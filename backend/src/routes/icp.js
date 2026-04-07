import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/icp  — daftar semua kategori ICP
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const kategoris = await prisma.icpkategori.findMany({
      orderBy: { id_icp: "asc" },
    });
    return res.status(200).json(kategoris);
  } catch (err) {
    console.error("GET /api/icp error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/icp/mahasiswa/:mahasiswa_id  — ICP seorang mahasiswa
// ─────────────────────────────────────────────────────────────────────────────
router.get("/mahasiswa/:mahasiswa_id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.mahasiswa_id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const data = await prisma.icpmahasiswa.findMany({
      where: { id_mahasiswa: id },
      include: { icpkategori: true },
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error("GET /api/icp/mahasiswa/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/icp  — tambah kategori ICP baru
// body: { nama_indo, nama_eng, bobot_poin }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { nama_indo, nama_eng, bobot_poin } = req.body;

    if (!nama_indo || !nama_eng || bobot_poin === undefined) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }

    const kategori = await prisma.icpkategori.create({
      data: {
        nama_indo,
        nama_eng,
        bobot_poin: parseInt(bobot_poin),
      },
    });

    return res.status(201).json({ success: true, data: kategori });
  } catch (err) {
    console.error("POST /api/icp error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/icp/:id  — update kategori ICP
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const { nama_indo, nama_eng, bobot_poin } = req.body;

    const kategori = await prisma.icpkategori.update({
      where: { id_icp: id },
      data: {
        ...(nama_indo   && { nama_indo }),
        ...(nama_eng    && { nama_eng }),
        ...(bobot_poin !== undefined && { bobot_poin: parseInt(bobot_poin) }),
      },
    });

    return res.status(200).json({ success: true, data: kategori });
  } catch (err) {
    console.error("PATCH /api/icp/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/icp/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    await prisma.icpkategori.delete({ where: { id_icp: id } });

    return res.status(200).json({ success: true, message: "Kategori ICP berhasil dihapus." });
  } catch (err) {
    console.error("DELETE /api/icp/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;
