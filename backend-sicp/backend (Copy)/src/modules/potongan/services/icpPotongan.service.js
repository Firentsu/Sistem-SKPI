const db = require("../../../shared/config/db")
const potonganModel = require("../models/icpPotongan.model")
const { applyPotonganToLedger } = require("./icpPotonganLedger.service")
const validator = require("../../../shared/utils/validator")
const { validateTransition, ensureNotFinal } = require("../../../shared/utils/statusGuard")
const { logAudit } = require("../../audit/services/audit.service")
const SemesterService = require("../../akademik/services/semester.service")
const finalValidatorPolicy = require("../../../shared/policies/finalValidator.policy")
const potonganLimitService = require("./potonganLimit.service")

// ============================================================================
// icpPotongan.service.js  (REVISI — routing + dosen + limit + force)
// ----------------------------------------------------------------------------
//  - createPotongan        : dosen/admin biasa ajukan (pending, butuh validasi)
//                            WAJIB pilih target_admin_final_id
//                            Cek limit per-semester & per-mahasiswa
//  - createPotonganDirect  : admin AS ('potongan_super') / Super Admin
//                            → langsung approved, langsung ledger, NO limit
//  - approvePotongan       : admin AS ('validasi_potongan') / Super Admin
//                            routing-aware (target_admin_final_id atau SA override)
//  - rejectPotongan        : sama, dengan alasan
// ============================================================================

// ===============================
// CREATE — dosen / admin biasa (pending → butuh validasi)
const createPotongan = async (data, actor) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const {
      mahasiswa_id,
      kategori_id,
      kategori_pelanggaran,
      jumlah_potong,
      keterangan,
      target_admin_final_id
    } = data

    // ROLE: dosen / admin biasa (admin AS akan masuk jalur direct)
    const roles = Array.isArray(actor.roles) ? actor.roles : [actor.role]
    const isStaff = roles.includes("dosen") || roles.includes("admin")
    if (!isStaff) {
      throw new Error("Hanya dosen / admin yang dapat mengajukan potongan")
    }

    // VALIDATION dasar
    validator.required(mahasiswa_id, "mahasiswa_id")
    validator.required(kategori_id, "kategori_id")
    validator.required(jumlah_potong, "jumlah_potong")
    validator.isPositiveNumber(jumlah_potong, "jumlah_potong")
    await validator.exists("mahasiswa", "id", mahasiswa_id, "Mahasiswa", conn)
    await validator.exists("kategori", "id", kategori_id, "Kategori", conn)

    // SEMESTER aktif
    const active = await SemesterService.getActiveSemester(conn)
    const semester_id = active.id

    // ROUTING — wajib pilih validator final
    if (!target_admin_final_id) {
      throw new Error(
        "target_admin_final_id wajib — pilih admin akses-super yang akan memvalidasi"
      )
    }
    await finalValidatorPolicy.assertValidPotonganValidator(
      target_admin_final_id, conn
    )

    // LIMIT CHECK — kecuali pengaju adalah Super Admin atau punya 'potongan_super'
    const bypassLimit =
      roles.includes("super_admin") ||
      !!(actor.access && actor.access.potongan_super)

    if (!bypassLimit) {
      await potonganLimitService.assertWithinLimit({
        user_id: actor.id,
        mahasiswa_id,
        semester_id,
        tambahan: Number(jumlah_potong),
        conn
      })
    }

    // INSERT (status default 'pending' — sudah benar di model.insertPotongan)
    const id = await potonganModel.insertPotongan({
      mahasiswa_id,
      kategori_id,
      kategori_pelanggaran,
      jumlah_potong,
      keterangan,
      created_by: actor.id,
      semester_id,
      target_admin_final_id
    }, conn)

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: roles.includes("dosen") ? "DOSEN_AJUKAN_POTONGAN" : "ADMIN_AJUKAN_POTONGAN",
      target_table: "icp_potongan",
      target_id: id,
      detail: {
        mahasiswa_id, kategori_id, jumlah_potong,
        target_admin_final_id
      },
      conn
    })

    await conn.commit()
    return { id, status: "pending", target_admin_final_id }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// CREATE DIRECT — Super Admin / Admin AS ber-akses 'potongan_super'
