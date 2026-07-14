const BaseModel = require("../../../shared/models/base.model")

// ===============================
const findNegativeBalance = async (conn) => {
  return await BaseModel.findAll(`
    SELECT 
      mahasiswa_id,
      kategori_id,
      SUM(
        CASE 
          WHEN tipe = 'masuk' THEN point
          WHEN tipe = 'keluar' THEN -point
        END
      ) as saldo
    FROM icp_transactions
    GROUP BY mahasiswa_id, kategori_id
    HAVING saldo < 0
  `, [], conn)
}

// ===============================
const findInvalidTransactions = async (conn) => {
  return await BaseModel.findAll(`
    SELECT * FROM icp_transactions
    WHERE point <= 0
       OR point IS NULL
       OR tipe NOT IN ('masuk','keluar')
  `, [], conn)
}

// ===============================
const findAnomaly = async (conn) => {
  return await BaseModel.findAll(`
    SELECT mahasiswa_id, SUM(point) as total
    FROM icp_transactions
    GROUP BY mahasiswa_id
    HAVING total > 1000000
  `, [], conn)
}

// ===============================
const rejectByIds = async (ids, conn) => {
  if (!ids.length) return

  await BaseModel.query(`
    UPDATE icp_transactions
    SET status = 'rejected'
    WHERE id IN (?)
  `, [ids], conn)
}

// ===============================
const findInvalidTransactionIds = async (conn) => {
  const rows = await BaseModel.findAll(`
    SELECT id FROM icp_transactions
    WHERE point <= 0 OR point IS NULL
  `, [], conn)

  return rows.map(r => r.id)
}

module.exports = {
  findNegativeBalance,
  findInvalidTransactions,
  findAnomaly,
  rejectByIds,
  findInvalidTransactionIds
} 