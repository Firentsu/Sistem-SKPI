const db = require("../../../shared/config/db")
const validateNamaIcp = require("../../../shared/utils/validateNamaIcp")
const semesterService = require("../../akademik/services/semester.service")

const LIMIT_PENGAJUAN = 100

const getMahasiswaId = async (userId, conn = null) => {

  const runner = conn || db

  const [mhs] = await runner.query(
    `SELECT id FROM mahasiswa WHERE user_id = ?`,
    [userId]
  )

  if (!mhs.length) {
    throw new Error("Data mahasiswa tidak ditemukan")
  }

  return mhs[0].id
}

const getSemesterAktif = async (conn = null) => {
  const sem = await semesterService.getActiveSemester(conn)
  if (!sem) throw new Error("Semester aktif tidak ditemukan")
  return sem.id
}

//CREATE PENGAJUAN
const createPengajuan = async (user, body) => {

  // VALIDASI ROLE
  if (user.role !== "mahasiswa") {
    throw new Error(
      "Hanya mahasiswa yang bisa mengajukan"
    )
  }

  const mahasiswa_id = await getMahasiswaId(user.id)
  const {
    kategori_id,
    nama_icp_id,
    point,
    deskripsi,
    target_user_id,
    unit_id
  } = body

  if (!kategori_id) {
    throw new Error("kategori_id wajib diisi")
  }

  if (!nama_icp_id) {
    throw new Error("nama_icp_id wajib diisi")
  }

  if (!point) {
    throw new Error("point wajib diisi")
  }

  if (!target_user_id) {
    throw new Error("target_user_id wajib diisi")
  }

  if (!unit_id) {
    throw new Error("unit_id wajib diisi")
  }

  const [userRows] = await db.query(`
    SELECT
      u.id,
      u.role,
      CASE WHEN u.role = 'admin' THEN 1
           WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') THEN 1
           ELSE 0 END AS is_admin,
      CASE WHEN EXISTS (
        SELECT 1 FROM admin_access aa
        WHERE aa.user_id = u.id AND aa.access_key = 'validasi_final'
      ) THEN 1 ELSE 0 END AS has_validasi_final
    FROM users u
    WHERE u.id = ?
    LIMIT 1
  `, [target_user_id])

  if (!userRows.length) {
    throw new Error("Target user tidak ditemukan")
  }

  const target_role = userRows[0].role

  const isDirectFinal =
    target_role === "super_admin" ||
    (Number(userRows[0].is_admin) === 1 &&
      Number(userRows[0].has_validasi_final) === 1)

  const target_admin_final_id = isDirectFinal ? target_user_id : null

  await validateNamaIcp({
    unit_id,
    kategori_id,
    nama_icp_id,
    target_user_id
  })

  const conn = await db.getConnection()

  try {

    await conn.beginTransaction()

    await conn.query(
      `SELECT id FROM mahasiswa WHERE id = ? FOR UPDATE`,
      [mahasiswa_id]
    )

    const semester_id = await getSemesterAktif(conn)

    const [countRows] = await conn.query(`
      SELECT COUNT(*) as total
      FROM icp_pengajuan
      WHERE mahasiswa_id = ?
        AND DATE(created_at) = CURDATE()
    `, [mahasiswa_id])

    if (countRows[0].total >= LIMIT_PENGAJUAN) {
      throw new Error("Limit pengajuan harian tercapai")
    }

    const [result] = await conn.query(`
      INSERT INTO icp_pengajuan (
        mahasiswa_id,
        unit_id,
        semester_id,
        kategori_id,
        nama_icp_id,
        point,
        deskripsi,
        target_user_id,
        target_role,
        target_admin_final_id,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      mahasiswa_id,
      unit_id,
      semester_id,
      kategori_id,
      nama_icp_id,
      point,
      deskripsi,
      target_user_id,
      target_role,
      target_admin_final_id
    ])

    await conn.commit()

    return {
      id: result.insertId,
      status: "pending",
      flow: target_admin_final_id ? "direct_final" : "tier1",
      target_admin_final_id
    }

  } catch (err) {

    await conn.rollback()
    throw err

  } finally {

    conn.release()

  }
}

const getHistory = async (user) => {

  if (user.role !== "mahasiswa") {
    throw new Error(
      "Hanya mahasiswa yang memiliki history"
    )
  }

  const mahasiswa_id = await getMahasiswaId(user.id)

  const [rows] = await db.query(`
    SELECT
      p.*,
      u.username as target_name,
      ni.nama as nama_icp
    FROM icp_pengajuan p
    LEFT JOIN users u
      ON p.target_user_id = u.id
    LEFT JOIN nama_icp ni
      ON p.nama_icp_id = ni.id
    WHERE p.mahasiswa_id = ?
    ORDER BY p.id DESC
  `, [mahasiswa_id])

  return rows
}

const getInbox = async (user) => {

  const [rows] = await db.query(`
    SELECT
      p.*,
      m.nama as mahasiswa_name,
      u.username as mahasiswa_username,
      ni.nama as nama_icp
    FROM icp_pengajuan p
    LEFT JOIN mahasiswa m
      ON p.mahasiswa_id = m.id
    LEFT JOIN users u
      ON m.user_id = u.id
    LEFT JOIN nama_icp ni
      ON p.nama_icp_id = ni.id
    WHERE p.target_user_id = ?
    ORDER BY p.id DESC
  `, [user.id])

  return rows
}

module.exports = {
  createPengajuan,
  getHistory,
  getInbox
} 