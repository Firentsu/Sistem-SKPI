const model = require("../models/icpBalance.model")

// ===============================
const getSaldoMahasiswa = async (mahasiswa_id, conn = null) => {

  if (!mahasiswa_id) {
    throw new Error("mahasiswa_id wajib")
  }

  const row = await model.getSaldoMahasiswa(mahasiswa_id, conn)

  return {
    mahasiswa_id,
    total_icp: Number(row?.total_icp || 0)
  }
}

// ===============================
const getHistory = async (mahasiswa_id, conn = null) => {

  if (!mahasiswa_id) {
    throw new Error("mahasiswa_id wajib")
  }

  return await model.getHistory(mahasiswa_id, conn)
}

// ===============================
const getRanking = async (limit = 10, conn = null, jurusan_id = null) => {

  if (limit > 100) limit = 100 // safety limit

  return await model.getRanking(limit, conn, jurusan_id)
}

// ===============================
// Saldo ICP per kategori (Fisik/Iman/Intelektual/Kepribadian/Keterampilan/Moral)
const getSaldoPerKategori = async (mahasiswa_id, conn = null) => {

  if (!mahasiswa_id) {
    throw new Error("mahasiswa_id wajib")
  }

  const rows = await model.getSaldoPerKategori(mahasiswa_id, conn)

  return rows.map(r => ({
    kategori_id: r.kategori_id,
    kategori:    r.kategori,
    total:       Number(r.total || 0)
  }))
}

module.exports = {
  getSaldoMahasiswa,
  getHistory,
  getRanking,
  getSaldoPerKategori
}