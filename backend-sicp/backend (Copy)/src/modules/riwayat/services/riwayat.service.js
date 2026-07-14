const db = require("../../../shared/config/db")

const getRiwayatKegiatan = async ({ semester_id, status, limit = 100 } = {}) => {
  const where = []; const params = []
  if (semester_id) { where.push("k.semester_id = ?"); params.push(semester_id) }
  if (status) { where.push("k.status = ?"); params.push(status) }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : ""
  params.push(Number(limit))
  const [rows] = await db.query(
    `SELECT k.id, k.nama_kegiatan, k.status, k.tanggal_mulai, k.tanggal_selesai,
            k.icp_reward, k.semester_id, u.username AS dibuat_oleh, k.created_at,
            un.nama_unit AS unit
     FROM kegiatan k
     LEFT JOIN users u ON k.created_by = u.id
     LEFT JOIN unit_organisasi un ON k.unit_id = un.id
     ${whereSql} ORDER BY k.created_at DESC LIMIT ?`, params)
  return rows
}

const getRiwayatLogin = async ({ user_id, limit = 100 } = {}) => {
  const where = []; const params = []
  if (user_id) { where.push("l.user_id = ?"); params.push(user_id) }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : ""
  params.push(Number(limit))
  const [rows] = await db.query(
    `SELECT l.id, l.user_id, u.username, u.role, l.ip_address, l.device, l.login_time
     FROM login_log l LEFT JOIN users u ON l.user_id = u.id
     ${whereSql} ORDER BY l.login_time DESC LIMIT ?`, params)
  return rows
}

const getRiwayatPemberianValidasi = async ({ semester_id, status, limit = 100 } = {}) => {
  const where = []; const params = []
  if (semester_id) { where.push("p.semester_id = ?"); params.push(semester_id) }
  if (status) { where.push("p.status = ?"); params.push(status) }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : ""
  params.push(Number(limit))
  const [rows] = await db.query(
    `SELECT p.id, p.point, p.status, p.deskripsi, p.created_at,
            m.nama AS mahasiswa, m.nim,
            pemberi.username AS pemberi, p.pemberi_icp_id,
            validator.username AS validator, p.validated_by, p.final_validated_at,
            p.approved_by, p.approved_at, p.alasan_tolak,
            p.target_admin_final_id, tv.username AS validator_tujuan,
            k.nama_kategori AS kategori, ni.nama AS nama_icp, p.semester_id
     FROM icp_pengajuan p
     LEFT JOIN mahasiswa m ON p.mahasiswa_id = m.id
     LEFT JOIN users pemberi ON p.pemberi_icp_id = pemberi.id
     LEFT JOIN users validator ON p.validated_by = validator.id
     LEFT JOIN users tv ON p.target_admin_final_id = tv.id
     LEFT JOIN kategori_icp k ON p.kategori_id = k.id
     LEFT JOIN nama_icp ni ON p.nama_icp_id = ni.id
     ${whereSql} ORDER BY p.created_at DESC LIMIT ?`, params)
  return rows
}

const getRiwayatMandiri = async (actorId, { semester_id, limit = 100 } = {}) => {
  const params1 = [actorId]; let w1 = "p.pemberi_icp_id = ?"
  if (semester_id) { w1 += " AND p.semester_id = ?"; params1.push(semester_id) }
  params1.push(Number(limit))
  const [pemberian] = await db.query(
    `SELECT p.id, p.point, p.status, p.deskripsi, p.created_at, m.nama AS mahasiswa, m.nim,
            k.nama_kategori AS kategori, ni.nama AS nama_icp, p.semester_id, 'pemberian' AS jenis
     FROM icp_pengajuan p
     LEFT JOIN mahasiswa m ON p.mahasiswa_id = m.id
     LEFT JOIN kategori_icp k ON p.kategori_id = k.id
     LEFT JOIN nama_icp ni ON p.nama_icp_id = ni.id
     WHERE ${w1} ORDER BY p.created_at DESC LIMIT ?`, params1)

  const params2 = [actorId]; let w2 = "pt.dipotong_oleh = ?"
  if (semester_id) { w2 += " AND pt.semester_id = ?"; params2.push(semester_id) }
  params2.push(Number(limit))
  const [potongan] = await db.query(
    `SELECT pt.id, pt.jumlah_potong AS point, pt.status, pt.keterangan, pt.created_at,
            m.nama AS mahasiswa, m.nim, k.nama_kategori AS kategori,
            pt.semester_id, 'potongan' AS jenis
     FROM icp_potongan pt
     LEFT JOIN mahasiswa m ON pt.mahasiswa_id = m.id
     LEFT JOIN kategori_icp k ON pt.kategori_id = k.id
     WHERE ${w2} ORDER BY pt.created_at DESC LIMIT ?`, params2)

  return { pemberian, potongan }
}

