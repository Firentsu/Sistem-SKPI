const panitiaService = require("../services/panitia.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
// 🔥 REMOVE ANGGOTA (oleh Admin) — full via service
exports.removePanitia = async (req, res) => {
  try {
    const result = await panitiaService.removeAnggotaByAdmin({
      panitia_id: Number(req.params.id),
      user: req.user,
      reason: req.body?.reason
    })

    return success(res, result, "Anggota berhasil dikeluarkan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// 🔥 CANCEL PANITIA (oleh Mahasiswa) — full via service
exports.cancelPanitia = async (req, res) => {
  try {
    const result = await panitiaService.cancelByMahasiswa({
      panitia_id: Number(req.params.id),
      user: req.user
    })

    return success(res, result, "Berhasil keluar dari panitia")
  } catch (err) {
    return fail(res, err.message)
  }
} 