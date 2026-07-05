const service = require("../services/icpRanking.service")
const { success, fail } = require("../../../shared/utils/response")

const normalizeNumber = (val, def) => {
  const num = Number(val)
  return isNaN(num) ? def : num
}
const safeError = (err) => err?.message || "Terjadi kesalahan"

// ===============================
// GET ranking — hormati flag publish (item SA-1).
// Jika ditutup, user biasa dapat ranking kosong + published:false.
// Super Admin tetap bisa melihat (preview).
const getRanking = async (req, res) => {
  try {
    const semesters_id = req.query.semesters_id ? Number(req.query.semesters_id) : null
    const limit = normalizeNumber(req.query.limit, 10)
    const jurusan_id = req.query.jurusan_id ? Number(req.query.jurusan_id) : null

    const published = await service.getRankingVisibility()
    const isSuper = req.user && req.user.role === "super_admin"

    if (!published && !isSuper) {
      return success(res, { published: false, ranking: [] })
    }

    const ranking = await service.getRanking(semesters_id, limit, jurusan_id)
    return success(res, { published, ranking })
  } catch (error) {
    return fail(res, safeError(error))
  }
}

// GET status visibilitas (untuk tombol toggle di FE)
const getVisibility = async (req, res) => {
  try {
    return success(res, { published: await service.getRankingVisibility() })
  } catch (error) { return fail(res, safeError(error)) }
}

// PUT visibilitas — Super Admin only
const setVisibility = async (req, res) => {
  try {
    const published = req.body.published === true || req.body.published === "true" || req.body.published === 1
    const result = await service.setRankingVisibility(published, req.user)
    return success(res, result, published ? "Ranking dipublish" : "Ranking ditutup")
  } catch (error) { return fail(res, safeError(error)) }
}

module.exports = { getRanking, getVisibility, setVisibility }
