/**
 * /api/auth — Autentikasi Admin
 * Menggunakan express-session (MySQL Store), tanpa JWT
 *
 * POST   /login    → login admin
 * POST   /logout   → logout, hapus sesi
 * GET    /me       → cek sesi aktif
 * GET    /profile  → ambil profil
 * PATCH  /profile  → update username / email / password
 * POST   /avatar   → upload foto profil
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";

import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { createNotif } from "../utils/notifikasi.js";
import { subscribe, unsubscribe } from "../utils/sseManager.js";

const router = Router();

// ── Multer untuk avatar ─────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const EXT_MAP = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

// ════════════════════════════════════════════════════════════
//  POST /api/auth/login
// ════════════════════════════════════════════════════════════
router.get("/cek-akun", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ exists: false });
    const user = await prisma.users.findFirst({
      where: { username: username.trim(), role: "admin" },
      select: { user_id: true },
    });
    res.json({ exists: !!user });
  } catch {
    res.json({ exists: false });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }

    const user = await prisma.users.findFirst({
      where: { username },
      include: { admin: true },
    });

    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "Username tidak ditemukan atau bukan admin" });
    }

    if (user.status_akun === "nonaktif") {
      return res.status(403).json({ error: "Akun dinonaktifkan. Hubungi administrator." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Password salah" });

    // Simpan data ke session
    req.session.userId = user.user_id;
    req.session.role = "admin";

    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/auth/logout
// ════════════════════════════════════════════════════════════
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.clearCookie("skpi_session");
    res.json({ ok: true });
  });
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
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
      admin: admin ? {
        id_admin: admin.id_admin,
        nama_admin: admin.nama_admin,
        email: admin.email,
        avatar: admin.avatar,
      } : null,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/auth/profile
// ════════════════════════════════════════════════════════════
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const admin = user.admin ?? null;

    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      nama_admin: admin?.nama_admin ?? user.username,
      avatar: admin?.avatar ?? null,
      id_admin: admin?.id_admin ?? null,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("GET /auth/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/auth/profile
//  Body: { action: "username" | "email" | "password", ... }
// ════════════════════════════════════════════════════════════
router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { action } = req.body;
    const admin = user.admin ?? null;

    // Update username
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
      if (existing) return res.status(409).json({ error: "Username sudah digunakan" });

      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { username: trimmed, updated_at: new Date() },
      });
      return res.json({ success: true, message: "Username berhasil diperbarui" });
    }

    // Update email
    if (action === "email") {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: "Format email tidak valid" });
      }
      const trimmed = email.trim().toLowerCase();

      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { email: trimmed, updated_at: new Date() },
      });
      if (admin) {
        await prisma.admin.update({
          where: { id_admin: admin.id_admin },
          data: { email: trimmed },
        });
      }
      return res.json({ success: true, message: "Email berhasil diperbarui" });
    }

    // Update password
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
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { password: hashed, updated_at: new Date() },
      });
      return res.json({ success: true, message: "Password berhasil diperbarui" });
    }

    res.status(400).json({ error: "Action tidak dikenal" });
  } catch (err) {
    console.error("PATCH /auth/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/auth/avatar
// ════════════════════════════════════════════════════════════
router.post("/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    const { user } = req;
    const admin = user.admin ?? null;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File avatar tidak ditemukan" });

    // Hapus avatar lama jika ada
    if (admin?.avatar) {
      const oldPath = path.join(process.cwd(), "public", admin.avatar);
      if (existsSync(oldPath)) await unlink(oldPath).catch(() => { });
    }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = EXT_MAP[file.mimetype];
    const filename = `admin_${admin?.id_admin ?? user.user_id}_${Date.now()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    if (admin) {
      await prisma.admin.update({
        where: { id_admin: admin.id_admin },
        data: { avatar: publicUrl },
      });
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
//  DELETE /api/auth/avatar  — hapus foto profil admin
// ════════════════════════════════════════════════════════════
router.delete("/avatar", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const admin = user.admin ?? null;

    if (!admin?.avatar) {
      return res.status(400).json({ error: "Tidak ada foto profil yang perlu dihapus" });
    }

    // Hapus file fisik
    const filePath = path.join(process.cwd(), "public", admin.avatar);
    if (existsSync(filePath)) await unlink(filePath).catch(() => {});

    // Kosongkan field di DB
    await prisma.admin.update({
      where: { id_admin: admin.id_admin },
      data: { avatar: null },
    });

    createNotif(user.user_id, "Foto Profil Dihapus",
      "Foto profil Anda telah berhasil dihapus dari sistem.");

    res.json({ success: true, message: "Foto profil berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /auth/avatar error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/auth/sse  — Server-Sent Events untuk admin
// ════════════════════════════════════════════════════════════
router.get("/sse", requireAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nonaktifkan buffering nginx
  res.flushHeaders();

  const userId = req.user.user_id;
  subscribe(userId, res);

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  // Heartbeat tiap 25 detik agar koneksi tidak ditutup proxy
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe(userId, res);
  });
});

export default router;