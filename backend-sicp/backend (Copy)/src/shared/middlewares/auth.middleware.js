const jwt = require("jsonwebtoken")
const db = require("../config/db")
const { fail } = require("../utils/response")
const { ACCESS_KEYS } = require("../constants/accessKeys")

// ============================================================================
// AUTH MIDDLEWARE  (FINAL — Legacy Cleanup)
// ----------------------------------------------------------------------------
// REVISI 11 POIN + FINAL CLEANUP:
//   - PERAN GANDA  → req.user.roles (array)
//   - AKSES SUPER  → req.user.access  ({ access_key: true })
//
// Sumber kebenaran TUNGGAL untuk semua akses-super adalah tabel admin_access.
// Field legacy `req.user.access_kelola_kegiatan` SUDAH DIHAPUS — semua
// controller/service kini wajib pakai `req.user.access.kelola_kegiatan`.
// ============================================================================

const authMiddleware = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return fail(res, "Server misconfigured", 500)
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, "Unauthorized", 401)
    }

    const token = authHeader.split(" ")[1]

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return fail(res, "Token invalid atau expired", 401)
    }

    if (!decoded || !decoded.id || !decoded.role) {
      return fail(res, "Token tidak valid", 401)
    }

    const [rows] = await db.query(`
      SELECT
        u.id, u.role, u.status,
        m.id AS mahasiswa_id,
        d.id AS dosen_id
      FROM users u
      LEFT JOIN mahasiswa m ON m.user_id = u.id
      LEFT JOIN dosen d ON d.user_id = u.id
      WHERE u.id = ?
    `, [decoded.id])

    if (!rows.length) {
      return fail(res, "Unauthorized", 401)
    }

    const user = rows[0]

    if (user.status !== "aktif") {
      return fail(res, "User tidak aktif", 401)
    }

    // ====================================================================
    // PERAN GANDA — gabung role utama + user_roles
    const [roleRows] = await db.query(
      "SELECT role FROM user_roles WHERE user_id = ?",
      [user.id]
    )

    const roles = Array.from(new Set(
      [user.role, ...roleRows.map((r) => r.role)].filter(Boolean)
    ))

    if (!roles.includes(decoded.role)) {
      return fail(res, "Token tidak valid", 401)
    }

    // ====================================================================
    // AKSES SUPER GRANULAR — single source of truth = admin_access table.
    // Super Admin lolos otomatis untuk semua kunci.
    const access = {}

    if (roles.includes("super_admin")) {
      for (const k of ACCESS_KEYS) access[k] = true
    } else if (roles.includes("admin")) {
      const [accessRows] = await db.query(
        "SELECT access_key FROM admin_access WHERE user_id = ?",
        [user.id]
      )
      for (const r of accessRows) {
        if (ACCESS_KEYS.includes(r.access_key)) {
          access[r.access_key] = true
        }
      }
    }

    req.user = {
      id: user.id,
      role: user.role,                 // role utama (kompatibilitas mundur)
      roles,                           // semua role (peran ganda)
      mahasiswa_id: user.mahasiswa_id || null,
      dosen_id: user.dosen_id || null,
      access,                          // { access_key: true }
      is_admin_super:
        roles.includes("super_admin") ||
        Object.keys(access).length > 0
    }

    next()

  } catch (err) {
    console.error("AUTH ERROR:", err.message)
    return fail(res, "Unauthorized", 401)
  }
}

module.exports = authMiddleware
