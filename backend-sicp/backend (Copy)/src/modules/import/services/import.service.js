const db = require("../../../shared/config/db")
const bcrypt = require("bcrypt")
const { parseExcel, parseExcelMultiSheet } = require("../../../shared/utils/excelParser")

const SALT_ROUNDS = 10

const insertUserOnly = async (conn, { username, password, role, createdBy }) => {
  const u = String(username).trim().toLowerCase()
  if (!u) throw new Error("username kosong")
  const [exists] = await conn.query(
    "SELECT id FROM users WHERE username = ? LIMIT 1", [u]
  )
  if (exists.length) throw new Error(`username "${u}" sudah ada`)
  const hashed = await bcrypt.hash(String(password), SALT_ROUNDS)
  const [r] = await conn.query(
    `INSERT INTO users (username, password, role, created_by, status)
     VALUES (?, ?, ?, ?, 'aktif')`,
    [u, hashed, role, createdBy]
  )
  return r.insertId
}

const logImport = async (conn, importedBy, jenis, total, berhasil, gagal) => {
  await conn.query(
    `INSERT INTO import_logs (imported_by, jenis_import, total_data, berhasil, gagal)
     VALUES (?, ?, ?, ?, ?)`,
    [importedBy, jenis, total, berhasil, gagal]
  )
}

