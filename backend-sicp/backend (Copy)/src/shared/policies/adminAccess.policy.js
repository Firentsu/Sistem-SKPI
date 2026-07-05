// ============================================================================
// adminAccess.policy.js
// Helper otorisasi LAPISAN SERVICE untuk peran ganda + akses super granular.
// Dipakai di dalam service (bukan route), saat keputusan otorisasi butuh
// konteks bisnis (mis. pengajuan staff-originated vs mahasiswa-originated).
// ============================================================================

const { ACCESS_KEYS } = require("../constants/accessKeys")

// --- ROLE -------------------------------------------------------------------
const rolesOf = (user) => {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length) return user.roles
  return user.role ? [user.role] : []
}

const hasRole = (user, role) => rolesOf(user).includes(role)

const hasAnyRole = (user, allowed = []) =>
  rolesOf(user).some((r) => allowed.includes(r))

const isSuperAdmin = (user) => hasRole(user, "super_admin")
const isAdmin = (user) => hasRole(user, "admin")
const isDosen = (user) => hasRole(user, "dosen")
const isMahasiswa = (user) => hasRole(user, "mahasiswa")

// --- AKSES SUPER ------------------------------------------------------------
// hasAccess: super_admin selalu true; admin true bila punya access_key tsb.
const hasAccess = (user, key) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (!isAdmin(user)) return false
  return !!(user.access && user.access[key])
}

// isAdminSuper: super_admin, ATAU admin dengan minimal 1 akses super.
const isAdminSuper = (user) => {
  if (isSuperAdmin(user)) return true
  return isAdmin(user) && !!user.access && Object.keys(user.access).length > 0
}

// requireAccess: lempar error bila tidak punya akses.
const requireAccess = (user, key) => {
  if (!hasAccess(user, key)) {
    throw new Error(`Tidak memiliki akses super: ${key}`)
  }
  return true
}

// requireRole: lempar error bila tidak punya salah satu role.
const requireRole = (user, allowed = []) => {
  if (!hasAnyRole(user, allowed)) {
    throw new Error("Role tidak memiliki akses")
  }
  return true
}

module.exports = {
  ACCESS_KEYS,
  rolesOf,
  hasRole,
  hasAnyRole,
  isSuperAdmin,
  isAdmin,
  isDosen,
  isMahasiswa,
  hasAccess,
  isAdminSuper,
  requireAccess,
  requireRole
}
