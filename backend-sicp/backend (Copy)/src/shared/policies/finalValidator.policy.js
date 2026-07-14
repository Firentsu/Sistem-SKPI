const db = require("../config/db")
const { hasRole, hasAccess } = require("./adminAccess.policy")

// ============================================================================
// finalValidator.policy.js
// ----------------------------------------------------------------------------
// REVISI — routing validasi final pengajuan ICP staff-originated:
//
//   1. Saat staff (dosen/admin biasa) memberi ICP atau approve Tier-1
//      pengajuan mahasiswa, mereka WAJIB memilih satu Admin Akses-Super
//      sebagai validator final via field `target_admin_final_id`.
//
//   2. Hanya admin yang dipilih itu (atau Super Admin) yang dapat
//      melihat & memvalidasi pengajuan tersebut. Validasi tidak menumpuk
//      ke satu admin AS.
//
//   3. Super Admin SELALU memiliki override: dapat melihat & validasi
//      SEMUA pengajuan, termasuk yang tidak ditujukan kepadanya.
// ============================================================================

// Apakah user adalah Super Admin?
const isSuperAdmin = (user) => hasRole(user, "super_admin")

// Apakah user adalah Admin Akses-Super yang memegang kunci validasi_final?
const isAdminFinalValidator = (user) =>
  hasRole(user, "admin") && hasAccess(user, "validasi_final")

// REVISI POTONGAN — apakah user dapat memvalidasi POTONGAN tertentu?
//   - Super Admin: selalu YES
//   - Admin dgn 'validasi_potongan': hanya bila routed kepadanya
//     (fallback NULL → semua admin AS validasi_potongan boleh)
const canValidatePotongan = (potongan, user) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const isValidator =
    hasRole(user, "admin") && hasAccess(user, "validasi_potongan")
  if (!isValidator) return false

  if (potongan.target_admin_final_id == null) return true
  return Number(potongan.target_admin_final_id) === Number(user.id)
}

// Apakah user berhak memvalidasi pengajuan tertentu?
//   - Super Admin: selalu YES (override penuh)
//   - Admin AS  : hanya jika target_admin_final_id === user.id
//     (atau target_admin_final_id NULL → fallback legacy: semua admin AS bisa)
const canValidateFinal = (pengajuan, user) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true

  if (!isAdminFinalValidator(user)) return false

  // Tidak ada routing → fallback: semua admin AS bisa (data lama pre-revisi 005)
  if (pengajuan.target_admin_final_id == null) return true

  return Number(pengajuan.target_admin_final_id) === Number(user.id)
}

// Validasi bahwa target_admin_final_id yang DIPILIH staff valid:
//   - user ber-role admin (atau peran ganda termasuk admin)
//   - status user = aktif
//   - punya akses 'validasi_final' di admin_access
const assertValidFinalTarget = async (target_admin_final_id, conn = null) => {
  if (target_admin_final_id == null) {
    throw new Error("target_admin_final_id wajib diisi")
  }

  const c = conn || db
  const [rows] = await c.query(
    `
    SELECT u.id, u.role, u.status,
           CASE WHEN u.role='super_admin' THEN 1 ELSE 0 END AS is_super_admin,
           CASE WHEN u.role='admin' THEN 1
                WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=u.id AND ur.role='admin') THEN 1
                ELSE 0
           END AS is_admin,
           CASE WHEN EXISTS (
             SELECT 1 FROM admin_access aa
             WHERE aa.user_id=u.id AND aa.access_key='validasi_final'
           ) THEN 1 ELSE 0 END AS has_validasi_final
    FROM users u
    WHERE u.id = ?
    LIMIT 1
    `,
    [target_admin_final_id]
  )

  const row = rows[0]
  if (!row) throw new Error("Target validator tidak ditemukan")
  if (row.status !== "aktif") throw new Error("Target validator tidak aktif")
  // Super Admin SELALU sah jadi target validator final (tanpa perlu access key)
  if (row.is_super_admin) return true
  if (!row.is_admin) throw new Error("Target validator harus berperan admin atau super admin")
  if (!row.has_validasi_final) {
    throw new Error(
      "Target validator tidak memiliki akses 'validasi_final'"
    )
  }
  return true
}

