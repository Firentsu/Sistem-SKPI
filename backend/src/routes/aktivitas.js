import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/aktivitas
// Query: ?status=diproses|disetujui|ditolak|revisi&mahasiswa_id=1&page=1
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, mahasiswa_id, page: pageStr } = req.query;
    const page = parseInt(pageStr || "1", 10) || 1;
    const pageSize = 10;
    
    const where = {};
    if (status) where.status_verifikasi = status;
    if (mahasiswa_id) where.id_mahasiswa = parseInt(mahasiswa_id);

    const [total, rows] = await Promise.all([
      prisma.kegiatanmahasiswa.count({ where }),
      prisma.kegiatanmahasiswa.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          mahasiswa: { select: { nama: true, nim: true } },
          jenisaktivitas: true,
          kategoriaktivitas: true,
          kelompokaktivitas: true,
          levelkegiatan: true,
          posisikegiatan: true,
          buktikegiatan: true,
        },
        orderBy: { tanggal_kegiatan: "desc" },
      }),
    ]);

    return res.status(200).json({ total, page, pageSize, rows });
  } catch (err) {
    console.error("GET /api/aktivitas error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/aktivitas/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const aktivitas = await prisma.kegiatanmahasiswa.findUnique({
      where: { id_kegiatan: id },
      include: {
        mahasiswa: true,
        jenisaktivitas: true,
        kategoriaktivitas: true,
        kelompokaktivitas: true,
        levelkegiatan: true,
        posisikegiatan: true,
        buktikegiatan: true,
      },
    });

    if (!aktivitas) return res.status(404).json({ error: "Aktivitas tidak ditemukan." });

    return res.status(200).json(aktivitas);
  } catch (err) {
    console.error("GET /api/aktivitas/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/aktivitas/:id/verifikasi
// body: { status: "disetujui"|"ditolak"|"revisi", catatan_admin?: string }
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:id/verifikasi", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const { status, catatan_admin } = req.body;
    const validStatus = ["diproses", "disetujui", "ditolak", "revisi"];

    if (!status || !validStatus.includes(status)) {
      return res.status(400).json({ error: `Status harus salah satu: ${validStatus.join(", ")}.` });
    }

    const aktivitas = await prisma.kegiatanmahasiswa.update({
      where: { id_kegiatan: id },
      data: {
        status_verifikasi: status,
        catatan_admin: catatan_admin || null,
      },
    });

    return res.status(200).json({ success: true, data: aktivitas });
  } catch (err) {
    console.error("PATCH /api/aktivitas/:id/verifikasi error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;