const getRiwayatValidasi = async (actorId, { semester_id, limit = 100 } = {}) => {
  const p1 = [actorId, actorId]; let w1 = "(p.validated_by = ? OR p.approved_by = ?)"
  if (semester_id) { w1 += " AND p.semester_id = ?"; p1.push(semester_id) }
  p1.push(Number(limit))
  const [pemberian] = await db.query(
    `SELECT p.id, p.point, p.status, p.deskripsi, p.created_at, p.final_validated_at,
            m.nama AS mahasiswa, m.nim, pemberi.username AS pengaju,
            validator.username AS validator,
            k.nama_kategori AS kategori, ni.nama AS nama_icp, p.semester_id, 'pemberian' AS jenis
     FROM icp_pengajuan p
     LEFT JOIN mahasiswa m ON p.mahasiswa_id = m.id
     LEFT JOIN users pemberi ON p.pemberi_icp_id = pemberi.id
     LEFT JOIN users validator ON p.validated_by = validator.id
     LEFT JOIN kategori_icp k ON p.kategori_id = k.id
     LEFT JOIN nama_icp ni ON p.nama_icp_id = ni.id
     WHERE ${w1} ORDER BY p.created_at DESC LIMIT ?`, p1)

  const p2 = [actorId]; let w2 = "pt.validated_by = ?"
  if (semester_id) { w2 += " AND pt.semester_id = ?"; p2.push(semester_id) }
  p2.push(Number(limit))
  const [potongan] = await db.query(
    `SELECT pt.id, pt.jumlah_potong AS point, pt.status, pt.keterangan, pt.created_at,
            m.nama AS mahasiswa, m.nim, pengaju.username AS pengaju,
            validator.username AS validator,
            k.nama_kategori AS kategori, pt.semester_id, 'potongan' AS jenis
     FROM icp_potongan pt
     LEFT JOIN mahasiswa m ON pt.mahasiswa_id = m.id
     LEFT JOIN users pengaju ON pt.dipotong_oleh = pengaju.id
     LEFT JOIN users validator ON pt.validated_by = validator.id
     LEFT JOIN kategori_icp k ON pt.kategori_id = k.id
     WHERE ${w2} ORDER BY pt.created_at DESC LIMIT ?`, p2)

  return { pemberian, potongan }
}

const getRiwayatPengajuanSaya = async (actorId, { semester_id, limit = 100 } = {}) => {
  const p1 = [actorId]; let w1 = "p.pemberi_icp_id = ?"
  if (semester_id) { w1 += " AND p.semester_id = ?"; p1.push(semester_id) }
  p1.push(Number(limit))
  const [pemberian] = await db.query(
      `SELECT p.id, p.point, p.status, p.deskripsi, p.created_at, p.edited_at,
            m.nama AS mahasiswa, m.nim, k.nama_kategori AS kategori, ni.nama AS nama_icp,
            p.unit_id, un.nama_unit AS unit,
            p.target_admin_final_id,
            tv.username AS validator_tujuan,
            p.validated_by, vd.username AS divalidasi_oleh,
            p.alasan_tolak, p.semester_id, 'pemberian' AS jenis
      FROM icp_pengajuan p
      LEFT JOIN mahasiswa m ON p.mahasiswa_id = m.id
      LEFT JOIN kategori_icp k ON p.kategori_id = k.id
      LEFT JOIN nama_icp ni ON p.nama_icp_id = ni.id
      LEFT JOIN unit_organisasi un ON un.id = p.unit_id
      LEFT JOIN users tv ON p.target_admin_final_id = tv.id
      LEFT JOIN users vd ON p.validated_by = vd.id
      WHERE ${w1} ORDER BY p.created_at DESC LIMIT ?`, p1)

  const p2 = [actorId]; let w2 = "pt.dipotong_oleh = ?"
  if (semester_id) { w2 += " AND pt.semester_id = ?"; p2.push(semester_id) }
  p2.push(Number(limit))
  const [potongan] = await db.query(
    `SELECT pt.id, pt.jumlah_potong AS point, pt.status, pt.keterangan, pt.created_at, pt.edited_at,
            m.nama AS mahasiswa, m.nim, k.nama_kategori AS kategori,
            pt.target_admin_final_id,
            tv.username AS validator_tujuan,
            pt.validated_by, vd.username AS divalidasi_oleh,
            pt.alasan, pt.semester_id, 'potongan' AS jenis
     FROM icp_potongan pt
     LEFT JOIN mahasiswa m ON pt.mahasiswa_id = m.id
     LEFT JOIN kategori_icp k ON pt.kategori_id = k.id
     LEFT JOIN users tv ON pt.target_admin_final_id = tv.id
     LEFT JOIN users vd ON pt.validated_by = vd.id
     WHERE ${w2} ORDER BY pt.created_at DESC LIMIT ?`, p2)

  return { pemberian, potongan }
}

