const db = require("../../../shared/config/db")

// ===============================
// DAFTAR PANITIA
const daftar = async (payload, user) => {
  if (!user.mahasiswa_id) {
    throw new Error("Hanya mahasiswa yang bisa daftar")
  }

  const { divisi_id } = payload
  if (!divisi_id) throw new Error("divisi_id wajib")

  // ❌ Cegah duplicate daftar
  const [exist] = await db.query(
    `SELECT id FROM pendaftaran_panitia
     WHERE mahasiswa_id = ? AND divisi_id = ?`,
    [user.mahasiswa_id, divisi_id]
  )

  if (exist.length) {
    throw new Error("Sudah pernah daftar di divisi ini")
  }

  const [result] = await db.query(
    `INSERT INTO pendaftaran_panitia
     (mahasiswa_id, divisi_id, status)
     VALUES (?, ?, 'pending')`,
    [user.mahasiswa_id, divisi_id]
  )

  return { id: result.insertId }
}

// ===============================
// APPROVE PANITIA
const approve = async (id, user) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [[data]] = await conn.query(
      `SELECT pp.*, dk.kegiatan_id
       FROM pendaftaran_panitia pp
       JOIN divisi_kegiatan dk ON dk.id = pp.divisi_id
       WHERE pp.id = ?`,
      [id]
    )

    if (!data) throw new Error("Data tidak ditemukan")

    // ❌ Cegah double approve
    const [exist] = await conn.query(
      `SELECT id FROM panitia_kegiatan
       WHERE mahasiswa_id = ?
       AND divisi_id = ?
       AND kegiatan_id = ?
       AND removed_at IS NULL`,
      [data.mahasiswa_id, data.divisi_id, data.kegiatan_id]
    )

    if (exist.length) {
      throw new Error("Mahasiswa sudah menjadi panitia")
    }

    // UPDATE STATUS PENDAFTARAN
    await conn.query(
      `UPDATE pendaftaran_panitia
       SET status = 'approved'
       WHERE id = ?`,
      [id]
    )

    // INSERT PANITIA
    const [insert] = await conn.query(
      `INSERT INTO panitia_kegiatan
       (kegiatan_id, divisi_id, mahasiswa_id, status)
       VALUES (?, ?, ?, 'approved')`,
      [data.kegiatan_id, data.divisi_id, data.mahasiswa_id]
    )

    // 🔥 LOG
    await conn.query(
      `INSERT INTO panitia_logs
       (panitia_id, aksi, actor_id, keterangan)
       VALUES (?, 'approve', ?, ?)`,
      [
        insert.insertId,
        user.id,
        "Approve pendaftaran panitia"
      ]
    )

    await conn.commit()

    return { id: insert.insertId }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// REJECT PANITIA
const reject = async (id, user) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [[data]] = await conn.query(
      `SELECT * FROM pendaftaran_panitia WHERE id = ?`,
      [id]
    )

    if (!data) throw new Error("Data tidak ditemukan")

    await conn.query(
      `UPDATE pendaftaran_panitia
       SET status = 'rejected'
       WHERE id = ?`,
      [id]
    )

    await conn.commit()

    return { success: true }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  daftar,
  approve,
  reject
} 