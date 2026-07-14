const service = require("../services/roleManagement.service")
const { success, fail } = require("../../../shared/utils/response")

// ============================================================================
// roleManagement.controller.js — kelola peran ganda & akses super (Super Admin)
// ============================================================================

const validId = (id) => {
  if (!id || isNaN(Number(id))) throw new Error("ID tidak valid")
  return Number(id)
}

// GET /api/role-management/access-keys
const getAccessKeys = async (req, res) => {
  try {
    return success(res, { access_keys: service.ACCESS_KEYS })
  } catch (err) {
    return fail(res, err.message)
  }
}

// GET /api/role-management/users/:id
const getUserAuthDetail = async (req, res) => {
  try {
    const id = validId(req.params.id)
    const data = await service.getUserAuthDetail(id)
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// POST /api/role-management/users/:id/roles  body: { role }
const grantRole = async (req, res) => {
  try {
    const id = validId(req.params.id)
    const { role, profile } = req.body
    if (!role) throw new Error("role wajib diisi")
    const data = await service.grantRole(id, role, req.user, profile || {})
    return success(res, data, "Role berhasil ditambahkan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// DELETE /api/role-management/users/:id/roles/:role
const revokeRole = async (req, res) => {
  try {
    const id = validId(req.params.id)
    const { role } = req.params
    if (!role) throw new Error("role wajib diisi")
    const data = await service.revokeRole(id, role, req.user)
    return success(res, data, "Role berhasil dicabut")
  } catch (err) {
    return fail(res, err.message)
  }
}

// POST /api/role-management/users/:id/access  body: { access_key }
const grantAccess = async (req, res) => {
  try {
    const id = validId(req.params.id)
    const { access_key } = req.body
    if (!access_key) throw new Error("access_key wajib diisi")
    const data = await service.grantAccess(id, access_key, req.user)
    return success(res, data, "Akses super berhasil diberikan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// DELETE /api/role-management/users/:id/access/:access_key
const revokeAccess = async (req, res) => {
  try {
    const id = validId(req.params.id)
    const { access_key } = req.params
    if (!access_key) throw new Error("access_key wajib diisi")
    const data = await service.revokeAccess(id, access_key, req.user)
    return success(res, data, "Akses super berhasil dicabut")
  } catch (err) {
    return fail(res, err.message)
  }
}


// ★ PUT /api/role-management/users/:id/access  body: { access_keys: [...] }
//   REV2 UNIFIED — replace semua akses sekaligus
const setUserAccess = async (req, res) => {
  try {
    const id = validId(req.params.id)
    const { access_keys } = req.body
    const data = await service.setUserAccess(id, access_keys, req.user)
    return success(res, data, "Akses super berhasil di-set")
  } catch (err) {
    return fail(res, err.message)
  }
}


// POST /api/role-management/users/:id/access  (REV3 — BULK)
//   body: { access_keys: ["validasi_final", "kelola_kegiatan", ...], mode?: "append"|"replace" }
const grantAccessBulk = async (req, res) => {
  try {
    const id = validId(req.params.id)
    let { access_keys, access_key, mode } = req.body
    // Backward compat: kalau client masih kirim "access_key" (singular string), normalisasi jadi array
    if (!access_keys && access_key) access_keys = [access_key]
    if (!access_keys) throw new Error("access_keys (array) wajib diisi")
    const data = await service.grantAccessBulk(id, access_keys, req.user, mode || "append")
    return success(res, data, "Akses super berhasil diperbarui")
  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  getAccessKeys,
  getUserAuthDetail,
  grantRole,
  revokeRole,
  grantAccess: grantAccessBulk,
  grantAccessBulk,
  revokeAccess,
  setUserAccess
}