// Daftar admin AS aktif yang berhak menjadi target validator final.
// Dipakai endpoint helper untuk dropdown di frontend pengaju.
const listEligibleFinalValidators = async (conn = null) => {
  const c = conn || db
  const [rows] = await c.query(
    `
    SELECT DISTINCT u.id, u.username, COALESCE(ap.nama, u.username) AS nama, 'admin_as' AS tipe
    FROM users u
    INNER JOIN admin_access aa
      ON aa.user_id = u.id AND aa.access_key = 'validasi_final'
    LEFT JOIN admin_profile ap ON ap.user_id = u.id
    WHERE u.status = 'aktif'
      AND (u.role = 'admin'
        OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'))
    UNION
    SELECT u.id, u.username, COALESCE(ap.nama, u.username) AS nama, 'super_admin' AS tipe
    FROM users u
    LEFT JOIN admin_profile ap ON ap.user_id = u.id
    WHERE u.status = 'aktif' AND u.role = 'super_admin'
    ORDER BY nama ASC, id ASC
    `
  )
  return rows
}

// REVISI POTONGAN — validasi bahwa target_admin_final_id valid sebagai
// validator POTONGAN: punya 'validasi_potongan' (bukan 'validasi_final').
const assertValidPotonganValidator = async (target_admin_final_id, conn = null) => {
  if (target_admin_final_id == null) {
    throw new Error("target_admin_final_id wajib diisi")
  }

  const c = conn || db
  const [rows] = await c.query(
    `
    SELECT u.id, u.status,
           CASE WHEN u.role='super_admin' THEN 1 ELSE 0 END AS is_super_admin,
           CASE WHEN u.role='admin' THEN 1
                WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=u.id AND ur.role='admin') THEN 1
                ELSE 0
           END AS is_admin,
           CASE WHEN EXISTS (
             SELECT 1 FROM admin_access aa
             WHERE aa.user_id=u.id AND aa.access_key='validasi_potongan'
           ) THEN 1 ELSE 0 END AS has_access
    FROM users u
    WHERE u.id = ?
    LIMIT 1
    `,
    [target_admin_final_id]
  )

  const row = rows[0]
  if (!row) throw new Error("Target validator tidak ditemukan")
  if (row.status !== "aktif") throw new Error("Target validator tidak aktif")
  // Super Admin SELALU sah jadi target validator potongan
  if (row.is_super_admin) return true
  if (!row.is_admin) throw new Error("Target validator harus berperan admin atau super admin")
  if (!row.has_access) {
    throw new Error("Target validator tidak memiliki akses 'validasi_potongan'")
  }
  return true
}

// REVISI POTONGAN — daftar admin AS aktif yang dapat dipilih sebagai
// validator potongan (untuk dropdown frontend pengaju).
const listEligiblePotonganValidators = async (conn = null) => {
  const c = conn || db
  const [rows] = await c.query(
    `
    SELECT DISTINCT u.id, u.username, COALESCE(ap.nama, u.username) AS nama, 'admin_as' AS tipe
    FROM users u
    INNER JOIN admin_access aa
      ON aa.user_id = u.id AND aa.access_key = 'validasi_potongan'
    LEFT JOIN admin_profile ap ON ap.user_id = u.id
    WHERE u.status = 'aktif'
      AND (u.role = 'admin'
        OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'))
    UNION
    SELECT u.id, u.username, COALESCE(ap.nama, u.username) AS nama, 'super_admin' AS tipe
    FROM users u
    LEFT JOIN admin_profile ap ON ap.user_id = u.id
    WHERE u.status = 'aktif' AND u.role = 'super_admin'
    ORDER BY nama ASC, id ASC
    `
  )
  return rows
}

module.exports = {
  isSuperAdmin,
  isAdminFinalValidator,
  canValidateFinal,
  canValidatePotongan,
  assertValidFinalTarget,
  assertValidPotonganValidator,
  listEligibleFinalValidators,
  listEligiblePotonganValidators
}
