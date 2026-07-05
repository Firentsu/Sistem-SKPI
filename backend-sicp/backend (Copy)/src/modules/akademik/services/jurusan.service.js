const db = require("../../../shared/config/db")
const model = require("../models/jurusan.model")
const { logAudit } = require("../../audit/services/audit.service")

const getAll = async () => {
  const [rows] = await model.getAll()
  return rows
}

const create = async (data, user) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    if (!data.nama_jurusan) {
      throw new Error("nama_jurusan wajib")
    }
    if (data.warna && !/^#[0-9a-fA-F]{6}$/.test(data.warna)) {
      throw new Error("warna harus format hex, contoh #2563eb")
    }

    const id = await model.insert(data, conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "CREATE_JURUSAN",
      target_table: "jurusan",
      target_id: id,
      detail: data,
      conn
    })

    await conn.commit()
    return { id }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const update = async (id, data, user) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const exist = await model.findById(id, conn)
    if (!exist) throw new Error("Jurusan tidak ditemukan")

    await model.update(id, data, conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "UPDATE_JURUSAN",
      target_table: "jurusan",
      target_id: id,
      detail: data,
      conn
    })

    await conn.commit()
    return { id }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const remove = async (id, user) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await model.remove(id, conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "DELETE_JURUSAN",
      target_table: "jurusan",
      target_id: id,
      conn
    })

    await conn.commit()
    return { id }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove
} 