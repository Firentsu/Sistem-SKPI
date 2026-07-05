// ============================================================================
// userLimit.service.js  (REVISI v2 — per USER per KONTEKS unit/MK)
// ============================================================================
const db = require("../../../shared/config/db")

const isSuperAdmin = (u) => {
  const r = Array.isArray(u.roles) ? u.roles : [u.role]
  return r.includes("super_admin")
}
const hasAccess = (u, k) => isSuperAdmin(u) || (u.access && u.access[k])

const setLimit = async (actor, body) => {
  if (!hasAccess(actor, "kelola_limit")) throw new Error("Tidak punya akses kelola_limit")
  const { user_id, scope_type, scope_id, semester_id,
          limit_per_semester, limit_per_mahasiswa } = body
  if (!user_id) throw new Error("user_id wajib")
  if (!["unit","mata_kuliah"].includes(scope_type))
    throw new Error("scope_type harus 'unit' atau 'mata_kuliah'")
  if (!scope_id) throw new Error("scope_id wajib")
  if (!semester_id) throw new Error("semester_id wajib")

  // Validasi member scope
  if (scope_type === "unit") {
    const [m] = await db.query(
      `SELECT 1 FROM user_unit_member WHERE user_id = ? AND unit_id = ? LIMIT 1`,
      [user_id, scope_id])
    if (!m.length) throw new Error("User bukan member unit ini")
  } else {
    const [m] = await db.query(
      `SELECT 1 FROM mata_kuliah_dosen WHERE user_id = ? AND mata_kuliah_id = ? LIMIT 1`,
      [user_id, scope_id])
    if (!m.length) throw new Error("User bukan pengampu mata kuliah ini")
  }

  // POIN 7: aturan limit per scope_type
  //   - unit        : boleh limit_per_semester DAN/ATAU limit_per_mahasiswa
  //   - mata_kuliah : HANYA limit_per_mahasiswa (per_semester tidak berlaku)
  let finalPerSemester = limit_per_semester ?? null
  let finalPerMahasiswa = limit_per_mahasiswa ?? null
  if (scope_type === "mata_kuliah") {
    if (limit_per_semester !== undefined && limit_per_semester !== null) {
      throw new Error("Mata kuliah hanya memakai limit_per_mahasiswa (limit_per_semester tidak berlaku untuk mata kuliah)")
    }
    finalPerSemester = null
    if (finalPerMahasiswa === null) throw new Error("limit_per_mahasiswa wajib untuk mata kuliah")
  } else {
    // unit: minimal salah satu di-set
    if (finalPerSemester === null && finalPerMahasiswa === null)
      throw new Error("Unit wajib mengisi minimal salah satu: limit_per_semester atau limit_per_mahasiswa")
  }

  await db.query(
    `INSERT INTO user_limit_in_context
       (user_id, scope_type, scope_id, semester_id,
        limit_per_semester, limit_per_mahasiswa, set_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       limit_per_semester = VALUES(limit_per_semester),
       limit_per_mahasiswa = VALUES(limit_per_mahasiswa),
       set_by = VALUES(set_by)`,
    [user_id, scope_type, scope_id, semester_id,
     finalPerSemester, finalPerMahasiswa, actor.id])
  return { user_id, scope_type, scope_id, semester_id,
           limit_per_semester: finalPerSemester, limit_per_mahasiswa: finalPerMahasiswa }
}

const getLimits = async (q) => {
  const where = [], params = []
  if (q.user_id)     { where.push("user_id = ?"); params.push(q.user_id) }
  if (q.scope_type)  { where.push("scope_type = ?"); params.push(q.scope_type) }
  if (q.scope_id)    { where.push("scope_id = ?"); params.push(q.scope_id) }
  if (q.semester_id) { where.push("semester_id = ?"); params.push(q.semester_id) }
  const wsql = where.length ? "WHERE " + where.join(" AND ") : ""
  const [rows] = await db.query(
    `SELECT * FROM v_user_limit_summary ${wsql} ORDER BY user_id, scope_type, scope_id`,
    params)
  return rows
}

