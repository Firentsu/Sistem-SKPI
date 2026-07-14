const service = require("../services/riwayat.service")
const { success, fail } = require("../../../shared/utils/response")

exports.riwayatKegiatan = async (req, res) => {
  try {
    const data = await service.getRiwayatKegiatan(req.query)
    return success(res, data, "Riwayat kegiatan")
  } catch (err) { return fail(res, err.message) }
}
exports.riwayatLogin = async (req, res) => {
  try {
    const data = await service.getRiwayatLogin(req.query)
    return success(res, data, "Riwayat login semua user")
  } catch (err) { return fail(res, err.message) }
}
exports.riwayatPemberianValidasi = async (req, res) => {
  try {
    const data = await service.getRiwayatPemberianValidasi(req.query)
    return success(res, data, "Riwayat pemberian & validasi ICP")
  } catch (err) { return fail(res, err.message) }
}

exports.riwayatMandiri = async (req, res) => {
  try {
    const data = await service.getRiwayatMandiri(req.user.id, req.query)
    return success(res, data, "Riwayat pemberian & potongan mandiri")
  } catch (err) { return fail(res, err.message) }
}
exports.riwayatValidasi = async (req, res) => {
  try {
    const data = await service.getRiwayatValidasi(req.user.id, req.query)
    return success(res, data, "Riwayat validasi pemberian & potongan")
  } catch (err) { return fail(res, err.message) }
}

exports.riwayatPengajuanSaya = async (req, res) => {
  try {
    const data = await service.getRiwayatPengajuanSaya(req.user.id, req.query)
    return success(res, data, "Riwayat pengajuan saya")
  } catch (err) { return fail(res, err.message) }
}

exports.riwayatTransaksi = async (req, res) => {
  try {
    const data = await service.getRiwayatTransaksi(req.query)
    return success(res, data, "Riwayat aktivitas transaksi")
  } catch (err) { return fail(res, err.message) }
}

exports.riwayatPotonganAll = async (req, res) => {
  try {
    const data = await service.getRiwayatPotonganAll(req.query)
    return success(res, data, "Riwayat potongan semua role")
  } catch (err) { return fail(res, err.message) }
}

exports.riwayatValidasiAll = async (req, res) => {
  try {
    const data = await service.getRiwayatValidasiAll(req.query)
    return success(res, data, "Riwayat validasi semua (pemberian & potongan final)")
  } catch (err) { return fail(res, err.message) }
}
