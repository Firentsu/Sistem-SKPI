/**
 * /api/mahasiswa/auth — Autentikasi Mahasiswa
 * Menggunakan express-session (MySQL Store), tanpa JWT
 *
 * POST   /login    → login dengan NIM + password
 * POST   /logout   → logout, hapus sesi
 * GET    /me       → cek sesi aktif
 * GET    /profile  → ambil profil
 * PATCH  /profile  → update username / email
 * POST   /avatar   → upload foto profil
 * PATCH  /password → ganti password
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";

import prisma from "../lib/prisma.js";
import { requireMahasiswaAuth } from "../middleware/mahasiswaAuth.js";

const router = Router();

// ── Multer untuk avatar ─────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        cb(null, allowed.includes(file.mimetype));
    },
});

const EXT_MAP = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/auth/login
//  Body: { nim, password }
// ════════════════════════════════════════════════════════════
router.post("/login", async (req, res) => {
    try {
        const { nim, password } = req.body;

        if (!nim || !password) {
            return res.status(400).json({ error: "NIM dan password wajib diisi" });
        }

        const mahasiswa = await prisma.mahasiswa.findFirst({
            where: { nim: nim.trim() },
            include: { users: true },
        });

        if (!mahasiswa) {
            return res.status(401).json({ error: "NIM tidak ditemukan" });
        }
        if (!mahasiswa.id_user || !mahasiswa.users) {
            return res.status(401).json({ error: "Akun belum dibuat. Hubungi admin." });
        }

        const user = mahasiswa.users;

        if (user.status_akun === "nonaktif") {
            return res.status(403).json({ error: "Akun dinonaktifkan. Hubungi admin." });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: "Password salah" });

        // Simpan data ke session
        req.session.userId = user.user_id;
        req.session.mahasiswaId = mahasiswa.id_mahasiswa;
        req.session.role = "mahasiswa";

        return res.json({
            ok: true,
            nama: mahasiswa.nama,
            nim: mahasiswa.nim,
        });
    } catch (err) {
        console.error("POST /mahasiswa/auth/login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/auth/logout
// ════════════════════════════════════════════════════════════
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Logout mahasiswa error:", err);
        res.clearCookie("skpi_session");
        res.json({ ok: true });
    });
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/auth/me
// ════════════════════════════════════════════════════════════
router.get("/me", requireMahasiswaAuth, async (req, res) => {
    try {
        const { mahasiswaUser: user, mahasiswa } = req;

        res.json({
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            mahasiswa: {
                id_mahasiswa: mahasiswa.id_mahasiswa,
                nim: mahasiswa.nim,
                nama: mahasiswa.nama,
                email: mahasiswa.email,
                avatar: mahasiswa.foto_profil,
                foto_profil: mahasiswa.foto_profil,
                angkatan: mahasiswa.angkatan,
                prodi: mahasiswa.programstudi?.nama_prodi ?? null,
                id_prodi: mahasiswa.id_prodi,
                status_skpi: mahasiswa.status_skpi,
            },
        });
    } catch (err) {
        console.error("GET /mahasiswa/auth/me error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/auth/profile
// ════════════════════════════════════════════════════════════
router.get("/profile", requireMahasiswaAuth, async (req, res) => {
    try {
        const { mahasiswaUser: user, mahasiswa } = req;

        res.json({
            id_mahasiswa: mahasiswa.id_mahasiswa,
            nim: mahasiswa.nim,
            nama: mahasiswa.nama,
            email: mahasiswa.email ?? user.email,
            username: user.username,
            prodi: mahasiswa.programstudi?.nama_prodi ?? null,
            angkatan: mahasiswa.angkatan,
            avatar: mahasiswa.foto_profil,
            foto_profil: mahasiswa.foto_profil,
            status_skpi: mahasiswa.status_skpi,
            created_at: user.created_at,
        });
    } catch (err) {
        console.error("GET /mahasiswa/auth/profile error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/mahasiswa/auth/profile
//  Body: { action: "username" | "email", ... }
// ════════════════════════════════════════════════════════════
router.patch("/profile", requireMahasiswaAuth, async (req, res) => {
    try {
        const { mahasiswaUser: user, mahasiswa } = req;
        const { action } = req.body;

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
            await prisma.mahasiswa.update({
                where: { id_mahasiswa: mahasiswa.id_mahasiswa },
                data: { email: trimmed },
            });
            return res.json({ success: true, message: "Email berhasil diperbarui" });
        }

        res.status(400).json({ error: "Action tidak dikenal" });
    } catch (err) {
        console.error("PATCH /mahasiswa/auth/profile error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/auth/avatar
// ════════════════════════════════════════════════════════════
router.post("/avatar", requireMahasiswaAuth, upload.single("avatar"), async (req, res) => {
    try {
        const { mahasiswa } = req;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "File avatar tidak ditemukan" });

        // Hapus foto lama jika ada
        if (mahasiswa.foto_profil) {
            const oldPath = path.join(process.cwd(), "public", mahasiswa.foto_profil);
            if (existsSync(oldPath)) await unlink(oldPath).catch(() => { });
        }

        if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

        const ext = EXT_MAP[file.mimetype];
        const filename = `mhs_${mahasiswa.id_mahasiswa}_${Date.now()}.${ext}`;
        await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

        const publicUrl = `/uploads/avatars/${filename}`;

        await prisma.mahasiswa.update({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            data: { foto_profil: publicUrl },
        });

        res.json({ success: true, avatar: publicUrl });
    } catch (err) {
        console.error("POST /mahasiswa/auth/avatar error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/mahasiswa/auth/password
//  Body: { password_lama, password_baru }
// ════════════════════════════════════════════════════════════
router.patch("/password", requireMahasiswaAuth, async (req, res) => {
    try {
        const { mahasiswaUser: user } = req;
        const { password_lama, password_baru } = req.body;

        if (!password_lama || !password_baru) {
            return res.status(400).json({ error: "Password lama dan baru wajib diisi" });
        }
        if (password_baru.length < 8) {
            return res.status(400).json({ error: "Password baru minimal 8 karakter" });
        }

        const valid = await bcrypt.compare(password_lama, user.password);
        if (!valid) return res.status(400).json({ error: "Password lama tidak tepat" });

        const hashed = await bcrypt.hash(password_baru, 12);
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { password: hashed, updated_at: new Date() },
        });

        res.json({ success: true, message: "Password berhasil diperbarui" });
    } catch (err) {
        console.error("PATCH /mahasiswa/auth/password error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;