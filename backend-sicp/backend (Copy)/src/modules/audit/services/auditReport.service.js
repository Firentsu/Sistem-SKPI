const model = require("../models/auditReport.model")

// ===============================
const safeParse = (val) => {
  try {
    return typeof val === "string" ? JSON.parse(val) : val
  } catch {
    return null
  }
}

// ===============================
const normalizeFilters = (filters) => {
  return {
    user_id: filters.user_id ? Number(filters.user_id) : null,
    action: filters.action || null,
    target_table: filters.target_table || null,
    limit: filters.limit ? Number(filters.limit) : 50
  }
}

// ===============================
const getAuditLogs = async (filters = {}, conn = null) => {
  const safeFilters = normalizeFilters(filters)

  const rows = await model.findAuditLogs(safeFilters, conn)

  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    role: r.role,
    action: r.action,
    target_table: r.target_table,
    target_id: r.target_id,
    detail: safeParse(r.detail),
    created_at: r.created_at
  }))
}

// ===============================
const getICPTracking = async (conn = null) => {
  const rows = await model.findICPTracking(conn)

  return Array.isArray(rows) ? rows : []
}

module.exports = {
  getAuditLogs,
  getICPTracking
} 