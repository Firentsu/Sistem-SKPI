const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 🔹 GET MAHASISWA BY USER ID
// ===============================
const getByUserId = async (user_id, conn = null) => {
  return await BaseModel.findOne(
    `SELECT id, user_id, nim, nama, status
     FROM mahasiswa
     WHERE user_id = ?
     LIMIT 1`,
    [user_id],
    conn
  )
}

// ===============================
// 🔹 GET BY ID
// ===============================
const getById = async (id, conn = null) => {
  return await BaseModel.findOne(
    `SELECT id, user_id, nim, nama, status
     FROM mahasiswa
     WHERE id = ?
     LIMIT 1`,
    [id],
    conn
  )
}

// ===============================
// 🔒 GET ACTIVE ONLY (UNTUK ICP)
// ===============================
const getActiveById = async (id, conn = null) => {
  return await BaseModel.findOne(
    `SELECT id, user_id, nim, nama, status
     FROM mahasiswa
     WHERE id = ? AND status = 'aktif'
     LIMIT 1`,
    [id],
    conn
  )
}

// ===============================
// 🔒 GET ACTIVE BY USER
// ===============================
const getActiveByUserId = async (user_id, conn = null) => {
  return await BaseModel.findOne(
    `SELECT id, user_id, nim, nama, status
     FROM mahasiswa
     WHERE user_id = ? AND status = 'aktif'
     LIMIT 1`,
    [user_id],
    conn
  )
}

module.exports = {
  getByUserId,
  getById,
  getActiveById,
  getActiveByUserId
} 