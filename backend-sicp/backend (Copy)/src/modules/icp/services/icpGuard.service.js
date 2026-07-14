const guardModel = require("../models/icpGuard.model")

const getConfig = async (key, conn, defaultValue = null) => {
  const [rows] = await conn.query(
    `SELECT nilai
       FROM system_settings
      WHERE nama_setting = ?
      LIMIT 1`,
    [key]
  )

  if (!rows.length) return defaultValue

  const num = Number(rows[0].nilai)
  return isNaN(num) ? defaultValue : num
}

const guardPengajuanHarian = async ({ mahasiswa_id, conn }) => {
  if (!mahasiswa_id) throw new Error("mahasiswa_id tidak valid")

  const LIMIT = await getConfig("limit_pengajuan_harian", conn, 5)

  const total = await guardModel.countPengajuanHarian(
    mahasiswa_id,
    conn,
    true 
  )

  if (total >= LIMIT) {
    throw new Error(`Batas pengajuan harian tercapai (${LIMIT}/hari)`)
  }
}
//limit dosen ke per satuan mahasiswa
const guardDosenToMahasiswa = async ({
  dosen_id,
  mahasiswa_id,
  conn
}) => {
  if (!dosen_id || !mahasiswa_id) {
    throw new Error("Data dosen/mahasiswa tidak valid")
  }

  const LIMIT = await getConfig("limit_dosen_per_mhs", conn, 3)

  const total = await guardModel.countDosenToMahasiswa(
    dosen_id,
    mahasiswa_id,
    conn,
    true
  )

  if (total >= LIMIT) {
    throw new Error(
      `Batas pemberian ke mahasiswa ini hari ini tercapai (${LIMIT}/hari)`
    )
  }
}

const guardApproveStatus = (status) => {
  const allowed = ["pending"]

  if (!allowed.includes(status)) {
    throw new Error("Pengajuan sudah diproses sebelumnya")
  }
}

const guardValidasiStatus = (status) => {
  const allowed = ["approved"]

  if (!allowed.includes(status)) {
    throw new Error(
      "Pengajuan belum siap divalidasi (harus di-approve dosen/admin dulu)"
    )
  }
}

const guardRejectStatus = (status) => {
  const allowed = ["pending", "approved"]

  if (!allowed.includes(status)) {
    throw new Error("Status saat ini tidak bisa di-reject")
  }
}

module.exports = {
  guardPengajuanHarian,
  guardDosenToMahasiswa,
  guardApproveStatus,
  guardValidasiStatus,
  guardRejectStatus,
  getConfig
} 