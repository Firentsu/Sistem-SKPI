const db = require("../../../shared/config/db")
const model = require("../models/mataKuliah.model")
const semesterModel = require("../models/semester.model")
const { logAudit } = require("../../audit/services/audit.service")

const resolveSemesterId = async (semesterId, conn) => {
  if (semesterId) {
    const found = await semesterModel.findSemesterById(semesterId, conn)
    if (!found) throw new Error("semester_id tidak ditemukan")
    return found.id
  }
  const aktif = await semesterModel.findActiveSemester(conn)
  if (!aktif) throw new Error("Tidak ada semester aktif — kirim semester_id eksplisit")
  return aktif.id
}

const getAll = async (semesterId = null) => {
  const [rows] = await model.getAll(semesterId)
  return rows
}

const getDetail = async (id) => {
  const mk = await model.findById(id)
  if (!mk) throw new Error("Mata kuliah tidak ditemukan")
  const [dosens] = await db.query(
    `SELECT mkd.id, mkd.user_id, u.username, COALESCE(d.nama, ap.nama) AS nama,
            d.nidn, mkd.is_koordinator, mkd.added_at
     FROM mata_kuliah_dosen mkd
     JOIN users u ON u.id = mkd.user_id
     LEFT JOIN dosen d ON d.user_id = u.id
     LEFT JOIN admin_profile ap ON ap.user_id = u.id
     WHERE mkd.mata_kuliah_id = ?
     ORDER BY mkd.is_koordinator DESC, u.username`, [id])
  const [mhs] = await db.query(
    `SELECT mkm.id, mkm.mahasiswa_id, m.nim, m.nama, m.angkatan,
            m.jurusan_id, j.nama_jurusan, mkm.status, mkm.enrolled_at
     FROM mata_kuliah_mahasiswa mkm
     JOIN mahasiswa m ON m.id = mkm.mahasiswa_id
     LEFT JOIN jurusan j ON j.id = m.jurusan_id
     WHERE mkm.mata_kuliah_id = ?
     ORDER BY m.nim`, [id])
  return { ...mk, dosen: dosens, mahasiswa: mhs,
           jumlah_dosen: dosens.length, jumlah_mahasiswa: mhs.length }
}

const create = async (data, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    if (!data.nama_mk) throw new Error("nama_mk wajib")
    if (!data.kode_mk) throw new Error("kode_mk wajib")
    data.semester_id = await resolveSemesterId(data.semester_id, conn)
    const id = await model.insert(data, conn)

    // Optional: dosen_user_ids[] saat create
    if (Array.isArray(data.dosen_user_ids)) {
      for (let i = 0; i < data.dosen_user_ids.length; i++) {
        await conn.query(
          `INSERT IGNORE INTO mata_kuliah_dosen
           (mata_kuliah_id, user_id, is_koordinator, added_by)
           VALUES (?, ?, ?, ?)`,
          [id, data.dosen_user_ids[i], i === 0 ? 1 : 0, user.id])
      }
    }

    await logAudit({ user_id: user.id, role: user.role, action: "CREATE_MK",
                     target_table: "mata_kuliah", target_id: id, detail: data, conn })
    await conn.commit()
    return { id, semester_id: data.semester_id }
  } catch (err) {
    await conn.rollback()
    if (err.code === "ER_DUP_ENTRY")
      throw new Error("Mata kuliah dgn kode ini sudah ada di semester tsb")
    throw err
  } finally { conn.release() }
}

const update = async (id, data, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const existing = await model.findById(id, conn)
    if (!existing) throw new Error("Mata kuliah tidak ditemukan")
    data.semester_id = data.semester_id ? await resolveSemesterId(data.semester_id, conn) : existing.semester_id
    data.kode_mk = data.kode_mk ?? existing.kode_mk
    data.nama_mk = data.nama_mk ?? existing.nama_mk
    data.jurusan_id = data.jurusan_id ?? existing.jurusan_id
    data.angkatan = data.angkatan ?? existing.angkatan
    data.sks = data.sks ?? existing.sks
    await model.update(id, data, conn)
    await logAudit({ user_id: user.id, role: user.role, action: "UPDATE_MK",
                     target_table: "mata_kuliah", target_id: id, detail: data, conn })
    await conn.commit()
    return { id }
  } catch (err) {
    await conn.rollback()
    if (err.code === "ER_DUP_ENTRY")
      throw new Error("Mata kuliah dgn kode ini sudah ada di semester tsb")
    throw err
  } finally { conn.release() }
}

const remove = async (id, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    await model.remove(id, conn)
    await logAudit({ user_id: user.id, role: user.role, action: "DELETE_MK",
                     target_table: "mata_kuliah", target_id: id, conn })
    await conn.commit()
    return { id }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

// ----- DOSEN management dalam MK (multi) -----
const addDosen = async (mkId, userId, isKoordinator, actor) => {
  await db.query(
    `INSERT IGNORE INTO mata_kuliah_dosen (mata_kuliah_id, user_id, is_koordinator, added_by)
     VALUES (?, ?, ?, ?)`,
    [mkId, userId, isKoordinator ? 1 : 0, actor.id])
  return { mata_kuliah_id: mkId, user_id: userId, added: true }
}

const removeDosen = async (mkId, userId) => {
  const [r] = await db.query(
    `DELETE FROM mata_kuliah_dosen WHERE mata_kuliah_id = ? AND user_id = ?`,
    [mkId, userId])
  if (!r.affectedRows) throw new Error("Dosen tidak ditemukan di MK")
  return { mata_kuliah_id: mkId, user_id: userId, removed: true }
}

// ----- MAHASISWA enrollment -----
const enrollMahasiswa = async (mkId, mahasiswaId, actor) => {
  await db.query(
    `INSERT IGNORE INTO mata_kuliah_mahasiswa
     (mata_kuliah_id, mahasiswa_id, enrolled_by, status)
     VALUES (?, ?, ?, 'aktif')`,
    [mkId, mahasiswaId, actor.id])
  return { mata_kuliah_id: mkId, mahasiswa_id: mahasiswaId, enrolled: true }
}

const dropMahasiswa = async (mkId, mahasiswaId) => {
  const [r] = await db.query(
    `UPDATE mata_kuliah_mahasiswa SET status='drop'
     WHERE mata_kuliah_id = ? AND mahasiswa_id = ?`,
    [mkId, mahasiswaId])
  if (!r.affectedRows) throw new Error("Enrollment tidak ditemukan")
  return { mata_kuliah_id: mkId, mahasiswa_id: mahasiswaId, dropped: true }
}

module.exports = {
  getAll, getDetail, create, update, remove,
  addDosen, removeDosen, enrollMahasiswa, dropMahasiswa,
}
