const auditService = require("../../audit/services/audit.service")

// ===============================
const classifyStatus = ({ negative, duplicate }) => {
  if (negative > 0) return "critical"
  if (duplicate > 0) return "warning"
  return "healthy"
}

// ===============================
const getSystemHealth = async () => {
  const [
    negativeBalance,
    duplicateLedger
  ] = await Promise.all([
    auditService.checkNegativeBalance(),
    auditService.detectDuplicateLedger()
  ])

  const result = {
    negative_balance: negativeBalance.length,
    duplicate_ledger: duplicateLedger.length
  }

  return {
    status: classifyStatus({
      negative: result.negative_balance,
      duplicate: result.duplicate_ledger
    }),
    issues: result,
    timestamp: new Date()
  }
}

module.exports = {
  getSystemHealth
}
