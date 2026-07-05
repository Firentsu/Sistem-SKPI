const BaseModel = require("../../../shared/models/base.model")

const getAll = async (conn = null) => {
  return await BaseModel.query(
    "SELECT * FROM jurusan ORDER BY id DESC",
    [],
    conn
  )
}

const findById = async (id, conn = null) => {
  const [rows] = await BaseModel.query(
    "SELECT * FROM jurusan WHERE id = ?",
    [id],
    conn
  )
  return rows[0]
}

const insert = async (data, conn) => {
  const [result] = await BaseModel.query(
    "INSERT INTO jurusan (nama_jurusan, warna) VALUES (?, ?)",
    [data.nama_jurusan, data.warna || "#888888"],
    conn
  )
  return result.insertId
}

const update = async (id, data, conn) => {
  await BaseModel.query(
    "UPDATE jurusan SET nama_jurusan = ?, warna = COALESCE(?, warna) WHERE id = ?",
    [data.nama_jurusan, data.warna || null, id],
    conn
  )
}

const remove = async (id, conn) => {
  await BaseModel.query(
    "DELETE FROM jurusan WHERE id = ?",
    [id],
    conn
  )
}

module.exports = {
  getAll,
  findById,
  insert,
  update,
  remove
} 