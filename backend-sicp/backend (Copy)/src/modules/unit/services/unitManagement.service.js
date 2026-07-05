// ============================================================================
// unitManagement.service.js
// ----------------------------------------------------------------------------
// Endpoint terpadu untuk kelola unit organisasi:
//   - CRUD unit (nama, deskripsi)
//   - Assign/remove kategori akses ke unit (unit_kategori)
//   - CRUD nama_icp DALAM unit (nama_icp.unit_id)
//   - Add/remove user member ke unit (user_unit_member)
//
// Akses:
//   - Super Admin: penuh
//   - Admin AS dgn input_unit_organisasi: CRUD unit + kelola member
//   - Admin AS dgn kelola_unit_kategori: kelola unit_kategori
//   - Admin AS dgn kelola_nama_icp: kelola nama_icp
// ============================================================================

const db = require("../../../shared/config/db")

const isSuperAdmin = (u) => {
  const r = Array.isArray(u.roles) ? u.roles : [u.role]
  return r.includes("super_admin")
}
const hasAccess = (u, k) => isSuperAdmin(u) || (u.access && u.access[k])

// ============================================================================
// 1. CREATE UNIT (sekaligus kategori + nama_icp + member optional)
// ============================================================================
const createUnit = async (user, body) => {
  if (!hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses input_unit_organisasi")
  }
  const { nama_unit, deskripsi, kategori_ids = [], nama_icp = [], member_user_ids = [] } = body
  if (!nama_unit) throw new Error("nama_unit wajib diisi")

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // 1. INSERT unit
    const [r] = await conn.query(
      `INSERT INTO unit_organisasi (nama_unit, deskripsi) VALUES (?, ?)`,
      [nama_unit, deskripsi || null]
    )
    const unit_id = r.insertId

    // 2. Assign kategori (akses)
    for (const kid of kategori_ids) {
      await conn.query(
        `INSERT IGNORE INTO unit_kategori (unit_id, kategori_id, added_by)
         VALUES (?, ?, ?)`,
        [unit_id, kid, user.id]
      )
    }

    // 3. Insert nama_icp
    for (const ni of nama_icp) {
      const nama = typeof ni === "string" ? ni : ni.nama
      if (!nama) continue
      await conn.query(
        `INSERT INTO nama_icp (nama, unit_id, status)
         VALUES (?, ?, 'aktif')`,
        [nama, unit_id]
      )
    }

    // 4. Add member
    for (const uid of member_user_ids) {
      await conn.query(
        `INSERT IGNORE INTO user_unit_member (user_id, unit_id, added_by)
         VALUES (?, ?, ?)`,
        [uid, unit_id, user.id]
      )
    }

    await conn.commit()
    return { unit_id, nama_unit, kategori_count: kategori_ids.length,
             nama_icp_count: nama_icp.length, member_count: member_user_ids.length }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ============================================================================
// 2. GET UNIT DETAIL (semua info)
// ============================================================================
const getUnitDetail = async (unitId) => {
  const [units] = await db.query(
    `SELECT * FROM unit_organisasi WHERE id = ? LIMIT 1`, [unitId]
  )
  if (!units.length) throw new Error("Unit tidak ditemukan")

  const [kategoris] = await db.query(
    `SELECT k.id, k.nama_kategori, k.tipe, uk.added_at
     FROM unit_kategori uk
     JOIN kategori_icp k ON k.id = uk.kategori_id
     WHERE uk.unit_id = ? AND k.status = 'aktif'
     ORDER BY k.nama_kategori`, [unitId]
  )

  const [namaIcps] = await db.query(
    `SELECT id, nama, status, created_at FROM nama_icp
     WHERE unit_id = ? ORDER BY nama`, [unitId]
  )

  const [members] = await db.query(
    `SELECT u.id AS user_id, u.username, u.role, u.status,
            COALESCE(d.nama, ap.nama, m.nama) AS nama,
            uum.added_at
     FROM user_unit_member uum
     JOIN users u ON u.id = uum.user_id
     LEFT JOIN dosen d ON d.user_id = u.id
     LEFT JOIN admin_profile ap ON ap.user_id = u.id
     LEFT JOIN mahasiswa m ON m.user_id = u.id
     WHERE uum.unit_id = ?
     ORDER BY u.role, u.username`, [unitId]
  )

  return { ...units[0], kategori: kategoris, nama_icp: namaIcps, member: members }
}

// ============================================================================
// 3. LIST UNIT (semua, dgn ringkasan)
// ============================================================================
const listUnits = async () => {
  const [rows] = await db.query(`SELECT * FROM v_unit_full ORDER BY nama_unit`)
  return rows
}

// ============================================================================
// 4. UPDATE UNIT (nama, deskripsi)
// ============================================================================
const updateUnit = async (user, unitId, body) => {
  if (!hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses input_unit_organisasi")
  }
  const { nama_unit, deskripsi } = body
  const fields = []
  const params = []
  if (nama_unit !== undefined) { fields.push("nama_unit = ?"); params.push(nama_unit) }
  if (deskripsi !== undefined) { fields.push("deskripsi = ?"); params.push(deskripsi) }
  if (!fields.length) throw new Error("Tidak ada field untuk diupdate")
  params.push(unitId)
  await db.query(`UPDATE unit_organisasi SET ${fields.join(", ")} WHERE id = ?`, params)
  return { unit_id: unitId, updated: fields.length }
}

// ============================================================================
// 5. DELETE UNIT (cascade ke unit_kategori, nama_icp, user_unit_member)
// ============================================================================
const deleteUnit = async (user, unitId) => {
  if (!isSuperAdmin(user)) throw new Error("Hanya Super Admin yang bisa hapus unit")
  await db.query(`DELETE FROM unit_organisasi WHERE id = ?`, [unitId])
  return { unit_id: unitId, deleted: true }
}

// ============================================================================
// 6. ASSIGN KATEGORI ke UNIT
// ============================================================================
const assignKategori = async (user, unitId, kategoriId) => {
  if (!hasAccess(user, "kelola_unit_kategori") && !hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses kelola_unit_kategori")
  }
  await db.query(
    `INSERT IGNORE INTO unit_kategori (unit_id, kategori_id, added_by) VALUES (?, ?, ?)`,
    [unitId, kategoriId, user.id]
  )
  return { unit_id: unitId, kategori_id: kategoriId, assigned: true }
}

const removeKategori = async (user, unitId, kategoriId) => {
  if (!hasAccess(user, "kelola_unit_kategori") && !hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses kelola_unit_kategori")
  }
  await db.query(
    `DELETE FROM unit_kategori WHERE unit_id = ? AND kategori_id = ?`,
    [unitId, kategoriId]
  )
  return { unit_id: unitId, kategori_id: kategoriId, removed: true }
}

// ============================================================================
// 7. CRUD NAMA_ICP DALAM UNIT
// ============================================================================
const addNamaIcp = async (user, unitId, nama) => {
  if (!hasAccess(user, "kelola_nama_icp") && !hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses kelola_nama_icp")
  }
  if (!nama) throw new Error("nama wajib diisi")
  const [r] = await db.query(
    `INSERT INTO nama_icp (nama, unit_id, status) VALUES (?, ?, 'aktif')`,
    [nama, unitId]
  )
  return { nama_icp_id: r.insertId, nama, unit_id: unitId }
}

const updateNamaIcp = async (user, unitId, namaIcpId, body) => {
  if (!hasAccess(user, "kelola_nama_icp") && !hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses kelola_nama_icp")
  }
  const { nama, status } = body
  const fields = [], params = []
  if (nama !== undefined) { fields.push("nama = ?"); params.push(nama) }
  if (status !== undefined) { fields.push("status = ?"); params.push(status) }
  if (!fields.length) throw new Error("Tidak ada field untuk diupdate")
  params.push(namaIcpId, unitId)
  const [r] = await db.query(
    `UPDATE nama_icp SET ${fields.join(", ")} WHERE id = ? AND unit_id = ?`, params
  )
  if (!r.affectedRows) throw new Error("Nama ICP tidak ditemukan dalam unit ini")
  return { nama_icp_id: namaIcpId, updated: fields.length }
}

const deleteNamaIcp = async (user, unitId, namaIcpId) => {
  if (!hasAccess(user, "kelola_nama_icp") && !hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses kelola_nama_icp")
  }
  const [r] = await db.query(
    `DELETE FROM nama_icp WHERE id = ? AND unit_id = ?`, [namaIcpId, unitId]
  )
  if (!r.affectedRows) throw new Error("Nama ICP tidak ditemukan dalam unit ini")
  return { nama_icp_id: namaIcpId, deleted: true }
}

// ============================================================================
// 8. ADD/REMOVE MEMBER (user bisa multi-unit)
// ============================================================================
const addMember = async (user, unitId, targetUserId) => {
  if (!hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses input_unit_organisasi")
  }
  // cek user exist & bukan mahasiswa (mahasiswa tidak boleh jadi member unit)
  const [u] = await db.query(`SELECT id, role FROM users WHERE id = ? LIMIT 1`, [targetUserId])
  if (!u.length) throw new Error("User tidak ditemukan")
  if (u[0].role === "mahasiswa") throw new Error("Mahasiswa tidak bisa jadi member unit")

  await db.query(
    `INSERT IGNORE INTO user_unit_member (user_id, unit_id, added_by) VALUES (?, ?, ?)`,
    [targetUserId, unitId, user.id]
  )

  // ITEM 6 — jika dosen, isi dosen.unit_id agar tidak NULL lagi di profil.
  if (u[0].role === "dosen") {
    await db.query(
      `UPDATE dosen SET unit_id = ? WHERE user_id = ?`,
      [unitId, targetUserId]
    )
  }

  return { unit_id: unitId, user_id: targetUserId, added: true }
}

const removeMember = async (user, unitId, targetUserId) => {
  if (!hasAccess(user, "input_unit_organisasi")) {
    throw new Error("Tidak punya akses input_unit_organisasi")
  }
  await db.query(
    `DELETE FROM user_unit_member WHERE unit_id = ? AND user_id = ?`,
    [unitId, targetUserId]
  )

  // ITEM 6 — jika dosen & unit yang dihapus adalah unit primernya,
  // alihkan ke membership tersisa (atau NULL bila tidak ada lagi).
  const [u] = await db.query(`SELECT role FROM users WHERE id = ? LIMIT 1`, [targetUserId])
  if (u.length && u[0].role === "dosen") {
    const [rest] = await db.query(
      `SELECT unit_id FROM user_unit_member WHERE user_id = ? ORDER BY added_at DESC LIMIT 1`,
      [targetUserId]
    )
    const nextUnit = rest.length ? rest[0].unit_id : null
    await db.query(
      `UPDATE dosen SET unit_id = ? WHERE user_id = ? AND (unit_id = ? OR unit_id IS NULL)`,
      [nextUnit, targetUserId, unitId]
    )
  }

  return { unit_id: unitId, user_id: targetUserId, removed: true }
}

// ============================================================================
// 9. PUBLIC: dipakai saat pengajuan ICP — load nama_icp + kategori per unit
// ============================================================================
const getUnitOptions = async (unitId) => {
  // Untuk dropdown saat user pilih unit, return: nama_icp[] + kategori[] + members[]
  const [namaIcps] = await db.query(
    `SELECT id, nama FROM nama_icp WHERE unit_id = ? AND status='aktif' ORDER BY nama`,
    [unitId]
  )
  const [kategoris] = await db.query(
    `SELECT k.id, k.nama_kategori, k.tipe
     FROM unit_kategori uk
     JOIN kategori_icp k ON k.id = uk.kategori_id
     WHERE uk.unit_id = ? AND k.status = 'aktif'
     ORDER BY k.nama_kategori`,
    [unitId]
  )
  // ITEM MHS-1 — pemberi ICP = member unit (dosen/admin) yang aktif
  const [members] = await db.query(
    `SELECT uum.user_id, u.username, u.role,
            COALESCE(d.nama, ap.nama, u.username) AS nama
     FROM user_unit_member uum
     JOIN users u ON u.id = uum.user_id AND u.status = 'aktif'
     LEFT JOIN dosen d ON d.user_id = u.id
     LEFT JOIN admin_profile ap ON ap.user_id = u.id
     WHERE uum.unit_id = ?
     ORDER BY nama`,
    [unitId]
  )
  return { nama_icp: namaIcps, kategori: kategoris, members }
}

// ITEM Admin-1 / MHS-1 / Sys-1 — daftar unit untuk SEMUA role (read-only,
// dipakai dropdown pengajuan & tampilan riwayat/inbox). CRUD tetap terkunci.
const listForAll = async () => {
  const [rows] = await db.query(
    `SELECT id, nama_unit, deskripsi FROM unit_organisasi ORDER BY nama_unit`
  )
  return rows
}

const getMyUnits = async (userId) => {
  const [rows] = await db.query(
    `SELECT u.id, u.nama_unit, u.deskripsi
     FROM user_unit_member uum
     JOIN unit_organisasi u ON u.id = uum.unit_id
     WHERE uum.user_id = ?
     ORDER BY u.nama_unit`,
    [userId]
  )
  return rows
}

module.exports = {
  createUnit, getUnitDetail, listUnits, updateUnit, deleteUnit,
  assignKategori, removeKategori,
  addNamaIcp, updateNamaIcp, deleteNamaIcp,
  addMember, removeMember,
  getUnitOptions, getMyUnits, listForAll,
}
