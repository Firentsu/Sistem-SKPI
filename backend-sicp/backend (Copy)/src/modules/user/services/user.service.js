const db = require("../../../shared/config/db")
const UserModel = require("../models/user.model")
const bcrypt = require("bcrypt")
const { logAudit } = require("../../audit/services/audit.service")

// ===============================
const getAllUsers = async () => {
  const [rows] = await UserModel.getAllUsers()

  return rows.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    nim: u.nim || null,
    nidn: u.nidn || null
  }))
}

// ===============================
const getProfile = async (user_id) => {
  const [users] = await UserModel.getUserById(user_id)
  if (!users.length) throw new Error("User tidak ditemukan")

  const user = users[0]

  let profile = null

  if (user.role === "mahasiswa") {
    const [mhs] = await UserModel.getMahasiswaByUserId(user_id)
    profile = mhs[0] || null
  }

  if (user.role === "dosen") {
    const [dsn] = await UserModel.getDosenByUserId(user_id)
    profile = dsn[0] || null
  }

  return { user, profile }
}

// ===============================
// POIN 1: Super Admin / Admin AS lihat daftar user PER ROLE
const getUsersByRole = async (roleFilter) => {
  if (roleFilter === "multi") {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.role AS role_utama, u.status,
             GROUP_CONCAT(ur.role) AS role_tambahan
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      GROUP BY u.id, u.username, u.role, u.status
      ORDER BY u.username ASC`)
    return rows
  }
  if (!["mahasiswa", "dosen", "admin", "super_admin"].includes(roleFilter))
    throw new Error("role filter tidak valid (mahasiswa/dosen/admin/super_admin/multi)")
  const [rows] = await db.query(
    `SELECT id, username, role, status, created_at FROM users WHERE role = ? ORDER BY username ASC`,
    [roleFilter])
  return rows
}

// POIN 1: profil LENGKAP seorang user (gabung profil sesuai semua role)
const getFullProfile = async (user_id) => {
  const [users] = await UserModel.getUserById(user_id)
  if (!users.length) throw new Error("User tidak ditemukan")
  const user = users[0]

  const [extraRoles] = await db.query(`SELECT role FROM user_roles WHERE user_id = ?`, [user_id])
  const roles = [user.role, ...extraRoles.map(r => r.role)]

  const result = { user, roles, profiles: {} }
  if (roles.includes("mahasiswa")) {
    const [m] = await db.query(
      `SELECT m.*, j.nama_jurusan
       FROM mahasiswa m
       LEFT JOIN jurusan j ON j.id = m.jurusan_id
       WHERE m.user_id = ?`, [user_id])
    result.profiles.mahasiswa = m[0] || null
  }
  if (roles.includes("dosen")) {
    // ITEM 6 — sertakan nama unit & jurusan; plus daftar unit dari membership.
    const [d] = await db.query(
      `SELECT d.*, j.nama_jurusan, un.nama_unit
       FROM dosen d
       LEFT JOIN jurusan j ON j.id = d.jurusan_id
       LEFT JOIN unit_organisasi un ON un.id = d.unit_id
       WHERE d.user_id = ?`, [user_id])
    const dosen = d[0] || null
    if (dosen) {
      const [units] = await db.query(
        `SELECT uo.id, uo.nama_unit
         FROM user_unit_member uum
         JOIN unit_organisasi uo ON uo.id = uum.unit_id
         WHERE uum.user_id = ? ORDER BY uo.nama_unit`, [user_id])
      dosen.units = units
    }
    result.profiles.dosen = dosen
  }
  if (roles.includes("admin") || roles.includes("super_admin")) {
    // ITEM 5 — sertakan nama jurusan agar tidak tampil kosong.
    const [a] = await db.query(
      `SELECT a.*, j.nama_jurusan
       FROM admin_profile a
       LEFT JOIN jurusan j ON j.id = a.jurusan_id
       WHERE a.user_id = ?`, [user_id])
    result.profiles.admin = a[0] || null
  }
  return result
}

// POIN 4: daftar user yang BOLEH jadi anggota unit (semua KECUALI mahasiswa)
const getEligibleUnitMembers = async () => {
  const [rows] = await db.query(`
    SELECT id, username, role, status FROM users
    WHERE role IN ('super_admin','admin','dosen') AND status = 'aktif'
    ORDER BY role ASC, username ASC`)
  return rows
}

// ===============================
// 🔥 UPDATE PROFILE MAHASISWA
const updateMyProfile = async (user, data) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const userId = user.id

    // Tentukan role utama (semua role bisa update profil sendiri)
    let role = user.role
    if (!role) {
      const [u] = await conn.query(`SELECT role FROM users WHERE id=?`, [userId])
      role = u.length ? u[0].role : null
    }

    const applyUpdate = async (table, allowed) => {
      const fields = []
      const values = []
      for (const col of allowed) {
        if (col === "foto_profile" && data.foto !== undefined) {
          fields.push("foto_profile=?"); values.push(data.foto); continue
        }
        if (data[col] !== undefined) { fields.push(`${col}=?`); values.push(data[col]) }
      }
      if (!fields.length) throw new Error("Tidak ada data yang diupdate")
      values.push(userId)
      await conn.query(`UPDATE ${table} SET ${fields.join(", ")} WHERE user_id=?`, values)
    }

    let target_table
    if (role === "mahasiswa") {
      target_table = "mahasiswa"
      await applyUpdate("mahasiswa", ["nama", "tempat_lahir", "tanggal_lahir", "motto", "foto_profile"])
    } else if (role === "dosen") {
      target_table = "dosen"
      await applyUpdate("dosen", ["nama", "jabatan", "motto", "foto_profile"])
    } else {
      target_table = "admin_profile"
      await applyUpdate("admin_profile", ["nama", "jurusan_id"])
    }

    // 🔥 AUDIT
    await logAudit({
      user_id: user.id,
      role: role,
      action: "UPDATE_PROFILE",
      target_table,
      target_id: userId,
      detail: data,
      conn
    })

    await conn.commit()

    return { user_id: userId, role }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// POIN 3: buat user dgn IDENTITAS LENGKAP per role (tidak hanya username/password)
// Field wajib per role:
//   mahasiswa  : nim, nama, jurusan_id, angkatan  (opsional: tempat_lahir, tanggal_lahir, motto)
//   dosen      : nidn, nama, jurusan_id           (opsional: unit_id, jabatan, motto)
//   admin      : nama                             (opsional: jurusan_id)
//   super_admin: nama
const createUser = async ({ username, password, role, profile = {}, createdBy }) => {
  username = String(username).trim().toLowerCase()
  role = String(role).trim().toLowerCase()

  if (!["mahasiswa", "dosen", "admin", "super_admin"].includes(role))
    throw new Error("Role tidak valid")
  if (!password || String(password).length < 4)
    throw new Error("Password minimal 4 karakter")

  // Validasi identitas wajib per role
  const need = (f) => { if (profile[f] === undefined || profile[f] === null || profile[f] === "") throw new Error(`Field '${f}' wajib diisi untuk role ${role}`) }
  if (role === "mahasiswa") { need("nim"); need("nama"); need("jurusan_id"); need("angkatan") }
  if (role === "dosen")     { need("nidn"); need("nama"); need("jurusan_id") }
  if (role === "admin")     { need("nama") }
  if (role === "super_admin"){ need("nama") }

  const hashed = await bcrypt.hash(password, 10)
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const existing = await UserModel.findByUsername(username, conn)
    if (existing) throw new Error("Username sudah digunakan")

    const userId = await UserModel.insertUser({ username, password: hashed, role, createdBy }, conn)

    if (role === "mahasiswa") {
      await conn.query(
        `INSERT INTO mahasiswa (user_id, nim, nama, jurusan_id, angkatan, tempat_lahir, tanggal_lahir, motto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, profile.nim, profile.nama, profile.jurusan_id, profile.angkatan,
         profile.tempat_lahir || null, profile.tanggal_lahir || null, profile.motto || null])
    } else if (role === "dosen") {
      await conn.query(
        `INSERT INTO dosen (user_id, nidn, nama, jurusan_id, unit_id, jabatan, motto)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, profile.nidn, profile.nama, profile.jurusan_id,
         profile.unit_id || null, profile.jabatan || null, profile.motto || null])
    } else {
      // admin & super_admin → admin_profile
      await conn.query(
        `INSERT INTO admin_profile (user_id, nama, jurusan_id) VALUES (?, ?, ?)`,
        [userId, profile.nama, profile.jurusan_id || null])
    }

    await conn.commit()
    return { id: userId, role }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// POIN 1: Super admin update PROFIL user lain (field per role di tabel profil)
const updateUserProfile = async (id, data, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [u] = await conn.query(`SELECT id, role FROM users WHERE id=?`, [id])
    if (!u.length) throw new Error("User tidak ditemukan")
    const role = u[0].role

    // update akun (username/status) bila dikirim
    const acc = {}
    if (data.username) acc.username = String(data.username).trim().toLowerCase()
    if (data.status && ["aktif","nonaktif"].includes(data.status)) acc.status = data.status
    if (Object.keys(acc).length) {
      const set = Object.keys(acc).map(k=>`${k}=?`).join(", ")
      await conn.query(`UPDATE users SET ${set} WHERE id=?`, [...Object.values(acc), id])
    }

    // update profil sesuai role
    const setProfile = async (table, allowed, key="user_id") => {
      const f = {}
      for (const col of allowed) if (data[col] !== undefined) f[col] = data[col]
      if (!Object.keys(f).length) return
      const set = Object.keys(f).map(k=>`${k}=?`).join(", ")
      await conn.query(`UPDATE ${table} SET ${set} WHERE ${key}=?`, [...Object.values(f), id])
    }

    if (role === "mahasiswa")
      await setProfile("mahasiswa", ["nim","nama","jurusan_id","angkatan","tempat_lahir","tanggal_lahir","motto","foto_profile"])
    else if (role === "dosen")
      await setProfile("dosen", ["nidn","nama","jurusan_id","unit_id","jabatan","motto","foto_profile"])
    else
      await setProfile("admin_profile", ["nama","jurusan_id"])

    await conn.commit()
    return { id, role }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// ITEM 7 — Super Admin boleh mengedit diri sendiri / Super Admin lain.
// Pengaman: jangan sampai Super Admin AKTIF terakhir hilang (lockout sistem).
const ensureNotLastSuperAdmin = async (runner, targetId) => {
  const [tgt] = await runner.query(
    `SELECT role, status FROM users WHERE id=?`, [targetId])
  if (!tgt.length) return
  if (tgt[0].role !== "super_admin") return
  const [others] = await runner.query(
    `SELECT COUNT(*) AS n FROM users
     WHERE role='super_admin' AND status='aktif' AND id<>?`, [targetId])
  if (Number(others[0].n) === 0) {
    throw new Error(
      "Tidak bisa menonaktifkan / menurunkan role Super Admin aktif terakhir"
    )
  }
}

// ===============================
const updateUser = async (id, data, actor) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // ITEM 7: Super Admin boleh ubah dirinya sendiri. Role lain tidak.
    if (id === actor.id && actor.role !== "super_admin") {
      throw new Error("Tidak bisa mengubah diri sendiri")
    }

    const [user] = await UserModel.getUserById(id, conn)
    if (!user.length) throw new Error("User tidak ditemukan")

    const fields = {}

    if (data.username) {
      fields.username = String(data.username).trim().toLowerCase()
    }

    if (data.role) {
      if (actor.role !== "super_admin") {
        throw new Error("Tidak boleh mengubah role")
      }
      // Anti-lockout: menurunkan role SA terakhir dari super_admin → blokir.
      if (user[0].role === "super_admin" && data.role !== "super_admin") {
        await ensureNotLastSuperAdmin(conn, id)
      }
      fields.role = data.role
    }

    if (data.status) {
      if (!["aktif", "nonaktif"].includes(data.status))
        throw new Error("status harus 'aktif' atau 'nonaktif'")
      // Anti-lockout: menonaktifkan SA terakhir → blokir.
      if (data.status === "nonaktif") {
        await ensureNotLastSuperAdmin(conn, id)
      }
      fields.status = data.status
    }

    await UserModel.updateUserDynamic(id, fields, conn)

    // KONSISTENSI: bila status diubah, sinkronkan ke tabel profil yang punya kolom status
    if (data.status) {
      await conn.query(`UPDATE mahasiswa SET status=? WHERE user_id=?`, [data.status, id])
      try { await conn.query(`UPDATE dosen SET status=? WHERE user_id=?`, [data.status, id]) } catch {}
      if (data.status === "aktif")
        await conn.query(`UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=?`, [id])
    }

    await conn.commit()
    return { id, status: data.status || undefined }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
const deactivateUser = async (id, actor) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    if (id === actor.id && actor.role !== "super_admin") {
      throw new Error("Tidak bisa menonaktifkan diri sendiri")
    }

    // Anti-lockout Super Admin terakhir
    await ensureNotLastSuperAdmin(conn, id)

    const [r] = await conn.query(`UPDATE users SET status='nonaktif' WHERE id=?`, [id])
    if (!r.affectedRows) throw new Error("User tidak ditemukan")
    await conn.query(`UPDATE mahasiswa SET status='nonaktif' WHERE user_id=?`, [id])
    try { await conn.query(`UPDATE dosen SET status='nonaktif' WHERE user_id=?`, [id]) } catch {}

    await conn.commit()
    return { id, status: "nonaktif" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
const deleteUser = async (id, actor) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    if (id === actor.id) {
      throw new Error("Tidak bisa menghapus diri sendiri")
    }

    const [mhs] = await conn.query(
      `SELECT id FROM mahasiswa WHERE user_id=?`,
      [id]
    )

    if (mhs.length) {
      const mahasiswaId = mhs[0].id

      const [trx] = await conn.query(
        `SELECT COUNT(*) as total FROM icp_transactions WHERE mahasiswa_id=?`,
        [mahasiswaId]
      )

      if (trx[0].total > 0) {
        throw new Error("User memiliki transaksi ICP")
      }
    }

    const [r] = await conn.query(`UPDATE users SET status='nonaktif' WHERE id=?`, [id])
    if (!r.affectedRows) throw new Error("User tidak ditemukan")
    await conn.query(`UPDATE mahasiswa SET status='nonaktif' WHERE user_id=?`, [id])
    try { await conn.query(`UPDATE dosen SET status='nonaktif' WHERE user_id=?`, [id]) } catch {}

    await conn.commit()
    return { id, status: "nonaktif" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// FINAL CLEANUP — toggleAccessKelolaKegiatan kini proxy ke
// roleManagement service. Tidak lagi menulis kolom legacy
// users.access_kelola_kegiatan — pakai tabel admin_access.
//
// Endpoint LAMA  PUT /api/users/:id/access-kelola-kegiatan  → tetap hidup
// (alias) agar tidak memecah klien lama. Endpoint resmi/baru adalah:
//   POST   /api/role-management/users/:id/access  { access_key: "kelola_kegiatan" }
//   DELETE /api/role-management/users/:id/access/kelola_kegiatan
//
const roleMgmt = require("./roleManagement.service")

const toggleAccessKelolaKegiatan = async (id, enabled, actor) => {
  // Idempotent: jika user sudah/tidak punya akses, jangan throw — kembalikan state.
  try {
    if (enabled) {
      return await roleMgmt.grantAccess(id, "kelola_kegiatan", actor)
    }
    return await roleMgmt.revokeAccess(id, "kelola_kegiatan", actor)
  } catch (err) {
    const msg = String(err && err.message || "")
    if (
      msg.includes("sudah aktif") ||
      msg.includes("tidak memiliki akses")
    ) {
      return {
        user_id: id,
        access_key: "kelola_kegiatan",
        granted: !!enabled,
        revoked: !enabled,
        note: "no-op (state sudah sesuai)"
      }
    }
    throw err
  }
}

// POIN 6: aktifkan kembali user yang nonaktif
const reactivateUser = async (id, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [u] = await conn.query(`SELECT id, status FROM users WHERE id=?`, [id])
    if (!u.length) throw new Error("User tidak ditemukan")
    if (u[0].status === "aktif") throw new Error("User sudah aktif")

    await conn.query(`UPDATE users SET status='aktif', failed_attempts=0, locked_until=NULL WHERE id=?`, [id])
    await conn.query(`UPDATE mahasiswa SET status='aktif' WHERE user_id=?`, [id])
    try { await conn.query(`UPDATE dosen SET status='aktif' WHERE user_id=?`, [id]) } catch {}

    await conn.commit()
    return { id, status: "aktif" }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}


// POIN 2: set status user secara eksplisit & andal (aktif/nonaktif) — pasti commit ke DB
const setUserStatus = async (id, status, actor) => {
  if (!["aktif", "nonaktif"].includes(status))
    throw new Error("status harus 'aktif' atau 'nonaktif'")
  if (id === actor.id && actor.role !== "super_admin")
    throw new Error("Tidak bisa mengubah status diri sendiri")

  const [u] = await db.query(`SELECT id FROM users WHERE id=?`, [id])
  if (!u.length) throw new Error("User tidak ditemukan")

  // Anti-lockout Super Admin terakhir saat menonaktifkan
  if (status === "nonaktif") {
    await ensureNotLastSuperAdmin(db, id)
  }

  // users = sumber kebenaran (dipakai login & getAllUsers)
  const [r] = await db.query(`UPDATE users SET status=? WHERE id=?`, [status, id])
  // sinkron ke profil yang punya kolom status
  await db.query(`UPDATE mahasiswa SET status=? WHERE user_id=?`, [status, id])
  try { await db.query(`UPDATE dosen SET status=? WHERE user_id=?`, [status, id]) } catch {}
  if (status === "aktif")
    await db.query(`UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=?`, [id])

  return { id, status, affected: r.affectedRows }
}


// ============================================================
// SA#1 & SA#2 (11 Juni): update username & password semua user (termasuk diri sendiri)
// Super Admin only. Bila id = actor.id → ubah milik sendiri.
// ============================================================
const updateUsername = async (id, newUsername, actor) => {
  if (!newUsername || !String(newUsername).trim())
    throw new Error("username baru wajib")
  const uname = String(newUsername).trim().toLowerCase()
  if (uname.length < 3) throw new Error("username minimal 3 karakter")

  // cek user target ada
  const [u] = await db.query(`SELECT id FROM users WHERE id=?`, [id])
  if (!u.length) throw new Error("User tidak ditemukan")

  // cek username belum dipakai user lain
  const [dup] = await db.query(`SELECT id FROM users WHERE username=? AND id<>?`, [uname, id])
  if (dup.length) throw new Error("Username sudah dipakai user lain")

  await db.query(`UPDATE users SET username=? WHERE id=?`, [uname, id])
  await logAudit({
    user_id: actor.id, role: actor.role, action: "UPDATE_USERNAME",
    target_table: "users", target_id: id,
    detail: { username: uname, self: id === actor.id } })
  return { id, username: uname }
}

const updatePassword = async (id, newPassword, actor) => {
  if (!newPassword || String(newPassword).length < 4)
    throw new Error("password baru minimal 4 karakter")
  const [u] = await db.query(`SELECT id FROM users WHERE id=?`, [id])
  if (!u.length) throw new Error("User tidak ditemukan")

  const hashed = await bcrypt.hash(String(newPassword), 10)
  await db.query(`UPDATE users SET password=? WHERE id=?`, [hashed, id])
  // reset lock saat ganti password
  await db.query(`UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=?`, [id])
  await logAudit({
    user_id: actor.id, role: actor.role, action: "UPDATE_PASSWORD",
    target_table: "users", target_id: id,
    detail: { self: id === actor.id } })  // JANGAN log password
  return { id, updated: true }
}


module.exports = {
  updatePassword,
  updateUsername,
  setUserStatus,
  updateUserProfile,
  reactivateUser,
  getAllUsers,
  getProfile,
  getUsersByRole,
  getFullProfile,
  getEligibleUnitMembers,
  updateMyProfile,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  toggleAccessKelolaKegiatan
} 