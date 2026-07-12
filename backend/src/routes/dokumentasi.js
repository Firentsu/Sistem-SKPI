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

// ─── GET import diagram dari URL (draw.io / Google Drive) ─────────
// Editor draw.io tak bisa memuat link Drive langsung (CORS + butuh login
// Google), jadi backend yang menariknya (server-to-server, tanpa CORS).
// Host dibatasi (allowlist) untuk mencegah SSRF ke jaringan internal.
const IMPORT_ALLOWED_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
  "app.diagrams.net",
  "viewer.diagrams.net",
  "embed.diagrams.net",
  "www.draw.io",
  "draw.io",
]);

function extractDriveId(raw) {
  let m = raw.match(/#G([A-Za-z0-9_-]+)/);          // app.diagrams.net/#G<id>
  if (m) return m[1];
  m = raw.match(/\/file\/d\/([A-Za-z0-9_-]+)/);      // drive.google.com/file/d/<id>/
  if (m) return m[1];
  m = raw.match(/[?&#]id=([A-Za-z0-9_-]+)/);         // ?id=<id> / &id=<id>
  if (m) return m[1];
  return null;
}

router.get("/import", requireAuth, async (req, res) => {
  try {
    const raw = String(req.query.url || "").trim();
    if (!raw) return res.status(400).json({ error: "URL kosong." });

    let parsed;
    try { parsed = new URL(raw); } catch { return res.status(400).json({ error: "URL tidak valid." }); }
    if (parsed.protocol !== "https:") {
      return res.status(400).json({ error: "Hanya URL https yang didukung." });
    }
    if (!IMPORT_ALLOWED_HOSTS.has(parsed.hostname)) {
      return res.status(400).json({ error: "Host tidak didukung. Gunakan tautan Google Drive atau draw.io." });
    }

    const driveId = extractDriveId(raw);
    let fetchUrl;
    if (driveId) {
      fetchUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    } else if (/\.(drawio|xml)(\?|$)/i.test(parsed.pathname)) {
      fetchUrl = raw; // tautan langsung ke berkas .drawio/.xml pada host tepercaya
    } else {
      return res.status(422).json({ error: "ID diagram tidak ditemukan pada tautan. Pastikan ini tautan file Google Drive / draw.io." });
    }

    let r = await fetch(fetchUrl, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
    let text = await r.text();

    // File besar bisa memicu halaman konfirmasi "virus scan" → ulangi dgn token.
    const ctype = r.headers.get("content-type") || "";
    if (/text\/html/i.test(ctype) && /confirm=/.test(text)) {
      const t = text.match(/confirm=([0-9A-Za-z_-]+)/);
      if (t) {
        r = await fetch(`${fetchUrl}&confirm=${t[1]}`, { headers: { "User-Agent": "Mozilla/5.0" } });
        text = await r.text();
      }
    }

    if (!/<mxfile|<mxGraphModel/i.test(text)) {
      return res.status(422).json({
        error: "Diagram tidak bisa diambil. Pastikan file dibagikan sebagai 'Anyone with the link'.",
      });
    }

    return res.status(200).json({ xml: text });
  } catch (err) {
    console.error("GET /api/dokumentasi/import error:", err);
    return res.status(500).json({ error: "Gagal mengambil diagram dari URL." });
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