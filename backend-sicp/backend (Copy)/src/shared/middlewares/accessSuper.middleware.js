const { fail } = require("../utils/response")
const { isValidAccessKey } = require("../constants/accessKeys")

// ============================================================================
// ACCESS SUPER MIDDLEWARE
// ============================================================================
// RULE:
// - super_admin -> bypass semua access_key
// - admin       -> wajib punya access_key terkait
// - selain itu  -> forbidden
//
// req.user wajib sudah diisi auth middleware:
// {
//   role,
//   roles,
//   access
// }
// ============================================================================

const accessSuper = (accessKey) => {
  if (!isValidAccessKey(accessKey)) {
    throw new Error(`access_key tidak dikenal: ${accessKey}`)
  }

  return (req, res, next) => {
    try {
      if (!req.user) {
        return fail(res, "Unauthorized", 401)
      }

      const roles =
        Array.isArray(req.user.roles) && req.user.roles.length
          ? req.user.roles
          : req.user.role
            ? [req.user.role]
            : []

      // =========================================================================
      // SUPER ADMIN BYPASS
      // =========================================================================
      if (roles.includes("super_admin")) {
        return next()
      }

      // =========================================================================
      // HANYA ADMIN YANG BOLEH PUNYA ACCESS SUPER
      // =========================================================================
      if (!roles.includes("admin")) {
        return fail(res, "Akses ditolak", 403)
      }

      // =========================================================================
      // VALIDASI ACCESS KEY
      // =========================================================================
      const access =
        req.user.access &&
        typeof req.user.access === "object"
          ? req.user.access
          : {}

      if (access[accessKey]) {
        return next()
      }

      return fail(
        res,
        `Admin tidak memiliki akses super: ${accessKey}`,
        403
      )

    } catch (err) {
      return fail(
        res,
        err.message || "Gagal validasi akses super",
        500
      )
    }
  }
}

module.exports = accessSuper 