const getRiwayatTransaksi = async ({ semester_id, mahasiswa_id, source_type, limit = 200 } = {}) => {
  const where = []; const params = []
  if (semester_id) { where.push("t.semester_id = ?"); params.push(semester_id) }
  if (mahasiswa_id) { where.push("t.mahasiswa_id = ?"); params.push(mahasiswa_id) }
  if (source_type) { where.push("t.source_type = ?"); params.push(source_type) }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : ""
  params.push(Number(limit))
  const [rows] = await db.query(
    `SELECT t.id, t.mahasiswa_id, m.nama AS mahasiswa, m.nim,
            t.source_type, t.tipe, t.point, t.status, t.deskripsi,
            t.created_at, cu.username AS oleh, t.semester_id,
            k.nama_kategori AS kategori, ni.nama AS nama_icp
     FROM icp_transactions t
     LEFT JOIN mahasiswa m ON t.mahasiswa_id = m.id
     LEFT JOIN users cu ON t.created_by = cu.id
     LEFT JOIN kategori_icp k ON t.kategori_id = k.id
     LEFT JOIN nama_icp ni ON t.nama_icp_id = ni.id
     ${whereSql} ORDER BY t.created_at DESC LIMIT ?`, params)
  return rows
}

const getRiwayatPotonganAll = async ({ semester_id, status, limit = 200 } = {}) => {
  const where = []; const params = []
  if (semester_id) { where.push("pt.semester_id = ?"); params.push(semester_id) }
  if (status) { where.push("pt.status = ?"); params.push(status) }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : ""
  params.push(Number(limit))
  const [rows] = await db.query(
    `SELECT pt.id, pt.jumlah_potong AS point, pt.status, pt.keterangan,
            pt.kategori_pelanggaran, pt.created_at,
            m.nama AS mahasiswa, m.nim,
            k.nama_kategori AS kategori,
            pemotong.username AS pemotong, pemotong.role AS pemotong_role,
            validator.username AS validator,
            pt.semester_id, s.tahun_ajaran, s.semester
     FROM icp_potongan pt
     LEFT JOIN mahasiswa m ON pt.mahasiswa_id = m.id
     LEFT JOIN kategori_icp k ON pt.kategori_id = k.id
     LEFT JOIN users pemotong ON pt.dipotong_oleh = pemotong.id
     LEFT JOIN users validator ON pt.validated_by = validator.id
     LEFT JOIN semesters s ON pt.semester_id = s.id
     ${whereSql} ORDER BY pt.created_at DESC LIMIT ?`, params)
  return rows
}

const getRiwayatValidasiAll = async ({ semester_id, limit = 100 } = {}) => {
  const w1 = ["p.status IN ('approved','approved_final')"]; const p1 = []
  if (semester_id) { w1.push("p.semester_id = ?"); p1.push(semester_id) }
  p1.push(Number(limit))
  const [pemberian] = await db.query(
    `SELECT p.id, p.point, p.status, p.deskripsi, p.created_at, p.final_validated_at,
            m.nama AS mahasiswa, m.nim, pemberi.username AS pengaju,
            validator.username AS validator,
            k.nama_kategori AS kategori, ni.nama AS nama_icp, p.semester_id, 'pemberian' AS jenis
     FROM icp_pengajuan p
     LEFT JOIN mahasiswa m ON p.mahasiswa_id = m.id
     LEFT JOIN users pemberi ON p.pemberi_icp_id = pemberi.id
     LEFT JOIN users validator ON p.validated_by = validator.id
     LEFT JOIN kategori_icp k ON p.kategori_id = k.id
     LEFT JOIN nama_icp ni ON p.nama_icp_id = ni.id
     WHERE ${w1.join(" AND ")} ORDER BY p.created_at DESC LIMIT ?`, p1)

  const w2 = ["pt.status = 'approved'"]; const p2 = []
  if (semester_id) { w2.push("pt.semester_id = ?"); p2.push(semester_id) }
  p2.push(Number(limit))
  const [potongan] = await db.query(
    `SELECT pt.id, pt.jumlah_potong AS point, pt.status, pt.keterangan, pt.created_at,
            m.nama AS mahasiswa, m.nim, pengaju.username AS pengaju,
            validator.username AS validator,
            k.nama_kategori AS kategori, pt.semester_id, 'potongan' AS jenis
     FROM icp_potongan pt
     LEFT JOIN mahasiswa m ON pt.mahasiswa_id = m.id
     LEFT JOIN users pengaju ON pt.dipotong_oleh = pengaju.id
     LEFT JOIN users validator ON pt.validated_by = validator.id
     LEFT JOIN kategori_icp k ON pt.kategori_id = k.id
     WHERE ${w2.join(" AND ")} ORDER BY pt.created_at DESC LIMIT ?`, p2)

  return [...pemberian, ...potongan].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )
}

module.exports = {
  getRiwayatKegiatan,
  getRiwayatLogin,
  getRiwayatPemberianValidasi,
  getRiwayatMandiri,
  getRiwayatValidasi,
  getRiwayatPengajuanSaya,
  getRiwayatTransaksi,
  getRiwayatPotonganAll,
  getRiwayatValidasiAll
} 