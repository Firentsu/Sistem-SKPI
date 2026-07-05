const db = require("../../../shared/config/db")
const model = require("../models/semester.model")
const validator = require("../../../shared/utils/validator")
const { logAudit } = require("../../audit/services/audit.service")

// ===============================
const getActiveSemester = async (conn = null) => {
  const data = await model.findActiveSemester(conn)
  if (!data) throw new Error("Semester aktif tidak ditemukan")
  return data
}

// ===============================
const validateSemester = async (semester_id, conn = null) => {
  validator.required(semester_id, "semester_id")
  const data = await model.findSemesterById(semester_id, conn)
  if (!data) throw new Error("Semester tidak ditemukan")
  return data
}

// ===============================
const enforceActiveSemester = async (semester_id, conn = null) => {
  const active = await getActiveSemester(conn)
  if (Number(active.id) !== Number(semester_id)) {
    throw new Error("Semester tidak aktif")
  }
}

// ===============================
// 🆕 GET ALL SEMESTER
const getAllSemester = async () => {
  return await model.findAllSemester()
}

// ===============================
// 🆕 CREATE SEMESTER
const createSemester = async ({ tahun_ajaran, semester }, user) => {
  if (!tahun_ajaran || !semester) {
    throw new Error("tahun_ajaran dan semester wajib diisi")
  }

  if (!["ganjil", "genap"].includes(semester)) {
    throw new Error("semester harus 'ganjil' atau 'genap'")
  }

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // Cek duplikat
    const total = await model.countByTahunSemester(tahun_ajaran, semester, conn)
    if (total > 0) {
      throw new Error("Semester sudah ada")
    }

    const semester_id = await model.insertSemester({ tahun_ajaran, semester }, conn)

    if (user) {
      await logAudit({
        user_id: user.id,
        role: user.role,
        action: "CREATE_SEMESTER",
        target_table: "semesters",
        target_id: semester_id,
        detail: { tahun_ajaran, semester },
        conn
      })
    }

    await conn.commit()

    return {
      id: semester_id,
      tahun_ajaran,
      semester,
      aktif: 0
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// 🆕 SET ACTIVE SEMESTER
const setActiveSemester = async (id, user) => {
  if (!id) throw new Error("ID semester wajib diisi")
  if (isNaN(id)) throw new Error("ID semester harus berupa angka")

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    // 1. Nonaktifkan semua
    await model.deactivateAll(conn)

    // 2. Aktifkan yang dipilih
    const affected = await model.activateById(id, conn)

    if (affected === 0) {
      throw new Error("Semester tidak ditemukan")
    }

    if (user) {
      await logAudit({
        user_id: user.id,
        role: user.role,
        action: "SET_ACTIVE_SEMESTER",
        target_table: "semesters",
        target_id: Number(id),
        detail: { semester_id: Number(id) },
        conn
      })
    }

    await conn.commit()

    return {
      semester_id: Number(id),
      aktif: 1
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// REVISI 11POIN #10: EDIT-WINDOW SEMESTER LAMA
// Super Admin bisa "menyalakan" semester non-aktif untuk sementara
// agar datanya bisa diedit, tanpa mengganti semester aktif.

const toMysqlDatetime = (d) => {
  const p = (n) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  )
}

// Buka / perpanjang edit-window. Terima { until } absolut ATAU { hours } durasi.
const openEditWindow = async (id, { until, hours } = {}, user) => {
  if (!id || isNaN(id)) throw new Error("ID semester tidak valid")

  let untilDate
  if (until) {
    untilDate = new Date(until)
    if (isNaN(untilDate.getTime())) {
      throw new Error("Format 'until' tidak valid (pakai YYYY-MM-DD HH:MM:SS)")
    }
  } else if (hours) {
    const h = Number(hours)
    if (isNaN(h) || h <= 0) throw new Error("'hours' harus angka > 0")
    untilDate = new Date(Date.now() + h * 3600 * 1000)
  } else {
    throw new Error("Wajib kirim 'until' atau 'hours'")
  }

  if (untilDate.getTime() <= Date.now()) {
    throw new Error("Batas edit-window harus di masa depan")
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const sem = await model.findSemesterById(id, conn)
    if (!sem) throw new Error("Semester tidak ditemukan")

    const untilStr = toMysqlDatetime(untilDate)
    await model.setEditWindow(id, untilStr, conn)

    if (user) {
      await logAudit({
        user_id: user.id,
        role: user.role,
        action: "OPEN_SEMESTER_EDIT_WINDOW",
        target_table: "semesters",
        target_id: Number(id),
        detail: { edit_window_until: untilStr },
        conn
      })
    }

    await conn.commit()
    return { semester_id: Number(id), edit_window_until: untilStr }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// Tutup edit-window (set NULL).
const closeEditWindow = async (id, user) => {
  if (!id || isNaN(id)) throw new Error("ID semester tidak valid")

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const sem = await model.findSemesterById(id, conn)
    if (!sem) throw new Error("Semester tidak ditemukan")

    await model.setEditWindow(id, null, conn)

    if (user) {
      await logAudit({
        user_id: user.id,
        role: user.role,
        action: "CLOSE_SEMESTER_EDIT_WINDOW",
        target_table: "semesters",
        target_id: Number(id),
        detail: {},
        conn
      })
    }

    await conn.commit()
    return { semester_id: Number(id), edit_window_until: null }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// Cek apakah semester boleh diedit (aktif ATAU dalam edit-window).
const isSemesterEditable = async (semester_id, conn = null) => {
  return await model.isEditable(semester_id, conn)
}

// Guard: lempar error bila semester tidak boleh diedit.
const enforceEditableSemester = async (semester_id, conn = null) => {
  const ok = await model.isEditable(semester_id, conn)
  if (!ok) {
    throw new Error(
      "Semester tidak aktif dan tidak dalam masa edit-window"
    )
  }
}

module.exports = {
  getActiveSemester,
  validateSemester,
  enforceActiveSemester,
  getAllSemester,
  createSemester,
  setActiveSemester,
  openEditWindow,
  closeEditWindow,
  isSemesterEditable,
  enforceEditableSemester
} 