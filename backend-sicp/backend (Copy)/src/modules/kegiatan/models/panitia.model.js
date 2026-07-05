const BaseModel = require("../../../shared/models/base.model")
const db = require("../../../shared/config/db")

// ===============================
// 🔍 GET ALL PANITIA WITH FULL DETAIL (raw query → model)
const getAllPanitiaWithDetail = async (conn = null) => {
  const sql = `
    SELECT 
      pk.id,
      pk.kegiatan_id,
      pk.divisi_id,
      pk.mahasiswa_id,
      pk.jabatan,
      pk.status,
      pk.created_at,
      pk.removed_at,
      pk.removal_reason,
      m.nama AS mahasiswa_nama,
      m.nim,
      dk.nama_divisi,
      k.nama_kegiatan,
      k.status AS kegiatan_status
    FROM panitia_kegiatan pk
    LEFT JOIN mahasiswa m ON m.id = pk.mahasiswa_id
    LEFT JOIN divisi_kegiatan dk ON dk.id = pk.divisi_id
    LEFT JOIN kegiatan k ON k.id = pk.kegiatan_id
    ORDER BY pk.created_at DESC
  `

  if (conn) {
    const [rows] = await conn.query(sql)
    return rows
  }

  const [rows] = await db.query(sql)
  return rows
}

// ===============================
// 🔍 FIND CO BY PENDAFTARAN ID (untuk validasi akses CO)
const findCOByPendaftaranId = async (pendaftaran_id, conn = null) => {
  const sql = `
    SELECT dk.co_mahasiswa_id
    FROM pendaftaran_panitia pp
    JOIN divisi_kegiatan dk ON dk.id = pp.divisi_id
    WHERE pp.id = ?
  `

  if (conn) {
    const [rows] = await conn.query(sql, [pendaftaran_id])
    return rows[0] || null
  }

  const [rows] = await db.query(sql, [pendaftaran_id])
  return rows[0] || null
}

// ===============================
// 🔍 FIND PANITIA WITH KEGIATAN STATUS (FOR UPDATE)
const findPanitiaWithKegiatanForUpdate = async (id, conn) => {
  const [rows] = await conn.query(
    `SELECT pk.*, k.status AS kegiatan_status
     FROM panitia_kegiatan pk
     JOIN kegiatan k ON k.id = pk.kegiatan_id
     WHERE pk.id = ? FOR UPDATE`,
    [id]
  )
  return rows[0] || null
}

// ===============================
// 🚫 SOFT REMOVE PANITIA (UPDATE status='cancelled')
const softRemovePanitia = async ({ id, actor_id, reason }, conn) => {
  await conn.query(
    `UPDATE panitia_kegiatan 
     SET removed_at = NOW(),
         removed_by = ?,
         removal_reason = ?,
         status = 'cancelled'
     WHERE id = ?`,
    [actor_id, reason, id]
  )
}

// ===============================
// 📝 INSERT PANITIA LOG
const insertPanitiaLog = async ({ panitia_id, aksi, actor_id, keterangan }, conn) => {
  await conn.query(
    `INSERT INTO panitia_logs (panitia_id, aksi, actor_id, keterangan)
     VALUES (?, ?, ?, ?)`,
    [panitia_id, aksi, actor_id, keterangan]
  )
}

// ===============================
const findDivisi = async (divisi_id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT id, kegiatan_id, kuota, nama_divisi
       FROM divisi_kegiatan
      WHERE id = ?`,
    [divisi_id],
    conn
  )
  return rows[0] || null
}

const findKegiatan = async (kegiatan_id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT id, status, semester_id, unit_id, icp_reward,
            pendaftaran_selesai, pendaftaran_closed_at
       FROM kegiatan
      WHERE id = ?`,
    [kegiatan_id],
    conn
  )
  return rows[0] || null
}

const checkDuplicateKegiatan = async (mahasiswa_id, kegiatan_id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT pp.id 
       FROM pendaftaran_panitia pp
       JOIN divisi_kegiatan dk ON pp.divisi_id = dk.id
      WHERE pp.mahasiswa_id = ?
        AND dk.kegiatan_id = ?
        AND pp.status IN ('pending','approved')
      LIMIT 1`,
    [mahasiswa_id, kegiatan_id],
    conn
  )
  return rows.length > 0
}

const checkDuplicateDivisi = async (mahasiswa_id, divisi_id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT id
       FROM pendaftaran_panitia 
      WHERE mahasiswa_id = ?
        AND divisi_id = ?
        AND status IN ('pending','approved')
      LIMIT 1`,
    [mahasiswa_id, divisi_id],
    conn
  )
  return rows.length > 0
}

