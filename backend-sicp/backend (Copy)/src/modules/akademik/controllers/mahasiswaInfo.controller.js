const service = require("../services/mahasiswaInfo.service")
const { success, fail } = require("../../../shared/utils/response")

const requireMahasiswa = (req) => {
  if (!req.user || !req.user.id) throw new Error("User tidak valid")
  const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role]
  if (!roles.includes("mahasiswa")) {
    throw new Error("Endpoint khusus mahasiswa")
  }
}

exports.profile = async (req, res) => {
  try {
    requireMahasiswa(req)
    const data = await service.getProfile(req.user.id)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

exports.myKelas = async (req, res) => {
  try {
    requireMahasiswa(req)
    const opts = {}
    if (req.query.semester_id) opts.semester_id = Number(req.query.semester_id)
    if (req.query.all_sem === '1') opts.all_sem = true
    const data = await service.getMyKelas(req.user.id, opts)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}
