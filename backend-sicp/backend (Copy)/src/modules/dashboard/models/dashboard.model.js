const BaseModel = require("../../../shared/models/base.model")

// ===============================
const buildFilter = (filters, params) => {
  let where = "WHERE t.status = 'approved'"

  if (filters.semester_id) {
    where += " AND t.semester_id = ?"
    params.push(filters.semester_id)
  }

  if (filters.kategori_id) {
    where += " AND t.kategori_id = ?"
    params.push(filters.kategori_id)
  }

  if (filters.unit_id) {
    where += " AND t.unit_id = ?"
    params.push(filters.unit_id)
  }

  return where
}

// ===============================
const countMahasiswa = async (conn) => {
  const row = await BaseModel.findOne(
    "SELECT COUNT(*) AS total FROM mahasiswa",
    [],
    conn
  )
  return Number(row?.total || 0)
}

// ===============================
const countTransaksi = async (filters, conn) => {
  const params = []

  const where = buildFilter(filters, params)

  const row = await BaseModel.findOne(`
    SELECT COUNT(*) AS total
    FROM icp_transactions t
    ${where}
  `, params, conn)

  return Number(row?.total || 0)
}

// ===============================
const sumICP = async (filters, conn) => {
  const params = []

  const where = buildFilter(filters, params)

  const row = await BaseModel.findOne(`
    SELECT COALESCE(SUM(
      CASE 
        WHEN t.tipe = 'masuk' THEN t.point
        WHEN t.tipe = 'keluar' THEN -t.point
      END
    ), 0) AS total_icp
    FROM icp_transactions t
    ${where}
  `, params, conn)

  return Number(row?.total_icp || 0)
}

// ===============================
const getTopMahasiswa = async (filters, conn) => {
  const params = []

  let joinCondition = `
    ON m.id = t.mahasiswa_id
    AND t.status = 'approved'
  `

  if (filters.semester_id) {
    joinCondition += " AND t.semester_id = ?"
    params.push(filters.semester_id)
  }

  if (filters.kategori_id) {
    joinCondition += " AND t.kategori_id = ?"
    params.push(filters.kategori_id)
  }

  if (filters.unit_id) {
    joinCondition += " AND t.unit_id = ?"
    params.push(filters.unit_id)
  }

  const rows = await BaseModel.findAll(`
    SELECT 
      m.id,
      COALESCE(m.nama, 'Unknown') AS nama,
      COALESCE(SUM(
        CASE 
          WHEN t.tipe = 'masuk' THEN t.point
          WHEN t.tipe = 'keluar' THEN -t.point
        END
      ), 0) AS total_icp
    FROM mahasiswa m
    LEFT JOIN icp_transactions t 
      ${joinCondition}
    GROUP BY m.id
    ORDER BY total_icp DESC
    LIMIT 10
  `, params, conn)

  return rows.map(r => ({
    id: r.id,
    nama: r.nama,
    total_icp: Number(r.total_icp || 0)
  }))
}

module.exports = {
  countMahasiswa,
  countTransaksi,
  sumICP,
  getTopMahasiswa
} 