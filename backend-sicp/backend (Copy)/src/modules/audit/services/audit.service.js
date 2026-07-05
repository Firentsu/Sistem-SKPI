const BaseModel = require("../../../shared/models/base.model")

// ===============================
const safeStringify = (data) => {
  try {
    return JSON.stringify(data || {})
  } catch {
    return JSON.stringify({ error: "invalid detail" })
  }
}

// ===============================
const logAudit = async ({
  user_id,
  role = null,
  action,
  target_table = null,
  target_id = null,
  detail = {},
  conn
}) => {
  // if (!conn) throw new Error("Audit wajib pakai connection")
  if (!user_id || !action) throw new Error("Audit tidak valid")

  await BaseModel.query(
    `INSERT INTO audit_log
     (user_id, role, action, target_table, target_id, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      user_id,
      role,
      action,
      target_table,
      target_id,
      safeStringify(detail)
    ],
    conn
  )
}

// ===============================
// 🔴 NEGATIVE BALANCE
const checkNegativeBalance = async () => {
  const [rows] = await BaseModel.query(`
    SELECT mahasiswa_id,
           SUM(CASE WHEN tipe='masuk' THEN point ELSE -point END) AS saldo
    FROM icp_transactions
    WHERE status = 'approved'
    GROUP BY mahasiswa_id
    HAVING saldo < 0
  `)
  return rows
}

// ===============================
// 🔴 INVALID POINT
const detectAnomaly = async () => {
  const [rows] = await BaseModel.query(`
    SELECT *
    FROM icp_transactions
    WHERE point <= 0
  `)
  return rows
}

// ===============================
// 🔴 DUPLICATE LEDGER (NEW CORE)
const detectDuplicateLedger = async () => {
  const [rows] = await BaseModel.query(`
    SELECT source_type, source_id, mahasiswa_id, tipe, COUNT(*) as total
    FROM icp_transactions
    WHERE source_id IS NOT NULL
    GROUP BY source_type, source_id, mahasiswa_id, tipe
    HAVING total > 1
  `)
  return rows
}

// ===============================
// 🔍 FULL CONSISTENCY CHECK
const checkTransactionConsistency = async () => {
  const [
    negative,
    duplicate
  ] = await Promise.all([
    checkNegativeBalance(),
    detectDuplicateLedger()
  ])

  return {
    negative_balance: negative,
    duplicate_ledger: duplicate
  }
}

// ===============================
// 📊 RECALCULATE (READ ONLY)
const recalculateBalance = async () => {
  const [rows] = await BaseModel.query(`
    SELECT mahasiswa_id,
           SUM(CASE WHEN tipe='masuk' THEN point ELSE -point END) AS saldo
    FROM icp_transactions
    WHERE status = 'approved'
    GROUP BY mahasiswa_id
  `)
  return rows
}

// ===============================
// 🔧 FIX INVALID (SAFE SOFT FIX)
const fixInvalidTransactions = async () => {
  const [rows] = await BaseModel.query(`
    UPDATE icp_transactions
    SET status = 'rejected'
    WHERE point <= 0
  `)

  return {
    message: "Invalid transaksi ditandai sebagai rejected",
    affected: rows?.affectedRows || 0
  }
}

// ===============================
// 🔧 FIX DUPLICATE (SAFE MARK ONLY)
const fixDuplicateLedger = async () => {
  const [rows] = await BaseModel.query(`
    UPDATE icp_transactions t
    JOIN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY source_type, source_id, mahasiswa_id, tipe
                 ORDER BY id
               ) as rn
        FROM icp_transactions
        WHERE source_id IS NOT NULL
      ) x
      WHERE x.rn > 1
    ) dup ON dup.id = t.id
    SET t.status = 'rejected'
  `)

  return {
    message: "Duplicate ledger ditandai sebagai rejected",
    affected: rows?.affectedRows || 0
  }
}

// ===============================
// 🚀 FULL AUDIT RUN
const runFullAudit = async () => {
  const [
    negative,
    anomaly,
    duplicate
  ] = await Promise.all([
    checkNegativeBalance(),
    detectAnomaly(),
    detectDuplicateLedger()
  ])

  const totalIssues =
    negative.length +
    anomaly.length +
    duplicate.length

  return {
    summary: {
      status: totalIssues === 0 ? "healthy" : "warning",
      total_issues: totalIssues
    },
    negative_balance: negative,
    invalid_point: anomaly,
    duplicate_ledger: duplicate
  }
}

module.exports = {
  logAudit,
  checkNegativeBalance,
  detectAnomaly,
  detectDuplicateLedger,
  checkTransactionConsistency,
  recalculateBalance,
  fixInvalidTransactions,
  fixDuplicateLedger,
  runFullAudit
}