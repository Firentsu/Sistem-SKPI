const db = require("../../../shared/config/db")
const model = require("../models/kegiatan.model")
const panitiaModel = require("../models/panitia.model")
const icpTransactionService = require("../../icp/services/icpTransaction.service")
const validateNamaIcp = require("../../../shared/utils/validateNamaIcp")
const { logAudit } = require("../../audit/services/audit.service")

const {
  validateAdminKegiatanAccess
} = require("../../../shared/policies/access.policy")

const {
  validateTransition,
  validateRewardState
} = require("../../../shared/policies/kegiatan.policy")

const {
  validateRewardDuplicate,
  validatePanitiaReward
} = require("../../../shared/policies/reward.policy")

const distributeKegiatanReward = async (kegiatan, conn) => {
  validateRewardState(kegiatan)

  await validateNamaIcp({
    unit_id: kegiatan.unit_id,
    kategori_id: kegiatan.kategori_id,
    nama_icp_id: kegiatan.nama_icp_id
  })

  const panitiaList = await panitiaModel.getPanitiaByKegiatan(kegiatan.id, conn)
  validatePanitiaReward(panitiaList)

  const [existing] = await conn.query(
    `SELECT id FROM icp_transactions
     WHERE source_type = 'kegiatan' AND source_id = ? LIMIT 1`,
    [kegiatan.id]
  )
  validateRewardDuplicate(existing)

  // pemberi = pembuat kegiatan (admin AS kelola kegiatan)
  const pemberiId = kegiatan.created_by
  const actor = { id: pemberiId, role: "super_admin" }

  let distributed = 0
  for (const p of panitiaList) {
    const point =
      (p.point_override != null && Number(p.point_override) > 0)
        ? Number(p.point_override)
        : kegiatan.icp_reward

    await icpTransactionService.createTransaction(
      {
        mahasiswa_id: p.mahasiswa_id,
        source_type: "kegiatan",
        source_id: kegiatan.id,
        deskripsi: `Reward kegiatan: ${kegiatan.nama_kegiatan}`,
        point,
        tipe: "masuk",
        semester_id: kegiatan.semester_id,
        kategori_id: kegiatan.kategori_id,
        nama_icp_id: kegiatan.nama_icp_id,
        created_by: pemberiId,
        validated_by: pemberiId,
        idempotency_key: `KEGIATAN-${kegiatan.id}-MHS-${p.mahasiswa_id}`,
        conn
      },
      actor
    )
    distributed++
  }
  return distributed
}

