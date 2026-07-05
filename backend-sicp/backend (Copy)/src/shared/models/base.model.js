const db = require("../config/db")

const query = async (sql, params = [], conn = null) => {
  if (conn) {
    return await conn.query(sql, params)
  }

  const [rows] = await db.query(sql, params)
  return [rows]
}

const findOne = async (sql, params = [], conn = null) => {
  const [rows] = await query(sql, params, conn)
  return rows[0] || null
}

const findAll = async (sql, params = [], conn = null) => {
  const [rows] = await query(sql, params, conn)
  return rows
}

module.exports = {
  query,
  findOne,
  findAll
} 