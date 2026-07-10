import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ─── GET semua dokumen ────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { kategori, q } = req.query;
    const where = {};
    if (kategori && kategori !== "Semua") where.kategori = kategori;
    if (q) {
      where.OR = [
        { judul: { contains: q } },
        { deskripsi: { contains: q } },
      ];
    }
    const docs = await prisma.dokumentasi.findMany({
      where,
      orderBy: { updated_at: "desc" },
    });
    return res.status(200).json(docs);
  } catch (err) {
    console.error("GET /api/dokumentasi error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─── GET satu dokumen ─────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    const doc = await prisma.dokumentasi.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ error: "Dokumen tidak ditemukan." });
    return res.status(200).json(doc);
  } catch (err) {
    console.error("GET /api/dokumentasi/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─── POST tambah dokumen ──────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { judul, kategori, deskripsi, konten, file_url, diagram_xml } = req.body;
    if (!judul || !kategori) {
      return res.status(400).json({ error: "Judul dan kategori wajib diisi." });
    }
    const doc = await prisma.dokumentasi.create({
      data: {
        judul,
        kategori,
        deskripsi,
        konten,
        file_url,
        diagram_xml,
      },
    });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("POST /api/dokumentasi error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─── PUT update dokumen ────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    const { judul, kategori, deskripsi, konten, file_url, diagram_xml } = req.body;
    const doc = await prisma.dokumentasi.update({
      where: { id },
      data: { judul, kategori, deskripsi, konten, file_url, diagram_xml },
    });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error("PUT /api/dokumentasi/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─── DELETE dokumen ────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });
    await prisma.dokumentasi.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DELETE /api/dokumentasi/:id error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;