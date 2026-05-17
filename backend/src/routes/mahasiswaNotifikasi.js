/**
 * /api/mahasiswa/notifikasi — Notifikasi milik mahasiswa yang sedang login
 *
 * GET    /              → ambil daftar notifikasi
 * PATCH  /baca-semua   → tandai semua sudah dibaca
 * PATCH  /:id/baca     → tandai satu sudah dibaca
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireMahasiswaAuth } from "../middleware/mahasiswaAuth.js";

const router = Router();
router.use(requireMahasiswaAuth);

// PENTING: route statis (/baca-semua) harus didaftarkan SEBELUM route dinamis (/:id/...)
router.patch("/baca-semua", async (req, res) => {
  try {
    await prisma.notifikasi.updateMany({
      where: { id_user: req.mahasiswaUser.user_id, status_baca: false },
      data:  { status_baca: true },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /mahasiswa/notifikasi/baca-semua error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/baca", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

    await prisma.notifikasi.updateMany({
      where: { id_notifikasi: id, id_user: req.mahasiswaUser.user_id },
      data:  { status_baca: true },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /mahasiswa/notifikasi/:id/baca error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const userId = req.mahasiswaUser.user_id;

    const [rows, unread] = await Promise.all([
      prisma.notifikasi.findMany({
        where:   { id_user: userId },
        orderBy: { created_at: "desc" },
        take:    limit,
        select: {
          id_notifikasi: true,
          judul:         true,
          pesan:         true,
          status_baca:   true,
          created_at:    true,
        },
      }),
      prisma.notifikasi.count({
        where: { id_user: userId, status_baca: false },
      }),
    ]);

    return res.json({ rows, unread });
  } catch (err) {
    console.error("GET /mahasiswa/notifikasi error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
