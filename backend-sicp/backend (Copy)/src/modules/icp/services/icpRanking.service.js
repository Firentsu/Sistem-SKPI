const model = require("../models/icpRanking.model")
const configModel = require("../../system/models/config.model")
const { logAudit } = require("../../audit/services/audit.service")

const RANKING_KEY = "ranking_published"

// ===============================
// Status publish ranking global (default: tampil / '1')
const getRankingVisibility = async (conn = null) => {
  const val = await configModel.findConfigByKey(RANKING_KEY, conn)
  // default published bila belum pernah di-set
  return val === null ? true : val === "1"
}

// SA: tutup/publish ranking global (item SA-1)
const setRankingVisibility = async (published, actor) => {
  if (!actor || actor.role !== "super_admin") {
    throw new Error("Hanya Super Admin yang bisa mengatur visibilitas ranking")
  }
  await configModel.upsertConfig(
    RANKING_KEY,
    published ? "1" : "0",
    "Visibilitas ranking global (1=tampil, 0=disembunyikan)"
  )
  await logAudit({
    user_id: actor.id, role: actor.role,
    action: published ? "PUBLISH_RANKING" : "TUTUP_RANKING",
    target_table: "system_settings", target_id: null,
    detail: { ranking_published: published }
  })
  return { published }
}

// ===============================
const getRanking = async (
  semester_id = null,
  limit = 10,
  jurusan_id = null,
  conn = null
) => {
  return await model.getRanking(
    { semester_id, limit, jurusan_id },
    conn
  )
}

module.exports = {
  getRanking,
  getRankingVisibility,
  setRankingVisibility
}
