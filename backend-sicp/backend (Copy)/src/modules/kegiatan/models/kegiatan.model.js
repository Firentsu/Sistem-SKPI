const BaseModel = require("../../../shared/models/base.model")

const checkUnit = async (unit_id, conn) => {
  return await BaseModel.findOne(
    "SELECT id FROM unit_organisasi WHERE id = ?",
    [unit_id],
    conn
  )
}

const checkUnitKategori = async (unit_id, kategori_id, conn) => {
  const row = await BaseModel.findOne(
    `SELECT 1 FROM unit_kategori
     WHERE unit_id = ? AND kategori_id = ?`,
    [unit_id, kategori_id],
    conn
  )
  return !!row
}

const getActiveSemester = async (conn) => {
  return await BaseModel.findOne(
    `SELECT id FROM semesters WHERE aktif = 1 LIMIT 1`,
    [],
    conn
  )
}

const insertKegiatan = async (data, conn) => {
  const result = await BaseModel.query(
    `INSERT INTO kegiatan
    (nama_kegiatan, deskripsi, tanggal_mulai, tanggal_selesai, unit_id,
     kategori_id, nama_icp_id, semester_id, icp_reward, status, created_by,
     jadwal_mulai, jadwal_selesai)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`,
    [
      data.nama_kegiatan,
      data.deskripsi || null,
      data.tanggal_mulai || null,
      data.tanggal_selesai || null,
      data.unit_id,
      data.kategori_id,
      data.nama_icp_id || null,
      data.semester_id,
      data.icp_reward || 0,
      data.created_by,
      data.jadwal_mulai || null,
      data.jadwal_selesai || null
    ],
    conn
  )

  return result.insertId
}

const getAllKegiatan = async (conn, semesterId = null, includeHidden = false) => {
  let where = ""
  const params = []
  if (semesterId === "all") {
    where = ""
  } else if (semesterId) {
    where = "WHERE k.semester_id = ?"
    params.push(semesterId)
  } else {
    where = "WHERE k.semester_id = (SELECT id FROM semesters WHERE aktif = 1 LIMIT 1)"
  }
  where += where ? " AND " : "WHERE "
  where += includeHidden ? "k.is_hidden = 1" : "k.is_hidden = 0"
  return await BaseModel.findAll(
    `SELECT k.*, u.username as created_by_name, s.tahun_ajaran, s.semester,
            un.nama_unit, ki.nama_kategori, ni.nama AS nama_icp
     FROM kegiatan k
     LEFT JOIN users u ON k.created_by = u.id
     LEFT JOIN semesters s ON k.semester_id = s.id
     LEFT JOIN unit_organisasi un ON k.unit_id = un.id
     LEFT JOIN kategori_icp ki ON k.kategori_id = ki.id
     LEFT JOIN nama_icp ni ON k.nama_icp_id = ni.id
     ${where}
     ORDER BY k.id DESC`,
    params,
    conn
  )
}

//soft hide, tidak menghapus data.
const setHidden = async (id, hidden, conn) => {
  await BaseModel.query(
    `UPDATE kegiatan
     SET is_hidden = ?, hidden_at = ${hidden ? "NOW()" : "NULL"}
     WHERE id = ?`,
    [hidden ? 1 : 0, id],
    conn
  )
}

const getKegiatanDetail = async (id, conn) => {
  return await BaseModel.findOne(
    `SELECT id, nama_kegiatan, deskripsi, unit_id, kategori_id, nama_icp_id,
            semester_id, icp_reward, status, created_by,
            jadwal_mulai, jadwal_selesai, started_at, ended_at,
            pendaftaran_mulai, pendaftaran_selesai, pendaftaran_closed_at
     FROM kegiatan WHERE id = ?`,
    [id],
    conn
  )
}

const updateStatus = async (id, status, conn) => {
  await BaseModel.query(
    `UPDATE kegiatan SET status = ? WHERE id = ?`,
    [status, id],
    conn
  )
}

const findDueToStart = async (conn) => {
  return await BaseModel.findAll(
    `SELECT id FROM kegiatan
     WHERE status IN ('draft','pendaftaran_dibuka')
       AND jadwal_mulai IS NOT NULL
       AND jadwal_mulai <= NOW()`,
    [],
    conn
  )
}

const findDueToFinish = async (conn) => {
  return await BaseModel.findAll(
    `SELECT id FROM kegiatan
     WHERE status = 'berjalan'
       AND jadwal_selesai IS NOT NULL
       AND jadwal_selesai <= NOW()`,
    [],
    conn
  )
}

const findDueToClosePendaftaran = async (conn) => {
  return await BaseModel.findAll(
    `SELECT id FROM kegiatan
     WHERE status = 'pendaftaran_dibuka'
       AND pendaftaran_selesai IS NOT NULL
       AND pendaftaran_selesai <= NOW()
       AND pendaftaran_closed_at IS NULL`,
    [],
    conn
  )
}

module.exports = {
  checkUnit,
  checkUnitKategori,
  getActiveSemester,
  insertKegiatan,
  getAllKegiatan,
  getKegiatanDetail,
  updateStatus,
  findDueToStart,
  findDueToFinish,
  findDueToClosePendaftaran,
  setHidden
}
