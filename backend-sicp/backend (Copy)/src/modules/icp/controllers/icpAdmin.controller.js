const service = require("../services/icpAdmin.service")
const { success, fail } = require("../../../shared/utils/response")

const validateUser = (req) => {
  if (!req.user) throw new Error("User tidak valid")
}

const safeError = (err) => err?.message || "Terjadi kesalahan"

// ===============================
const createManual = async (req, res) => {
  try {
    validateUser(req)

    const result = await service.createManual(req.body, req.user)

    return success(res, result, "ICP manual admin berhasil")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

// ===============================
const createKepanitiaan = async (req, res) => {
  try {
    validateUser(req)

    const result = await service.createKepanitiaan(req.body, req.user)

    return success(res, result, "ICP kepanitiaan berhasil dibuat")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

module.exports = {
  createManual,
  createKepanitiaan
} 