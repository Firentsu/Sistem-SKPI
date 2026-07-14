const { fail } = require("../utils/response")

// ============================================================================
// ROLE MIDDLEWARE
// Revisi 11 poin: cek terhadap SEMUA role user (peran ganda).
// User lolos bila SALAH SATU role-nya termasuk allowedRoles.
// Backward-compatible: bila req.user.roles tidak ada, fallback ke req.user.role.
// ============================================================================

const roleMiddleware = (allowedRoles) => {
  if (!Array.isArray(allowedRoles)) {
    throw new Error("Role config tidak valid")
  }

  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Unauthorized", 401)
    }

    const userRoles =
      Array.isArray(req.user.roles) && req.user.roles.length
        ? req.user.roles
        : [req.user.role]

    const ok = userRoles.some((r) => allowedRoles.includes(r))

    if (!ok) {
      return fail(res, "Akses ditolak", 403)
    }

    next()
  }
}

module.exports = roleMiddleware
