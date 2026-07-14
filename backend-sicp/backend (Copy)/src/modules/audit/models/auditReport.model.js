const BaseModel = require("../../../shared/models/base.model")

// ===============================
const findAuditLogs = async (filters, conn) => {
  const {
    user_id,
    role,
    action,
    target_table,
    start_date,
    end_date,
    limit = 50
  } = filters

  let where = "WHERE 1=1"
  const params = []

  if (user_id) {
    where += " AND a.user_id = ?"
    params.push(user_id)
  }

  if (role) {
    where += " AND a.role = ?"
    params.push(role)
  }

  if (action) {
    where += " AND a.action = ?"
    params.push(action)
  }

  if (target_table) {
    where += " AND a.target_table = ?"
    params.push(target_table)
  }

  if (start_date) {
    where += " AND a.created_at >= ?"
    params.push(start_date)
  }

  if (end_date) {
    where += " AND a.created_at <= ?"
    params.push(end_date)
  }

  return await BaseModel.findAll(
    `
    SELECT 
      a.id,
      a.user_id,
      u.username AS nama,
      a.role,
      a.action,
      a.target_table,
      a.target_id,
      a.detail,
      a.created_at
    FROM audit_log a
    JOIN users u ON u.id = a.user_id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ?
  `,
    [...params, Number(limit)],
    conn
  )
}

// ===============================
const findICPTracking = async (conn) => {
  return await BaseModel.findAll(
    `
    SELECT 
      t.id,
      t.mahasiswa_id,
      t.point,
      t.tipe,
      t.status,
      t.created_at,

      u1.username AS created_by_name,
      u1.role AS created_by_role,

      u2.username AS validated_by_name,
      u2.role AS validated_by_role

    FROM icp_transactions t
    LEFT JOIN users u1 ON u1.id = t.created_by
    LEFT JOIN users u2 ON u2.id = t.validated_by

    WHERE t.status = 'approved'

    ORDER BY t.created_at DESC
    LIMIT 100
  `,
    [],
    conn
  )
}

module.exports = {
  findAuditLogs,
  findICPTracking
} 