const createKegiatan = async (data, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    if (!["admin", "super_admin"].includes(user.role)) {
      throw new Error("Hanya admin / super admin")
    }
    validateAdminKegiatanAccess(user)

    const { nama_kegiatan, unit_id, kategori_id, nama_icp_id } = data
    if (!nama_kegiatan) throw new Error("nama_kegiatan wajib")
    if (!unit_id) throw new Error("unit_id wajib")
    if (!kategori_id) throw new Error("kategori_id wajib")
    if (!nama_icp_id) throw new Error("nama_icp_id wajib")

    // ITEM 9 — validasi urutan jadwal bila diisi
    if (data.jadwal_mulai && data.jadwal_selesai &&
        new Date(data.jadwal_selesai) <= new Date(data.jadwal_mulai)) {
      throw new Error("jadwal_selesai harus setelah jadwal_mulai")
    }

    const unit = await model.checkUnit(unit_id, conn)
    if (!unit) throw new Error("Unit organisasi tidak ditemukan")

    const allowed = await model.checkUnitKategori(unit_id, kategori_id, conn)
    if (!allowed) throw new Error("Kategori tidak diizinkan untuk unit ini")

    await validateNamaIcp({ unit_id, kategori_id, nama_icp_id })

    const semester = await model.getActiveSemester(conn)
    if (!semester) throw new Error("Semester aktif tidak ditemukan")

    const id = await model.insertKegiatan(
      { ...data, semester_id: semester.id, created_by: user.id }, conn)

    await logAudit({
      user_id: user.id, role: user.role, action: "CREATE_KEGIATAN",
      target_table: "kegiatan", target_id: id,
      detail: { nama_kegiatan, unit_id, kategori_id, nama_icp_id,
                jadwal_mulai: data.jadwal_mulai || null,
                jadwal_selesai: data.jadwal_selesai || null }, conn
    })

    await conn.commit()
    return { id, status: "draft" }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

//kelola jadwal kegiatan
const dibukaPendaftaran = async (id, user, body = {}) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const kegiatan = await model.getKegiatanDetail(id, conn)
    if (!kegiatan) throw new Error("Kegiatan tidak ditemukan")

    if (kegiatan.status !== "draft") {
      throw new Error(
        "Pendaftaran hanya bisa dibuka saat kegiatan masih draft (belum dimulai)")
    }

    const [divisi] = await conn.query(
      `SELECT id, kuota FROM divisi_kegiatan WHERE kegiatan_id = ?`, [id])
    if (!divisi.length) {
      throw new Error("Tidak bisa buka pendaftaran — belum ada divisi kegiatan")
    }
    const adaKuota = divisi.some(d => Number(d.kuota) > 0)
    if (!adaKuota) {
      throw new Error("Tidak bisa buka pendaftaran — setiap divisi wajib punya kuota")
    }

    // jadwal pendaftaran (WIB). pendaftaran_mulai default = sekarang.
    const pendaftaran_mulai = body.pendaftaran_mulai || null
    const pendaftaran_selesai = body.pendaftaran_selesai || null

    // penutupan harus sebelum/pas jadwal kegiatan dimulai
    if (pendaftaran_selesai && kegiatan.jadwal_mulai &&
        new Date(pendaftaran_selesai) > new Date(kegiatan.jadwal_mulai)) {
      throw new Error(
        "Jadwal tutup pendaftaran harus sebelum / pas jadwal kegiatan dimulai")
    }

    validateTransition(kegiatan.status, "pendaftaran_dibuka")

    await conn.query(
      `UPDATE kegiatan
       SET status = 'pendaftaran_dibuka',
           pendaftaran_mulai = COALESCE(?, NOW()),
           pendaftaran_selesai = ?,
           pendaftaran_closed_at = NULL
       WHERE id = ?`,
      [pendaftaran_mulai, pendaftaran_selesai, id])

    await logAudit({
      user_id: user.id, role: user.role, action: "BUKA_PENDAFTARAN",
      target_table: "kegiatan", target_id: id,
      detail: { pendaftaran_mulai, pendaftaran_selesai }, conn })

    await conn.commit()
    return { id, status: "pendaftaran_dibuka", pendaftaran_mulai, pendaftaran_selesai }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

const tutupPendaftaran = async (id, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const kegiatan = await model.getKegiatanDetail(id, conn)
    if (!kegiatan) throw new Error("Kegiatan tidak ditemukan")
    if (kegiatan.status !== "pendaftaran_dibuka") {
      throw new Error("Pendaftaran tidak sedang dibuka")
    }

    await conn.query(
      `UPDATE kegiatan
       SET pendaftaran_selesai = NOW(), pendaftaran_closed_at = NOW()
       WHERE id = ?`, [id])

    await logAudit({
      user_id: user.id, role: user.role, action: "TUTUP_PENDAFTARAN",
      target_table: "kegiatan", target_id: id, detail: {}, conn })

    await conn.commit()
    return { id, pendaftaran_closed: true }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

const mulaiKegiatan = async (id, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const kegiatan = await model.getKegiatanDetail(id, conn)
    if (!kegiatan) throw new Error("Kegiatan tidak ditemukan")

    validateTransition(kegiatan.status, "berjalan")

    await conn.query(
      `UPDATE kegiatan
       SET status = 'berjalan',
           started_at = NOW(),
           jadwal_mulai = CASE
             WHEN jadwal_mulai IS NULL OR jadwal_mulai > NOW() THEN NOW()
             ELSE jadwal_mulai END,
           pendaftaran_closed_at = COALESCE(pendaftaran_closed_at, NOW())
       WHERE id = ?`, [id])

    await logAudit({
      user_id: user.id, role: user.role, action: "MULAI_KEGIATAN",
      target_table: "kegiatan", target_id: id, detail: {}, conn })

    await conn.commit()
    return { id, status: "berjalan" }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

const selesaiKegiatan = async (id, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const kegiatan = await model.getKegiatanDetail(id, conn)
    if (!kegiatan) throw new Error("Kegiatan tidak ditemukan")

    validateTransition(kegiatan.status, "selesai")

    const distributed = await distributeKegiatanReward(kegiatan, conn)

    await conn.query(
      `UPDATE kegiatan
       SET status = 'selesai',
           ended_at = NOW(),
           jadwal_selesai = CASE
             WHEN jadwal_selesai IS NULL OR jadwal_selesai > NOW() THEN NOW()
             ELSE jadwal_selesai END
       WHERE id = ?`, [id])

    await logAudit({
      user_id: user.id, role: user.role, action: "SELESAI_KEGIATAN",
      target_table: "kegiatan", target_id: id,
      detail: { reward_distributed: distributed }, conn })

    await conn.commit()
    return { id, status: "selesai", reward_distributed: distributed }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

// ============================================================================
const batalkanKegiatan = async (id, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const kegiatan = await model.getKegiatanDetail(id, conn)
    if (!kegiatan) throw new Error("Kegiatan tidak ditemukan")

    validateTransition(kegiatan.status, "dibatalkan")
    await model.updateStatus(id, "dibatalkan", conn)

    await logAudit({
      user_id: user.id, role: user.role, action: "BATAL_KEGIATAN",
      target_table: "kegiatan", target_id: id, detail: {}, conn })

    await conn.commit()
    return { id, status: "dibatalkan" }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

const runScheduler = async () => {
  const conn = await db.getConnection()
  try {
    // auto-tutup pendaftaran yang lewat jadwal
    const dueClose = await model.findDueToClosePendaftaran(conn)
    for (const k of dueClose) {
      await conn.query(
        `UPDATE kegiatan SET pendaftaran_closed_at = NOW()
         WHERE id = ? AND pendaftaran_closed_at IS NULL`, [k.id])
    }

    // auto-mulai kegiatan yang lewat jadwal_mulai
    const dueStart = await model.findDueToStart(conn)
    for (const k of dueStart) {
      await conn.beginTransaction()
      try {
        await conn.query(
          `UPDATE kegiatan
           SET status = 'berjalan', started_at = NOW(),
               pendaftaran_closed_at = COALESCE(pendaftaran_closed_at, NOW())
           WHERE id = ? AND status IN ('draft','pendaftaran_dibuka')`, [k.id])
        await conn.commit()
      } catch (e) { await conn.rollback() }
    }

    // auto-selesai kegiatan yang lewat jadwal_selesai + distribusi reward
    const dueFinish = await model.findDueToFinish(conn)
    for (const k of dueFinish) {
      await conn.beginTransaction()
      try {
        const kegiatan = await model.getKegiatanDetail(k.id, conn)
        if (kegiatan && kegiatan.status === "berjalan") {
          try { await distributeKegiatanReward(kegiatan, conn) } catch (e) {}
          await conn.query(
            `UPDATE kegiatan SET status = 'selesai', ended_at = NOW()
             WHERE id = ? AND status = 'berjalan'`, [k.id])
        }
        await conn.commit()
      } catch (e) { await conn.rollback() }
    }
  } catch (err) {
    console.error("[KEGIATAN SCHEDULER]", err.message)
  } finally {
    conn.release()
  }
}

const getAllKegiatan = async (semesterId = null, includeHidden = false) => {
  // lazy self-correction: koreksi status sebelum menampilkan
  await runScheduler()
  return await model.getAllKegiatan(null, semesterId, includeHidden)
}

const hideKegiatan = async (id, user) => {
  validateAdminKegiatanAccess(user)
  const k = await model.getKegiatanDetail(id)
  if (!k) throw new Error("Kegiatan tidak ditemukan")
  await model.setHidden(id, true)
  await logAudit({
    user_id: user.id, role: user.role, action: "SEMBUNYIKAN_KEGIATAN",
    target_table: "kegiatan", target_id: id, detail: {} })
  return { id, is_hidden: true }
}

const unhideKegiatan = async (id, user) => {
  validateAdminKegiatanAccess(user)
  const k = await model.getKegiatanDetail(id)
  if (!k) throw new Error("Kegiatan tidak ditemukan")
  await model.setHidden(id, false)
  await logAudit({
    user_id: user.id, role: user.role, action: "TAMPILKAN_KEGIATAN",
    target_table: "kegiatan", target_id: id, detail: {} })
  return { id, is_hidden: false }
}

const getKegiatanById = async (id) => {
  const [rows] = await db.query(
    `SELECT k.*, u.username AS dibuat_oleh, un.nama_unit, ki.nama_kategori,
            ni.nama AS nama_icp
     FROM kegiatan k
     LEFT JOIN users u ON k.created_by = u.id
     LEFT JOIN unit_organisasi un ON k.unit_id = un.id
     LEFT JOIN kategori_icp ki ON k.kategori_id = ki.id
     LEFT JOIN nama_icp ni ON k.nama_icp_id = ni.id
     WHERE k.id = ?`, [id])
  if (!rows.length) throw new Error("Kegiatan tidak ditemukan")
  const kegiatan = rows[0]

  // divisi + nama co
  const [divisi] = await db.query(
    `SELECT dk.id, dk.nama_divisi, dk.kuota, dk.co_mahasiswa_id, dk.link_grup,
            co.nama AS co_nama,
            (SELECT COUNT(*) FROM panitia_kegiatan pk
             WHERE pk.divisi_id = dk.id AND pk.status='approved' AND pk.removed_at IS NULL) AS terisi
     FROM divisi_kegiatan dk
     LEFT JOIN mahasiswa co ON co.id = dk.co_mahasiswa_id
     WHERE dk.kegiatan_id = ? ORDER BY dk.id`, [id])

  // panitia approved
  const [panitia] = await db.query(
    `SELECT pk.id, pk.mahasiswa_id, pk.divisi_id, pk.jabatan, pk.point_override,
            m.nama, m.nim, dk.nama_divisi
     FROM panitia_kegiatan pk
     JOIN mahasiswa m ON m.id = pk.mahasiswa_id
     LEFT JOIN divisi_kegiatan dk ON dk.id = pk.divisi_id
     WHERE pk.kegiatan_id = ? AND pk.status='approved' AND pk.removed_at IS NULL
     ORDER BY dk.id, pk.jabatan DESC`, [id])

  // status pendaftaran terbuka? (item 4)
  const now = new Date()
  const pendaftaran_open =
    kegiatan.status === "pendaftaran_dibuka" &&
    !kegiatan.pendaftaran_closed_at &&
    (!kegiatan.pendaftaran_selesai || now < new Date(kegiatan.pendaftaran_selesai))

  return { ...kegiatan, divisi, panitia, pendaftaran_open }
}

const updateKegiatan = async (id, payload, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const exist = await model.getKegiatanDetail(id, conn)
    if (!exist) throw new Error("Kegiatan tidak ditemukan")
    if (["selesai", "dibatalkan"].includes(exist.status)) {
      throw new Error(`Kegiatan ${exist.status} tidak bisa diubah`)
    }

    const allowed = ["nama_kegiatan","deskripsi","tanggal_mulai","tanggal_selesai",
      "unit_id","kategori_id","icp_reward","tanggal_acara_mulai","tanggal_acara_selesai",
      "angkatan_diterima","limit_pendaftar","nama_icp_id",
      "jadwal_mulai","jadwal_selesai","pendaftaran_mulai","pendaftaran_selesai"]

    const fields = []; const vals = []
    for (const col of allowed) {
      if (payload[col] !== undefined) { fields.push(`${col}=?`); vals.push(payload[col]) }
    }
    if (!fields.length) throw new Error("Tidak ada data untuk diupdate")

    // re-validasi relasi unit/kategori/nama_icp bila salah satunya diubah
    const newUnit = payload.unit_id ?? exist.unit_id
    const newKategori = payload.kategori_id ?? exist.kategori_id
    const newNamaIcp = payload.nama_icp_id ?? exist.nama_icp_id
    if (payload.unit_id !== undefined || payload.kategori_id !== undefined ||
        payload.nama_icp_id !== undefined) {
      const okUnit = await model.checkUnit(newUnit, conn)
      if (!okUnit) throw new Error("Unit organisasi tidak ditemukan")
      const okKat = await model.checkUnitKategori(newUnit, newKategori, conn)
      if (!okKat) throw new Error("Kategori tidak diizinkan untuk unit ini")
      if (newNamaIcp) {
        await validateNamaIcp({ unit_id: newUnit, kategori_id: newKategori,
                                nama_icp_id: newNamaIcp })
      }
    }

    // validasi urutan jadwal
    const jm = payload.jadwal_mulai ?? exist.jadwal_mulai
    const js = payload.jadwal_selesai ?? exist.jadwal_selesai
    if (jm && js && new Date(js) <= new Date(jm)) {
      throw new Error("jadwal_selesai harus setelah jadwal_mulai")
    }

    vals.push(id)
    await conn.query(`UPDATE kegiatan SET ${fields.join(", ")} WHERE id=?`, vals)

    await logAudit({
      user_id: user.id, role: user.role, action: "UPDATE_KEGIATAN",
      target_table: "kegiatan", target_id: id, detail: payload, conn })

    await conn.commit()
    return { id, updated: true }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

const deleteKegiatan = async (id, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    validateAdminKegiatanAccess(user)

    const k = await model.getKegiatanDetail(id, conn)
    if (!k) throw new Error("Kegiatan tidak ditemukan")
    if (k.status !== "draft") {
      throw new Error(
        "Kegiatan hanya bisa dihapus saat masih draft (belum dibuka pendaftaran / berjalan). Batalkan saja.")
    }

    // pastikan belum ada panitia (draft seharusnya belum ada)
    const [panitia] = await conn.query(
      `SELECT COUNT(*) AS t FROM panitia_kegiatan WHERE kegiatan_id=?`, [id])
    if (panitia[0].t > 0) {
      throw new Error("Kegiatan sudah punya panitia — tidak bisa dihapus")
    }

    await conn.query(`DELETE FROM divisi_kegiatan WHERE kegiatan_id=?`, [id])
    await conn.query(`DELETE FROM kegiatan WHERE id=?`, [id])

    await logAudit({
      user_id: user.id, role: user.role, action: "DELETE_KEGIATAN",
      target_table: "kegiatan", target_id: id, detail: {}, conn })

    await conn.commit()
    return { id, deleted: true }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

module.exports = {
  createKegiatan,
  getAllKegiatan,
  getKegiatanById,
  updateKegiatan,
  deleteKegiatan,
  dibukaPendaftaran,
  tutupPendaftaran,
  mulaiKegiatan,
  selesaiKegiatan,
  batalkanKegiatan,
  distributeKegiatanReward,
  runScheduler,
  hideKegiatan,
  unhideKegiatan
}
