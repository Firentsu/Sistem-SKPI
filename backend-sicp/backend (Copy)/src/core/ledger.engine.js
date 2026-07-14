// ============================================================================
// CENTRAL LEDGER ENGINE v1
// ----------------------------------------------------------------------------
// Single source of truth untuk seluruh pembuatan ledger ICP
// ============================================================================

const icpTransactionService = require("../modules/icp/services/icpTransaction.service")
const { logAudit } = require("../modules/audit/services/audit.service")
const {
  VALID_SOURCE_TYPES
} = require("../shared/constants/icpSourceType")

// ============================================================================
const validatePayload = (payload) => {
  const required = [
    "mahasiswa_id",
    "source_type",
    "deskripsi",
    "point",
    "tipe",
    "semester_id",
    "kategori_id"
  ]

  for (const field of required) {
    if (
      payload[field] === undefined ||
      payload[field] === null ||
      payload[field] === ""
    ) {
      throw new Error(`${field} wajib`)
    }
  }

  if (!VALID_SOURCE_TYPES.includes(payload.source_type)) {
    throw new Error("source_type tidak valid")
  }

  if (!["masuk", "keluar"].includes(payload.tipe)) {
    throw new Error("tipe transaksi tidak valid")
  }
}

// ============================================================================
const createLedger = async ({
  payload,
  actor,
  audit_action,
  audit_detail
}) => {
  validatePayload(payload)

  if (!payload.conn) {
    throw new Error("conn wajib")
  }

  const result = await icpTransactionService.createTransaction(
    payload,
    actor
  )

  // duplicate = tidak audit ulang
  if (result.duplicated) {
    return result
  }

  // ==========================================================================
  // AUDIT
  await logAudit({
    user_id: actor.id,
    role: actor.role,
    action: audit_action || "CREATE_LEDGER",
    target_table: "icp_transactions",
    target_id: result.id,
    detail: audit_detail || {
      mahasiswa_id: payload.mahasiswa_id,
      point: payload.point,
      source_type: payload.source_type
    },
    conn: payload.conn
  })

  return result
}

module.exports = {
  createLedger
} 