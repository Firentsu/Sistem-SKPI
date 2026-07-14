const BaseModel = require("../../../shared/models/base.model")
const db = require("../../../shared/config/db")

// ===============================
const findActiveSemester = async (conn) => {
  const row = await BaseModel.findOne(
    `SELECT id, tahun_ajaran, semester 
     FROM semesters 
     WHERE aktif = 1 
     LIMIT 1`,
    [],
    conn
  )

  return row || null
}

// ===============================
const findSemesterById = async (id, conn) => {
  const row = await BaseModel.findOne(
    `SELECT id, tahun_ajaran, semester, aktif, edit_window_until
     FROM semesters
     WHERE id = ?`,
    [id],
    conn
  )

  return row || null
}

// ===============================
// REVISI 11POIN #10: edit-window semester lama
// Semester boleh diedit jika aktif=1 ATAU masih dalam edit_window_until.
const isEditable = async (id, conn = null) => {
  const row = await BaseModel.findOne(
    `SELECT id FROM semesters
     WHERE id = ?
       AND (aktif = 1
            OR (edit_window_until IS NOT NULL AND edit_window_until > NOW()))`,
    [id],
    conn
  )
  return !!row
}

// Set / perpanjang edit-window. until = NULL untuk menutup.
const setEditWindow = async (id, until, conn = null) => {
  const [result] = await BaseModel.query(
    `UPDATE semesters SET edit_window_until = ? WHERE id = ?`,
    [until, id],
    conn
  )
  return result.affectedRows
}

// ===============================
// 🆕 GET ALL SEMESTER
const findAllSemester = async (conn = null) => {
  const sql = `
    SELECT id, tahun_ajaran, semester, aktif, created_at
    FROM semesters
    ORDER BY id DESC
  `

  if (conn) {
    const [rows] = await conn.query(sql)
    return rows
  }

  const [rows] = await db.query(sql)
  return rows
}

// ===============================
// 🆕 COUNT SEMESTER (untuk cek duplikat)
const countByTahunSemester = async (tahun_ajaran, semester, conn = null) => {
  const sql = `
    SELECT COUNT(*) as total 
    FROM semesters 
    WHERE tahun_ajaran = ? AND semester = ?
  `
  const params = [tahun_ajaran, semester]

  if (conn) {
    const [rows] = await conn.query(sql, params)
    return Number(rows[0].total) || 0
  }

  const [rows] = await db.query(sql, params)
  return Number(rows[0].total) || 0
}

// ===============================
// 🆕 INSERT SEMESTER (default aktif=0)
const insertSemester = async ({ tahun_ajaran, semester }, conn = null) => {
  const sql = `
    INSERT INTO semesters (tahun_ajaran, semester, aktif) 
    VALUES (?, ?, 0)
  `
  const params = [tahun_ajaran, semester]

  if (conn) {
    const [result] = await conn.query(sql, params)
    return result.insertId
  }

  const [result] = await db.query(sql, params)
  return result.insertId
}

// ===============================
// 🆕 DEACTIVATE ALL (untuk set active flow)
const deactivateAll = async (conn) => {
  await conn.query(`UPDATE semesters SET aktif = 0`)
}

// ===============================
// 🆕 ACTIVATE BY ID
const activateById = async (id, conn) => {
  const [result] = await conn.query(
    `UPDATE semesters SET aktif = 1 WHERE id = ?`,
    [id]
  )
  return result.affectedRows
}

module.exports = {
  findActiveSemester,
  findSemesterById,
  findAllSemester,
  countByTahunSemester,
  insertSemester,
  deactivateAll,
  activateById,
  isEditable,
  setEditWindow
} 