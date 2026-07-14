const db = require("../../../shared/config/db")
const model = require("../models/dashboard.model")
const validator = require("../../../shared/utils/validator")

// ===============================
const normalizeFilters = (filters) => {
  const result = {}

  if (filters.semester_id) {
    const val = Number(filters.semester_id)
    if (!isNaN(val)) result.semester_id = val
  }

  if (filters.kategori_id) {
    const val = Number(filters.kategori_id)
    if (!isNaN(val)) result.kategori_id = val
  }

  if (filters.unit_id) {
    const val = Number(filters.unit_id)
    if (!isNaN(val)) result.unit_id = val
  }

  return result
}

// ===============================
const getDashboard = async (filters = {}) => {
  const conn = await db.getConnection()

  try {
    const safeFilters = normalizeFilters(filters)

    // ===============================
    // 🔒 VALIDASI FILTER
    if (safeFilters.semester_id) {
      await validator.existsSemester(safeFilters.semester_id, conn)
    }

    if (safeFilters.kategori_id) {
      await validator.existsKategori(safeFilters.kategori_id, conn)
    }

    if (safeFilters.unit_id) {
      await validator.existsUnit(safeFilters.unit_id, conn)
    }

    // ===============================
    // 🔥 PARALLEL QUERY (CONSISTENT CONNECTION)
    const [
      total_mahasiswa,
      total_transaksi,
      total_icp,
      top_mahasiswa
    ] = await Promise.all([
      model.countMahasiswa(conn),

      model.countTransaksi(
        {
          ...safeFilters,
          status: "approved"
        },
        conn
      ),

      model.sumICP(
        {
          ...safeFilters,
          status: "approved"
        },
        conn
      ),

      model.getTopMahasiswa(
        {
          ...safeFilters,
          status: "approved"
        },
        conn
      )
    ])

    // ===============================
    // 🔥 NORMALISASI OUTPUT
    return {
      total_mahasiswa: Number(total_mahasiswa || 0),
      total_transaksi: Number(total_transaksi || 0),
      total_icp: Number(total_icp || 0),
      top_mahasiswa: Array.isArray(top_mahasiswa) ? top_mahasiswa : []
    }

  } catch (err) {
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  getDashboard
} 