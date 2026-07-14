const db = require("../config/db")

const ALLOWED_TABLES = {
  mahasiswa: "mahasiswa",
  kategori: "kategori_icp",
  semester: "semesters",
  user: "users",
  unit: "unit_organisasi"
}

const required = (value, field) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${field} wajib diisi`)
  }
}

const isPositiveNumber = (value, field) => {
  const num = Number(value)

  if (isNaN(num) || num <= 0) {
    throw new Error(`${field} harus lebih dari 0`)
  }

  return num
}

const sanitizeString = (value) => {
  if (typeof value !== "string") return ""
  return value.trim()
}

const exists = async (tableKey, field, value, label, conn = null) => {
  const table = ALLOWED_TABLES[tableKey]

  if (!table) {
    throw new Error("Table tidak diizinkan")
  }

  const connection = conn || db

  const [rows] = await connection.query(
    `SELECT 1 FROM ${table} WHERE ${field} = ? LIMIT 1`,
    [value]
  )

  if (!rows.length) {
    throw new Error(`${label} tidak ditemukan`)
  }

  return true
}

module.exports = {
  required,
  isPositiveNumber,
  sanitizeString,
  exists
}