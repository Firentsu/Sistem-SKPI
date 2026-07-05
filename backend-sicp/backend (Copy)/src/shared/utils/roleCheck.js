// ============================================================================
// utils/roleCheck.js
// ----------------------------------------------------------------------------
// Helper sentralisasi pengecekan role multi-role aware.
// Selalu prioritaskan req.user.roles (array, dari user_roles + role utama).
// Fallback ke req.user.role bila roles tidak tersedia (kompatibilitas mundur).
//
// Pemakaian:
//   const RC = require("./roleCheck")
//   if (RC.is(user, "dosen")) { ... }
//   if (RC.isAny(user, ["dosen","admin"])) { ... }
//   if (RC.isSuperAdmin(user)) { ... }
// ============================================================================

const getRoles = (user) => {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length) return user.roles
  if (user.role) return [user.role]
  return []
}

const is = (user, role) => getRoles(user).includes(role)

const isAny = (user, roles) => {
  const ur = getRoles(user)
  return roles.some((r) => ur.includes(r))
}

const isAll = (user, roles) => {
  const ur = getRoles(user)
  return roles.every((r) => ur.includes(r))
}

const isMahasiswa  = (user) => is(user, "mahasiswa")
const isDosen      = (user) => is(user, "dosen")
const isAdmin      = (user) => is(user, "admin")
const isSuperAdmin = (user) => is(user, "super_admin")
const isStaff      = (user) => isAny(user, ["dosen", "admin", "super_admin"])

// Untuk situasi yg perlu role tunggal untuk audit/log
const primary = (user) => user?.role || getRoles(user)[0] || null

// Cek apakah user efektif "berperan sebagai dosen"
// (baik role utama dosen, atau peran ganda admin+dosen / super_admin+dosen)
const canActAsDosen = (user) => isDosen(user) || isSuperAdmin(user)

module.exports = {
  getRoles,
  is, isAny, isAll,
  isMahasiswa, isDosen, isAdmin, isSuperAdmin, isStaff,
  canActAsDosen,
  primary,
}
