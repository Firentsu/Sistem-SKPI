const panitiaService = require("../services/panitia.service")
const { success, fail } = require("../../../shared/utils/response")

// ============================================================================
// panitia.controller.js  (FINAL — Legacy Cleanup)
// ----------------------------------------------------------------------------
// FINAL CLEANUP:
//   - Helper hasKelolaKegiatan(user) sekarang HANYA membaca dari sumber baru:
//     • roles includes "super_admin"  → bypass
//     • req.user.access.kelola_kegiatan === true (tabel admin_access)
//   - Field legacy req.user.access_kelola_kegiatan SUDAH DIHAPUS.
//
// Untuk endpoint yang DIRESERVASI oleh route guard accessSuper("kelola_kegiatan")
// helper ini sebenarnya redundan, namun tetap dipakai untuk endpoint
// dual-actor (approve/reject/setLinkGroup) yang juga dapat dipanggil mahasiswa CO.
// ============================================================================

const getRoles = (user) =>
  Array.isArray(user?.roles) && user.roles.length
    ? user.roles
    : [user?.role].filter(Boolean)

const hasKelolaKegiatan = (user) => {
  if (!user) return false
  const roles = getRoles(user)
  if (roles.includes("super_admin")) return true
  return !!(user.access && user.access.kelola_kegiatan)
}

const isStaff = (user) => {
  const roles = getRoles(user)
  return roles.includes("admin") || roles.includes("super_admin")
}

// ===============================
exports.getAllPanitia = async (req, res) => {
  try {
    const data = await panitiaService.getAllPanitia()
    return success(res, data, "Daftar panitia")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
exports.daftarPanitia = async (req, res) => {
  try {
    const result = await panitiaService.daftarPanitia(req.body, req.user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// APPROVE — dual-actor:
//   • staff (admin/super_admin) dengan akses kelola_kegiatan
//   • mahasiswa yang merupakan CO divisi terkait
exports.approvePanitia = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const user = req.user

    if (isStaff(user)) {
      if (!hasKelolaKegiatan(user)) {
        throw new Error("Admin tidak memiliki akses kelola kegiatan")
      }
    } else if (user.role === "mahasiswa") {
      await panitiaService.validateCO(id, user)
    } else {
      throw new Error("Akses ditolak")
    }

    const result = await panitiaService.approvePanitia(id, user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
exports.rejectPanitia = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const user = req.user

    if (isStaff(user)) {
      if (!hasKelolaKegiatan(user)) {
        throw new Error("Admin tidak memiliki akses kelola kegiatan")
      }
    } else if (user.role === "mahasiswa") {
      await panitiaService.validateCO(id, user)
    } else {
      throw new Error("Akses ditolak")
    }

    const result = await panitiaService.rejectPanitia(id, user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
exports.getByKegiatan = async (req, res) => {
  try {
    const kegiatan_id = Number(req.params.kegiatan_id)
    const result = await panitiaService.getPanitiaByKegiatan(kegiatan_id)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
exports.getPendaftar = async (req, res) => {
  try {
    const result = await panitiaService.getPendaftarByDivisi(req.params.divisi_id)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
exports.getMyPendaftaran = async (req, res) => {
  try {
    const result = await panitiaService.getMyPendaftaran(req.user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
exports.setCO = async (req, res) => {
  try {
    const result = await panitiaService.setCO(
      Number(req.params.divisi_id),
      Number(req.body.mahasiswa_id),
      req.user
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// SET LINK GROUP — dual-actor (staff dgn kelola_kegiatan ATAU mahasiswa CO)
exports.setLinkGroup = async (req, res) => {
  try {
    const divisi_id = Number(req.params.divisi_id)
    const user = req.user

    if (isStaff(user)) {
      if (!hasKelolaKegiatan(user)) {
        throw new Error("Admin tidak memiliki akses kelola kegiatan")
      }
    } else if (user.role === "mahasiswa") {
      await panitiaService.validateCODivisi(divisi_id, user)
    } else {
      throw new Error("Akses ditolak")
    }

    const result = await panitiaService.setLinkGroup(
      divisi_id,
      req.body.link_grup,
      user
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ITEM 11 — set point reward override per panitia
exports.setPanitiaReward = async (req, res) => {
  try {
    const result = await panitiaService.setPanitiaReward(
      Number(req.params.id),
      req.body.point,
      req.user
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}
