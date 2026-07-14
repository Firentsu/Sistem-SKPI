const db = require("../../../shared/config/db")
const { logAudit } = require("../../audit/services/audit.service")

// EDIT pengajuan PEMBERIAN (icp_pengajuan) — saat pending
const editPemberian = async (id, edits, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query(
      `SELECT * FROM icp_pengajuan WHERE id = ? FOR UPDATE`, [id])
    if (!rows.length) throw new Error("Pengajuan tidak ditemukan")
    const p = rows[0]

    if (p.status !== "pending")
      throw new Error("Hanya pengajuan berstatus pending yang bisa diedit")

    // cek kepemilikan: pemberi (dosen/admin) ATAU mahasiswa pengaju
    const isPemberi = p.pemberi_icp_id && Number(p.pemberi_icp_id) === Number(actor.id)
    let isMahasiswaOwner = false
    if (!isPemberi) {
      const [m] = await conn.query(
        `SELECT id FROM mahasiswa WHERE id = ? AND user_id = ?`,
        [p.mahasiswa_id, actor.id])
      isMahasiswaOwner = m.length > 0
    }
    const isSuper = actor.role === "super_admin"
    if (!isPemberi && !isMahasiswaOwner && !isSuper)
      throw new Error("Anda tidak berhak mengedit pengajuan ini")

    // simpan nilai asli (sekali, jika belum)
    const saveOriginal = p.edited_by == null
    const newPoint = edits.point !== undefined ? Number(edits.point) : p.point
    const newKategori = edits.kategori_id !== undefined ? edits.kategori_id : p.kategori_id
    const newDesk = edits.deskripsi !== undefined ? edits.deskripsi : p.deskripsi
    if (!Number.isInteger(newPoint) || newPoint <= 0)
      throw new Error("point harus integer > 0")
    if (edits.kategori_id !== undefined && edits.kategori_id) {
      const [k] = await conn.query(`SELECT id FROM kategori_icp WHERE id=?`, [edits.kategori_id])
      if (!k.length) throw new Error("Kategori tidak ditemukan")
    }

    await conn.query(
      `UPDATE icp_pengajuan SET
        point = ?, kategori_id = ?, deskripsi = ?,
        edited_by = ?, edited_at = NOW()
        ${saveOriginal ? ", original_point = point, original_kategori_id = kategori_id, original_deskripsi = deskripsi" : ""}
       WHERE id = ?`,
      [newPoint, newKategori, newDesk, actor.id, id])

    await logAudit({ user_id: actor.id, role: actor.role, action: "SELF_EDIT_PEMBERIAN",
      target_table: "icp_pengajuan", target_id: id,
      detail: { point: newPoint, kategori_id: newKategori }, conn })
    await conn.commit()
    return { id, status: "pending", edited: true }
  } catch (err) {
    await conn.rollback(); throw err
  } finally { conn.release() }
}

// EDIT pengajuan POTONGAN (icp_potongan) — saat pending
const editPotongan = async (id, edits, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query(
      `SELECT * FROM icp_potongan WHERE id = ? FOR UPDATE`, [id])
    if (!rows.length) throw new Error("Potongan tidak ditemukan")
    const p = rows[0]
    if (p.status !== "pending")
      throw new Error("Hanya potongan berstatus pending yang bisa diedit")

    const isOwner = p.dipotong_oleh && Number(p.dipotong_oleh) === Number(actor.id)
    const isSuper = actor.role === "super_admin"
    if (!isOwner && !isSuper)
      throw new Error("Anda tidak berhak mengedit potongan ini")

    const saveOriginal = p.edited_by == null
    const newJumlah = edits.jumlah_potong !== undefined ? Number(edits.jumlah_potong) : p.jumlah_potong
    const newKategori = edits.kategori_id !== undefined ? edits.kategori_id : p.kategori_id
    const newKet = edits.keterangan !== undefined ? edits.keterangan : p.keterangan
    if (!Number.isInteger(newJumlah) || newJumlah <= 0)
      throw new Error("jumlah_potong harus integer > 0")
    if (edits.kategori_id !== undefined && edits.kategori_id) {
      const [k] = await conn.query(`SELECT id FROM kategori_icp WHERE id=?`, [edits.kategori_id])
      if (!k.length) throw new Error("Kategori tidak ditemukan")
    }

    await conn.query(
      `UPDATE icp_potongan SET
        jumlah_potong = ?, kategori_id = ?, keterangan = ?,
        edited_by = ?, edited_at = NOW()
        ${saveOriginal ? ", original_jumlah_potong = jumlah_potong, original_kategori_id = kategori_id, original_keterangan = keterangan" : ""}
       WHERE id = ?`,
      [newJumlah, newKategori, newKet, actor.id, id])

    await logAudit({ user_id: actor.id, role: actor.role, action: "SELF_EDIT_POTONGAN",
      target_table: "icp_potongan", target_id: id,
      detail: { jumlah_potong: newJumlah, kategori_id: newKategori }, conn })
    await conn.commit()
    return { id, status: "pending", edited: true }
  } catch (err) {
    await conn.rollback(); throw err
  } finally { conn.release() }
}

module.exports = { editPemberian, editPotongan }
