const auditService = require("../services/audit.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const validateUser = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error("User tidak valid")
  }
}

const safeError = (err) => err?.message || "Terjadi kesalahan"

// ===============================
const runAudit = async (req, res) => {
  try {
    validateUser(req)

    const result = await auditService.runFullAudit()

    return success(res, result, "Audit system berhasil dijalankan")

  } catch (error) {
    return fail(res, safeError(error))
  }
} 

// ===============================
const runAutoFix = async (req, res) => {
  try {
    validateUser(req)

    const [
      fixInvalid,
      fixDuplicate,
      recalculated
    ] = await Promise.all([
      auditService.fixInvalidTransactions(),
      auditService.fixDuplicateLedger(),
      auditService.recalculateBalance()
    ])

    return success(res, {
      fixInvalid,
      fixDuplicate,
      recalculated
    }, "Auto fix berhasil dijalankan")

  } catch (error) {
    return fail(res, safeError(error))
  }
}

module.exports = {
  runAudit,
  runAutoFix
} 