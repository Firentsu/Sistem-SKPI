/**
 * /api/master-data  — Manajemen semua master data (akses admin)
 *
 * GET    /                        → semua master data sekaligus
 * GET/POST/PATCH/DELETE /prodi    → Program Studi
 * GET/POST/PATCH/DELETE /jenis-aktivitas
 * GET/POST/PATCH/DELETE /kategori-aktivitas
 * GET/POST/PATCH/DELETE /kelompok-aktivitas
 * GET/POST/PATCH/DELETE /level-kegiatan
 * GET/POST/PATCH/DELETE /posisi-kegiatan
 * GET/POST/PATCH/DELETE /periode-akademik
 */

import express from "express";
import prisma  from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ════════════════════════════════════════════════════════════
//  GET /api/master-data  — semua sekaligus (untuk form dropdown)
// ════════════════════════════════════════════════════════════
router.get("/", requireAuth, async (_req, res) => {
  try {
    const [
      programStudi, jenisAktivitas, kategoriAktivitas,
      kelompokAktivitas, levelKegiatan, posisiKegiatan, periodeAkademik,
    ] = await Promise.all([
      prisma.programstudi.findMany({ orderBy: { nama_prodi: "asc" } }),
      prisma.jenisaktivitas.findMany({ where: { status: true }, orderBy: { nama_indo: "asc" } }),
      prisma.kategoriaktivitas.findMany({ where: { status: true }, orderBy: { nama_indo: "asc" } }),
      prisma.kelompokaktivitas.findMany({ where: { status: true }, orderBy: { nama_indo: "asc" } }),
      prisma.levelkegiatan.findMany({ orderBy: { nama_level: "asc" } }),
      prisma.posisikegiatan.findMany({ orderBy: { nama_posisi: "asc" } }),
      prisma.periodeakademik.findMany({ where: { status: true }, orderBy: { nama_periode: "desc" } }),
    ]);
    return res.json({ programStudi, jenisAktivitas, kategoriAktivitas, kelompokAktivitas, levelKegiatan, posisiKegiatan, periodeAkademik });
  } catch (err) {
    console.error("GET /api/master-data error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  Factory helper — buat CRUD route untuk tabel master data
//  sederhana (yang punya nama_indo + nama_eng + status)
// ════════════════════════════════════════════════════════════
function makeCRUD(model, idField, path, extraFields = {}) {
  // GET list
  router.get(`/${path}`, requireAuth, async (_req, res) => {
    try {
      const rows = await prisma[model].findMany({ orderBy: { nama_indo: "asc" } });
      return res.json(rows);
    } catch (err) {
      console.error(`GET /${path}:`, err);
      return res.status(500).json({ error: "Server error." });
    }
  });

  // POST create
  router.post(`/${path}`, requireAuth, async (req, res) => {
    try {
      const { nama_indo, nama_eng, ...rest } = req.body;
      if (!nama_indo || !nama_eng) {
        return res.status(400).json({ error: "nama_indo dan nama_eng wajib diisi." });
      }
      const row = await prisma[model].create({
        data: { nama_indo, nama_eng, status: true, ...extraFields, ...rest },
      });
      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      console.error(`POST /${path}:`, err);
      return res.status(500).json({ error: "Server error." });
    }
  });

  // PATCH update
  router.patch(`/${path}/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      const { nama_indo, nama_eng, status, ...rest } = req.body;
      const row = await prisma[model].update({
        where: { [idField]: id },
        data: {
          ...(nama_indo !== undefined && { nama_indo }),
          ...(nama_eng  !== undefined && { nama_eng }),
          ...(status    !== undefined && { status: Boolean(status) }),
          ...rest,
        },
      });
      return res.json({ success: true, data: row });
    } catch (err) {
      console.error(`PATCH /${path}/:id:`, err);
      return res.status(500).json({ error: "Server error." });
    }
  });

  // DELETE
  router.delete(`/${path}/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
      await prisma[model].delete({ where: { [idField]: id } });
      return res.json({ success: true });
    } catch (err) {
      console.error(`DELETE /${path}/:id:`, err);
      // Kalau ada relasi, softdelete via status
      if (err.code === "P2003") {
        return res.status(409).json({ error: "Data masih digunakan, tidak bisa dihapus." });
      }
      return res.status(500).json({ error: "Server error." });
    }
  });
}

// Register semua tabel master data
makeCRUD("jenisaktivitas",    "id_jenis",    "jenis-aktivitas");
makeCRUD("kategoriaktivitas", "id_kategori", "kategori-aktivitas");
makeCRUD("kelompokaktivitas", "id_kelompok", "kelompok-aktivitas");

// ── Level kegiatan (tidak punya nama_eng, hanya nama_level) ─
router.get("/level-kegiatan", requireAuth, async (_req, res) => {
  try {
    return res.json(await prisma.levelkegiatan.findMany({ orderBy: { nama_level: "asc" } }));
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.post("/level-kegiatan", requireAuth, async (req, res) => {
  try {
    const { nama_level } = req.body;
    if (!nama_level) return res.status(400).json({ error: "nama_level wajib diisi." });
    const row = await prisma.levelkegiatan.create({ data: { nama_level } });
    return res.status(201).json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.patch("/level-kegiatan/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await prisma.levelkegiatan.update({
      where: { id_level: id },
      data: { nama_level: req.body.nama_level },
    });
    return res.json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.delete("/level-kegiatan/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.levelkegiatan.delete({ where: { id_level: id } });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === "P2003") return res.status(409).json({ error: "Data masih digunakan." });
    return res.status(500).json({ error: "Server error." });
  }
});

// ── Posisi kegiatan (hanya nama_posisi) ─────────────────────
router.get("/posisi-kegiatan", requireAuth, async (_req, res) => {
  try {
    return res.json(await prisma.posisikegiatan.findMany({ orderBy: { nama_posisi: "asc" } }));
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.post("/posisi-kegiatan", requireAuth, async (req, res) => {
  try {
    const { nama_posisi } = req.body;
    if (!nama_posisi) return res.status(400).json({ error: "nama_posisi wajib diisi." });
    const row = await prisma.posisikegiatan.create({ data: { nama_posisi } });
    return res.status(201).json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.patch("/posisi-kegiatan/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await prisma.posisikegiatan.update({
      where: { id_posisi: id },
      data: { nama_posisi: req.body.nama_posisi },
    });
    return res.json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.delete("/posisi-kegiatan/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.posisikegiatan.delete({ where: { id_posisi: id } });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === "P2003") return res.status(409).json({ error: "Data masih digunakan." });
    return res.status(500).json({ error: "Server error." });
  }
});

// ── Periode akademik ────────────────────────────────────────
router.get("/periode-akademik", requireAuth, async (_req, res) => {
  try {
    return res.json(await prisma.periodeakademik.findMany({ orderBy: { nama_periode: "desc" } }));
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.post("/periode-akademik", requireAuth, async (req, res) => {
  try {
    const { nama_periode, semester } = req.body;
    if (!nama_periode || !semester) return res.status(400).json({ error: "nama_periode dan semester wajib diisi." });
    if (!["Ganjil", "Genap"].includes(semester)) return res.status(400).json({ error: "semester harus Ganjil atau Genap." });
    const row = await prisma.periodeakademik.create({ data: { nama_periode, semester, status: true } });
    return res.status(201).json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.patch("/periode-akademik/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama_periode, semester, status } = req.body;
    const row = await prisma.periodeakademik.update({
      where: { id_periode: id },
      data: {
        ...(nama_periode !== undefined && { nama_periode }),
        ...(semester     !== undefined && { semester }),
        ...(status       !== undefined && { status: Boolean(status) }),
      },
    });
    return res.json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.delete("/periode-akademik/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.periodeakademik.delete({ where: { id_periode: id } });
    return res.json({ success: true });
  } catch { return res.status(500).json({ error: "Server error." }); }
});

// ── Program Studi ───────────────────────────────────────────
router.get("/prodi", requireAuth, async (_req, res) => {
  try {
    return res.json(await prisma.programstudi.findMany({ orderBy: { nama_prodi: "asc" } }));
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.post("/prodi", requireAuth, async (req, res) => {
  try {
    const { nama_prodi, fakultas } = req.body;
    if (!nama_prodi || !fakultas) return res.status(400).json({ error: "nama_prodi dan fakultas wajib diisi." });
    const row = await prisma.programstudi.create({ data: { nama_prodi, fakultas } });
    return res.status(201).json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.patch("/prodi/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama_prodi, fakultas } = req.body;
    const row = await prisma.programstudi.update({
      where: { id_prodi: id },
      data: {
        ...(nama_prodi && { nama_prodi }),
        ...(fakultas   && { fakultas }),
      },
    });
    return res.json({ success: true, data: row });
  } catch { return res.status(500).json({ error: "Server error." }); }
});
router.delete("/prodi/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.programstudi.delete({ where: { id_prodi: id } });
    return res.json({ success: true });
  } catch (err) {
    if (err.code === "P2003") return res.status(409).json({ error: "Prodi masih memiliki mahasiswa terdaftar." });
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;