const service = require("../services/dosenInfo.service")
const { success, fail } = require("../../../shared/utils/response")

const requireUser = (req) => {
  if (!req.user || !req.user.id) throw new Error("User tidak valid")
}

const requireStaff = (req) => {
  requireUser(req)
  const roles = service.getRoles(req.user)
  const ok = roles.some(r => ["dosen","admin","super_admin"].includes(r))
  if (!ok) throw new Error("Endpoint khusus staff (dosen/admin/super_admin)")
}

// GET /api/dosen-info/units — unit organisasi user anggota
exports.myUnits = async (req, res) => {
  try {
    requireStaff(req)
    const data = await service.getMyUnits(req.user.id)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

// GET /api/dosen-info/jurusan — jurusan keanggotaan
exports.myJurusan = async (req, res) => {
  try {
    requireStaff(req)
    const data = await service.getMyJurusan(req.user.id)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

// GET /api/dosen-info/kategori-access — kategori ICP user-level
exports.myKategoriAccess = async (req, res) => {
  try {
    requireStaff(req)
    const data = await service.getMyKategoriAccess(req.user.id)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

// GET /api/dosen-info/kelas[?semester_id=&all_sem=1]
exports.myKelas = async (req, res) => {
  try {
    requireStaff(req)
    const opts = {}
    if (req.query.semester_id) opts.semester_id = Number(req.query.semester_id)
    if (req.query.all_sem === '1') opts.all_sem = true
    const data = await service.getMyKelas(req.user.id, opts)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

// GET /api/dosen-info/kelas/:kelas_id/mahasiswa
exports.mahasiswaInKelas = async (req, res) => {
  try {
    requireStaff(req)
    const data = await service.getMahasiswaInKelas(
      req.user.id, Number(req.params.kelas_id), req.user
    )
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

// GET /api/dosen-info/profile — ringkasan profil sebagai dosen
exports.profile = async (req, res) => {
  try {
    requireStaff(req)
    const data = await service.getDosenProfile(req.user.id)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}
