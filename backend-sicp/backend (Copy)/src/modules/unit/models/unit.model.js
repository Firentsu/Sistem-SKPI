const BaseModel = require("../../../shared/models/base.model")

// ===============================
const insertUnit = async (data, conn) => {
  const { nama_unit, deskripsi } = data

  const [res] = await BaseModel.query(
    `INSERT INTO unit_organisasi (nama_unit, deskripsi)
     VALUES (?, ?)`,
    [nama_unit, deskripsi || null],
    conn
  )

  return res.insertId
}

// ===============================
const findAllUnits = async (conn) => {
  return await BaseModel.findAll(
    `SELECT id, nama_unit, deskripsi
     FROM unit_organisasi
     ORDER BY id DESC`,
    [],
    conn
  )
}

// ===============================
const findByName = async (nama_unit, conn) => {
  return await BaseModel.findOne(
    `SELECT id FROM unit_organisasi WHERE nama_unit = ? LIMIT 1`,
    [nama_unit],
    conn
  )
}

// ===============================
const findById = async (id, conn) => {
  return await BaseModel.findOne(
    `SELECT id FROM unit_organisasi WHERE id = ?`,
    [id],
    conn
  )
}

// ===============================
const updateUnit = async (id, data, conn) => {
  const { nama_unit, deskripsi } = data

  const [res] = await BaseModel.query(
    `UPDATE unit_organisasi
     SET nama_unit = COALESCE(?, nama_unit),
         deskripsi = COALESCE(?, deskripsi)
     WHERE id = ?`,
    [nama_unit, deskripsi, id],
    conn
  )

  return res.affectedRows
}

// ===============================
const deleteUnit = async (id, conn) => {
  const [res] = await BaseModel.query(
    `DELETE FROM unit_organisasi WHERE id = ?`,
    [id],
    conn
  )

  return res.affectedRows
}

// ===============================
const isUnitUsed = async (id, conn) => {
  const row = await BaseModel.findOne(
    `SELECT id FROM kegiatan WHERE unit_id = ? LIMIT 1`,
    [id],
    conn
  )

  return !!row
}

module.exports = {
  insertUnit,
  findAllUnits,
  findByName,
  findById,
  updateUnit,
  deleteUnit,
  isUnitUsed
} 