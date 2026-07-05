const db = require("../../../shared/config/db")
const { logAudit } = require("../../audit/services/audit.service")
const { ACCESS_KEYS, isValidAccessKey } = require("../../../shared/constants/accessKeys")

// ============================================================================
// roleManagement.service.js
// Revisi 11 poin — kelola PERAN GANDA & AKSES SUPER. Khusus Super Admin.
// ============================================================================

const VALID_ROLES = ["super_admin", "admin", "dosen", "mahasiswa"]

// ----------------------------------------------------------------------------
// 🔍 DETAIL: roles + access milik 1 user
const getUserAuthDetail = async (userId) => {
  const [users] = await db.query(
    "SELECT id, username, role, status FROM users WHERE id = ?",
    [userId]
  )
  if (!users.length) throw new Error("User tidak ditemukan")
  const user = users[0]

  const [roleRows] = await db.query(
    "SELECT role, granted_by, granted_at FROM user_roles WHERE user_id = ?",
    [userId]
  )

  const [accessRows] = await db.query(
    "SELECT access_key, granted_by, granted_at FROM admin_access WHERE user_id = ?",
    [userId]
  )

  const roles = Array.from(new Set(
    [user.role, ...roleRows.map((r) => r.role)].filter(Boolean)
  ))

  return {
    user_id: user.id,
    username: user.username,
    primary_role: user.role,
    status: user.status,
    roles,
    secondary_roles: roleRows,
    access: accessRows.map((a) => a.access_key),
    access_detail: accessRows
  }
}

// ----------------------------------------------------------------------------
// ➕ TAMBAH ROLE (peran ganda) — hanya Super Admin
const grantRole = async (userId, role, actor, profile = {}) => {
  if (!VALID_ROLES.includes(role)) {
    throw new Error("Role tidak valid")
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [users] = await conn.query(
      "SELECT id, username, role FROM users WHERE id = ? FOR UPDATE",
      [userId]
    )
    if (!users.length) throw new Error("User tidak ditemukan")
    const target = users[0]

    if (target.role === role) {
      throw new Error("User sudah memiliki role tersebut (role utama)")
    }

    const [existing] = await conn.query(
      "SELECT id FROM user_roles WHERE user_id = ? AND role = ?",
      [userId, role]
    )
    if (existing.length) {
      throw new Error("User sudah memiliki role tersebut")
    }

    // catat role
    await conn.query(
      `INSERT INTO user_roles (user_id, role, granted_by, granted_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, role, actor.id]
    )

    // POIN 3: multi-role DOSEN hanya boleh untuk admin & super_admin,
    // dan WAJIB isi identitas dosen lengkap (sama seperti buat dosen baru)
    if (role === "dosen") {
      if (!["admin", "super_admin"].includes(target.role)) {
        throw new Error("Multi-role dosen hanya untuk admin atau super_admin")
      }
      const need = (f) => { if (profile[f] === undefined || profile[f] === null || profile[f] === "") throw new Error(`Field '${f}' wajib diisi untuk multi-role dosen`) }
      need("nidn"); need("nama"); need("jurusan_id")

      const [d] = await conn.query("SELECT id FROM dosen WHERE user_id = ?", [userId])
      if (!d.length) {
        await conn.query(
          `INSERT INTO dosen (user_id, nidn, nama, jurusan_id, unit_id, jabatan, motto)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, profile.nidn, profile.nama, profile.jurusan_id,
           profile.unit_id || null, profile.jabatan || null, profile.motto || null])
      }
    }

    if (role === "mahasiswa") {
      const [m] = await conn.query(
        "SELECT id FROM mahasiswa WHERE user_id = ?",
        [userId]
      )
      if (!m.length) {
        await conn.query(
          `INSERT INTO mahasiswa (user_id, nim, nama, status)
           VALUES (?, ?, ?, 'aktif')`,
          [userId, `AUTO-${userId}`, target.username]
        )
      }
    }

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "GRANT_ROLE",
      target_table: "user_roles",
      target_id: userId,
      detail: { user_id: userId, role },
      conn
    })

    await conn.commit()
    return { user_id: userId, role, granted: true }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ----------------------------------------------------------------------------
