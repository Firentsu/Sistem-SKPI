const dashboardService = require("../services/dashboard.service")
const { success, fail } = require("../../../shared/utils/response")
const systemHealthService = require("../../system/services/systemHealth.service")

// ===============================
const normalizeQuery = (query) => {
  const result = {}

  if (query.semester_id) {
    const val = Number(query.semester_id)
    if (!isNaN(val)) result.semester_id = val
  }

  if (query.kategori_id) {
    const val = Number(query.kategori_id)
    if (!isNaN(val)) result.kategori_id = val
  }

  if (query.unit_id) {
    const val = Number(query.unit_id)
    if (!isNaN(val)) result.unit_id = val
  }

  return result
}

// ===============================
const validateUser = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error("User tidak valid")
  }
}

// ===============================
const getDashboard = async (req, res) => {
  try {
    validateUser(req)

    const filters = normalizeQuery(req.query)

    const [data, health] = await Promise.all([
      dashboardService.getDashboard(filters),
      systemHealthService.getSystemHealth()
    ])

    return success(res, {
      ...data,
      system_health: health
    })

  } catch (error) {
    return fail(res, error?.message || "Terjadi kesalahan")
  }
} 

module.exports = {
  getDashboard
} 