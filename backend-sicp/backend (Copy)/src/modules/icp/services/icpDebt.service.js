const db = require("../../../shared/config/db")

// ===============================
const getMyDebt = async (mahasiswa_id) => {
  const [rows] = await db.query(
    `SELECT 
        d.mahasiswa_id,
        d.kategori_id,
        k.nama_kategori,
        d.amount,
        d.updated_at
     FROM icp_debt d
     LEFT JOIN kategori_icp k ON k.id = d.kategori_id
     WHERE d.mahasiswa_id = ?
     ORDER BY d.amount DESC`,
    [mahasiswa_id]
  )

  return rows
}

module.exports = {
  getMyDebt
} 