// ➖ CABUT ROLE — hanya Super Admin. Role utama TIDAK bisa dicabut.
const revokeRole = async (userId, role, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [users] = await conn.query(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE",
      [userId]
    )
    if (!users.length) throw new Error("User tidak ditemukan")

    if (users[0].role === role) {
      throw new Error("Role utama tidak bisa dicabut")
    }

    const [result] = await conn.query(
      "DELETE FROM user_roles WHERE user_id = ? AND role = ?",
      [userId, role]
    )
    if (result.affectedRows === 0) {
      throw new Error("User tidak memiliki role tersebut")
    }

    // ITEM #4 (10 Juni): jika role DOSEN dicabut dari admin/super_admin (multi-role),
    // hapus profil dosen-nya — harus input ulang bila role dosen diberikan lagi.
    // Hanya hapus bila dosen BUKAN role utama (role utama dosen tidak boleh dicabut, sudah dicegah di atas).
    if (role === "dosen") {
      await conn.query("DELETE FROM dosen WHERE user_id = ?", [userId])
    }

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "REVOKE_ROLE",
      target_table: "user_roles",
      target_id: userId,
      detail: { user_id: userId, role },
      conn
    })

    await conn.commit()
    return { user_id: userId, role, revoked: true }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ----------------------------------------------------------------------------
