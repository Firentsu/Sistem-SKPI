const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 🔍 GET USER
const findUserByUsername = async (username, conn) => {
  const [rows] = await BaseModel.query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username],
    conn
  )
  return rows[0] || null
}

// ===============================
// 🔍 GET MAHASISWA
const findMahasiswaByUserId = async (userId, conn) => {
  const [rows] = await BaseModel.query(
    "SELECT id FROM mahasiswa WHERE user_id = ? LIMIT 1",
    [userId],
    conn
  )
  return rows[0] || null
}

// ===============================
// 🔍 GET DOSEN
const findDosenByUserId = async (userId, conn) => {
  const [rows] = await BaseModel.query(
    "SELECT id FROM dosen WHERE user_id = ? LIMIT 1",
    [userId],
    conn
  )
  return rows[0] || null
}

// ===============================
// 📝 LOGIN LOG
const insertLoginLog = async (userId, ip, device, conn) => {
  await BaseModel.query(
    `INSERT INTO login_log (user_id, ip_address, device)
     VALUES (?, ?, ?)`,
    [userId, ip || null, device || null],
    conn
  )
}

// ===============================
// ➕ CREATE USER
const insertUser = async (data, conn) => {
  const [result] = await BaseModel.query(
    `INSERT INTO users (username, password, role, created_at, created_by)
     VALUES (?, ?, ?, NOW(), ?)`,
    [data.username, data.password, data.role, data.createdBy],
    conn
  )

  return result.insertId
}

// ===============================
const insertMahasiswa = async (userId, username, conn) => {
  const nim = `AUTO-${userId}`

  await BaseModel.query(
    `INSERT INTO mahasiswa (user_id, nim, nama, status)
     VALUES (?, ?, ?, 'aktif')`,
    [userId, nim, username],
    conn
  )
}

// ===============================
const insertDosen = async (userId, username, conn) => {
  await BaseModel.query(
    `INSERT INTO dosen (user_id, nama)
     VALUES (?, ?)`,
    [userId, username],
    conn
  )
}

module.exports = {
  findUserByUsername,
  findMahasiswaByUserId,
  findDosenByUserId,
  insertLoginLog,
  insertUser,
  insertMahasiswa,
  insertDosen
} 