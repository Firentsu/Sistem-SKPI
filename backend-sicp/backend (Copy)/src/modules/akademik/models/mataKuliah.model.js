const BaseModel = require("../../../shared/models/base.model")

// REVISI v2: mata_kuliah multi-dosen + multi-mahasiswa (drop kolom dosen_id)
const getAll = async (semesterId = null, conn = null) => {
  let sql = `
    SELECT mk.*, j.nama_jurusan,
           s.tahun_ajaran, s.semester,
           (SELECT COUNT(*) FROM mata_kuliah_dosen mkd
            WHERE mkd.mata_kuliah_id = mk.id) AS jumlah_dosen,
           (SELECT COUNT(*) FROM mata_kuliah_mahasiswa mkm
            WHERE mkm.mata_kuliah_id = mk.id AND mkm.status='aktif') AS jumlah_mahasiswa
    FROM mata_kuliah mk
    LEFT JOIN jurusan j ON j.id = mk.jurusan_id
    LEFT JOIN semesters s ON s.id = mk.semester_id
  `
  const params = []
  if (semesterId) { sql += ` WHERE mk.semester_id = ?`; params.push(semesterId) }
  sql += ` ORDER BY mk.id DESC`
  return await BaseModel.query(sql, params, conn)
}

const insert = async (data, conn) => {
  const [result] = await BaseModel.query(
    `INSERT INTO mata_kuliah
     (kode_mk, nama_mk, jurusan_id, angkatan, semester_id, sks)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.kode_mk, data.nama_mk, data.jurusan_id,
     data.angkatan || null, data.semester_id, data.sks || 0],
    conn)
  return result.insertId
}

const update = async (id, data, conn) => {
  await BaseModel.query(
    `UPDATE mata_kuliah
     SET kode_mk=?, nama_mk=?, jurusan_id=?, angkatan=?, semester_id=?, sks=?
     WHERE id=?`,
    [data.kode_mk, data.nama_mk, data.jurusan_id,
     data.angkatan, data.semester_id, data.sks, id],
    conn)
}

const findById = async (id, conn = null) =>
  await BaseModel.findOne(`SELECT * FROM mata_kuliah WHERE id = ?`, [id], conn)

const remove = async (id, conn) => {
  await BaseModel.query(`DELETE FROM mata_kuliah WHERE id = ?`, [id], conn)
}

module.exports = { getAll, insert, update, findById, remove }