// ➕ BERI AKSES SUPER BULK (array) — 1 request set banyak access keys sekaligus
// REV3: lebih simple dari pada panggil grantAccess satu-satu.
//   body: { access_keys: ["validasi_final", "kelola_kegiatan", ...] }
//
// Mode "mode":
//   - "append" (default): tambah ke set existing (skip yg sudah ada)
//   - "replace": REPLACE seluruh set — semua akses lama yg tidak ada di array dihapus
//
const grantAccessBulk = async (userId, accessKeys, actor, mode = "append") => {
  if (!Array.isArray(accessKeys)) {
    throw new Error("access_keys harus array, mis: [\"validasi_final\", \"kelola_kegiatan\"]")
  }
  if (!accessKeys.length && mode !== "replace") {
    throw new Error("access_keys tidak boleh kosong")
  }
  // Validate semua keys dulu
  for (const k of accessKeys) {
    if (!isValidAccessKey(k)) throw new Error(`access_key tidak dikenal: ${k}`)
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // Cek target user
    const [users] = await conn.query(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE", [userId])
    if (!users.length) throw new Error("User tidak ditemukan")

    // Cek user adalah admin (akses super hanya untuk admin)
    const [roleRows] = await conn.query(
      "SELECT role FROM user_roles WHERE user_id = ?", [userId])
    const roles = [users[0].role, ...roleRows.map(r => r.role)]
    if (!roles.includes("admin")) {
      throw new Error("Akses super hanya bisa diberikan ke user ber-role admin")
    }

    // Ambil set existing
    const [existRows] = await conn.query(
      "SELECT access_key FROM admin_access WHERE user_id = ?", [userId])
    const existing = new Set(existRows.map(r => r.access_key))

    const toAdd = accessKeys.filter(k => !existing.has(k))
    let toRemove = []
    if (mode === "replace") {
      toRemove = [...existing].filter(k => !accessKeys.includes(k))
    }

    // Insert toAdd
    for (const k of toAdd) {
      await conn.query(
        `INSERT INTO admin_access (user_id, access_key, granted_by, granted_at)
         VALUES (?, ?, ?, NOW())`,
        [userId, k, actor.id])
    }
    // Delete toRemove (replace mode)
    for (const k of toRemove) {
      await conn.query(
        `DELETE FROM admin_access WHERE user_id = ? AND access_key = ?`,
        [userId, k])
    }

    await logAudit({
      user_id: actor.id, role: actor.role,
      action: mode === "replace" ? "REPLACE_ACCESS_SUPER" : "GRANT_ACCESS_SUPER_BULK",
      target_table: "admin_access", target_id: userId,
      detail: { user_id: userId, mode, requested: accessKeys, added: toAdd, removed: toRemove },
      conn,
    })

    await conn.commit()
    return {
      user_id: userId,
      mode,
      requested: accessKeys,
      added: toAdd,
      removed: toRemove,
      final_access: mode === "replace" ? accessKeys : [...existing, ...toAdd],
    }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

// ----------------------------------------------------------------------------
// ➕ BERI AKSES SUPER (per fitur) — hanya Super Admin
const grantAccess = async (userId, accessKey, actor) => {
  if (!isValidAccessKey(accessKey)) {
    throw new Error(`access_key tidak dikenal: ${accessKey}`)
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const detail = await (async () => {
      const [u] = await conn.query(
        "SELECT id, role FROM users WHERE id = ? FOR UPDATE",
        [userId]
      )
      if (!u.length) throw new Error("User tidak ditemukan")
      return u[0]
    })()

    // akses super hanya bermakna untuk user ber-role admin
    const [roleRows] = await conn.query(
      "SELECT role FROM user_roles WHERE user_id = ?",
      [userId]
    )
    const roles = [detail.role, ...roleRows.map((r) => r.role)]
    if (!roles.includes("admin")) {
      throw new Error("Akses super hanya bisa diberikan ke user ber-role admin")
    }

    const [existing] = await conn.query(
      "SELECT id FROM admin_access WHERE user_id = ? AND access_key = ?",
      [userId, accessKey]
    )
    if (existing.length) {
      throw new Error("Akses tersebut sudah aktif")
    }

    await conn.query(
      `INSERT INTO admin_access (user_id, access_key, granted_by, granted_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, accessKey, actor.id]
    )

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "GRANT_ACCESS_SUPER",
      target_table: "admin_access",
      target_id: userId,
      detail: { user_id: userId, access_key: accessKey },
      conn
    })

    await conn.commit()
    return { user_id: userId, access_key: accessKey, granted: true }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ----------------------------------------------------------------------------
// ➖ CABUT AKSES SUPER — hanya Super Admin
const revokeAccess = async (userId, accessKey, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.query(
      "DELETE FROM admin_access WHERE user_id = ? AND access_key = ?",
      [userId, accessKey]
    )
    if (result.affectedRows === 0) {
      throw new Error("User tidak memiliki akses tersebut")
    }

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "REVOKE_ACCESS_SUPER",
      target_table: "admin_access",
      target_id: userId,
      detail: { user_id: userId, access_key: accessKey },
      conn
    })

    await conn.commit()
    return { user_id: userId, access_key: accessKey, revoked: true }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}


// ============================================================================
// ★ REV2 UNIFIED — SET semua akses sekaligus (replace mode)
// Body: { access_keys: ["validasi_final","kelola_kegiatan", ...] }
// 1 endpoint pengganti pasangan grantAccess + revokeAccess satu-per-satu.
// ============================================================================
const setUserAccess = async (userId, accessKeys, actor) => {
  if (!Array.isArray(accessKeys)) {
    throw new Error("access_keys harus array (boleh kosong utk revoke semua)")
  }
  for (const k of accessKeys) {
    if (!isValidAccessKey(k)) {
      throw new Error(`access_key tidak dikenal: ${k}`)
    }
  }
  const desired = new Set(accessKeys)

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [users] = await conn.query(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE", [userId]
    )
    if (!users.length) throw new Error("User tidak ditemukan")
    const u = users[0]
    const [roleRows] = await conn.query(
      "SELECT role FROM user_roles WHERE user_id = ?", [userId]
    )
    const roles = [u.role, ...roleRows.map(r => r.role)]
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      throw new Error("Akses super hanya bisa diberikan ke user ber-role admin")
    }

    const [curRows] = await conn.query(
      "SELECT access_key FROM admin_access WHERE user_id = ?", [userId]
    )
    const current = new Set(curRows.map(r => r.access_key))

    const toGrant = [...desired].filter(k => !current.has(k))
    const toRevoke = [...current].filter(k => !desired.has(k))
    const unchanged = [...desired].filter(k => current.has(k))

    for (const k of toGrant) {
      await conn.query(
        `INSERT INTO admin_access (user_id, access_key, granted_by, granted_at)
         VALUES (?, ?, ?, NOW())`,
        [userId, k, actor.id]
      )
    }
    if (toRevoke.length) {
      await conn.query(
        `DELETE FROM admin_access WHERE user_id = ? AND access_key IN (?)`,
        [userId, toRevoke]
      )
    }

    await logAudit({
      user_id: actor.id, role: actor.role,
      action: "SET_USER_ACCESS_BULK",
      target_table: "admin_access", target_id: userId,
      detail: { granted: toGrant, revoked: toRevoke, unchanged, final: [...desired] },
      conn
    })

    await conn.commit()
    return {
      user_id: userId,
      granted: toGrant, revoked: toRevoke, unchanged,
      final_access: [...desired]
    }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  grantAccessBulk,
  ACCESS_KEYS,
  VALID_ROLES,
  getUserAuthDetail,
  grantRole,
  revokeRole,
  grantAccess,
  revokeAccess,
  setUserAccess
}
