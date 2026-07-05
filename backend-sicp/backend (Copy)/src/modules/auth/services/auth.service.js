const db = require("../../../shared/config/db")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const authModel = require("../models/auth.model")

const ALLOWED_ROLES = ["super_admin", "admin", "dosen", "mahasiswa"]

// ===============================
const normalize = (v) => String(v || "").trim().toLowerCase()

// ===============================
// LOGIN
const login = async (username, password, meta = {}) => {
  if (!username || !password) {
    throw new Error("LOGIN_INVALID")
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("SERVER_MISCONFIGURED")
  }

  username = normalize(username)

  const conn = await db.getConnection()

  try {
    const user = await authModel.findUserByUsername(username, conn)

    // 🔒 GENERIC ERROR (ANTI ENUMERATION)
    if (!user || !user.password) {
      throw new Error("LOGIN_FAILED")
    }

    if (user.status !== "aktif") {
      throw new Error("LOGIN_FAILED")
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      throw new Error("LOGIN_FAILED")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new Error("LOGIN_FAILED")
    }

    let mahasiswa_id = null
    let dosen_id = null

    // ===============================
    if (user.role === "mahasiswa") {
      const mhs = await authModel.findMahasiswaByUserId(user.id, conn)
      if (!mhs) throw new Error("LOGIN_FAILED")
      mahasiswa_id = mhs.id
    }

    if (user.role === "dosen") {
      const dsn = await authModel.findDosenByUserId(user.id, conn)
      if (!dsn) throw new Error("LOGIN_FAILED")
      dosen_id = dsn.id
    }

    // ===============================
    // 🔥 PERAN GANDA — ambil seluruh role user
    let roles = [user.role]
    try {
      const [roleRows] = await conn.query(
        "SELECT role FROM user_roles WHERE user_id = ?",
        [user.id]
      )
      roles = Array.from(new Set(
        [user.role, ...roleRows.map((r) => r.role)].filter(Boolean)
      ))
    } catch (err) {
      // tabel user_roles belum ada (migrasi belum jalan) — fallback role tunggal
      console.error("LOGIN ROLES WARN:", err.message)
    }

    // ===============================
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        roles,
        mahasiswa_id,
        dosen_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    )

    // ===============================
    // 🔥 LOGIN LOG (ISOLATED)
    try {
      const logConn = await db.getConnection()
      try {
        await authModel.insertLoginLog(
          user.id,
          meta.ip || null,
          meta.userAgent || null,
          logConn
        )
      } finally {
        logConn.release()
      }
    } catch (err) {
      console.error("LOGIN LOG ERROR:", err.message)
    }

    return {
      token,
      user: {
        id: user.id,
        role: user.role,
        roles
      }
    }

  } finally {
    conn.release()
  }
}

// ===============================
// CREATE USER
const createUser = async ({ username, password, role, createdBy }) => {
  if (!username || !password || !role) {
    throw new Error("Data tidak lengkap")
  }

  if (!createdBy) {
    throw new Error("createdBy wajib diisi")
  }

  username = normalize(username)

  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Role tidak valid")
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  const SALT_ROUNDS = Number(process.env.BCRYPT_SALT || 10)

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const existing = await authModel.findUserByUsername(username, conn)
    if (existing) {
      throw new Error("Username sudah digunakan")
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const userId = await authModel.insertUser({
      username,
      password: hashedPassword,
      role,
      createdBy
    }, conn)

    // ===============================
    if (role === "mahasiswa") {
      const mhsId = await authModel.insertMahasiswa(userId, username, conn)
      if (!mhsId) throw new Error("Gagal membuat mahasiswa")
    }

    if (role === "dosen") {
      const dsnId = await authModel.insertDosen(userId, username, conn)
      if (!dsnId) throw new Error("Gagal membuat dosen")
    }

    await conn.commit()

    return {
      user_id: userId
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  login,
  createUser
} 