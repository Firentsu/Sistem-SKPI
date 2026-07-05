const db = require("../../../shared/config/db")
const model = require("../models/unit.model")
const validator = require("../../../shared/utils/validator")

// ===============================
const normalize = (val) => {
  if (typeof val !== "string") return val
  return val.trim()
}

// ===============================
const createUnit = async (data, conn = null) => {
  const connection = conn || await db.getConnection()
  const external = !!conn

  try {
    if (!external) await connection.beginTransaction()

    let { nama_unit, deskripsi } = data

    validator.required(nama_unit, "nama_unit")

    nama_unit = normalize(nama_unit)
    deskripsi = normalize(deskripsi)

    const exist = await model.findByName(nama_unit, connection)
    if (exist) {
      throw new Error("Unit sudah ada")
    }

    const id = await model.insertUnit(
      { nama_unit, deskripsi },
      connection
    )

    if (!external) await connection.commit()

    return {
      id,
      nama_unit,
      deskripsi: deskripsi || null
    }

  } catch (err) {
    if (!external) await connection.rollback()
    throw err
  } finally {
    if (!external) connection.release()
  }
}

// ===============================
const getUnits = async (conn = null) => {
  const rows = await model.findAllUnits(conn)

  return rows.map(u => ({
    id: u.id,
    nama_unit: u.nama_unit,
    deskripsi: u.deskripsi
  }))
}

// ===============================
const updateUnit = async (id, data, conn = null) => {
  const connection = conn || await db.getConnection()
  const external = !!conn

  try {
    if (!external) await connection.beginTransaction()

    validator.required(id, "id")

    const exist = await model.findById(id, connection)
    if (!exist) {
      throw new Error("Unit tidak ditemukan")
    }

    let { nama_unit, deskripsi } = data

    if (nama_unit) {
      nama_unit = normalize(nama_unit)

      const duplicate = await model.findByName(nama_unit, connection)
      if (duplicate && Number(duplicate.id) !== Number(id)) {
        throw new Error("Nama unit sudah digunakan")
      }
    }

    await model.updateUnit(id, { nama_unit, deskripsi }, connection)

    if (!external) await connection.commit()

    return { id }

  } catch (err) {
    if (!external) await connection.rollback()
    throw err
  } finally {
    if (!external) connection.release()
  }
}

// ===============================
const deleteUnit = async (id, conn = null) => {
  const connection = conn || await db.getConnection()
  const external = !!conn

  try {
    if (!external) await connection.beginTransaction()

    validator.required(id, "id")

    const exist = await model.findById(id, connection)
    if (!exist) {
      throw new Error("Unit tidak ditemukan")
    }

    const used = await model.isUnitUsed(id, connection)

    if (used) {
      throw new Error("Unit sedang digunakan oleh kegiatan")
    }

    await model.deleteUnit(id, connection)

    if (!external) await connection.commit()

    return { id }

  } catch (err) {
    if (!external) await connection.rollback()
    throw err
  } finally {
    if (!external) connection.release()
  }
}

module.exports = {
  createUnit,
  getUnits,
  updateUnit,
  deleteUnit
} 