const BaseModel = require("../../../shared/models/base.model")

const getRanking = async (filters, conn) => {
  const {
    semester_id = null,
    limit = 10,
    jurusan_id = null
  } = filters

  let joinCondition = `
    ON m.id = t.mahasiswa_id
    AND t.status = 'approved'
  `

  const params = []

  // 🔥 FILTER SEMESTER (JOIN LEVEL)
  if (semester_id) {
    joinCondition += " AND t.semester_id = ?"
    params.push(semester_id)
  }

  let where = ""
  if (jurusan_id) {
    where = "WHERE m.jurusan_id = ?"
    params.push(jurusan_id)
  }

  params.push(Number(limit))

  const rows = await BaseModel.findAll(`
    SELECT 
      m.id,
      m.nama,
      j.nama_jurusan,
      COALESCE(SUM(
        CASE 
          WHEN t.tipe = 'masuk' THEN t.point
          WHEN t.tipe = 'keluar' THEN -t.point
          ELSE 0
        END
      ), 0) AS total_icp
    FROM mahasiswa m
    LEFT JOIN jurusan j ON m.jurusan_id = j.id
    LEFT JOIN icp_transactions t 
      ${joinCondition}
    ${where}
    GROUP BY m.id, m.nama, j.nama_jurusan
    ORDER BY total_icp DESC
    LIMIT ?
  `, params, conn)

  return rows.map(row => ({
    ...row,
    total_icp: Number(row.total_icp)
  }))
}

module.exports = {
  getRanking
} 