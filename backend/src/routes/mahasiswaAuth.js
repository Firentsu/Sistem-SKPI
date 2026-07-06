/**
 * /api/mahasiswa/auth — Autentikasi Mahasiswa
 * Menggunakan express-session (MySQL Store), tanpa JWT
 *
 * POST   /login    → login dengan NIM + password
 * POST   /logout   → logout, hapus sesi
 * GET    /me       → cek sesi aktif
 * GET    /profile  → ambil profil
 * PATCH  /profile  → update username / email
 * DELETE /avatar   → hapus foto profil
 * POST   /avatar   → upload foto profil
 * PATCH  /password → ganti password
 */
import { loginLimiter } from "../middleware/rateLimiter.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";

import prisma from "../lib/prisma.js";
import { requireMahasiswaAuth } from "../middleware/mahasiswaAuth.js";
import { createNotif } from "../utils/notifikasi.js";
import { subscribe, unsubscribe } from "../utils/sseManager.js";

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
router.get("/cek-akun", async (req, res) => {
    try {
        const { nim } = req.query;
        if (!nim) return res.json({ exists: false });
        const mhs = await prisma.mahasiswa.findFirst({
            where: { nim: nim.trim() },
            select: { id_mahasiswa: true },
        });
        res.json({ exists: !!mhs });
    } catch {
        res.json({ exists: false });
    }
});

router.post("/login", loginLimiter,  async (req, res) => {
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
            id_mahasiswa:  mahasiswa.id_mahasiswa,
            nim:           mahasiswa.nim,
            nama:          mahasiswa.nama,
            email:         mahasiswa.email ?? user.email,
            username:      user.username,
            prodi:         mahasiswa.programstudi?.nama_prodi ?? null,
            angkatan:      mahasiswa.angkatan,
            avatar:        mahasiswa.foto_profil,
            foto_profil:   mahasiswa.foto_profil,
            status_skpi:   mahasiswa.status_skpi,
            created_at:    user.created_at,
            tempat_lahir:  mahasiswa.tempat_lahir  ?? null,
            tgl_lahir:     mahasiswa.tgl_lahir     ?? null,
            tanggal_masuk: mahasiswa.tanggal_masuk ?? null,
            tanggal_lulus: mahasiswa.tanggal_lulus ?? null,
            nomor_ijazah:  mahasiswa.nomor_ijazah  ?? null,
            gelar:         mahasiswa.gelar         ?? null,
            gelar_eng:     mahasiswa.gelar_eng     ?? null,
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
            createNotif(user.user_id, "Profil Berhasil Diperbarui",
                "Username Anda berhasil diperbarui.");
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
            createNotif(user.user_id, "Profil Berhasil Diperbarui",
                "Email Anda berhasil diperbarui.");
            return res.json({ success: true, message: "Email berhasil diperbarui" });
        }

        res.status(400).json({ error: "Action tidak dikenal" });
    } catch (err) {
        console.error("PATCH /mahasiswa/auth/profile error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/mahasiswa/auth/biodata
//  Body: { tempat_lahir, tgl_lahir, tanggal_masuk, tanggal_lulus,
//          nomor_ijazah, gelar, gelar_eng }
// ════════════════════════════════════════════════════════════
router.patch("/biodata", requireMahasiswaAuth, async (req, res) => {
    try {
        const { mahasiswa } = req;
        const {
            tempat_lahir, tgl_lahir, tanggal_masuk, tanggal_lulus,
            nomor_ijazah, gelar, gelar_eng,
        } = req.body;

        const data = {};
        if (tempat_lahir  !== undefined) data.tempat_lahir  = tempat_lahir?.trim()  || null;
        if (tgl_lahir     !== undefined) data.tgl_lahir     = tgl_lahir     ? new Date(tgl_lahir)     : null;
        if (tanggal_masuk !== undefined) data.tanggal_masuk = tanggal_masuk ? new Date(tanggal_masuk) : null;
        if (tanggal_lulus !== undefined) data.tanggal_lulus = tanggal_lulus ? new Date(tanggal_lulus) : null;
        if (nomor_ijazah  !== undefined) data.nomor_ijazah  = nomor_ijazah?.trim()  || null;
        if (gelar         !== undefined) data.gelar         = gelar?.trim()         || null;
        if (gelar_eng     !== undefined) data.gelar_eng     = gelar_eng?.trim()     || null;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: "Tidak ada data yang dikirim" });
        }

        await prisma.mahasiswa.update({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            data,
        });

        createNotif(req.mahasiswaUser.user_id, "Biodata SKPI Diperbarui",
            "Data biodata SKPI Anda berhasil disimpan.");

        return res.json({ success: true, message: "Biodata berhasil disimpan" });
    } catch (err) {
        console.error("PATCH /mahasiswa/auth/biodata error:", err);
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

        createNotif(req.mahasiswaUser.user_id, "Foto Profil Diperbarui",
            "Foto profil Anda berhasil diperbarui.");
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

        createNotif(user.user_id, "Password Berhasil Diubah",
            "Password akun Anda berhasil diperbarui. Jika bukan Anda yang mengubah, segera hubungi admin.");
        res.json({ success: true, message: "Password berhasil diperbarui" });
    } catch (err) {
        console.error("PATCH /mahasiswa/auth/password error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/mahasiswa/auth/avatar  — hapus foto profil
// ════════════════════════════════════════════════════════════
router.delete("/avatar", requireMahasiswaAuth, async (req, res) => {
    try {
        const { mahasiswa } = req;

        if (!mahasiswa.foto_profil) {
            return res.status(400).json({ error: "Tidak ada foto profil yang perlu dihapus" });
        }

        // Hapus file fisik
        const filePath = path.join(process.cwd(), "public", mahasiswa.foto_profil);
        if (existsSync(filePath)) await unlink(filePath).catch(() => {});

        // Kosongkan field di DB
        await prisma.mahasiswa.update({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            data: { foto_profil: null },
        });

        createNotif(req.mahasiswaUser.user_id, "Foto Profil Dihapus",
            "Foto profil Anda telah berhasil dihapus dari sistem.");

        res.json({ success: true, message: "Foto profil berhasil dihapus" });
    } catch (err) {
        console.error("DELETE /mahasiswa/auth/avatar error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/auth/sse  — Server-Sent Events mahasiswa
// ════════════════════════════════════════════════════════════
router.get("/sse", requireMahasiswaAuth, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const userId = req.mahasiswaUser.user_id;
    subscribe(userId, res);

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    const heartbeat = setInterval(() => {
        try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
    }, 25000);

    req.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe(userId, res);
    });
});

export default router;