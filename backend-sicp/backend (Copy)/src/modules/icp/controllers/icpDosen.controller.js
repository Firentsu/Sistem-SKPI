const service = require("../services/icpDosen.service")
const { success, fail } = require("../../../shared/utils/response")

const validateUser = (req) => {
  if (!req.user) throw new Error("User tidak valid")
}

const safeError = (err) => err?.message || "Terjadi kesalahan"

// ===============================
const createKelas = async (req, res) => {
  try {
    validateUser(req)

    const result = await service.createKelas(
      req.body,
      req.user
    )

    return success(res, result, "ICP kelas berhasil dibuat")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

// ===============================
const createPartisipasi = async (req, res) => {
  try {
    validateUser(req)

    const result = await service.createPartisipasi(
      req.body,
      req.user
    )

    return success(res, result, "ICP partisipasi berhasil dibuat")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

module.exports = {
  createKelas,
  createPartisipasi
} 