// Tanpa validasi, tanpa limit, langsung masuk ledger.
const createPotonganDirect = async (data, actor) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const roles = Array.isArray(actor.roles) ? actor.roles : [actor.role]
    const allowed =
      roles.includes("super_admin") ||
      (roles.includes("admin") && actor.access && actor.access.potongan_super)

    if (!allowed) {
      throw new Error(
        "Akses ditolak — hanya Super Admin atau Admin ber-akses 'potongan_super'"
      )
    }

    const {
      mahasiswa_id,
      kategori_id,
      kategori_pelanggaran,
      jumlah_potong,
      keterangan
    } = data

    validator.required(mahasiswa_id, "mahasiswa_id")
    validator.required(kategori_id, "kategori_id")
    validator.required(jumlah_potong, "jumlah_potong")
    validator.isPositiveNumber(jumlah_potong, "jumlah_potong")

    const active = await SemesterService.getActiveSemester(conn)
    const semester_id = active.id

    const id = await potonganModel.insertPotonganApproved({
      mahasiswa_id,
      kategori_id,
      kategori_pelanggaran,
      jumlah_potong,
      keterangan,
      created_by: actor.id,
      semester_id
    }, conn)

    // force=true → unlimited, bypass semua saldo check
    const ledger = await applyPotonganToLedger(id, actor.id, conn, true)

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: roles.includes("super_admin")
        ? "SUPER_DIRECT_POTONGAN"
        : "ADMIN_AS_DIRECT_POTONGAN",
      target_table: "icp_potongan",
      target_id: id,
      detail: { mahasiswa_id, kategori_id, jumlah_potong, unlimited: true, saldo_after: ledger.saldo },
      conn
    })

    await conn.commit()
    return {
      id, status: "approved", direct: true, unlimited: true,
      saldo_after: ledger.saldo
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// APPROVE — admin AS ('validasi_potongan') / Super Admin (override)
const approvePotongan = async (id, actor) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const potongan = await potonganModel.findByIdForUpdate(id, conn)
    if (!potongan) throw new Error("Potongan tidak ditemukan")

    // Guard semester
    const aktif = await SemesterService.getActiveSemester(conn)
    if (Number(potongan.semester_id) !== Number(aktif.id)) {
      throw new Error(
        "Potongan kadaluarsa — semester sudah berganti, tidak bisa divalidasi lagi"
      )
    }

    // ROUTING + ROLE check
    if (!finalValidatorPolicy.canValidatePotongan(potongan, actor)) {
      throw new Error(
        "Hanya admin akses-super yang ditunjuk pengaju (akses 'validasi_potongan'), atau Super Admin, yang dapat memvalidasi"
      )
    }

    ensureNotFinal(potongan.status)
    validateTransition(potongan.status, "approved")

    await potonganModel.updateApproved(id, actor.id, conn)
    await applyPotonganToLedger(id, actor.id, conn)

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "APPROVE_POTONGAN",
      target_table: "icp_potongan",
      target_id: id,
      detail: { target_admin_final_id: potongan.target_admin_final_id || null },
      conn
    })

    await conn.commit()
    return { id, status: "approved" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// ITEM #3 (10 Juni): validator (Admin AS 'validasi_potongan' / Super Admin)
// EDIT pengajuan potongan dosen lalu approve — seperti edit-and-approve pemberian.
const editAndApprovePotongan = async (id, edits, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const potongan = await potonganModel.findByIdForUpdate(id, conn)
    if (!potongan) throw new Error("Potongan tidak ditemukan")

    const aktif = await SemesterService.getActiveSemester(conn)
    if (Number(potongan.semester_id) !== Number(aktif.id)) {
      throw new Error("Potongan kadaluarsa — semester sudah berganti")
    }
    if (!finalValidatorPolicy.canValidatePotongan(potongan, actor)) {
      throw new Error("Hanya validator yang ditunjuk (akses 'validasi_potongan') atau Super Admin yang dapat memvalidasi")
    }
    ensureNotFinal(potongan.status)
    validateTransition(potongan.status, "approved")

    // Terapkan edit (kategori bebas, jumlah, keterangan) — tanpa unit/nama_icp
    const newKategori = edits.kategori_id !== undefined ? edits.kategori_id : potongan.kategori_id
    const newJumlah = edits.jumlah_potong !== undefined ? Number(edits.jumlah_potong) : potongan.jumlah_potong
    const newKet = edits.keterangan !== undefined ? edits.keterangan : potongan.keterangan
    if (edits.kategori_id !== undefined)
      await validator.exists("kategori", "id", newKategori, "Kategori", conn)
    if (!Number.isInteger(newJumlah) || newJumlah <= 0)
      throw new Error("jumlah_potong harus integer > 0")

    await conn.query(
      `UPDATE icp_potongan SET kategori_id = ?, jumlah_potong = ?, keterangan = ? WHERE id = ?`,
      [newKategori, newJumlah, newKet, id])

    await potonganModel.updateApproved(id, actor.id, conn)
    await applyPotonganToLedger(id, actor.id, conn)

    await logAudit({
      user_id: actor.id, role: actor.role, action: "EDIT_APPROVE_POTONGAN",
      target_table: "icp_potongan", target_id: id,
      detail: { kategori_id: newKategori, jumlah_potong: newJumlah }, conn })

    await conn.commit()
    return { id, status: "approved", edited: true }
  } catch (err) {
    await conn.rollback(); throw err
  } finally { conn.release() }
}

