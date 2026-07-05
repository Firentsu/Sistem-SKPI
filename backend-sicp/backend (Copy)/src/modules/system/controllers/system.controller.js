const service = require("../services/system.service")
const { success, fail } = require("../../../shared/utils/response")
const systemHealthService = require("../services/systemHealth.service")

// ===============================
const getConfig = async (req, res) => {
  try {
    const data = await service.getConfig()
    return success(res, data)

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const createUser = async (req, res) => {
  return fail(res, "createUser belum diimplementasikan")
}

// ===============================
const listPotongan = async (req, res) => {
  return fail(res, "listPotongan belum diimplementasikan")
}

// ===============================
const getSystemHealth = async (req, res) => {
  try {
    const data = await systemHealthService.getSystemHealth()
    return success(res, data)

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
module.exports = {
  getConfig,
  createUser,
  listPotongan,
  getSystemHealth
}