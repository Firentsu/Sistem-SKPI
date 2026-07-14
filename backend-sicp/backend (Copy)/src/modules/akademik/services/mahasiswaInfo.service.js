const db = require("../../../shared/config/db")

// ============================================================================
// mahasiswaInfo.service.js  (NEW — Tahap 1)
// ----------------------------------------------------------------------------
// Info akademik mahasiswa:
//   - kelas yang dia ikuti (semester aktif default)
//   - profile lengkap (jurusan, angkatan)
//   - mata kuliah & dosennya
// ============================================================================

// GET kelas yang diikuti
const getMyKelas = async (user_id, { semester_id = null, all_sem = false } = {}) => {
  let where = "WHERE user_id = ? AND km_status = 'aktif'"
  const params = [user_id]
  if (semester_id) {
    where += " AND semester_id = ?"
    params.push(semester_id)
  } else if (!all_sem) {
    where += " AND sem_active = 1"
  }

  const [rows] = await db.query(
    `SELECT
       mata_kuliah_id AS kelas_id,
       nama_mk AS nama_kelas,
       sem_tahun_ajaran AS tahun_ajaran,
       sem_label, sem_active,
       mata_kuliah_id, kode_mk, nama_mk, sks, mk_angkatan,
       dosen_pengampu_usernames AS dosen_nama
     FROM v_mahasiswa_mk
     ${where}
     ORDER BY nama_mk ASC, nama_kelas ASC`,
    params
  )
  return rows
}

// GET profile akademik
const getProfile = async (user_id) => {
  const [rows] = await db.query(
    `SELECT m.id AS mahasiswa_id, m.nim, m.nama, m.angkatan,
            m.tempat_lahir, m.tanggal_lahir, m.motto, m.foto_profile,
            m.jurusan_id, j.nama_jurusan,
            m.status
     FROM mahasiswa m
     LEFT JOIN jurusan j ON j.id = m.jurusan_id
     WHERE m.user_id = ?
     LIMIT 1`,
    [user_id]
  )
  return rows[0] || null
}

module.exports = { getMyKelas, getProfile }
