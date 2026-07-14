const service = require("../services/icpDebt.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const validateUser = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error("User tidak valid")
  }
}

// ===============================
const getMyDebt = async (req, res) => {
  try {
    validateUser(req)

    if (!req.user.mahasiswa_id) {
      throw new Error("User bukan mahasiswa")
    }

    const data = await service.getMyDebt(req.user.mahasiswa_id)

    return success(res, data)

  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  getMyDebt
} 