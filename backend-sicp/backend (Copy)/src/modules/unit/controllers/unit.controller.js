const service = require("../services/unit.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const parseId = (id) => {
  const num = Number(id)
  if (isNaN(num)) throw new Error("ID tidak valid")
  return num
}

const validateUser = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error("User tidak valid")
  }
}

const safeError = (err) => err?.message || "Terjadi kesalahan"

// ===============================
const create = async (req, res) => {
  try {
    validateUser(req)

    const payload = {
      nama_unit: req.body.nama_unit,
      deskripsi: req.body.deskripsi
    }

    const data = await service.createUnit(payload)

    return success(res, data, "Unit berhasil dibuat")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

// ===============================
const getAll = async (req, res) => {
  try {
    validateUser(req)

    const data = await service.getUnits()

    return success(res, data)

  } catch (err) {
    return fail(res, safeError(err))
  }
}

// ===============================
const update = async (req, res) => {
  try {
    validateUser(req)

    const id = parseId(req.params.id)

    const payload = {
      nama_unit: req.body.nama_unit,
      deskripsi: req.body.deskripsi
    }

    const data = await service.updateUnit(id, payload)

    return success(res, data, "Unit berhasil diupdate")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

// ===============================
const remove = async (req, res) => {
  try {
    validateUser(req)

    const id = parseId(req.params.id)

    const data = await service.deleteUnit(id)

    return success(res, data, "Unit berhasil dihapus")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

module.exports = {
  create,
  getAll,
  update,
  remove
}