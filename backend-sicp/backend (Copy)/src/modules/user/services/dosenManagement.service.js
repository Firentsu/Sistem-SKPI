const db = require("../../../shared/config/db")
const { logAudit } = require("../../audit/services/audit.service")
const RC = require("../../../shared/utils/roleCheck")

// ============================================================================
// dosenManagement.service.js
// ----------------------------------------------------------------------------
// Helper endpoint untuk Super Admin / Admin AS:
//   - promoteToDosen      : grant role 'dosen' + lengkapi profil (NIDN/unit/jurusan)
//                           dalam SATU operasi (sebelumnya: grant role manual,
//                           UPDATE NIDN manual via SQL)
//   - assignUnit          : update dosen.unit_id (FK ke unit_organisasi)
//   - assignJurusan       : update dosen.jurusan_id
//   - assignMataKuliah    : assign dosen jadi pengampu MK (mata_kuliah.dosen_id)
//   - assignKelas         : assign dosen ke kelas tertentu (kelas.dosen_id)
//   - updateProfile       : update field profil dosen (nidn, nama, jabatan, dll)
//   - listDosenForAssign  : daftar user yg layak dijadikan dosen
// ============================================================================

const getOrCreateDosenId = async (user_id, fallback_nama, conn = db) => {
  const [d] = await conn.query(
    "SELECT id FROM dosen WHERE user_id = ? LIMIT 1",
    [user_id]
  )
  if (d.length) return d[0].id
  const [r] = await conn.query(
    "INSERT INTO dosen (user_id, nama, status) VALUES (?, ?, 'aktif')",
    [user_id, fallback_nama || `Dosen-${user_id}`]
  )
  return r.insertId
}