const insertPendaftaran = async (mahasiswa_id, divisi_id, conn) => {
  const [result] = await BaseModel.query(
    `INSERT INTO pendaftaran_panitia (mahasiswa_id, divisi_id, status)
     VALUES (?, ?, 'pending')`,
    [mahasiswa_id, divisi_id],
    conn
  )
  return result.insertId
}

const findPendaftaranForUpdate = async (id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT pp.*,
            dk.kegiatan_id,
            dk.kuota,
            dk.nama_divisi
       FROM pendaftaran_panitia pp
       JOIN divisi_kegiatan dk ON pp.divisi_id = dk.id
      WHERE pp.id = ?
      FOR UPDATE`,
    [id],
    conn
  )
  return rows[0] || null
}

const countPanitia = async (divisi_id, conn) => {
  const [[row]] = await BaseModel.query(
    `SELECT COUNT(*) AS total
       FROM panitia_kegiatan
      WHERE divisi_id = ?
        AND removed_at IS NULL
        AND status = 'approved'`,
    [divisi_id],
    conn
  )
  return Number(row.total) || 0
}

const insertPanitia = async (data, conn) => {
  const [result] = await BaseModel.query(
    `INSERT INTO panitia_kegiatan
       (mahasiswa_id, divisi_id, kegiatan_id, jabatan, status)
     VALUES (?, ?, ?, 'anggota', 'approved')`,
    [data.mahasiswa_id, data.divisi_id, data.kegiatan_id],
    conn
  )
  return result.insertId
}

const updateStatus = async (id, status, conn) => {
  const allowed = ["pending", "approved", "rejected"]
  if (!allowed.includes(status)) {
    throw new Error(`Status tidak valid: ${status}`)
  }

  const [result] = await BaseModel.query(
    `UPDATE pendaftaran_panitia
        SET status = ?
      WHERE id = ?
        AND status = 'pending'`,
    [status, id],
    conn
  )

  if (result.affectedRows === 0) {
    throw new Error("Pendaftaran tidak bisa diubah (sudah diproses)")
  }
}

const getPanitiaByKegiatan = async (kegiatan_id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT pk.id,
            pk.mahasiswa_id,
            pk.divisi_id,
            pk.jabatan,
            pk.point_override,
            m.nama,
            m.nim
       FROM panitia_kegiatan pk
       JOIN mahasiswa m ON pk.mahasiswa_id = m.id
      WHERE pk.kegiatan_id = ?
        AND pk.status = 'approved'
        AND pk.removed_at IS NULL`,
    [kegiatan_id],
    conn
  )
  return rows
}

const getPanitiaById = async (id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT * FROM panitia_kegiatan
      WHERE id = ?
      FOR UPDATE`,
    [id],
    conn
  )
  return rows[0] || null
}

const removePanitia = async (id, removed_by, reason, conn) => {
  const [result] = await BaseModel.query(
    `UPDATE panitia_kegiatan
        SET removed_at = NOW(),
            removed_by = ?,
            removal_reason = ?,
            status = 'cancelled'
      WHERE id = ?
        AND removed_at IS NULL`,
    [removed_by, reason || null, id],
    conn
  )

  if (result.affectedRows === 0) {
    throw new Error("Anggota panitia tidak bisa dihapus (sudah dihapus sebelumnya)")
  }
}

module.exports = {
  // 🆕 Refactor additions
  getAllPanitiaWithDetail,
  findCOByPendaftaranId,
  findPanitiaWithKegiatanForUpdate,
  softRemovePanitia,
  insertPanitiaLog,
  
  // Existing
  findDivisi,
  findKegiatan,
  checkDuplicateKegiatan,
  checkDuplicateDivisi,
  insertPendaftaran,
  findPendaftaranForUpdate,
  countPanitia,
  insertPanitia,
  updateStatus,
  getPanitiaByKegiatan,
  getPanitiaById,
  removePanitia
} 