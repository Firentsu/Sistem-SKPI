// ============================================================================
// access.policy.js
// CENTRAL ACCESS POLICY
// Revisi 11 poin: sadar peran ganda (roles array) + akses super granular.
// ============================================================================

const {
  rolesOf,
  hasAnyRole,
  isSuperAdmin
} = require("./adminAccess.policy")

// ----------------------------------------------------------------------------
const validateRole = (user, allowed = []) => {
  if (!user) {
    throw new Error("User tidak valid")
  }

  // cek terhadap SEMUA role (peran ganda)
  if (!hasAnyRole(user, allowed)) {
    throw new Error("Role tidak memiliki akses")
  }

  return true
}

// ----------------------------------------------------------------------------
const validateAdminKegiatanAccess = (user) => {

  validateRole(user, ["admin", "super_admin"])

  // super admin bypass
  if (isSuperAdmin(user)) {
    return true
  }

  // admin: butuh akses super 'kelola_kegiatan'
  if (!(user.access && user.access.kelola_kegiatan)) {
    throw new Error("Admin tidak memiliki akses kelola kegiatan")
  }

  return true
}

module.exports = {
  validateRole,
  validateAdminKegiatanAccess,
  rolesOf
}
