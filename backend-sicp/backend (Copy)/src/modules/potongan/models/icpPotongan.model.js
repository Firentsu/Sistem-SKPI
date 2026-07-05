const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 🔒 LOCK DATA
const findByIdForUpdate = async (id, conn) => {
  const [rows] = await BaseModel.query(
    "SELECT * FROM icp_potongan WHERE id = ? FOR UPDATE",
    [id],
    conn
  )
  return rows[0] || null
}

// ===============================
// ➕ INSERT (FIX FIELD + ROUTING)
const insertPotongan = async (data, conn) => {
  const {
    mahasiswa_id,
    kategori_id,
    kategori_pelanggaran,
    jumlah_potong,
    keterangan,
    created_by,
    semester_id,
    target_admin_final_id
  } = data

  const [result] = await BaseModel.query(
    `INSERT INTO icp_potongan
     (mahasiswa_id, kategori_id, kategori_pelanggaran, jumlah_potong, keterangan,
      dipotong_oleh, semester_id, target_admin_final_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mahasiswa_id,
      kategori_id,
      kategori_pelanggaran,
      jumlah_potong,
      keterangan,
      created_by,
      semester_id,
      target_admin_final_id || null
    ],
    conn
  )

  return result.insertId
}

// ===============================
// ➕ INSERT LANGSUNG APPROVED (SUPER ADMIN DIRECT)
// Super admin tidak butuh validasi user lain — potongan langsung approved
const insertPotonganApproved = async (data, conn) => {
  const {
    mahasiswa_id,
    kategori_id,
    kategori_pelanggaran,
    jumlah_potong,
    keterangan,
    created_by,
    semester_id
  } = data

  const [result] = await BaseModel.query(
    `INSERT INTO icp_potongan
     (mahasiswa_id, kategori_id, kategori_pelanggaran, jumlah_potong,
      keterangan, dipotong_oleh, semester_id, status, validated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?)`,
    [
      mahasiswa_id,
      kategori_id,
      kategori_pelanggaran || null,
      jumlah_potong,
      keterangan,
      created_by,
      semester_id,
      created_by
    ],
    conn
  )

  return result.insertId
}

// ===============================
// 🔄 UPDATE APPROVED (DEFENSIVE)
const updateApproved = async (id, user_id, conn) => {
  const [result] = await BaseModel.query(
    `UPDATE icp_potongan 
     SET status = 'approved', validated_by = ?
     WHERE id = ? AND status = 'pending'`,
    [user_id, id],
    conn
  )

  if (result.affectedRows === 0) {
    throw new Error("Potongan tidak bisa di-approve")
  }
}

// ===============================
// 🔄 UPDATE REJECTED (DEFENSIVE)
const updateRejected = async (id, user_id, alasan, conn) => {
  const [result] = await BaseModel.query(
    `UPDATE icp_potongan
     SET status = 'rejected',
         rejected_by = ?,
         rejected_at = NOW(),
         alasan = ?
     WHERE id = ? AND status = 'pending'`,
    [user_id, alasan || null, id],
    conn
  )

  if (result.affectedRows === 0) {
    throw new Error("Potongan tidak bisa di-reject")
  }
}

// ===============================
// 🔥 GET MY POTONGAN (FIX LOGIC)
const getMyPotongan = async (mahasiswa_id, conn = null) => {
  const [rows] = await BaseModel.query(
    // `
    // SELECT 
    //   p.id,
    //   p.jumlah_potong AS point,
    //   p.status,
    //   p.keterangan,
    //   p.alasan,
    //   p.created_at,
    //   m.nama AS mahasiswa_nama,
    //   k.nama_kategori
    // FROM icp_potongan p
    // LEFT JOIN mahasiswa m ON m.id = p.mahasiswa_id
    // LEFT JOIN kategori_icp k ON k.id = p.kategori_id
    // WHERE p.mahasiswa_id = ?
    // ORDER BY p.created_at DESC
    // `
    `
    SELECT
      p.id, p.jumlah_potong AS point, p.status, p.keterangan, p.alasan, p.created_at,
      p.kategori_id, k.nama_kategori,
      p.semester_id, s.tahun_ajaran, s.semester,        -- TAMBAH (utk kolom Semester)
      u.username AS pemotong                            -- TAMBAH (utk kolom Pemotong ICP)
    FROM icp_potongan p
    LEFT JOIN kategori_icp k ON k.id = p.kategori_id
    LEFT JOIN semesters s   ON s.id = p.semester_id     -- TAMBAH
    LEFT JOIN users u       ON u.id = p.dipotong_oleh   -- TAMBAH
    WHERE p.mahasiswa_id = ?
    ORDER BY p.created_at DESC
    `
    ,
    [mahasiswa_id],
    conn
  )

  return rows
}

module.exports = {
  findByIdForUpdate,
  insertPotongan,
  insertPotonganApproved,
  updateApproved,
  updateRejected,
  getMyPotongan
} 