const importMahasiswa = async (filePath, createdBy) => {
  const rows = parseExcel(filePath)
  if (!rows.length) throw new Error("File Excel kosong")
  return await db.withTransaction(async (conn) => {
    let success = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]; const baris = i + 1
      if (!row.nim)  throw new Error(`Baris ${baris}: 'nim' wajib`)
      if (!row.nama) throw new Error(`Baris ${baris}: 'nama' wajib`)
      const nim = String(row.nim).trim()
      const [dup] = await conn.query("SELECT id FROM mahasiswa WHERE nim = ? LIMIT 1", [nim])
      if (dup.length) throw new Error(`Baris ${baris}: NIM ${nim} sudah ada`)

      const username = row.username ? String(row.username).trim().toLowerCase() : nim.toLowerCase()
      const password = row.password ? String(row.password) : nim
      const user_id = await insertUserOnly(conn, { username, password, role: "mahasiswa", createdBy })

      const angkatan     = row.angkatan ? Number(row.angkatan) : null
      const jurusan_id   = row.jurusan_id ? Number(row.jurusan_id) : null
      const tempat_lahir = row.tempat_lahir ? String(row.tempat_lahir).trim() : null
      let tanggal_lahir  = null
      if (row.tanggal_lahir) {
        tanggal_lahir = (row.tanggal_lahir instanceof Date)
          ? row.tanggal_lahir.toISOString().slice(0,10)
          : String(row.tanggal_lahir).slice(0,10)
      }
      const motto = row.motto ? String(row.motto).trim() : null

      await conn.query(
        `INSERT INTO mahasiswa
         (user_id, nim, nama, jurusan_id, angkatan, tempat_lahir, tanggal_lahir, motto, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
        [user_id, nim, String(row.nama).trim(), jurusan_id, angkatan,
         tempat_lahir, tanggal_lahir, motto]
      )
      success++
    }
    await logImport(conn, createdBy, "mahasiswa", rows.length, success, 0)
    return { total: rows.length, success, failed: 0 }
  })
}

const importDosen = async (filePath, createdBy) => {
  const rows = parseExcel(filePath)
  if (!rows.length) throw new Error("File Excel kosong")
  return await db.withTransaction(async (conn) => {
    let success = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]; const baris = i + 1
      if (!row.nama) throw new Error(`Baris ${baris}: 'nama' wajib`)

      // POIN 9: MULTI-ROLE — beri role dosen ke admin/super_admin yang SUDAH ADA.
      // Pakai kolom 'multi_role_username' (username admin/SA target).
      const multiUsername = row.multi_role_username
        ? String(row.multi_role_username).trim().toLowerCase() : null

      if (multiUsername) {
        const [u] = await conn.query(
          "SELECT id, role FROM users WHERE username = ? LIMIT 1", [multiUsername])
        if (!u.length) throw new Error(`Baris ${baris}: user '${multiUsername}' tidak ditemukan`)
        const target = u[0]
        if (!["admin", "super_admin"].includes(target.role))
          throw new Error(`Baris ${baris}: multi-role dosen hanya untuk admin/super_admin`)

        const nidn = row.nidn ? String(row.nidn).trim() : null
        if (!nidn) throw new Error(`Baris ${baris}: 'nidn' wajib untuk multi-role dosen`)
        if (!row.jurusan_id) throw new Error(`Baris ${baris}: 'jurusan_id' wajib untuk multi-role dosen`)
        const [dupN] = await conn.query("SELECT id FROM dosen WHERE nidn = ? LIMIT 1", [nidn])
        if (dupN.length) throw new Error(`Baris ${baris}: NIDN ${nidn} sudah ada`)

        // catat role tambahan (idempotent)
        await conn.query(
          `INSERT IGNORE INTO user_roles (user_id, role, granted_by, granted_at)
           VALUES (?, 'dosen', ?, NOW())`, [target.id, createdBy])
        // isi identitas dosen lengkap (kalau belum ada)
        const [d] = await conn.query("SELECT id FROM dosen WHERE user_id = ?", [target.id])
        if (!d.length) {
          await conn.query(
            `INSERT INTO dosen (user_id, nidn, nama, unit_id, jurusan_id, jabatan, motto, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')`,
            [target.id, nidn, String(row.nama).trim(),
             row.unit_id ? Number(row.unit_id) : null, Number(row.jurusan_id),
             row.jabatan ? String(row.jabatan).trim() : null,
             row.motto ? String(row.motto).trim() : null])
        }
        success++
        continue
      }

      // === DOSEN BARU (single-role) ===
      const nidn = row.nidn ? String(row.nidn).trim() : null
      if (nidn) {
        const [dup] = await conn.query("SELECT id FROM dosen WHERE nidn = ? LIMIT 1", [nidn])
        if (dup.length) throw new Error(`Baris ${baris}: NIDN ${nidn} sudah ada`)
      }
      const username = row.username ? String(row.username).trim().toLowerCase()
                                    : (nidn ? nidn.toLowerCase() : null)
      if (!username) throw new Error(`Baris ${baris}: jika NIDN kosong, kolom 'username' wajib`)
      const password = row.password ? String(row.password) : (nidn || username)
      const user_id = await insertUserOnly(conn, { username, password, role: "dosen", createdBy })

      const jurusan_id = row.jurusan_id ? Number(row.jurusan_id) : null
      const unit_id    = row.unit_id ? Number(row.unit_id) : null
      const jabatan    = row.jabatan ? String(row.jabatan).trim() : null
      const motto      = row.motto ? String(row.motto).trim() : null

      await conn.query(
        `INSERT INTO dosen
         (user_id, nidn, nama, unit_id, jurusan_id, jabatan, motto, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')`,
        [user_id, nidn, String(row.nama).trim(), unit_id, jurusan_id, jabatan, motto]
      )
      success++
    }
    await logImport(conn, createdBy, "dosen", rows.length, success, 0)
    return { total: rows.length, success, failed: 0 }
  })
}

const importAdmin = async (filePath, createdBy) => {
  const rows = parseExcel(filePath)
  if (!rows.length) throw new Error("File Excel kosong")
  return await db.withTransaction(async (conn) => {
    let success = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]; const baris = i + 1
      if (!row.username) throw new Error(`Baris ${baris}: 'username' wajib`)
      if (!row.nama)     throw new Error(`Baris ${baris}: 'nama' wajib`)
      const username = String(row.username).trim().toLowerCase()
      const password = row.password ? String(row.password) : username
      const user_id = await insertUserOnly(conn, { username, password, role: "admin", createdBy })
      const jurusan_id = row.jurusan_id ? Number(row.jurusan_id) : null
      await conn.query(
        `INSERT INTO admin_profile (user_id, jurusan_id, nama) VALUES (?, ?, ?)`,
        [user_id, jurusan_id, String(row.nama).trim()]
      )
      success++
    }
    await logImport(conn, createdBy, "admin", rows.length, success, 0)
    return { total: rows.length, success, failed: 0 }
  })
}

