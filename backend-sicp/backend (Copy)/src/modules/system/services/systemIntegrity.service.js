const db = require("../../../shared/config/db")
const model = require("../models/systemIntegrity.model")
const { logAudit } = require("../../audit/services/audit.service")

// ===============================
const validateSuperAdmin = (actor) => {
  if (!actor || actor.role !== "super_admin") {
    throw new Error("Unauthorized integrity action")
  }
}

// ===============================
const checkNegativeBalance = (conn) =>
  model.findNegativeBalance(conn)

const checkTransactionConsistency = (conn) =>
  model.findInvalidTransactions(conn)

const detectAnomaly = (conn) =>
  model.findAnomaly(conn)

// ===============================
const fullCheck = async (conn = null) => {
  const connection = conn || await db.getConnection()
  const external = !!conn

  try {
    const [
      negative_balance,
      invalid_transactions,
      anomaly
    ] = await Promise.all([
      checkNegativeBalance(connection),
      checkTransactionConsistency(connection),
      detectAnomaly(connection)
    ])

    return {
      negative_balance,
      invalid_transactions,
      anomaly
    }

  } finally {
    if (!external) connection.release()
  }
}

// ===============================
const fixInvalidTransactions = async (actor, conn = null) => {
  validateSuperAdmin(actor)

  const connection = conn || await db.getConnection()
  const external = !!conn

  try {
    if (!external) await connection.beginTransaction()

    const ids = await model.findInvalidTransactionIds(connection)

    if (ids.length > 1000) {
      throw new Error("Terlalu banyak transaksi untuk diperbaiki")
    }

    if (ids.length) {
      await model.rejectByIds(ids, connection)

      await logAudit({
        user_id: actor.id,
        action: "FIX_INVALID_TRANSACTION",
        target_table: "icp_transactions",
        detail: { total: ids.length },
        conn: connection
      })
    }

    if (!external) await connection.commit()

    return { fixed: ids.length }

  } catch (err) {
    if (!external) await connection.rollback()
    throw err
  } finally {
    if (!external) connection.release()
  }
}

module.exports = {
  fullCheck,
  checkNegativeBalance,
  checkTransactionConsistency,
  detectAnomaly,
  fixInvalidTransactions
} 