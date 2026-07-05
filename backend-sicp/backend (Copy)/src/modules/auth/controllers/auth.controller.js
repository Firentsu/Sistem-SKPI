const authService = require("../services/auth.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const normalize = (value) => {
  if (!value) return ""
  return String(value).trim()
}

// ===============================
const login = async (req, res) => {
  try {
    let { username, password } = req.body || {}

    username = normalize(username)
    password = normalize(password)

    // ===============================
    // 🔒 VALIDASI INPUT
    if (!username || !password) {
      return fail(res, "Username dan password wajib diisi", 400)
    }

    // ===============================
    // 🔥 META (LOGIN TRACKING)
    const meta = {
      ip: req.ip || null,
      userAgent: req.headers["user-agent"] || null
    }

    // ===============================
    const result = await authService.login(username, password, meta)

    // ===============================
    // 🔒 VALIDASI OUTPUT WAJIB
    if (
      !result ||
      !result.token ||
      !result.user ||
      !result.user.id ||
      !result.user.role
    ) {
      throw new Error("Response login tidak valid (service error)")
    }

    // ===============================
    return success(res, {
      token: result.token,
      user: {
        id: result.user.id,
        role: result.user.role
      }
    }, "Login berhasil")

  } catch (err) {
    console.error("LOGIN ERROR:", err.message)

    // ===============================
    // 🔒 ERROR CLASSIFICATION
    if (
      err.message.toLowerCase().includes("password") ||
      err.message.toLowerCase().includes("user") ||
      err.message.toLowerCase().includes("login")
    ) {
      return fail(res, "Username atau password salah", 401)
    }

    return fail(res, err.message || "Terjadi kesalahan server", 500)
  }
}

module.exports = {
  login
} 