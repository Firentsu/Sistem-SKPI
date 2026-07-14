const service = require("../services/dosenManagement.service")
const { success, fail } = require("../../../shared/utils/response")

// POST /api/dosen-management/promote/:user_id
//   body: { nidn?, nama?, unit_id?, jurusan_id?, jabatan? }
exports.promote = async (req, res) => {
  try {
    const r = await service.promoteToDosen(
      Number(req.params.user_id), req.body || {}, req.user
    )
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}

// PUT /api/dosen-management/:dosen_id/unit  body: { unit_id }
exports.setUnit = async (req, res) => {
  try {
    const unit_id = req.body.unit_id === null ? null : Number(req.body.unit_id)
    const r = await service.assignUnit(Number(req.params.dosen_id), unit_id, req.user)
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}

// PUT /api/dosen-management/:dosen_id/jurusan  body: { jurusan_id }
exports.setJurusan = async (req, res) => {
  try {
    const jurusan_id = req.body.jurusan_id === null ? null : Number(req.body.jurusan_id)
    const r = await service.assignJurusan(Number(req.params.dosen_id), jurusan_id, req.user)
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}

// PUT /api/dosen-management/mata-kuliah/:mk_id/dosen  body: { dosen_id }
exports.setMataKuliahDosen = async (req, res) => {
  try {
    const dosen_id = req.body.dosen_id === null ? null : Number(req.body.dosen_id)
    const r = await service.assignMataKuliah(Number(req.params.mk_id), dosen_id, req.user)
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}

// PUT /api/dosen-management/kelas/:kelas_id/dosen  body: { dosen_id }
exports.setKelasDosen = async (req, res) => {
  try {
    const dosen_id = req.body.dosen_id === null ? null : Number(req.body.dosen_id)
    const r = await service.assignKelas(Number(req.params.kelas_id), dosen_id, req.user)
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}

// PUT /api/dosen-management/:dosen_id/profile  body: { nidn, nama, jabatan, ... }
exports.updateProfile = async (req, res) => {
  try {
    const r = await service.updateProfile(Number(req.params.dosen_id), req.body || {}, req.user)
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}

// GET /api/dosen-management?jurusan_id=&unit_id=&status=aktif
exports.list = async (req, res) => {
  try {
    const r = await service.listAssignableDosen(req.query)
    return success(res, r)
  } catch (e) { return fail(res, e.message) }
}
