const db = require("../../../shared/config/db")
const { logAudit } = require("../../audit/services/audit.service")

// ============================================================================
// potonganLimit.service.js  (REVISI 9 Juni — LIMIT GLOBAL)
// ----------------------------------------------------------------------------
// Limit pemotongan ICP per USER (dosen / admin biasa) — di-set Super Admin /
// Admin AS ber-akses 'kelola_limit'.
//
// GLOBAL, tidak terikat id mahasiswa:
//   - per_semester  : batas TOTAL potongan yg boleh user lakukan / semester
//   - per_mahasiswa : batas potongan user ke SETIAP mahasiswa (mahasiswa manapun)
//                     contoh: per_mahasiswa=5 → user tak boleh memotong >5 poin
//                     ke satu mahasiswa yang sama dalam 1 semester.
//
// Admin AS & Super Admin (punya 'potongan_super') = unlimited (tidak dicek).
// ============================================================================

// SET satu scope (upsert)
const setLimit = async ({ user_id, semester_id, scope, limit_point }, actor) => {
  if (!user_id) throw new Error("user_id wajib")
  if (!semester_id) throw new Error("semester_id wajib")
  if (!["per_semester", "per_mahasiswa"].includes(scope))
    throw new Error("scope harus 'per_semester' atau 'per_mahasiswa'")
  if (!Number.isInteger(limit_point) || limit_point < 0)
    throw new Error("limit_point harus integer >= 0")

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(
      `INSERT INTO potongan_limits (user_id, semester_id, scope, limit_point, created_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_point = VALUES(limit_point), updated_at = NOW()`,
      [user_id, semester_id, scope, limit_point, actor.id])
    await logAudit({
      user_id: actor.id, role: actor.role, action: "SET_POTONGAN_LIMIT",
      target_table: "potongan_limits", target_id: user_id,
      detail: { user_id, semester_id, scope, limit_point }, conn })
    await conn.commit()
    return { user_id, semester_id, scope, limit_point }
  } catch (err) {
    await conn.rollback(); throw err
  } finally { conn.release() }
}

// SET per_semester DAN per_mahasiswa sekaligus (keduanya GLOBAL)
const setLimitBundle = async ({ user_id, semester_id, limit_per_semester, limit_per_mahasiswa }, actor) => {
  if (!user_id) throw new Error("user_id wajib")
  if (!semester_id) throw new Error("semester_id wajib")
  if ((limit_per_semester === undefined || limit_per_semester === null) &&
      (limit_per_mahasiswa === undefined || limit_per_mahasiswa === null))
    throw new Error("Isi minimal salah satu: limit_per_semester atau limit_per_mahasiswa")

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const upsert = async (scope, val) => {
      if (val === undefined || val === null) return
      if (!Number.isInteger(val) || val < 0) throw new Error(`${scope} harus integer >= 0`)
      await conn.query(
        `INSERT INTO potongan_limits (user_id, semester_id, scope, limit_point, created_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE limit_point = VALUES(limit_point), updated_at = NOW()`,
        [user_id, semester_id, scope, val, actor.id])
    }
    await upsert("per_semester", limit_per_semester)
    await upsert("per_mahasiswa", limit_per_mahasiswa)
    await logAudit({
      user_id: actor.id, role: actor.role, action: "SET_POTONGAN_LIMIT_BUNDLE",
      target_table: "potongan_limits", target_id: user_id,
      detail: { user_id, semester_id, limit_per_semester, limit_per_mahasiswa }, conn })
    await conn.commit()
    return { user_id, semester_id,
             limit_per_semester: limit_per_semester ?? null,
             limit_per_mahasiswa: limit_per_mahasiswa ?? null }
  } catch (err) {
    await conn.rollback(); throw err
  } finally { conn.release() }
}

const getLimits = async (user_id, semester_id) => {
  const [rows] = await db.query(
    `SELECT id, scope, limit_point, created_by, updated_at
     FROM potongan_limits WHERE user_id = ? AND semester_id = ?
     ORDER BY scope ASC`,
    [user_id, semester_id])
  return rows
}

const removeLimit = async (id, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query(
      "SELECT user_id, semester_id, scope FROM potongan_limits WHERE id = ?", [id])
    if (!rows.length) throw new Error("Limit tidak ditemukan")
    await conn.query("DELETE FROM potongan_limits WHERE id = ?", [id])
    await logAudit({
      user_id: actor.id, role: actor.role, action: "REMOVE_POTONGAN_LIMIT",
      target_table: "potongan_limits", target_id: id, detail: rows[0], conn })
    await conn.commit()
    return { id, removed: true }
  } catch (err) {
    await conn.rollback(); throw err
  } finally { conn.release() }
}

// ASSERT: pengaju masih dalam batas (GLOBAL). Lempar Error bila over-limit.
//   - per_semester : SUM semua potongan user di semester
//   - per_mahasiswa: SUM potongan user ke mahasiswa target (siapa pun dia)
// Pemegang 'potongan_super' (Admin AS / Super Admin) unlimited → skip di caller.
const assertWithinLimit = async ({ user_id, mahasiswa_id, semester_id, tambahan, conn }) => {
  const c = conn || db

  // per_semester (total global)
  const [psRows] = await c.query(
    `SELECT limit_point FROM potongan_limits
     WHERE user_id = ? AND semester_id = ? AND scope = 'per_semester' LIMIT 1`,
    [user_id, semester_id])
  if (psRows.length) {
    const limit = Number(psRows[0].limit_point)
    const [u] = await c.query(
      `SELECT COALESCE(SUM(jumlah_potong),0) AS used FROM icp_potongan
       WHERE dipotong_oleh = ? AND semester_id = ? AND status IN ('pending','approved')`,
      [user_id, semester_id])
    if (Number(u[0].used) + Number(tambahan) > limit)
      throw new Error(`Limit potongan per semester tercapai (${u[0].used}/${limit}). Tambahan ${tambahan} ditolak.`)
  }

  // per_mahasiswa (berlaku ke SETIAP mahasiswa — pakai mahasiswa_id target utk hitung pemakaian)
  const [pmRows] = await c.query(
    `SELECT limit_point FROM potongan_limits
     WHERE user_id = ? AND semester_id = ? AND scope = 'per_mahasiswa' LIMIT 1`,
    [user_id, semester_id])
  if (pmRows.length) {
    const limit = Number(pmRows[0].limit_point)
    const [u] = await c.query(
      `SELECT COALESCE(SUM(jumlah_potong),0) AS used FROM icp_potongan
       WHERE dipotong_oleh = ? AND mahasiswa_id = ? AND semester_id = ? AND status IN ('pending','approved')`,
      [user_id, mahasiswa_id, semester_id])
    if (Number(u[0].used) + Number(tambahan) > limit)
      throw new Error(`Limit potongan ke mahasiswa ini tercapai (${u[0].used}/${limit}). Tambahan ${tambahan} ditolak.`)
  }

  return true
}

module.exports = {
  setLimit,
  setLimitBundle,
  getLimits,
  removeLimit,
  assertWithinLimit
}