// ============================================================================
// 1. PROMOTE TO DOSEN
//    Grant role 'dosen' (jika belum) + isi NIDN / unit / jurusan dalam 1 step
//    Body opsional: { nidn, nama, unit_id, jurusan_id, jabatan }
// ============================================================================
const promoteToDosen = async (target_user_id, body, actor) => {
  if (!RC.isSuperAdmin(actor)) {
    throw new Error("Hanya Super Admin yang boleh promote-to-dosen")
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // 1) Cek user ada + ambil username (utk default nama)
    const [u] = await conn.query(
      "SELECT id, username, role FROM users WHERE id = ?",
      [target_user_id]
    )
    if (!u.length) throw new Error("User target tidak ditemukan")
    const target = u[0]

    // mahasiswa TIDAK boleh dipromote jadi dosen (kombinasi terlarang)
    if (target.role === "mahasiswa") {
      throw new Error("Akun mahasiswa tidak dapat dipromote menjadi dosen")
    }

    // 2) Insert role 'dosen' bila belum
    const [rr] = await conn.query(
      "SELECT id FROM user_roles WHERE user_id = ? AND role = 'dosen'",
      [target_user_id]
    )
    if (!rr.length) {
      await conn.query(
        "INSERT INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'dosen', ?, NOW())",
        [target_user_id, actor.id]
      )
    }

    // 3) Get-or-create baris dosen + isi field
    const dosenId = await getOrCreateDosenId(
      target_user_id, body.nama || target.username, conn
    )

    // 4) Update field profil dosen (semua opsional)
    const fields = []
    const vals = []
    if (body.nidn !== undefined)       { fields.push("nidn = ?");        vals.push(body.nidn) }
    if (body.nama !== undefined)       { fields.push("nama = ?");        vals.push(body.nama) }
    if (body.unit_id !== undefined)    { fields.push("unit_id = ?");     vals.push(body.unit_id) }
    if (body.jurusan_id !== undefined) { fields.push("jurusan_id = ?");  vals.push(body.jurusan_id) }
    if (body.jabatan !== undefined)    { fields.push("jabatan = ?");     vals.push(body.jabatan) }

    if (fields.length) {
      vals.push(dosenId)
      await conn.query(
        `UPDATE dosen SET ${fields.join(", ")} WHERE id = ?`,
        vals
      )
    }

    await logAudit({
      user_id: actor.id, role: actor.role,
      action: "PROMOTE_TO_DOSEN",
      target_table: "user_roles", target_id: target_user_id,
      detail: { dosen_id: dosenId, ...body },
      conn,
    })

    await conn.commit()
    return { dosen_id: dosenId, user_id: target_user_id, granted_role: "dosen" }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ============================================================================
// 2. ASSIGN UNIT (dosen.unit_id, singular — sesuai schema aktual)
// ============================================================================
const assignUnit = async (dosen_id, unit_id, actor) => {
  if (!RC.isSuperAdmin(actor) && !(RC.isAdmin(actor) && actor?.access?.input_unit_organisasi)) {
    throw new Error("Akses ditolak: butuh super_admin / akses input_unit_organisasi")
  }
  // unit_id boleh null (keluar dari unit)
  if (unit_id !== null) {
    const [u] = await db.query("SELECT id FROM unit_organisasi WHERE id = ?", [unit_id])
    if (!u.length) throw new Error("Unit tidak ditemukan")
  }
  const [r] = await db.query(
    "UPDATE dosen SET unit_id = ? WHERE id = ?",
    [unit_id, dosen_id]
  )
  if (!r.affectedRows) throw new Error("Dosen tidak ditemukan")
  await logAudit({
    user_id: actor.id, role: actor.role,
    action: "ASSIGN_DOSEN_UNIT",
    target_table: "dosen", target_id: dosen_id,
    detail: { unit_id }
  })
  return { dosen_id, unit_id }
}

// ============================================================================
// 3. ASSIGN JURUSAN (dosen.jurusan_id)
// ============================================================================
const assignJurusan = async (dosen_id, jurusan_id, actor) => {
  if (!RC.isSuperAdmin(actor)) {
    throw new Error("Hanya Super Admin yang boleh assign jurusan dosen")
  }
  if (jurusan_id !== null) {
    const [j] = await db.query("SELECT id FROM jurusan WHERE id = ?", [jurusan_id])
    if (!j.length) throw new Error("Jurusan tidak ditemukan")
  }
  const [r] = await db.query(
    "UPDATE dosen SET jurusan_id = ? WHERE id = ?",
    [jurusan_id, dosen_id]
  )
  if (!r.affectedRows) throw new Error("Dosen tidak ditemukan")
  await logAudit({
    user_id: actor.id, role: actor.role,
    action: "ASSIGN_DOSEN_JURUSAN",
    target_table: "dosen", target_id: dosen_id,
    detail: { jurusan_id }
  })
  return { dosen_id, jurusan_id }
}

// ============================================================================
// 4. ASSIGN MATA KULIAH (mata_kuliah.dosen_id)
// ============================================================================
const assignMataKuliah = async (mata_kuliah_id, dosen_user_id, actor) => {
  if (!RC.isSuperAdmin(actor) && !(RC.isAdmin(actor) && actor?.access?.input_mata_kuliah)) {
    throw new Error("Akses ditolak: butuh super_admin / akses input_mata_kuliah")
  }
  if (dosen_id !== null) {
    const [d] = await db.query("SELECT id FROM dosen WHERE id = ?", [dosen_id])
    if (!d.length) throw new Error("Dosen tidak ditemukan")
  }
  const [r] = await db.query(
    "INSERT IGNORE INTO mata_kuliah_dosen (mata_kuliah_id, user_id, is_koordinator, added_by) VALUES (?, ?, 1, ?)",
    [mata_kuliah_id, dosen_user_id, actor.id]
  )
  if (!r.affectedRows) throw new Error("Mata kuliah tidak ditemukan")
  await logAudit({
    user_id: actor.id, role: actor.role,
    action: "ASSIGN_MK_DOSEN",
    target_table: "mata_kuliah", target_id: mata_kuliah_id,
    detail: { dosen_id }
  })
  return { mata_kuliah_id, user_id: dosen_user_id, added: true }
}

// ============================================================================
// 5. ASSIGN KELAS (kelas.dosen_id)
// ============================================================================
const assignKelas = async (kelas_id, dosen_id, actor) => {
  // DEPRECATED di REV2: konsep kelas didrop, mata_kuliah multi-dosen
  throw new Error(
    "Endpoint deprecated di REV2. Konsep kelas sudah dihapus. " +
    "Pakai POST /api/mata-kuliah/:id/dosen untuk assign dosen ke MK."
  )
}

// ============================================================================
// 6. UPDATE PROFILE DOSEN (parsial)
// ============================================================================
const updateProfile = async (dosen_id, body, actor) => {
  if (!RC.isSuperAdmin(actor)) {
    throw new Error("Hanya Super Admin yang boleh update profil dosen")
  }
  const allowed = ["nidn", "nama", "jabatan", "motto", "foto_profile", "unit_id", "jurusan_id", "status"]
  const fields = []
  const vals = []
  for (const k of allowed) {
    if (body[k] !== undefined) {
      fields.push(`${k} = ?`)
      vals.push(body[k])
    }
  }
  if (!fields.length) throw new Error("Tidak ada field yg di-update")
  vals.push(dosen_id)
  const [r] = await db.query(
    `UPDATE dosen SET ${fields.join(", ")} WHERE id = ?`,
    vals
  )
  if (!r.affectedRows) throw new Error("Dosen tidak ditemukan")
  await logAudit({
    user_id: actor.id, role: actor.role,
    action: "UPDATE_DOSEN_PROFILE",
    target_table: "dosen", target_id: dosen_id,
    detail: body
  })
  return { dosen_id, updated: fields.length }
}

// ============================================================================
// 7. LIST DOSEN UNTUK ASSIGN (semua user yg ada baris di tabel dosen)
//    Termasuk admin+dosen / SA+dosen — agar SA dapat assign mereka jadi pengampu.
// ============================================================================
const listAssignableDosen = async (filter = {}) => {
  let where = "1=1"
  const params = []
  if (filter.jurusan_id) {
    where += " AND d.jurusan_id = ?"
    params.push(filter.jurusan_id)
  }
  if (filter.unit_id) {
    where += " AND d.unit_id = ?"
    params.push(filter.unit_id)
  }
  if (filter.status) {
    where += " AND d.status = ?"
    params.push(filter.status)
  }
  const [rows] = await db.query(
    `SELECT
       d.id AS dosen_id, d.user_id, d.nidn, d.nama,
       d.unit_id, u.nama_unit,
       d.jurusan_id, j.nama_jurusan,
       d.jabatan, d.status,
       us.role AS user_primary_role,
       (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = d.user_id) AS additional_roles
     FROM dosen d
     LEFT JOIN unit_organisasi u ON u.id = d.unit_id
     LEFT JOIN jurusan j         ON j.id = d.jurusan_id
     LEFT JOIN users us          ON us.id = d.user_id
     WHERE ${where}
     ORDER BY d.nama ASC`,
    params
  )
  return rows
}

module.exports = {
  promoteToDosen,
  assignUnit,
  assignJurusan,
  assignMataKuliah,
  assignKelas,
  updateProfile,
  listAssignableDosen,
}
