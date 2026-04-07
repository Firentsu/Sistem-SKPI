import { Router }      from "express";
import bcrypt          from "bcryptjs";
import multer          from "multer";
import path            from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync }  from "fs";

import prisma          from "../lib/prisma.js";
import { signToken, verifyToken } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── Konfigurasi Multer (upload avatar ke memori dulu) ──────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },      // maks 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const EXT_MAP    = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

// ════════════════════════════════════════════════════════════
//  POST /api/auth/login
// ════════════════════════════════════════════════════════════
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }

    const user = await prisma.users.findFirst({ where: { username } });
    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "Username tidak ditemukan atau bukan admin" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Password salah" });

    const token = signToken({
      userId: user.user_id,
      role:   user.role,
      exp:    Date.now() + 1000 * 60 * 60 * 24,   // 1 hari
    });

    res.cookie("skpi_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge:   86400 * 1000,
      secure:   process.env.NODE_ENV === "production",
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/auth/logout
// ════════════════════════════════════════════════════════════
router.post("/logout", (_req, res) => {
  res.clearCookie("skpi_auth");
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
//  GET /api/auth/me
// ════════════════════════════════════════════════════════════
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const admin = user.admin ?? null;

    res.json({
      user: {
        user_id:  user.user_id,
        username: user.username,
        email:    user.email,
      },
      admin: admin ? {
        id_admin:   admin.id_admin,
        nama_admin: admin.nama_admin,
        email:      admin.email,
        avatar:     admin.avatar,
      } : null,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/auth/profile      → ambil profil
//  PATCH /api/auth/profile     → update username / email / password
// ════════════════════════════════════════════════════════════
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const admin = user.admin ?? null;

    res.json({
      user_id:    user.user_id,
      username:   user.username,
      email:      user.email,
      nama_admin: admin?.nama_admin ?? user.username,
      avatar:     admin?.avatar ?? null,
      id_admin:   admin?.id_admin ?? null,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("GET /auth/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { user }   = req;
    const { action } = req.body;
    const admin      = user.admin ?? null;

    // ── Update username ─────────────────────────────────────
    if (action === "username") {
      const { username } = req.body;
      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: "Username minimal 3 karakter" });
      }
      const trimmed = username.trim();
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return res.status(400).json({ error: "Username hanya boleh huruf, angka, dan underscore" });
      }
      const existing = await prisma.users.findFirst({
        where: { username: trimmed, NOT: { user_id: user.user_id } },
      });
      if (existing) return res.status(409).json({ error: "Username sudah digunakan akun lain" });

      await prisma.users.update({ where: { user_id: user.user_id }, data: { username: trimmed } });
      return res.json({ success: true, message: "Username berhasil diperbarui" });
    }

    // ── Update email ────────────────────────────────────────
    if (action === "email") {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: "Format email tidak valid" });
      }
      const trimmed  = email.trim().toLowerCase();
      const existing = await prisma.users.findFirst({
        where: { email: trimmed, NOT: { user_id: user.user_id } },
      });
      if (existing) return res.status(409).json({ error: "Email sudah digunakan akun lain" });

      await prisma.users.update({ where: { user_id: user.user_id }, data: { email: trimmed } });
      if (admin) {
        await prisma.admin.update({ where: { id_admin: admin.id_admin }, data: { email: trimmed } });
      }
      return res.json({ success: true, message: "Email berhasil diperbarui" });
    }

    // ── Update password ─────────────────────────────────────
    if (action === "password") {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Semua field password wajib diisi" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password baru minimal 8 karakter" });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: "Password saat ini tidak tepat" });

      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.users.update({ where: { user_id: user.user_id }, data: { password: hashed } });
      return res.json({ success: true, message: "Password berhasil diperbarui" });
    }

    res.status(400).json({ error: "Action tidak dikenal" });
  } catch (err) {
    console.error("PATCH /auth/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/auth/avatar    → upload foto profil
// ════════════════════════════════════════════════════════════
router.post("/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    const { user } = req;
    const admin    = user.admin ?? null;
    const file     = req.file;

    if (!file) return res.status(400).json({ error: "File avatar tidak ditemukan" });

    // Hapus avatar lama jika ada
    if (admin?.avatar) {
      const oldPath = path.join(process.cwd(), "public", admin.avatar);
      if (existsSync(oldPath)) await unlink(oldPath).catch(() => {});
    }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

    const ext      = EXT_MAP[file.mimetype];
    const filename = `admin_${admin?.id_admin ?? user.user_id}_${Date.now()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    if (admin) {
      await prisma.admin.update({ where: { id_admin: admin.id_admin }, data: { avatar: publicUrl } });
    } else {
      await prisma.admin.create({
        data: { id_user: user.user_id, nama_admin: user.username, email: user.email ?? "", avatar: publicUrl },
      });
    }

    res.json({ success: true, avatar: publicUrl });
  } catch (err) {
    console.error("POST /auth/avatar error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/auth/register
// ════════════════════════════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const existing = await prisma.users.findFirst({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: "Username sudah digunakan" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.users.create({
      data: {
        username,
        password:    hashed,
        email,
        role:        "mahasiswa",
        status_akun: "aktif",
        updated_at:  new Date(),
      },
    });

    res.status(201).json({ message: "Register berhasil", user_id: user.user_id });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
