const db = require("../../../shared/config/db")

// ============================================================================
// informasi.model.js
// ----------------------------------------------------------------------------
// Skema tabel informasi_kampus (sesuai migrasi 004):
//   id, judul, deskripsi, foto_path, status, created_by, created_at, updated_at
//
// status: 'published' | 'hidden' | 'deleted'
// ============================================================================

const findById = async (id, conn = null) => {
  const c = conn || db
  const [rows] = await c.query(
    `SELECT * FROM informasi_kampus WHERE id = ? LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

const findAll = async ({ status = null } = {}, conn = null) => {
  const c = conn || db

  let sql = `SELECT id, judul, deskripsi, foto_path, status,
                    created_by, created_at, updated_at
             FROM informasi_kampus`
  const params = []

  if (status) {
    sql += ` WHERE status = ?`
    params.push(status)
  } else {
    sql += ` WHERE status != 'deleted'`
  }
  sql += ` ORDER BY created_at DESC`

  const [rows] = await c.query(sql, params)
  return rows
}

const findPublic = async (conn = null) => {
  const c = conn || db
  const [rows] = await c.query(
    `SELECT id, judul, deskripsi, foto_path, created_at
     FROM informasi_kampus
     WHERE status = 'published'
     ORDER BY created_at DESC`
  )
  return rows
}

const insert = async (data, conn = null) => {
  const c = conn || db
  const [result] = await c.query(
    `INSERT INTO informasi_kampus
       (judul, deskripsi, foto_path, status, created_by)
     VALUES (?, ?, ?, 'published', ?)`,
    [data.judul, data.deskripsi, data.foto_path || null, data.created_by]
  )
  return result.insertId
}

const updateById = async (id, fields, conn = null) => {
  const c = conn || db
  const keys = Object.keys(fields)
  if (!keys.length) return false

  const set = keys.map(k => `${k} = ?`).join(", ")
  const values = keys.map(k => fields[k])

  const [result] = await c.query(
    `UPDATE informasi_kampus SET ${set}, updated_at = NOW() WHERE id = ?`,
    [...values, id]
  )
  return result.affectedRows > 0
}

const setStatus = async (id, status, conn = null) => {
  const c = conn || db
  const [result] = await c.query(
    `UPDATE informasi_kampus
       SET status = ?, updated_at = NOW()
     WHERE id = ?
       AND status != 'deleted'`,
    [status, id]
  )
  return result.affectedRows > 0
}

const softDelete = async (id, conn = null) => {
  const c = conn || db
  const [result] = await c.query(
    `UPDATE informasi_kampus
       SET status = 'deleted', updated_at = NOW()
     WHERE id = ?
       AND status != 'deleted'`,
    [id]
  )
  return result.affectedRows > 0
}

module.exports = {
  findById,
  findAll,
  findPublic,
  insert,
  updateById,
  setStatus,
  softDelete
}