const deleteLimit = async (actor, id) => {
  if (!hasAccess(actor, "kelola_limit")) throw new Error("Tidak punya akses kelola_limit")
  const [r] = await db.query(`DELETE FROM user_limit_in_context WHERE id = ?`, [id])
  if (!r.affectedRows) throw new Error("Limit tidak ditemukan")
  return { id, deleted: true }
}

// Dipanggil di flow pengajuan/manual. Throw error bila over-limit ATAU belum diset.
const checkLimit = async (args, conn = null) => {
  const runner = conn || db

  // --- NORMALISASI PARAMETER (kompatibel flow lama & baru) ---
  // Flow pemberian ICP memanggil dgn { limit_type, tambahan, unit_id?/mata_kuliah_id? }.
  // Endpoint/limit baru memakai { scope_type, scope_id, point_to_add }.
  let {
    user_id, scope_type, scope_id, semester_id, mahasiswa_id,
    point_to_add, tambahan, limit_type, unit_id, mata_kuliah_id
  } = args

  // poin yang akan ditambahkan
  if (point_to_add === undefined || point_to_add === null) point_to_add = tambahan

  // tentukan scope dari limit_type bila scope_type belum diberikan
  if (!scope_type) {
    if (limit_type === "beri_kelas_mk" && mata_kuliah_id) {
      scope_type = "mata_kuliah"; scope_id = mata_kuliah_id
    } else {
      // default: pemberian lewat unit (partisipasi, kepanitiaan, kelas tanpa mk_id)
      scope_type = "unit"; scope_id = unit_id
    }
  }

  // Jika konteks scope tidak tersedia, lewati pengecekan (jangan memblokir flow lama)
  if (!scope_type || !scope_id) {
    return { ok: true, skipped: true, reason: "scope tidak tersedia" }
  }

  const [limitRows] = await runner.query(
    `SELECT id, limit_per_semester, limit_per_mahasiswa
     FROM user_limit_in_context
     WHERE user_id = ? AND scope_type = ? AND scope_id = ? AND semester_id = ?
     LIMIT 1`,
    [user_id, scope_type, scope_id, semester_id])
  const limit = limitRows[0]

  if (!limit) {
    // Limit opsional: bila belum di-set, pemberian ICP diizinkan tanpa batas.
    return { ok: true, skipped: true, reason: "limit belum di-set (opsional)" }
  }

  // helper: filter perhitungan "used" sesuai scope
  const scopeCol = scope_type === "unit" ? "unit_id" : "mata_kuliah_id"

  if (limit.limit_per_semester !== null) {
    const [sumRows] = await runner.query(
      `SELECT COALESCE(SUM(point), 0) AS total
       FROM icp_pengajuan
       WHERE pemberi_icp_id = ? AND semester_id = ?
         AND ${scopeCol} = ?
         AND status IN ('approved','approved_final')`,
      [user_id, semester_id, scope_id])
    const used = Number(sumRows[0].total)
    if (used + Number(point_to_add) > limit.limit_per_semester) {
      throw new Error(
        `Melebihi limit per semester (${limit.limit_per_semester}). ` +
        `Sudah dipakai ${used}, ajukan ${point_to_add}.`)
    }
  }

  if (limit.limit_per_mahasiswa !== null && mahasiswa_id) {
    const [sumRows] = await runner.query(
      `SELECT COALESCE(SUM(point), 0) AS total
       FROM icp_pengajuan
       WHERE pemberi_icp_id = ? AND semester_id = ? AND mahasiswa_id = ?
         AND ${scopeCol} = ?
         AND status IN ('approved','approved_final')`,
      [user_id, semester_id, mahasiswa_id, scope_id])
    const used = Number(sumRows[0].total)
    if (used + Number(point_to_add) > limit.limit_per_mahasiswa) {
      throw new Error(
        `Melebihi limit per mahasiswa (${limit.limit_per_mahasiswa}). ` +
        `Sudah dapat ${used} dari Anda, ajukan ${point_to_add}.`)
    }
  }

  return { ok: true, limit_id: limit.id }
}

module.exports = { setLimit, getLimits, deleteLimit, checkLimit }
