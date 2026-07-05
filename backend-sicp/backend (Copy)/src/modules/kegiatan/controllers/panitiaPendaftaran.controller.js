const service = require("../services/panitiaPendaftaran.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const daftar = async (req, res) => {
  try {
    const result = await service.daftar(req.body, req.user)
    return success(res, result, "Berhasil daftar panitia")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const approve = async (req, res) => {
  try {
    const result = await service.approve(req.params.id, req.user)
    return success(res, result, "Panitia disetujui")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const reject = async (req, res) => {
  try {
    const result = await service.reject(req.params.id, req.user)
    return success(res, result, "Panitia ditolak")
  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  daftar,
  approve,
  reject
} 