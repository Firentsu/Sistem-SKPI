const service = require("../services/divisi.service")
const { success, fail } = require("../../../shared/utils/response")

const createDivisi = async (req, res) => {
  try { return success(res, await service.createDivisi(req.body, req.user), "Divisi berhasil dibuat") }
  catch (err) { return fail(res, err.message) }
}
const getDivisi = async (req, res) => {
  try { return success(res, await service.getDivisi(req.query), "Daftar divisi") }
  catch (err) { return fail(res, err.message) }
}
const getDivisiById = async (req, res) => {
  try { return success(res, await service.getDivisiById(req.params.id), "Detail divisi") }
  catch (err) { return fail(res, err.message) }
}
const updateDivisi = async (req, res) => {
  try { return success(res, await service.updateDivisi(req.params.id, req.body, req.user), "Divisi diperbarui") }
  catch (err) { return fail(res, err.message) }
}
const deleteDivisi = async (req, res) => {
  try { return success(res, await service.deleteDivisi(req.params.id, req.user), "Divisi dihapus") }
  catch (err) { return fail(res, err.message) }
}

module.exports = { createDivisi, getDivisi, getDivisiById, updateDivisi, deleteDivisi }
