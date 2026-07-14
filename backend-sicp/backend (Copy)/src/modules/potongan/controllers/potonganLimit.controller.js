const service = require("../services/potonganLimit.service")
const { success, fail } = require("../../../shared/utils/response")

const requireUser = (req) => {
  if (!req.user || !req.user.id) throw new Error("User tidak valid")
}

// POST /api/potongan-limit  body: { user_id, semester_id, scope, limit_point }  (GLOBAL, tanpa mahasiswa_id)
exports.set = async (req, res) => {
  try {
    requireUser(req)
    const result = await service.setLimit(req.body, req.user)
    return success(res, result, "Limit potongan disimpan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// POIN 5: POST /api/potongan-limit/bundle  → set per_semester + per_mahasiswa sekaligus
// body: { user_id, semester_id, limit_per_semester?, limit_per_mahasiswa? }  (GLOBAL)
exports.setBundle = async (req, res) => {
  try {
    requireUser(req)
    const result = await service.setLimitBundle(req.body, req.user)
    return success(res, result, "Limit potongan (semester + per mahasiswa) disimpan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// GET /api/potongan-limit/:user_id/:semester_id
exports.list = async (req, res) => {
  try {
    requireUser(req)
    const { user_id, semester_id } = req.params
    const data = await service.getLimits(Number(user_id), Number(semester_id))
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// DELETE /api/potongan-limit/:id
exports.remove = async (req, res) => {
  try {
    requireUser(req)
    const result = await service.removeLimit(Number(req.params.id), req.user)
    return success(res, result, "Limit dihapus")
  } catch (err) {
    return fail(res, err.message)
  }
}
