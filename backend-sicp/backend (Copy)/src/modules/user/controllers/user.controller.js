const userService = require("../services/user.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const parseId = (id) => {
  const num = Number(id)
  if (isNaN(num)) throw new Error("ID tidak valid")
  return num
}

const validateUser = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error("Unauthorized")
  }
}

const requireAdmin = (req) => {
  if (!["admin", "super_admin"].includes(req.user.role)) {
    throw new Error("Akses ditolak")
  }
}

// ===============================
const getAllUsers = async (req, res) => {
  try {
    validateUser(req)
    requireAdmin(req)

    const data = await userService.getAllUsers()
    return success(res, data)

  } catch (err) {
    return fail(res, err.message, 403)
  }
}

// ===============================
const getProfile = async (req, res) => {
  try {
    validateUser(req)

    const data = await userService.getProfile(req.user.id)
    return success(res, data)

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const updateMyProfile = async (req, res) => {
  try {
    validateUser(req)

    if (req.user.role !== "mahasiswa") {
      return fail(res, "Hanya mahasiswa yang bisa update profile", 403)
    }

    const payload = {
      nama: req.body.nama,
      tanggal_lahir: req.body.tanggal_lahir,
      motto: req.body.motto,
      foto: req.body.foto
    }

    const result = await userService.updateMyProfile(req.user, payload)

    return success(res, result, "Profile berhasil diperbarui")

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const createUser = async (req, res) => {
  try {
    validateUser(req)
    requireAdmin(req)

    let { username, password, role, profile } = req.body

    if (!username || !password || !role) {
      return fail(res, "username, password, dan role wajib diisi", 400)
    }

    username = String(username).trim().toLowerCase()

    const result = await userService.createUser({
      username,
      password,
      role,
      profile: profile || {},
      createdBy: req.user.id
    })

    return success(res, result, "User berhasil dibuat")

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const updateUser = async (req, res) => {
  try {
    validateUser(req)
    requireAdmin(req)

    const id = parseId(req.params.id)

    if (id === req.user.id) {
      return fail(res, "Tidak bisa mengubah diri sendiri", 400)
    }

    const payload = {}

    if (req.body.username) {
      payload.username = String(req.body.username).trim().toLowerCase()
    }

    if (req.body.role) {
      if (req.user.role !== "super_admin") {
        return fail(res, "Tidak boleh mengubah role", 403)
      }
      payload.role = req.body.role
    }

    if (req.body.status) {
      payload.status = req.body.status
    }

    const result = await userService.updateUser(id, payload, req.user)

    return success(res, result)

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const deactivateUser = async (req, res) => {
  try {
    validateUser(req)
    requireAdmin(req)

    const id = parseId(req.params.id)

    if (id === req.user.id) {
      return fail(res, "Tidak bisa menonaktifkan diri sendiri", 400)
    }

    const result = await userService.deactivateUser(id, req.user)

    return success(res, result, "Status user → nonaktif")

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
const deleteUser = async (req, res) => {
  try {
    validateUser(req)

    if (req.user.role !== "super_admin") {
      return fail(res, "Akses ditolak", 403)
    }

    const id = parseId(req.params.id)

    if (id === req.user.id) {
      return fail(res, "Tidak bisa menghapus diri sendiri", 400)
    }

    const result = await userService.deleteUser(id, req.user)

    return success(res, result)

  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// 🔥 REFACTORED — TIER 3: ADMIN TOGGLE ACCESS KELOLA KEGIATAN
// Sekarang FULL DELEGATE ke service (zero raw SQL di controller)
const updateAccessKelolaKegiatan = async (req, res) => {
  try {
    validateUser(req)

    if (req.user.role !== "super_admin") {
      return fail(res, "Hanya super admin yang dapat mengatur akses", 403)
    }

    const id = parseId(req.params.id)

    const { enabled } = req.body

    if (typeof enabled !== "boolean") {
      return fail(res, "enabled harus boolean", 400)
    }

    const result = await userService.toggleAccessKelolaKegiatan(
      id,
      enabled,
      req.user
    )

    return success(
      res,
      result,
      enabled
        ? "Akses kelola kegiatan berhasil diaktifkan"
        : "Akses kelola kegiatan berhasil dinonaktifkan"
    )

  } catch (err) {
    return fail(res, err.message)
  }
}

// POIN 1: daftar user per role
const getUsersByRole = async (req, res) => {
  try {
    const data = await userService.getUsersByRole(String(req.params.role || "").toLowerCase())
    return success(res, data, "Daftar user")
  } catch (err) { return fail(res, err.message) }
}

// POIN 1: profil lengkap user (semua role)
const getFullProfile = async (req, res) => {
  try {
    const data = await userService.getFullProfile(parseId(req.params.id))
    return success(res, data, "Profil lengkap")
  } catch (err) { return fail(res, err.message) }
}

// POIN 4: daftar calon anggota unit (tanpa mahasiswa)
const getEligibleUnitMembers = async (req, res) => {
  try {
    const data = await userService.getEligibleUnitMembers()
    return success(res, data, "Calon anggota unit (tanpa mahasiswa)")
  } catch (err) { return fail(res, err.message) }
}


// POIN 6: aktifkan kembali user
const reactivateUser = async (req, res) => {
  try {
    validateUser(req); requireAdmin(req)
    const result = await userService.reactivateUser(parseId(req.params.id), req.user)
    return success(res, result, "User diaktifkan kembali")
  } catch (err) { return fail(res, err.message) }
}


// ============================================================
// CREATE USER PER ROLE (endpoint terpisah, body lengkap per role)
// ============================================================
const _createByRole = (role) => async (req, res) => {
  try {
    validateUser(req); requireAdmin(req)
    const { username, password, ...rest } = req.body
    if (!username || !password) return fail(res, "username & password wajib", 400)
    // profile bisa dikirim nested {profile:{}} atau flat di body
    const profile = req.body.profile || rest
    const result = await userService.createUser({
      username, password, role, profile, createdBy: req.user.id
    })
    return success(res, result, `User ${role} berhasil dibuat`)
  } catch (err) { return fail(res, err.message) }
}
const createMahasiswa  = _createByRole("mahasiswa")
const createDosen      = _createByRole("dosen")
const createAdmin      = _createByRole("admin")
const createSuperAdmin = _createByRole("super_admin")

// POIN 1: Super admin update PROFIL user lain (per role, field lengkap)
const updateUserProfile = async (req, res) => {
  try {
    validateUser(req); requireAdmin(req)
    const id = parseId(req.params.id)
    const result = await userService.updateUserProfile(id, req.body || {}, req.user)
    return success(res, result, "Profil user diperbarui")
  } catch (err) { return fail(res, err.message) }
}


// POIN 2: set status eksplisit (body: { status: "aktif"|"nonaktif" })
const setUserStatus = async (req, res) => {
  try {
    validateUser(req); requireAdmin(req)
    const id = parseId(req.params.id)
    const result = await userService.setUserStatus(id, req.body.status, req.user)
    return success(res, result, `Status user → ${req.body.status}`)
  } catch (err) { return fail(res, err.message) }
}


// SA#1: update username (user lain / diri sendiri)
const updateUsername = async (req, res) => {
  try {
    validateUser(req); requireAdmin(req)
    const id = parseId(req.params.id)
    const result = await userService.updateUsername(id, req.body.username, req.user)
    return success(res, result, "Username diperbarui")
  } catch (err) { return fail(res, err.message) }
}

// SA#2: update password (user lain / diri sendiri)
const updatePassword = async (req, res) => {
  try {
    validateUser(req); requireAdmin(req)
    const id = parseId(req.params.id)
    const result = await userService.updatePassword(id, req.body.password, req.user)
    return success(res, result, "Password diperbarui")
  } catch (err) { return fail(res, err.message) }
}

module.exports = {
  updatePassword,
  updateUsername,
  setUserStatus,
  createMahasiswa,
  createDosen,
  createAdmin,
  createSuperAdmin,
  updateUserProfile,

  reactivateUser,
  getUsersByRole,
  getFullProfile,
  getEligibleUnitMembers,
  getAllUsers,
  getProfile,
  updateMyProfile,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  updateAccessKelolaKegiatan
} 