const importMataKuliahWithEnroll = async (filePath, createdBy) => {
  let sheets
  try { sheets = parseExcelMultiSheet(filePath) }
  catch (e) {
    throw new Error("parseExcelMultiSheet belum tersedia di utils/excelParser.")
  }
  const headerRows = sheets.Header || sheets.header || []
  const mhsRows    = sheets.Mahasiswa || sheets.mahasiswa || []
  if (!headerRows.length) throw new Error("Sheet 'Header' wajib berisi 1 baris info mata kuliah")
  const h = headerRows[0]
  if (!h.kode_mk) throw new Error("Header: kode_mk wajib")
  if (!h.nama_mk) throw new Error("Header: nama_mk wajib")

  return await db.withTransaction(async (conn) => {
    // === SEMESTER ===
    let semester_id = h.semester_id ? Number(h.semester_id) : null
    if (!semester_id && h.tahun_ajaran && h.semester) {
      const [[s2]] = await conn.query(
        `SELECT id FROM semesters WHERE tahun_ajaran = ? AND semester = ? LIMIT 1`,
        [String(h.tahun_ajaran).trim(), String(h.semester).trim().toLowerCase()]
      )
      if (!s2) throw new Error(`Semester (${h.tahun_ajaran}-${h.semester}) tidak ditemukan`)
      semester_id = s2.id
    }
    if (!semester_id) {
      const [[active]] = await conn.query(`SELECT id FROM semesters WHERE aktif = 1 LIMIT 1`)
      if (!active) throw new Error("Header tidak punya semester_id dan tidak ada semester aktif")
      semester_id = active.id
    }

    // === JURUSAN ===
    let jurusan_id = h.jurusan_id ? Number(h.jurusan_id) : null
    if (!jurusan_id && h.nama_jurusan) {
      const [[j]] = await conn.query(
        `SELECT id FROM jurusan WHERE nama_jurusan = ? LIMIT 1`,
        [String(h.nama_jurusan).trim()])
      if (!j) throw new Error(`Jurusan "${h.nama_jurusan}" tidak ditemukan`)
      jurusan_id = j.id
    }
    if (!jurusan_id) throw new Error("Header: jurusan_id (atau nama_jurusan) wajib")

    // === DOSEN (resolve dosen_id → user_id utk mata_kuliah_dosen) ===
    let dosen_user_id = null
    if (h.dosen_id) {
      const [[d]] = await conn.query(`SELECT user_id FROM dosen WHERE id = ? LIMIT 1`, [Number(h.dosen_id)])
      if (!d) throw new Error(`Dosen id ${h.dosen_id} tidak ditemukan`)
      dosen_user_id = d.user_id
    } else if (h.dosen_nidn) {
      const [[d]] = await conn.query(`SELECT user_id FROM dosen WHERE nidn = ? LIMIT 1`, [String(h.dosen_nidn).trim()])
      if (!d) throw new Error(`Dosen NIDN ${h.dosen_nidn} tidak ditemukan`)
      dosen_user_id = d.user_id
    } else if (h.dosen_user_id) {
      dosen_user_id = Number(h.dosen_user_id)
    }
    if (!dosen_user_id) throw new Error("Header: dosen_id atau dosen_nidn atau dosen_user_id wajib")

    // === ANGKATAN (REV2) ===
    const angkatan = h.angkatan ? Number(h.angkatan) : null

    // === CREATE OR REUSE mata_kuliah (UQ kode_mk + semester_id) ===
    const kode_mk = String(h.kode_mk).trim()
    let mk_id
    const [[existMk]] = await conn.query(
      `SELECT id FROM mata_kuliah WHERE kode_mk = ? AND semester_id = ? LIMIT 1`,
      [kode_mk, semester_id])
    if (existMk) {
      mk_id = existMk.id
    } else {
      const [ins] = await conn.query(
        `INSERT INTO mata_kuliah (kode_mk, nama_mk, jurusan_id, angkatan, semester_id, sks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [kode_mk, String(h.nama_mk).trim(), jurusan_id, angkatan, semester_id,
         h.sks ? Number(h.sks) : 0])
      mk_id = ins.insertId
    }

    // === ASSIGN DOSEN ke MK (mata_kuliah_dosen — many-to-many) ===
    await conn.query(
      `INSERT IGNORE INTO mata_kuliah_dosen (mata_kuliah_id, user_id, is_koordinator, added_by)
       VALUES (?, ?, 1, ?)`,
      [mk_id, dosen_user_id, createdBy])

    // === ENROLL MAHASISWA langsung ke MK (no kelas) ===
    let enrolled = 0, skipped = 0
    const skipDetails = []
    for (let i = 0; i < mhsRows.length; i++) {
      const r = mhsRows[i]; const baris = i + 1
      if (!r.nim) throw new Error(`Sheet Mahasiswa baris ${baris}: 'nim' wajib`)
      const nim = String(r.nim).trim()
      const [[mhs]] = await conn.query(
        `SELECT id FROM mahasiswa WHERE nim = ? AND status = 'aktif' LIMIT 1`, [nim])
      if (!mhs) throw new Error(`Sheet Mahasiswa baris ${baris}: NIM ${nim} tidak ditemukan / nonaktif`)
      const [[existE]] = await conn.query(
        `SELECT id FROM mata_kuliah_mahasiswa WHERE mata_kuliah_id = ? AND mahasiswa_id = ? LIMIT 1`,
        [mk_id, mhs.id])
      if (existE) { skipped++; skipDetails.push(`NIM ${nim} sudah enrolled`); continue }
      await conn.query(
        `INSERT INTO mata_kuliah_mahasiswa (mata_kuliah_id, mahasiswa_id, enrolled_by, status)
         VALUES (?, ?, ?, 'aktif')`,
        [mk_id, mhs.id, createdBy])
      enrolled++
    }
    await logImport(conn, createdBy, "mata_kuliah", mhsRows.length, enrolled, skipped)
    return {
      mata_kuliah_id: mk_id,
      dosen_user_id,
      total_mahasiswa: mhsRows.length, enrolled, skipped, skip_details: skipDetails,
    }
  })
}

const importPotongan = async (filePath, createdBy) => {
  const rows = parseExcel(filePath)
  if (!rows.length) throw new Error("File Excel kosong")
  return await db.withTransaction(async (conn) => {
    const [[semester]] = await conn.query(`SELECT id FROM semesters WHERE aktif = 1 LIMIT 1`)
    if (!semester) throw new Error("Semester aktif tidak ditemukan")
    let success = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]; const baris = i + 1
      if (!row.nim) throw new Error(`Baris ${baris}: nim wajib`)
      const [[mhs]] = await conn.query(
        `SELECT id FROM mahasiswa WHERE nim = ? AND status = 'aktif'`, [String(row.nim).trim()]
      )
      if (!mhs) throw new Error(`Baris ${baris}: NIM ${row.nim} tidak ditemukan / nonaktif`)
      if (!row.kategori) throw new Error(`Baris ${baris}: kategori wajib`)
      const [[kat]] = await conn.query(
        `SELECT id FROM kategori_icp WHERE nama_kategori = ?`, [String(row.kategori).trim()]
      )
      if (!kat) throw new Error(`Baris ${baris}: kategori "${row.kategori}" tidak ditemukan`)
      const jumlah = Number(row.jumlah_potong)
      if (isNaN(jumlah) || jumlah <= 0) throw new Error(`Baris ${baris}: jumlah_potong > 0`)
      if (!row.keterangan || !String(row.keterangan).trim()) {
        throw new Error(`Baris ${baris}: keterangan wajib`)
      }
      await conn.query(
        `INSERT INTO icp_potongan
         (mahasiswa_id, kategori_id, kategori_pelanggaran, jumlah_potong,
          keterangan, dipotong_oleh, semester_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [mhs.id, kat.id,
         row.kategori_pelanggaran ? String(row.kategori_pelanggaran).trim() : null,
         jumlah, String(row.keterangan).trim(), createdBy, semester.id]
      )
      success++
    }
    await logImport(conn, createdBy, "pemotongan_icp", rows.length, success, 0)
    return { total: rows.length, success, failed: 0 }
  })
}

module.exports = {
  importMahasiswa, importDosen, importAdmin,
  importMataKuliahWithEnroll, importPotongan,
}
