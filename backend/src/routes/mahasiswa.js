import { Router } from "express";

import prisma          from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Semua route mahasiswa wajib login
router.use(requireAuth);

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa
//  Query params: q (search), prodi, page
// ════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { q, prodi, page = "1" } = req.query;
    const pageNum  = parseInt(page, 10) || 1;
    const pageSize = 10;

    const where = {};
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { nim:  { contains: q } },
      ];
    }
    if (prodi && prodi !== "Semua") {
      const p = await prisma.programstudi.findFirst({ where: { nama_prodi: prodi } });
      if (p) where.id_prodi = p.id_prodi;
    }

    const [total, rows] = await Promise.all([
      prisma.mahasiswa.count({ where }),
      prisma.mahasiswa.findMany({
        where,
        skip:    (pageNum - 1) * pageSize,
        take:    pageSize,
        include: { programstudi: true },
        orderBy: { nama: "asc" },
      }),
    ]);

    res.json({ total, page: pageNum, pageSize, rows });
  } catch (err) {
    console.error("GET /mahasiswa error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/:id   → detail satu mahasiswa
// ════════════════════════════════════════════════════════════
router.get("/:id", async (req, res) => {
  try {
    const id  = parseInt(req.params.id, 10);
    const mhs = await prisma.mahasiswa.findUnique({
      where:   { id_mahasiswa: id },
      include: { programstudi: true, kegiatanmahasiswa: true },
    });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });
    res.json(mhs);
  } catch (err) {
    console.error("GET /mahasiswa/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa   → tambah mahasiswa baru
// ════════════════════════════════════════════════════════════
router.post("/", async (req, res) => {
  try {
    const { nim, nama, id_prodi, angkatan, email } = req.body;
    if (!nim || !nama) return res.status(400).json({ error: "NIM dan nama wajib diisi" });

    const existing = await prisma.mahasiswa.findFirst({ where: { nim } });
    if (existing) return res.status(409).json({ error: "NIM sudah terdaftar" });

    const mhs = await prisma.mahasiswa.create({
      data: { nim, nama, id_prodi: id_prodi ? parseInt(id_prodi) : null, angkatan, email },
    });
    res.status(201).json(mhs);
  } catch (err) {
    console.error("POST /mahasiswa error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/mahasiswa/:id   → update data mahasiswa
// ════════════════════════════════════════════════════════════
router.patch("/:id", async (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const data = req.body;
    const mhs  = await prisma.mahasiswa.update({ where: { id_mahasiswa: id }, data });
    res.json(mhs);
  } catch (err) {
    console.error("PATCH /mahasiswa/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/mahasiswa/:id
// ════════════════════════════════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.mahasiswa.delete({ where: { id_mahasiswa: id } });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /mahasiswa/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
