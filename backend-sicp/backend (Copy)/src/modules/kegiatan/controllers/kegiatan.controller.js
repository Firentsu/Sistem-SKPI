const service = require("../services/kegiatan.service")
const { success, fail } = require("../../../shared/utils/response")

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

// ===============================
const createKegiatan = async (req, res) => {
  try {
    validateUser(req)
    const result = await service.createKegiatan(req.body, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

const getAllKegiatan = async (req, res) => {
  try {
    const semesterId = req.query.semester_id || null
    const includeHidden = String(req.query.include_hidden || "").toLowerCase() === "true"
    const data = await service.getAllKegiatan(semesterId, includeHidden)
    return success(res, data)
  } catch (err) { return fail(res, err.message) }
}

// ===============================
const sembunyikanKegiatan = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.hideKegiatan(id, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

const tampilkanKegiatan = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.unhideKegiatan(id, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

// ===============================
const dibukaPendaftaran = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.dibukaPendaftaran(id, req.user, req.body || {})
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

//tutup pendaftaran
const tutupPendaftaran = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.tutupPendaftaran(id, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

// ===============================
const mulaiKegiatan = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.mulaiKegiatan(id, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

// ===============================
const selesaiKegiatan = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.selesaiKegiatan(id, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

// ===============================
const batalkanKegiatan = async (req, res) => {
  try {
    validateUser(req)
    const id = parseId(req.params.id)
    const result = await service.batalkanKegiatan(id, req.user)
    return success(res, result)
  } catch (err) { return fail(res, err.message) }
}

const getKegiatanById = async (req, res) => {
  try { return success(res, await service.getKegiatanById(req.params.id), "Detail kegiatan") }
  catch (err) { return fail(res, err.message) }
}
const updateKegiatan = async (req, res) => {
  try { return success(res, await service.updateKegiatan(req.params.id, req.body, req.user), "Kegiatan diperbarui") }
  catch (err) { return fail(res, err.message) }
}
const deleteKegiatan = async (req, res) => {
  try { return success(res, await service.deleteKegiatan(req.params.id, req.user), "Kegiatan dihapus") }
  catch (err) { return fail(res, err.message) }
}

module.exports = {
  deleteKegiatan,
  updateKegiatan,
  getKegiatanById,
  createKegiatan,
  getAllKegiatan,
  dibukaPendaftaran,
  tutupPendaftaran,
  mulaiKegiatan,
  selesaiKegiatan,
  batalkanKegiatan,
  sembunyikanKegiatan,
  tampilkanKegiatan
}
