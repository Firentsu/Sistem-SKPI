const service = require("../services/icpBalance.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const getMyBalance = async (req, res) => {
  try {
    if (!req.user || !req.user.mahasiswa_id) {
      throw new Error("User tidak valid")
    }

    const result = await service.getSaldoMahasiswa(req.user.mahasiswa_id)

    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const getMyHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.mahasiswa_id) {
      throw new Error("User tidak valid")
    }

    const data = await service.getHistory(req.user.mahasiswa_id)

    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const getRanking = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10
    const jurusan_id = req.query.jurusan_id ? Number(req.query.jurusan_id) : null

    const data = await service.getRanking(limit, null, jurusan_id)

    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// Breakdown saldo ICP per kategori untuk mahasiswa tertentu (dipakai sistem SKPI).
const getByCategory = async (req, res) => {
  try {
    const mahasiswa_id = Number(req.params.mahasiswaId)
    if (!mahasiswa_id) {
      throw new Error("mahasiswaId tidak valid")
    }

    const data = await service.getSaldoPerKategori(mahasiswa_id)

    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  getMyBalance,
  getMyHistory,
  getRanking,
  getByCategory
}