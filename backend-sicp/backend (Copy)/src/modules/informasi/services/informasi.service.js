const fs = require("fs")
const path = require("path")
const db = require("../../../shared/config/db")
const model = require("../models/informasi.model")
const { logAudit } = require("../../audit/services/audit.service")

// ============================================================================
// informasi.service.js
// ----------------------------------------------------------------------------
// Bisnis logic kelola informasi kampus oleh Super Admin.
// - create / update / hide / publish / delete (soft)
// - foto disimpan di src/uploads/informasi via upload.middleware
// - update / delete membersihkan foto lama dari disk setelah commit
// ============================================================================

// Helper: hapus file fisik (best effort).
const removeFoto = (foto_path) => {
  if (!foto_path) return
  try {
    const abs = path.isAbsolute(foto_path)
      ? foto_path
      : path.join(process.cwd(), foto_path)
    if (fs.existsSync(abs)) fs.unlinkSync(abs)
  } catch (err) {
    console.error("[INFORMASI removeFoto]", err.message)
  }
}

// ===============================
// LIST publik (untuk semua user login) — hanya status=published
const getInformasi = async () => {
  return await model.findPublic()
}

// LIST untuk Super Admin (semua status kecuali deleted, atau filter status)
const listForAdmin = async (filter = {}) => {
  return await model.findAll(filter)
}

const getDetail = async (id) => {
  const row = await model.findById(id)
  if (!row || row.status === "deleted") {
    throw new Error("Informasi tidak ditemukan")
  }
  return row
}

// ===============================
// CREATE
const create = async ({ judul, deskripsi, foto_path }, actor) => {
  if (!judul || !String(judul).trim()) throw new Error("judul wajib diisi")
  if (!deskripsi || !String(deskripsi).trim()) throw new Error("deskripsi wajib diisi")

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const id = await model.insert({
      judul: String(judul).trim(),
      deskripsi: String(deskripsi).trim(),
      foto_path: foto_path || null,
      created_by: actor.id
    }, conn)

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "CREATE_INFORMASI_KAMPUS",
      target_table: "informasi_kampus",
      target_id: id,
      detail: { judul, foto_path },
      conn
    })

    await conn.commit()
    return { id, status: "published" }
  } catch (err) {
    await conn.rollback()
    if (foto_path) removeFoto(foto_path)   // orphan-file cleanup
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// UPDATE
const update = async (id, { judul, deskripsi, foto_path }, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const before = await model.findById(id, conn)
    if (!before || before.status === "deleted") {
      throw new Error("Informasi tidak ditemukan")
    }

    const fields = {}
    if (judul !== undefined) {
      if (!String(judul).trim()) throw new Error("judul tidak boleh kosong")
      fields.judul = String(judul).trim()
    }
    if (deskripsi !== undefined) {
      if (!String(deskripsi).trim()) throw new Error("deskripsi tidak boleh kosong")
      fields.deskripsi = String(deskripsi).trim()
    }
    if (foto_path !== undefined) {
      fields.foto_path = foto_path || null
    }

    if (!Object.keys(fields).length) throw new Error("Tidak ada perubahan")

    const ok = await model.updateById(id, fields, conn)
    if (!ok) throw new Error("Update gagal")

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "UPDATE_INFORMASI_KAMPUS",
      target_table: "informasi_kampus",
      target_id: id,
      detail: { changes: Object.keys(fields) },
      conn
    })

    await conn.commit()

    // Hapus foto lama HANYA setelah commit sukses & foto benar-benar diganti.
    if (
      fields.foto_path !== undefined &&
      before.foto_path &&
      before.foto_path !== fields.foto_path
    ) {
      removeFoto(before.foto_path)
    }

    return { id, updated: Object.keys(fields) }
  } catch (err) {
    await conn.rollback()
    if (foto_path) removeFoto(foto_path)   // foto baru yg upload tp DB gagal
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// HIDE / PUBLISH
const setVisibility = async (id, visible, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const row = await model.findById(id, conn)
    if (!row || row.status === "deleted") {
      throw new Error("Informasi tidak ditemukan")
    }

    const target = visible ? "published" : "hidden"
    if (row.status === target) throw new Error(`Status sudah ${target}`)

    const ok = await model.setStatus(id, target, conn)
    if (!ok) throw new Error("Update status gagal")

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: visible ? "PUBLISH_INFORMASI_KAMPUS" : "HIDE_INFORMASI_KAMPUS",
      target_table: "informasi_kampus",
      target_id: id,
      detail: { from: row.status, to: target },
      conn
    })

    await conn.commit()
    return { id, status: target }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// SOFT DELETE
const remove = async (id, actor) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const row = await model.findById(id, conn)
    if (!row || row.status === "deleted") {
      throw new Error("Informasi tidak ditemukan")
    }

    const ok = await model.softDelete(id, conn)
    if (!ok) throw new Error("Delete gagal")

    await logAudit({
      user_id: actor.id,
      role: actor.role,
      action: "DELETE_INFORMASI_KAMPUS",
      target_table: "informasi_kampus",
      target_id: id,
      detail: { judul: row.judul },
      conn
    })

    await conn.commit()

    if (row.foto_path) removeFoto(row.foto_path)

    return { id, status: "deleted" }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  getInformasi,
  listForAdmin,
  getDetail,
  create,
  update,
  setVisibility,
  remove
}
