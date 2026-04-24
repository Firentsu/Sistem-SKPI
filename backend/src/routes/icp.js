/**
 * /api/icp  — Manajemen ICP (Indeks Capaian Pembelajaran)
 *
 * GET    /                         → daftar semua kategori ICP
 * POST   /                         → tambah kategori ICP (admin)
 * PATCH  /:id                      → update kategori ICP (admin)
 * DELETE /:id                      → hapus kategori ICP (admin)
 * GET    /mahasiswa/:mahasiswa_id   → ICP seorang mahasiswa + total poin
 * PUT    /mahasiswa/:mahasiswa_id   → set/update poin ICP per kategori (admin)
 * GET    /summary                  → ringkasan poin ICP semua mahasiswa (admin)
 */

import express from "express";
import prisma  from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ════════════════════════════════════════════════════════════
//  GET /api/icp  — semua kategori ICP
// ════════════════════════════════════════════════════════════
router.get("/", requireAuth, async (_req, res) => {
  try {
    const rows = await prisma.icpkategori.findMany({ orderBy: { id_icp: "asc" } });
    return res.json(rows);
  } catch (err) {
    console.error("GET /api/icp error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/icp/summary  — total poin ICP semua mahasiswa
// ════════════════════════════════════════════════════════════
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const { page: pageStr } = req.query;
    const page     = parseInt(pageStr || "1", 10) || 1;
    const pageSize = 20;

    // Ambil semua mahasiswa beserta total poin ICP mereka
    const [total, mahasiswaList] = await Promise.all([
      prisma.mahasiswa.count(),
      prisma.mahasiswa.findMany({
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: {
          programstudi:  { select: { nama_prodi: true } },
          icpmahasiswa:  { include: { icpkategori: true } },
        },
        orderBy: { nama: "asc" },
      }),
    ]);

    const rows = mahasiswaList.map(m => {
      const totalPoin = m.icpmahasiswa.reduce((sum, i) => sum + (i.total_poin ?? 0), 0);
      return {
        id_mahasiswa: m.id_mahasiswa,
        nim:          m.nim,
        nama:         m.nama,
        prodi:        m.programstudi?.nama_prodi ?? "-",
        total_poin:   totalPoin,
        detail_icp:   m.icpmahasiswa.map(i => ({
          id_icp:      i.id_icp,
          nama_indo:   i.icpkategori?.nama_indo,
          bobot_poin:  i.icpkategori?.bobot_poin,
          total_poin:  i.total_poin,
        })),
      };
    });

    return res.json({ total, page, pageSize, rows });
  } catch (err) {
    console.error("GET /api/icp/summary error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/icp/mahasiswa/:mahasiswa_id
// ════════════════════════════════════════════════════════════
router.get("/mahasiswa/:mahasiswa_id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.mahasiswa_id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    // Ambil semua kategori ICP
    const kategoris = await prisma.icpkategori.findMany({ orderBy: { id_icp: "asc" } });

    // Ambil poin mahasiswa per kategori
    const existing = await prisma.icpmahasiswa.findMany({
      where:   { id_mahasiswa: id },
      include: { icpkategori: true },
    });
    const existingMap = Object.fromEntries(existing.map(e => [e.id_icp, e]));

    // Gabungkan: setiap kategori muncul, poin 0 jika belum diisi
    const merged = kategoris.map(k => ({
      id_icp:              k.id_icp,
      nama_indo:           k.nama_indo,
      nama_eng:            k.nama_eng,
      bobot_poin:          k.bobot_poin,
      total_poin:          existingMap[k.id_icp]?.total_poin ?? 0,
      id_icp_mahasiswa:    existingMap[k.id_icp]?.id_icp_mahasiswa ?? null,
    }));

    const totalPoin = merged.reduce((sum, k) => sum + k.total_poin, 0);

    return res.json({ data: merged, total_poin: totalPoin });
  } catch (err) {
    console.error("GET /api/icp/mahasiswa/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  PUT /api/icp/mahasiswa/:mahasiswa_id
//  Set/update poin ICP untuk mahasiswa. Upsert per kategori.
//  Body: { items: [{ id_icp: number, total_poin: number }] }
// ════════════════════════════════════════════════════════════
router.put("/mahasiswa/:mahasiswa_id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.mahasiswa_id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Field 'items' wajib berupa array yang tidak kosong." });
    }

    // Pastikan mahasiswa ada
    const mhs = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id } });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan." });

    // Upsert setiap item
    const results = await Promise.all(
      items.map(async ({ id_icp, total_poin }) => {
        const icpId  = parseInt(id_icp, 10);
        const poin   = parseInt(total_poin, 10);
        if (isNaN(icpId) || isNaN(poin) || poin < 0) return null;

        const existing = await prisma.icpmahasiswa.findFirst({
          where: { id_mahasiswa: id, id_icp: icpId },
        });

        if (existing) {
          return prisma.icpmahasiswa.update({
            where: { id_icp_mahasiswa: existing.id_icp_mahasiswa },
            data:  { total_poin: poin },
          });
        } else {
          return prisma.icpmahasiswa.create({
            data: { id_mahasiswa: id, id_icp: icpId, total_poin: poin },
          });
        }
      })
    );

    return res.json({ success: true, updated: results.filter(Boolean).length });
  } catch (err) {
    console.error("PUT /api/icp/mahasiswa/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/icp  — tambah kategori ICP baru
// ════════════════════════════════════════════════════════════
router.post("/", requireAuth, async (req, res) => {
  try {
    const { nama_indo, nama_eng, bobot_poin } = req.body;
    if (!nama_indo || !nama_eng || bobot_poin === undefined) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }
    const row = await prisma.icpkategori.create({
      data: { nama_indo, nama_eng, bobot_poin: parseInt(bobot_poin) },
    });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error("POST /api/icp error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/icp/:id
// ════════════════════════════════════════════════════════════
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    const { nama_indo, nama_eng, bobot_poin } = req.body;
    const row = await prisma.icpkategori.update({
      where: { id_icp: id },
      data:  {
        ...(nama_indo   !== undefined && { nama_indo }),
        ...(nama_eng    !== undefined && { nama_eng }),
        ...(bobot_poin  !== undefined && { bobot_poin: parseInt(bobot_poin) }),
      },
    });
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error("PATCH /api/icp/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/icp/:id
// ════════════════════════════════════════════════════════════
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    // Hapus relasi icpmahasiswa dulu
    await prisma.icpmahasiswa.deleteMany({ where: { id_icp: id } });
    await prisma.icpkategori.delete({ where: { id_icp: id } });
    return res.json({ success: true, message: "Kategori ICP berhasil dihapus." });
  } catch (err) {
    console.error("DELETE /api/icp/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;