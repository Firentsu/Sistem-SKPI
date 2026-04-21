/**
 * /api/admin  — Route khusus admin
 *
 * GET    /stats              → statistik dashboard (jumlah mahasiswa, kegiatan, dll)
 * GET    /profile            → profil admin yang sedang login
 * PATCH  /profile            → update nama admin
 * POST   /password           → ganti password
 * GET    /mahasiswa/:id/akun → cek apakah mahasiswa sudah punya akun login
 * POST   /mahasiswa/:id/akun → buat akun login untuk mahasiswa
 * PATCH  /mahasiswa/:id/akun → reset password atau toggle status akun mahasiswa
 */

import { Router } from "express";
import bcrypt     from "bcryptjs";

import prisma          from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// ════════════════════════════════════════════════════════════
//  GET /api/admin/stats  — statistik untuk dashboard admin
// ════════════════════════════════════════════════════════════
router.get("/stats", async (_req, res) => {
  try {
    const [
      totalMahasiswa,
      kegiatanMenunggu,
      kegiatanDisetujui,
      pengajuanMenunggu,
      skpiDraft,
      skpiResmi,
    ] = await Promise.all([
      prisma.mahasiswa.count(),
      prisma.kegiatanmahasiswa.count({ where: { status_verifikasi: "diproses" } }),
      prisma.kegiatanmahasiswa.count({ where: { status_verifikasi: "disetujui" } }),
      prisma.pengajuanskpi.count({ where: { status_pengajuan: "menunggu" } }),
      prisma.skpi.count({ where: { status: "draft" } }),
      prisma.skpi.count({ where: { status: "resmi" } }),
    ]);

    // Kegiatan per bulan (6 bulan terakhir) untuk grafik
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const kegiatanBulanan = await prisma.kegiatanmahasiswa.findMany({
      where: { tanggal_kegiatan: { gte: sixMonthsAgo } },
      select: { tanggal_kegiatan: true, status_verifikasi: true },
    });

    // Kelompokkan per bulan
    const bulanMap = {};
    for (const k of kegiatanBulanan) {
      if (!k.tanggal_kegiatan) continue;
      const key = k.tanggal_kegiatan.toISOString().slice(0, 7); // "2026-03"
      if (!bulanMap[key]) bulanMap[key] = { bulan: key, total: 0, disetujui: 0 };
      bulanMap[key].total++;
      if (k.status_verifikasi === "disetujui") bulanMap[key].disetujui++;
    }

    return res.json({
      totalMahasiswa,
      kegiatanMenunggu,
      kegiatanDisetujui,
      pengajuanMenunggu,
      skpiDraft,
      skpiResmi,
      kegiatanBulanan: Object.values(bulanMap).sort((a, b) => a.bulan.localeCompare(b.bulan)),
    });
  } catch (err) {
    console.error("GET /admin/stats error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/admin/profile
//  PATCH /api/admin/profile
// ════════════════════════════════════════════════════════════
router.get("/profile", async (req, res) => {
  try {
    const { user } = req;
    const admin = user.admin ?? null;
    res.json({
      id_admin:   admin?.id_admin ?? null,
      id_user:    user.user_id,
      nama_admin: admin?.nama_admin ?? user.username,
      email:      admin?.email ?? user.email ?? null,
      avatar:     admin?.avatar ?? null,
      is_active:  admin?.is_active ?? true,
    });
  } catch (err) {
    console.error("GET /admin/profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const { user }       = req;
    const admin          = user.admin ?? null;
    const { nama_admin } = req.body;

    if (!nama_admin || nama_admin.trim().length < 2) {
      return res.status(400).json({ error: "Nama minimal 2 karakter" });
    }
    if (admin) {
      await prisma.admin.update({
        where: { id_admin: admin.id_admin },
        data:  { nama_admin: nama_admin.trim() },
      });
    }
    res.json({ success: true, message: "Profil berhasil diperbarui" });
  } catch (err) {
    console.error("PATCH /admin/profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/admin/password
// ════════════════════════════════════════════════════════════
router.post("/password", async (req, res) => {
  try {
    const { user }                         = req;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Password lama dan baru wajib diisi" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password baru minimal 6 karakter" });
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: "Password saat ini tidak sesuai" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({
      where: { user_id: user.user_id },
      data:  { password: hashed, updated_at: new Date() },
    });
    res.json({ message: "Password berhasil diperbarui" });
  } catch (err) {
    console.error("POST /admin/password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/admin/mahasiswa/:id/akun
//  Cek apakah mahasiswa sudah punya akun login
// ════════════════════════════════════════════════════════════
router.get("/mahasiswa/:id/akun", async (req, res) => {
  try {
    const id  = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

    const mhs = await prisma.mahasiswa.findUnique({
      where:   { id_mahasiswa: id },
      include: { users: { select: { user_id: true, username: true, status_akun: true, created_at: true } } },
    });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });

    if (!mhs.id_user || !mhs.users) {
      return res.json({ has_akun: false, mahasiswa: { nim: mhs.nim, nama: mhs.nama } });
    }

    return res.json({
      has_akun:  true,
      akun: {
        user_id:     mhs.users.user_id,
        username:    mhs.users.username,
        status_akun: mhs.users.status_akun,
        created_at:  mhs.users.created_at,
      },
    });
  } catch (err) {
    console.error("GET /admin/mahasiswa/:id/akun error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/admin/mahasiswa/:id/akun
//  Buat akun login untuk mahasiswa (username = NIM)
//  Body: { password? }  — default password = NIM itu sendiri
// ════════════════════════════════════════════════════════════
router.post("/mahasiswa/:id/akun", async (req, res) => {
  try {
    const id  = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

    const mhs = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id } });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });

    if (mhs.id_user) {
      return res.status(409).json({ error: "Mahasiswa sudah memiliki akun login" });
    }

    // Cek apakah username (NIM) sudah dipakai akun lain
    const existing = await prisma.users.findFirst({ where: { username: mhs.nim } });
    if (existing) {
      return res.status(409).json({ error: `Username ${mhs.nim} sudah digunakan akun lain` });
    }

    const plainPassword = req.body.password?.trim() || mhs.nim; // default = NIM
    const hashed        = await bcrypt.hash(plainPassword, 12);

    const user = await prisma.users.create({
      data: {
        username:    mhs.nim,
        password:    hashed,
        role:        "mahasiswa",
        email:       mhs.email ?? null,
        status_akun: "aktif",
        updated_at:  new Date(),
      },
    });

    // Hubungkan user ke mahasiswa
    await prisma.mahasiswa.update({
      where: { id_mahasiswa: id },
      data:  { id_user: user.user_id },
    });

    return res.status(201).json({
      success:  true,
      message:  `Akun berhasil dibuat. Username: ${mhs.nim}, Password: ${plainPassword}`,
      username: mhs.nim,
    });
  } catch (err) {
    console.error("POST /admin/mahasiswa/:id/akun error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/admin/mahasiswa/:id/akun
//  Reset password atau toggle status akun mahasiswa
//  Body: { action: "reset_password" | "toggle_status", password? }
// ════════════════════════════════════════════════════════════
router.patch("/mahasiswa/:id/akun", async (req, res) => {
  try {
    const id  = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

    const mhs = await prisma.mahasiswa.findUnique({
      where:   { id_mahasiswa: id },
      include: { users: true },
    });
    if (!mhs || !mhs.id_user) {
      return res.status(404).json({ error: "Mahasiswa atau akun tidak ditemukan" });
    }

    const { action, password } = req.body;

    // ── Reset password ──────────────────────────────────────
    if (action === "reset_password") {
      const newPass = password?.trim() || mhs.nim; // default reset ke NIM
      const hashed  = await bcrypt.hash(newPass, 12);
      await prisma.users.update({
        where: { user_id: mhs.id_user },
        data:  { password: hashed, updated_at: new Date() },
      });
      return res.json({
        success: true,
        message: `Password berhasil direset. Password baru: ${newPass}`,
      });
    }

    // ── Toggle status akun ──────────────────────────────────
    if (action === "toggle_status") {
      const user       = mhs.users;
      const newStatus  = user.status_akun === "aktif" ? "nonaktif" : "aktif";
      await prisma.users.update({
        where: { user_id: mhs.id_user },
        data:  { status_akun: newStatus, updated_at: new Date() },
      });
      return res.json({
        success:    true,
        status_akun: newStatus,
        message:    `Akun berhasil di${newStatus === "aktif" ? "aktifkan" : "nonaktifkan"}`,
      });
    }

    return res.status(400).json({ error: "Action tidak dikenal. Gunakan: reset_password atau toggle_status" });
  } catch (err) {
    console.error("PATCH /admin/mahasiswa/:id/akun error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;