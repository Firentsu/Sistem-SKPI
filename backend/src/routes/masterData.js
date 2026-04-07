import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/master-data  — ambil semua master data sekaligus
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const [
      programStudi,
      jenisAktivitas,
      kategoriAktivitas,
      kelompokAktivitas,
      levelKegiatan,
      posisiKegiatan,
      periodeAkademik,
    ] = await Promise.all([
      prisma.programstudi.findMany({ orderBy: { nama_prodi: "asc" } }),
      prisma.jenisaktivitas.findMany({ orderBy: { nama_indo: "asc" } }),
      prisma.kategoriaktivitas.findMany({ orderBy: { nama_indo: "asc" } }),
      prisma.kelompokaktivitas.findMany({ orderBy: { nama_indo: "asc" } }),
      prisma.levelkegiatan.findMany({ orderBy: { nama_level: "asc" } }),
      prisma.posisikegiatan.findMany({ orderBy: { nama_posisi: "asc" } }),
      prisma.periodeakademik.findMany({ orderBy: { nama_periode: "asc" } }),
    ]);

    return res.status(200).json({
      programStudi,
      jenisAktivitas,
      kategoriAktivitas,
      kelompokAktivitas,
      levelKegiatan,
      posisiKegiatan,
      periodeAkademik,
    });
  } catch (err) {
    console.error("GET /api/master-data error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/master-data/prodi
// ─────────────────────────────────────────────────────────────────────────────
router.get("/prodi", requireAuth, async (req, res) => {
  try {
    const data = await prisma.programstudi.findMany({ orderBy: { nama_prodi: "asc" } });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/master-data/prodi
// body: { nama_prodi, fakultas }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/prodi", requireAuth, async (req, res) => {
  try {
    const { nama_prodi, fakultas } = req.body;
    if (!nama_prodi || !fakultas) {
      return res.status(400).json({ error: "nama_prodi dan fakultas wajib diisi." });
    }

    const data = await prisma.programstudi.create({ data: { nama_prodi, fakultas } });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/master-data/prodi/:id
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/prodi/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama_prodi, fakultas } = req.body;

    const data = await prisma.programstudi.update({
      where: { id_prodi: id },
      data: {
        ...(nama_prodi && { nama_prodi }),
        ...(fakultas   && { fakultas }),
      },
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/master-data/prodi/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/prodi/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.programstudi.delete({ where: { id_prodi: id } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Pola yang sama untuk jenis, kategori, kelompok aktivitas
// Gunakan factory function agar tidak mengulang kode
// ─────────────────────────────────────────────────────────────────────────────
function masterDataRouter(model, idField, pathPrefix) {
  router.get(`/${pathPrefix}`, requireAuth, async (req, res) => {
    try {
      const data = await prisma[model].findMany({ orderBy: { nama_indo: "asc" } });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: "Server error." });
    }
  });

  router.post(`/${pathPrefix}`, requireAuth, async (req, res) => {
    try {
      const { nama_indo, nama_eng } = req.body;
      if (!nama_indo || !nama_eng) {
        return res.status(400).json({ error: "nama_indo dan nama_eng wajib diisi." });
      }
      const data = await prisma[model].create({ data: { nama_indo, nama_eng } });
      return res.status(201).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ error: "Server error." });
    }
  });

  router.patch(`/${pathPrefix}/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { nama_indo, nama_eng, status } = req.body;
      const data = await prisma[model].update({
        where: { [idField]: id },
        data: {
          ...(nama_indo !== undefined && { nama_indo }),
          ...(nama_eng  !== undefined && { nama_eng }),
          ...(status    !== undefined && { status }),
        },
      });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ error: "Server error." });
    }
  });

  router.delete(`/${pathPrefix}/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await prisma[model].delete({ where: { [idField]: id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Server error." });
    }
  });
}

masterDataRouter("jenisaktivitas",    "id_jenis",    "jenis-aktivitas");
masterDataRouter("kategoriaktivitas", "id_kategori", "kategori-aktivitas");
masterDataRouter("kelompokaktivitas", "id_kelompok", "kelompok-aktivitas");

export default router;
