import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skpi  — daftar semua SKPI
// Query: ?status=draft|resmi&mahasiswa_id=1&page=1
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, mahasiswa_id, page: pageStr } = req.query;
    const page     = parseInt(pageStr || "1", 10) || 1;
    const pageSize = 10;

    const where = {};
    if (status)       where.status       = status;
    if (mahasiswa_id) where.id_mahasiswa = parseInt(mahasiswa_id);

    const [total, rows] = await Promise.all([
      prisma.skpi.count({ where }),
      prisma.skpi.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { mahasiswa: { select: { nama: true, nim: true } } },
        orderBy: { tanggal_terbit: "desc" },
      }),
    ]);

    return res.status(200).json({ total, page, pageSize, rows });
  } catch (err) {
    console.error("GET /api/skpi error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skpi/riwayat  — riwayat generate SKPI
// ─────────────────────────────────────────────────────────────────────────────
router.get("/riwayat", requireAuth, async (req, res) => {
  try {
    const { mahasiswa_id, page: pageStr } = req.query;
    const page     = parseInt(pageStr || "1", 10) || 1;
    const pageSize = 10;

    const where = {};
    if (mahasiswa_id) where.id_mahasiswa = parseInt(mahasiswa_id);

    const [total, rows] = await Promise.all([
      prisma.riwayatskpi.count({ where }),
      prisma.riwayatskpi.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          mahasiswa: { select: { nama: true, nim: true } },
          skpi:      true,
        },
        orderBy: { tanggal_generate: "desc" },
      }),
    ]);

    return res.status(200).json({ total, page, pageSize, rows });
  } catch (err) {
    console.error("GET /api/skpi/riwayat error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skpi/template  — daftar template SKPI
// ─────────────────────────────────────────────────────────────────────────────
router.get("/template", requireAuth, async (req, res) => {
  try {
    const templates = await prisma.templateskpi.findMany({
      include: { sectiontemplate: { orderBy: { urutan: "asc" } } },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json(templates);
  } catch (err) {
    console.error("GET /api/skpi/template error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/skpi/template  — buat template SKPI baru
// body: { nama_template, sections: [{judul_indo, judul_eng, urutan}] }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/template", requireAuth, async (req, res) => {
  try {
    const { nama_template, sections } = req.body;

    if (!nama_template) {
      return res.status(400).json({ error: "Nama template wajib diisi." });
    }

    const template = await prisma.templateskpi.create({
      data: {
        nama_template,
        sectiontemplate: sections?.length
          ? {
              create: sections.map((s, i) => ({
                judul_indo: s.judul_indo,
                judul_eng:  s.judul_eng,
                urutan:     s.urutan ?? i + 1,
              })),
            }
          : undefined,
      },
      include: { sectiontemplate: true },
    });

    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    console.error("POST /api/skpi/template error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/skpi/generate
// body: { id_mahasiswa, id_template?, nomor_skpi? }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/generate", requireAuth, async (req, res) => {
  try {
    const { id_mahasiswa, id_template, nomor_skpi } = req.body;

    if (!id_mahasiswa) {
      return res.status(400).json({ error: "ID mahasiswa wajib diisi." });
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa: parseInt(id_mahasiswa) },
    });

    if (!mahasiswa) {
      return res.status(404).json({ error: "Mahasiswa tidak ditemukan." });
    }

    // Cek versi SKPI terakhir
    const lastSkpi = await prisma.skpi.findFirst({
      where:   { id_mahasiswa: parseInt(id_mahasiswa) },
      orderBy: { versi: "desc" },
    });

    const versi = (lastSkpi?.versi ?? 0) + 1;

    // Buat SKPI baru
    const skpi = await prisma.skpi.create({
      data: {
        id_mahasiswa:  parseInt(id_mahasiswa),
        nomor_skpi:    nomor_skpi || `SKPI/${mahasiswa.nim}/${versi}`,
        tanggal_terbit: new Date(),
        versi,
        status: "draft",
      },
    });

    // Catat riwayat
    await prisma.riwayatskpi.create({
      data: {
        id_skpi:          skpi.id_skpi,
        id_mahasiswa:     parseInt(id_mahasiswa),
        tanggal_generate: new Date(),
        keterangan:       `Generate SKPI versi ${versi}`,
      },
    });

    // Update status mahasiswa
    await prisma.mahasiswa.update({
      where: { id_mahasiswa: parseInt(id_mahasiswa) },
      data:  { status_skpi: "diajukan" },
    });

    return res.status(201).json({ success: true, data: skpi });
  } catch (err) {
    console.error("POST /api/skpi/generate error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/skpi/:id/status
// body: { status: "draft" | "resmi" }
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const { status } = req.body;
    if (!["draft", "resmi"].includes(status)) {
      return res.status(400).json({ error: "Status harus 'draft' atau 'resmi'." });
    }

    const skpi = await prisma.skpi.update({
      where: { id_skpi: id },
      data:  { status },
    });

    // Jika resmi, update status mahasiswa jadi diterbitkan
    if (status === "resmi") {
      await prisma.mahasiswa.update({
        where: { id_mahasiswa: skpi.id_mahasiswa },
        data:  { status_skpi: "diterbitkan" },
      });
    }

    return res.status(200).json({ success: true, data: skpi });
  } catch (err) {
    console.error("PATCH /api/skpi/:id/status error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;
