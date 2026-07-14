const db = require("../../../shared/config/db")

// ===============================
// 🔒 NORMALIZE HELPER
const normalize = (v) => String(v || "").trim().toLowerCase()

// ===============================
const getAllUsers = (conn = null) => {
  const connection = conn || db

  return connection.query(`
    SELECT 
      u.id,
      u.username,
      u.role,
      u.status,
      m.nim,
      d.nidn
    FROM users u
    LEFT JOIN mahasiswa m ON m.user_id = u.id
    LEFT JOIN dosen d ON d.user_id = u.id
  `)
}

// ===============================
const getUserById = (id, conn = null) => {
  const connection = conn || db

  return connection.query(
    `SELECT id, username, role, status FROM users WHERE id = ?`,
    [id]
  )
}

// ===============================
// Find user basic (untuk validasi internal)
// FINAL CLEANUP — kolom legacy access_kelola_kegiatan dihapus.
const findUserBasic = async (id, conn = null) => {
  const connection = conn || db

  const [rows] = await connection.query(
    `SELECT id, role, status FROM users WHERE id = ? LIMIT 1`,
    [id]
  )

  return rows[0] || null
}

// ===============================
const findByUsername = async (username, conn = null) => {
  const connection = conn || db

  const normalized = normalize(username)

  const [rows] = await connection.query(
    `SELECT id, username FROM users WHERE LOWER(username) = ?`,
    [normalized]
  )

  return rows[0] || null
}

// ===============================
const insertUser = async (data, conn = null) => {
  const connection = conn || db

  const {
    username,
    password,
    role,
    createdBy = null
  } = data

  const normalized = normalize(username)

  const [result] = await connection.query(
    `INSERT INTO users (username, password, role, created_by)
     VALUES (?, ?, ?, ?)`,
    [normalized, password, role, createdBy]
  )

  return result.insertId
}

// ===============================
const updateUserDynamic = async (id, fields, conn = null) => {
  const connection = conn || db

  const keys = Object.keys(fields)
  if (!keys.length) return

  const setClause = keys.map(key => `${key}=?`).join(", ")
  const values = keys.map(key => {
    if (key === "username") {
      return normalize(fields[key])
    }
    return fields[key]
  })

  await connection.query(
    `UPDATE users SET ${setClause} WHERE id=?`,
    [...values, id]
  )
}

// ===============================
const deactivateUser = (id, conn = null) => {
  const connection = conn || db

  return connection.query(
    `UPDATE users SET status='nonaktif' WHERE id=?`,
    [id]
  )
}

// ===============================
const softDeleteUser = (id, conn = null) => {
  const connection = conn || db

  return connection.query(
    `UPDATE users 
     SET status='nonaktif' 
     WHERE id=?`,
    [id]
  )
}

// ===============================
const hardDeleteUser = (id, conn = null) => {
  const connection = conn || db

  return connection.query(
    `DELETE FROM users WHERE id=?`,
    [id]
  )
}

// ===============================
const getMahasiswaByUserId = (user_id, conn = null) => {
  const connection = conn || db

  return connection.query(
    `SELECT * FROM mahasiswa WHERE user_id = ?`,
    [user_id]
  )
}

// ===============================
const getDosenByUserId = (user_id, conn = null) => {
  const connection = conn || db

  return connection.query(
    `SELECT * FROM dosen WHERE user_id = ?`,
    [user_id]
  )
}

// ===============================
// FINAL CLEANUP — fungsi legacy updateAccessKelolaKegiatan DIHAPUS.
// Pemberian/pencabutan akses kelola_kegiatan kini lewat
// /api/role-management/users/:id/access (admin_access table).

module.exports = {
  getAllUsers,
  getUserById,
  findUserBasic,
  findByUsername,
  insertUser,
  updateUserDynamic,
  deactivateUser,
  softDeleteUser,
  hardDeleteUser,
  getMahasiswaByUserId,
  getDosenByUserId
}
