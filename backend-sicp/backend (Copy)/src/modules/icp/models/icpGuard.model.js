const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 📊 COUNT PENGAJUAN HARI INI (WITH OPTIONAL LOCK)
const countPengajuanHarian = async (mahasiswa_id, conn, useLock = false) => {
  if (!mahasiswa_id) throw new Error("mahasiswa_id wajib")

  const lockClause = useLock ? "FOR UPDATE" : ""

  const [[row]] = await BaseModel.query(
    `SELECT COUNT(*) as total
     FROM icp_pengajuan
     WHERE mahasiswa_id = ?
     AND created_at >= CURDATE()
     AND created_at < CURDATE() + INTERVAL 1 DAY
     ${lockClause}`,
    [mahasiswa_id],
    conn
  )

  return row.total
}

// ===============================
// 📊 COUNT DOSEN → MAHASISWA (WITH LOCK)
const countDosenToMahasiswa = async (
  dosen_id,
  mahasiswa_id,
  conn,
  useLock = false
) => {
  if (!dosen_id || !mahasiswa_id) {
    throw new Error("Data dosen/mahasiswa tidak valid")
  }

  const lockClause = useLock ? "FOR UPDATE" : ""

  const [[row]] = await BaseModel.query(
    `SELECT COUNT(*) as total
     FROM icp_pengajuan
     WHERE target_user_id = ?
     AND mahasiswa_id = ?
     AND created_at >= CURDATE()
     AND created_at < CURDATE() + INTERVAL 1 DAY
     ${lockClause}`,
    [dosen_id, mahasiswa_id],
    conn
  )

  return row.total
}

module.exports = {
  countPengajuanHarian,
  countDosenToMahasiswa
} 