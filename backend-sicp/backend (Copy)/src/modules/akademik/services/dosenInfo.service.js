const db = require("../../../shared/config/db")

// ============================================================================
// dosenInfo.service.js  (FINAL — sesuai DB schema aktual)
// ----------------------------------------------------------------------------
// Endpoint /api/dosen-info — info terkait peran dosen:
//   - unit organisasi anggota (kolom dosen.unit_id singular)
//   - jurusan keanggotaan
//   - kategori ICP yang user-level access-nya diberikan
//   - kelas yang diampu (mata kuliah & jumlah mahasiswa)
//   - mahasiswa di sebuah kelas
//
// BERLAKU UNTUK:
//   - role 'dosen'         → info dari tabel dosen
//   - role 'admin'+'dosen' → multi-role, info gabungan
//   - role 'super_admin'   → akses semua + override
//   - role 'admin' (tanpa dosen) → tetap dapat melihat unit & jurusan via
//     admin_profile, tapi tidak dapat "kelas" (kelas hanya untuk dosen pengampu)
// ============================================================================

// ---------------------------- Helpers --------------------------------------
const getRoles = (user) =>
  Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean)

const isMahasiswa = (user)   => getRoles(user).includes("mahasiswa")
const isDosen     = (user)   => getRoles(user).includes("dosen")
const isAdmin     = (user)   => getRoles(user).includes("admin")
const isSuperAdmin= (user)   => getRoles(user).includes("super_admin")

const getDosenId = async (user_id, conn = null) => {
  const c = conn || db
  const [rows] = await c.query(
    "SELECT id FROM dosen WHERE user_id = ? LIMIT 1",
    [user_id]
  )
  return rows[0] ? rows[0].id : null
}

// ============================================================================
// 1. UNIT ORGANISASI ANGGOTA — semua role staff
//    Sumber:
//      - dosen.unit_id (jika user punya baris di dosen)
//      - + (optional) unit yg di-grant via user_kategori_access.unit_id
//        sehingga admin yg di-assign akses kategori di unit X juga melihat
//        unit X dalam daftar.
const getMyUnits = async (user_id) => {
  const [rows] = await db.query(
    `SELECT DISTINCT u.id, u.nama_unit, u.deskripsi
     FROM unit_organisasi u
     INNER JOIN user_unit_member uum ON uum.unit_id = u.id
     WHERE uum.user_id = ?
     ORDER BY u.nama_unit ASC`,
    [user_id])
  return rows
}

// ============================================================================
// 2. JURUSAN KEANGGOTAAN — multi-source
//    Sumber:
//      - mahasiswa.jurusan_id
//      - dosen.jurusan_id
//      - admin_profile.jurusan_id
const getMyJurusan = async (user_id) => {
  const [rows] = await db.query(
    `SELECT DISTINCT jurusan_id, nama_jurusan, via_role
     FROM v_user_jurusan_member
     WHERE user_id = ?
     ORDER BY nama_jurusan ASC`,
    [user_id]
  )
  return rows
}

// ============================================================================
// 3. KATEGORI ICP YANG USER PUNYA AKSES
const getMyKategoriAccess = async (user_id) => {
  const [rows] = await db.query(
    `SELECT DISTINCT k.id, k.nama_kategori AS nama, uk.unit_id, u.nama_unit
     FROM user_unit_member uum
     INNER JOIN unit_kategori uk ON uk.unit_id = uum.unit_id
     INNER JOIN kategori_icp k   ON k.id = uk.kategori_id
     LEFT  JOIN unit_organisasi u ON u.id = uk.unit_id
     WHERE uum.user_id = ?
     ORDER BY k.nama_kategori ASC, u.nama_unit ASC`,
    [user_id])
  return rows
}

// ============================================================================
// 4. KELAS YANG SAYA AMPU (semester aktif default)
//    Aktif untuk role dosen (termasuk admin+dosen, SA+dosen).
//    Bila user TIDAK ada di tabel dosen → kembalikan [].
const getMyKelas = async (user_id, { semester_id = null, all_sem = false } = {}) => {
  const dosen_id = await getDosenId(user_id)
  if (!dosen_id) return []

  let where = "WHERE k.user_id = ?"
  const params = [user_id]

  if (semester_id) {
    where += " AND k.semester_id = ?"
    params.push(semester_id)
  } else if (!all_sem) {
    where += " AND k.sem_active = 1"
  }

  const [rows] = await db.query(
    `SELECT
       mata_kuliah_id AS kelas_id,
       nama_mk AS nama_kelas,
       sem_tahun_ajaran AS tahun_ajaran,
       mata_kuliah_id, kode_mk, nama_mk, sks,
       mk_jurusan_id, mk_nama_jurusan, mk_angkatan,
       sem_tahun_ajaran, sem_label, sem_active,
       jumlah_mahasiswa
     FROM v_user_mk_ampu k
     ${where}
     ORDER BY nama_mk ASC, nama_kelas ASC`,
    params
  )
  return rows
}

// ============================================================================
// 5. MAHASISWA DI SUATU KELAS — guard ownership: dosen hanya bisa lihat kelas
//    yang dia ampu (kecuali super_admin yang override).
const getMahasiswaInKelas = async (user_id, kelas_id, actor) => {
  // SA → bypass
  if (actor && isSuperAdmin(actor)) {
    // langsung query
  } else {
    const dosen_id = await getDosenId(user_id)
    if (!dosen_id) throw new Error("User bukan dosen / tidak punya kelas")

    const [own] = await db.query(
      "SELECT 1 FROM mata_kuliah_dosen WHERE mata_kuliah_id = ? AND user_id = ? LIMIT 1",
      [kelas_id, dosen_id]
    )
    if (!own.length) throw new Error("Kelas ini tidak Anda ampu")
  }

  const [rows] = await db.query(
    `
    SELECT
      m.id, m.nim, m.nama, m.jurusan_id, m.angkatan, m.status,
      j.nama_jurusan
    FROM mata_kuliah_mahasiswa km
    INNER JOIN mahasiswa m ON m.id = km.mahasiswa_id
    LEFT JOIN jurusan j    ON j.id = m.jurusan_id
    WHERE km.mata_kuliah_id = ?
      AND km.status = 'aktif'
      AND m.status = 'aktif'
    ORDER BY m.nama ASC
    `,
    [kelas_id]
  )
  return rows
}

// ============================================================================
// 6. RINGKASAN PROFIL "AS DOSEN" — info utama dosen utk menu profil
const getDosenProfile = async (user_id) => {
  const [rows] = await db.query(
    `SELECT d.id AS dosen_id, d.nidn, d.nama, d.jabatan, d.motto, d.foto_profile,
            d.unit_id, u.nama_unit,
            d.jurusan_id, j.nama_jurusan,
            d.status
     FROM dosen d
     LEFT JOIN unit_organisasi u ON u.id = d.unit_id
     LEFT JOIN jurusan j         ON j.id = d.jurusan_id
     WHERE d.user_id = ?
     LIMIT 1`,
    [user_id]
  )
  return rows[0] || null
}

module.exports = {
  getMyUnits,
  getMyJurusan,
  getMyKategoriAccess,
  getMyKelas,
  getMahasiswaInKelas,
  getDosenProfile,

  // helpers exported untuk reuse
  isMahasiswa, isDosen, isAdmin, isSuperAdmin, getRoles
}
