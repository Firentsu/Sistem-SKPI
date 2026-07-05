const auditService = require("../services/auditReport.service")

const getAuditLogs = async (req, res) => {
  try {
    const { role, action, start_date, end_date } = req.query

    const data = await auditService.getAuditLogs({
      role,
      action,
      start_date,
      end_date
    })

    res.json({
      success: true,
      data
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

const getICPTracking = async (req, res) => {
  try {
    const data = await auditService.getICPTracking()

    res.json({
      success: true,
      data
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

module.exports = {
  getAuditLogs,
  getICPTracking
} 