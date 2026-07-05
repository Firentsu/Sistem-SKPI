const db = require("../../../shared/config/db")

const createDivisi = async (payload, user) => {
  const { kegiatan_id, nama_divisi, kuota, co_mahasiswa_id, link_grup } = payload
  if (!kegiatan_id) throw new Error("kegiatan_id wajib")
  if (!nama_divisi) throw new Error("nama_divisi wajib")
  const [result] = await db.query(
    `INSERT INTO divisi_kegiatan (kegiatan_id, nama_divisi, kuota, co_mahasiswa_id, link_grup)
     VALUES (?, ?, ?, ?, ?)`,
    [kegiatan_id, nama_divisi, kuota || 0, co_mahasiswa_id || null, link_grup || null])
  return { id: result.insertId }
}

// LIST divisi per kegiatan (atau semua bila tanpa filter)
const getDivisi = async ({ kegiatan_id } = {}) => {
  const params = []; let where = ""
  if (kegiatan_id) { where = "WHERE d.kegiatan_id = ?"; params.push(kegiatan_id) }
  const [rows] = await db.query(
    `SELECT d.id, d.kegiatan_id, d.nama_divisi, d.kuota, d.co_mahasiswa_id, d.link_grup,
            k.nama_kegiatan, m.nama AS co_nama
     FROM divisi_kegiatan d
     LEFT JOIN kegiatan k ON d.kegiatan_id = k.id
     LEFT JOIN mahasiswa m ON d.co_mahasiswa_id = m.id
     ${where} ORDER BY d.id DESC`, params)
  return rows
}

const getDivisiById = async (id) => {
  const [rows] = await db.query(
    `SELECT d.*, k.nama_kegiatan, m.nama AS co_nama
     FROM divisi_kegiatan d
     LEFT JOIN kegiatan k ON d.kegiatan_id = k.id
     LEFT JOIN mahasiswa m ON d.co_mahasiswa_id = m.id
     WHERE d.id = ?`, [id])
  if (!rows.length) throw new Error("Divisi tidak ditemukan")
  return rows[0]
}

const updateDivisi = async (id, payload, user) => {
  const [exist] = await db.query("SELECT id FROM divisi_kegiatan WHERE id=?", [id])
  if (!exist.length) throw new Error("Divisi tidak ditemukan")
  const fields = []; const vals = []
  for (const col of ["nama_divisi", "kuota", "co_mahasiswa_id", "link_grup"]) {
    if (payload[col] !== undefined) { fields.push(`${col}=?`); vals.push(payload[col]) }
  }
  if (!fields.length) throw new Error("Tidak ada data untuk diupdate")
  vals.push(id)
  await db.query(`UPDATE divisi_kegiatan SET ${fields.join(", ")} WHERE id=?`, vals)
  return { id, updated: true }
}

const deleteDivisi = async (id, user) => {
  const [exist] = await db.query("SELECT id FROM divisi_kegiatan WHERE id=?", [id])
  if (!exist.length) throw new Error("Divisi tidak ditemukan")
  // cegah hapus bila ada panitia terdaftar di divisi ini
  const [used] = await db.query(
    "SELECT COUNT(*) AS total FROM panitia_kegiatan WHERE divisi_id=?", [id])
  if (used[0].total > 0)
    throw new Error("Divisi tidak bisa dihapus — masih ada panitia terdaftar")
  await db.query("DELETE FROM divisi_kegiatan WHERE id=?", [id])
  return { id, deleted: true }
}

module.exports = { createDivisi, getDivisi, getDivisiById, updateDivisi, deleteDivisi }
