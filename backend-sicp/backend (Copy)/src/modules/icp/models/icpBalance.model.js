const BaseModel = require("../../../shared/models/base.model")

const getSaldoMahasiswa = async (mahasiswa_id, conn) => {
  return await BaseModel.findOne(
    `
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN tipe = 'masuk' THEN point
          WHEN tipe = 'keluar' THEN -point
          ELSE 0
        END
      ), 0) AS total_icp
    FROM icp_transactions
    WHERE mahasiswa_id = ?
    AND status = 'approved'
    `,
    [mahasiswa_id],
    conn
  )
}

const getHistory = async (mahasiswa_id, conn) => {
  return await BaseModel.findAll(
    `
    SELECT
      t.id,
      t.source_type,
      t.deskripsi,
      t.point,
      t.tipe,
      t.created_at,
      u.username                                AS created_by_username,
      k.nama_kategori,
      ni.nama                                   AS nama_icp,
      uo.nama_unit,
      CONCAT(s.tahun_ajaran, ' ', s.semester)   AS semester_label
    FROM icp_transactions t
    LEFT JOIN users           u  ON u.id  = t.created_by
    LEFT JOIN kategori_icp    k  ON k.id  = t.kategori_id
    LEFT JOIN nama_icp        ni ON ni.id = t.nama_icp_id
    LEFT JOIN unit_organisasi uo ON uo.id = ni.unit_id
    LEFT JOIN semesters       s  ON s.id  = t.semester_id
    WHERE t.mahasiswa_id = ?
      AND t.status = 'approved'
    ORDER BY t.created_at DESC
    `,
    [mahasiswa_id],
    conn
  )
}

const getRanking = async (limit = 10, conn, jurusan_id = null) => {
  const params = []
  let jurusanFilter = ""
  if (jurusan_id) {
    jurusanFilter = "AND m.jurusan_id = ?"
    params.push(Number(jurusan_id))
  }
  params.push(Number(limit))
  return await BaseModel.findAll(
    `
    SELECT 
      m.id as mahasiswa_id,
      m.nama,
      u.username,
      m.jurusan_id,
      j.nama_jurusan,
      j.warna AS warna_jurusan,
      COALESCE(SUM(
        CASE 
          WHEN t.tipe = 'masuk' THEN t.point
          WHEN t.tipe = 'keluar' THEN -t.point
          ELSE 0
        END
      ), 0) AS total_icp
    FROM mahasiswa m
    LEFT JOIN users u ON m.user_id = u.id
    LEFT JOIN jurusan j ON m.jurusan_id = j.id
    LEFT JOIN icp_transactions t 
      ON m.id = t.mahasiswa_id 
      AND t.status = 'approved'
    WHERE m.status = 'aktif' AND COALESCE(u.status, 'aktif') = 'aktif'
      ${jurusanFilter}
    GROUP BY m.id
    ORDER BY total_icp DESC
    LIMIT ?
    `,
    params,
    conn
  )
}

// Saldo ICP dipecah PER KATEGORI untuk seorang mahasiswa.
// Selalu mengembalikan 6 baris (semua kategori), 0 bila belum ada transaksi.
const getSaldoPerKategori = async (mahasiswa_id, conn) => {
  return await BaseModel.findAll(
    `
    SELECT
      k.id            AS kategori_id,
      k.nama_kategori AS kategori,
      COALESCE(SUM(
        CASE
          WHEN t.tipe = 'masuk'  THEN t.point
          WHEN t.tipe = 'keluar' THEN -t.point
          ELSE 0
        END
      ), 0) AS total
    FROM kategori_icp k
    LEFT JOIN icp_transactions t
      ON t.kategori_id   = k.id
      AND t.mahasiswa_id = ?
      AND t.status       = 'approved'
    GROUP BY k.id, k.nama_kategori
    ORDER BY k.id
    `,
    [mahasiswa_id],
    conn
  )
}

module.exports = {
  getSaldoMahasiswa,
  getHistory,
  getRanking,
  getSaldoPerKategori
}