// ===============================
// REJECT — sama
const rejectPotongan = async (id, actor, alasan) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const potongan = await potonganModel.findByIdForUpdate(id, conn)
    if (!potongan) throw new Error("Potongan tidak ditemukan")

    const aktif = await SemesterService.getActiveSemester(conn)
    if (Number(potongan.semester_id) !== Number(aktif.id)) {
      throw new Error(
        "Potongan kadaluarsa — semester sudah berganti, tidak bisa divalidasi lagi"
      )
    }

    if (!finalValidatorPolicy.canValidatePotongan(potongan, actor)) {
      throw new Error(
        "Hanya admin akses-super yang ditunjuk pengaju (akses 'validasi_potongan'), atau Super Admin, yang dapat memvalidasi"
      )
    }

    if (!alasan || typeof alasan !== "string") {
      throw new Error("alasan wajib diisi")
    }

    ensureNotFinal(potongan.status)
    validateTransition(potongan.status, "rejected")

    await potonganModel.updateRejected(id, actor.id, alasan.trim(), conn)

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "REJECT_POTONGAN",
      target_table: "icp_potongan",
      target_id: id,
      conn
    })

    await conn.commit()
    return { id, status: "rejected" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// LIST INBOX VALIDASI POTONGAN — FIFO + routing
//   - Super Admin → semua
//   - Admin AS dgn 'validasi_potongan' → hanya routed kepadanya (atau legacy NULL)
const listInboxValidasi = async (actor) => {
  const roles = Array.isArray(actor.roles) ? actor.roles : [actor.role]
  const isSuperAdmin = roles.includes("super_admin")
  const isValidator =
    roles.includes("admin") && actor.access && actor.access.validasi_potongan

  if (!isSuperAdmin && !isValidator) return []

  let where = "WHERE p.status = 'pending'"
  const params = []
  if (!isSuperAdmin) {
    where += " AND (p.target_admin_final_id = ? OR p.target_admin_final_id IS NULL)"
    params.push(actor.id)
  }

  const [rows] = await db.query(`
    SELECT
      p.id, p.mahasiswa_id, p.kategori_id, p.kategori_pelanggaran,
      p.jumlah_potong AS point, p.keterangan, p.status,
      p.dipotong_oleh AS pengaju_id,
      p.target_admin_final_id,
      p.semester_id, p.created_at,
      m.nama AS mahasiswa_nama, m.nim,
      k.nama_kategori,
      u.username AS pengaju_name,
      tf.username AS target_admin_final_name
    FROM icp_potongan p
    LEFT JOIN mahasiswa m ON m.id = p.mahasiswa_id
    LEFT JOIN kategori_icp k ON k.id = p.kategori_id
    LEFT JOIN users u ON u.id = p.dipotong_oleh
    LEFT JOIN users tf ON tf.id = p.target_admin_final_id
    ${where}
    ORDER BY p.created_at ASC
  `, params)

  return rows
}

// ===============================
// GET MY POTONGAN (mahasiswa lihat dirinya)
const getMyPotongan = async (mahasiswa_id) => {
  if (!mahasiswa_id) throw new Error("mahasiswa_id wajib")
  return await potonganModel.getMyPotongan(mahasiswa_id)
}

module.exports = {
  createPotongan,
  createPotonganDirect,
  approvePotongan,
  editAndApprovePotongan,
  rejectPotongan,
  listInboxValidasi,
  getMyPotongan
}
