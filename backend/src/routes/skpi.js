import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateSkpiDocx } from "../utils/generateSkpiDocx.js";
import { createNotif, getMahasiswaUserId } from "../utils/notifikasi.js";
import { randomUUID } from "crypto";
import os             from "os";
import fs             from "fs";
import path           from "path";
import { convertDocxToPdf } from "../utils/libreConvert.js";

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

const PRODI_CODES = {
  "Teknologi Informasi":           "TI",
  "Sistem Informasi":              "SI",
  "Manajemen":                     "MNJ",
  "Kewirausahaan":                 "KWU",
  "Pendidikan Guru Sekolah Dasar": "PGSD",
  "Agroekoteknologi":              "AGRO",
};
const ROMAN_MONTHS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

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
      include: { programstudi: true },
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

    // Generate nomor SKPI dinamis per prodi
    const prodiNama  = mahasiswa.programstudi?.nama_prodi || "";
    const prodiCode  = PRODI_CODES[prodiNama] || prodiNama.substring(0, 2).toUpperCase();
    const now        = new Date();
    const romanMonth = ROMAN_MONTHS[now.getMonth()];
    const year       = now.getFullYear();

    const prodiSkpiCount = await prisma.skpi.count({
      where: { mahasiswa: { programstudi: { nama_prodi: prodiNama } } },
    });
    const seqNum    = String(prodiSkpiCount + 1).padStart(3, "0");
    const autoNomor = `SKPI/${prodiCode}/${seqNum}/${romanMonth}/${year}`;

    // Buat SKPI baru
    const skpi = await prisma.skpi.create({
      data: {
        id_mahasiswa:  parseInt(id_mahasiswa),
        nomor_skpi:    nomor_skpi || autoNomor,
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

    // Notifikasi mahasiswa: SKPI sedang diproses
    const userId = await getMahasiswaUserId(parseInt(id_mahasiswa));
    createNotif(userId, "SKPI Sedang Diproses",
      "SKPI Anda sedang digenerate oleh admin. Harap tunggu hingga status berubah menjadi Diterbitkan.");

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

    // Sinkronkan status PENGAJUAN SKPI mahasiswa dengan status SKPI, agar
    // halaman "Pengajuan SKPI" mahasiswa ikut berubah:
    //   resmi → pengajuan "disetujui" (langkah "SKPI Terbit" selesai)
    //   draft → kembali "menunggu"
    // Pengajuan yang sudah "ditolak" tidak diubah.
    const latestPengajuan = await prisma.pengajuanskpi.findFirst({
      where:   { id_mahasiswa: skpi.id_mahasiswa },
      orderBy: { tanggal_pengajuan: "desc" },
    });
    if (latestPengajuan && latestPengajuan.status_pengajuan !== "ditolak") {
      await prisma.pengajuanskpi.update({
        where: { id_pengajuan: latestPengajuan.id_pengajuan },
        data:  { status_pengajuan: status === "resmi" ? "disetujui" : "menunggu" },
      });
    }

    // Jika resmi, update status mahasiswa jadi diterbitkan + kirim notifikasi
    if (status === "resmi") {
      await prisma.mahasiswa.update({
        where: { id_mahasiswa: skpi.id_mahasiswa },
        data:  { status_skpi: "diterbitkan" },
      });
      const userId = await getMahasiswaUserId(skpi.id_mahasiswa);
      createNotif(userId, "SKPI Diterbitkan",
        "Selamat! SKPI Anda telah resmi diterbitkan. Unduh di menu SKPI → tab Pengajuan SKPI.");
    }

    return res.status(200).json({ success: true, data: skpi });
  } catch (err) {
    console.error("PATCH /api/skpi/:id/status error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skpi/download/:mahasiswaId  — generate & download .docx SKPI
// ─────────────────────────────────────────────────────────────────────────────
router.get("/download/:mahasiswaId", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.mahasiswaId, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    // Ambil data mahasiswa lengkap
    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa: id },
      include: {
        programstudi: true,
        kegiatanmahasiswa: {
          where: { status_verifikasi: "disetujui" },
          include: { jenisaktivitas: true, kategoriaktivitas: true, kelompokaktivitas: true },
        },
      },
    });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });

    // Ambil ICP — relasi icpkategori (bukan icp)
    const icpRows = await prisma.icpmahasiswa.findMany({
      where: { id_mahasiswa: id },
      include: { icpkategori: true },
    });
    const icpDetail = icpRows.map(r => ({
      nama_indo:  r.icpkategori?.nama_indo || "",
      total_poin: r.total_poin ?? 0,
    }));

    // Ambil SKPI jika sudah ada (untuk nomor)
    const existingSkpi = await prisma.skpi.findFirst({ where: { id_mahasiswa: id }, orderBy: { tanggal_terbit: "desc" } });

    const mhsData = {
      id_mahasiswa: mhs.id_mahasiswa,
      nim:          mhs.nim,
      nama:         mhs.nama,
      prodi:        mhs.programstudi?.nama_prodi || "Teknologi Informasi",
      tempat_lahir: mhs.tempat_lahir,
      tgl_lahir:    mhs.tgl_lahir,
      tgl_masuk:    mhs.tanggal_masuk,
      tgl_lulus:    mhs.tanggal_lulus,
      nomor_ijazah: mhs.nomor_ijazah,
      gelar:        mhs.gelar,
      gelar_eng:    mhs.gelar_eng,
      nomor_skpi:   existingSkpi?.nomor_skpi,
    };

    const buffer = await generateSkpiDocx({
      mhs:      mhsData,
      icp:      icpDetail,
      kegiatan: mhs.kegiatanmahasiswa || [],
    });

    const safeName = (mhs.nama || "").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `SKPI_${mhs.nim}_${safeName}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    return res.send(buffer);

  } catch (err) {
    console.error("GET /api/skpi/download error:", err);
    const status = err.code === "NO_TEMPLATE" ? 404 : 500;
    return res.status(status).json({ error: err.message, code: err.code || "GENERATE_ERROR", available: err.available || [] });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skpi/preview-docx/:mahasiswaId
// Sama seperti /download tapi dikirim sebagai binary blob (inline, bukan attachment)
// sehingga frontend bisa fetch lalu render dengan docx-preview
// ─────────────────────────────────────────────────────────────────────────────
router.get("/preview-docx/:mahasiswaId", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.mahasiswaId, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa: id },
      include: {
        programstudi: true,
        kegiatanmahasiswa: {
          where: { status_verifikasi: "disetujui" },
          include: { jenisaktivitas: true, kategoriaktivitas: true, kelompokaktivitas: true },
        },
      },
    });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });

    const icpRows = await prisma.icpmahasiswa.findMany({
      where: { id_mahasiswa: id },
      include: { icpkategori: true },
    });
    const icpDetail = icpRows.map(r => ({
      nama_indo:  r.icpkategori?.nama_indo || "",
      total_poin: r.total_poin ?? 0,
    }));

    const existingSkpi = await prisma.skpi.findFirst({
      where: { id_mahasiswa: id },
      orderBy: { tanggal_terbit: "desc" },
    });

    const mhsData = {
      id_mahasiswa: mhs.id_mahasiswa,
      nim:          mhs.nim,
      nama:         mhs.nama,
      prodi:        mhs.programstudi?.nama_prodi || "Teknologi Informasi",
      tempat_lahir: mhs.tempat_lahir,
      tgl_lahir:    mhs.tgl_lahir,
      tgl_masuk:    mhs.tanggal_masuk,
      tgl_lulus:    mhs.tanggal_lulus,
      nomor_ijazah: mhs.nomor_ijazah,
      gelar:        mhs.gelar,
      gelar_eng:    mhs.gelar_eng,
      nomor_skpi:   existingSkpi?.nomor_skpi,
    };

    const buffer = await generateSkpiDocx({
      mhs:      mhsData,
      icp:      icpDetail,
      kegiatan: mhs.kegiatanmahasiswa || [],
    });

    // Kirim sebagai blob tanpa Content-Disposition attachment
    // agar frontend dapat fetch() dan render dengan docx-preview
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Cache-Control", "no-cache");
    return res.send(buffer);

  } catch (err) {
    console.error("GET /api/skpi/preview-docx error:", err);
    const status2 = err.code === "NO_TEMPLATE" ? 404 : 500;
    return res.status(status2).json({ error: err.message, code: err.code || "GENERATE_ERROR", available: err.available || [] });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skpi/preview-pdf/:mahasiswaId
// Generate filled DOCX → convert ke PDF via LibreOffice → kirim PDF inline
// ─────────────────────────────────────────────────────────────────────────────
router.get("/preview-pdf/:mahasiswaId", requireAuth, async (req, res) => {
  const tmpDir  = path.join(os.tmpdir(), `skpi_${randomUUID()}`);
  const tmpDocx = path.join(tmpDir, "skpi.docx");
  const tmpPdf  = path.join(tmpDir, "skpi.pdf");

  try {
    const id = parseInt(req.params.mahasiswaId, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid." });

    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa: id },
      include: {
        programstudi: true,
        kegiatanmahasiswa: {
          where: { status_verifikasi: "disetujui" },
          include: { jenisaktivitas: true, kategoriaktivitas: true, kelompokaktivitas: true },
        },
      },
    });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });

    const icpRows = await prisma.icpmahasiswa.findMany({
      where: { id_mahasiswa: id },
      include: { icpkategori: true },
    });
    const icpDetail = icpRows.map(r => ({
      nama_indo:  r.icpkategori?.nama_indo || "",
      total_poin: r.total_poin ?? 0,
    }));

    const existingSkpi = await prisma.skpi.findFirst({
      where: { id_mahasiswa: id },
      orderBy: { tanggal_terbit: "desc" },
    });

    /* 1. Generate filled DOCX */
    const docxBuffer = await generateSkpiDocx({
      mhs: {
        id_mahasiswa: mhs.id_mahasiswa,
        nim:          mhs.nim,
        nama:         mhs.nama,
        prodi:        mhs.programstudi?.nama_prodi || "Teknologi Informasi",
        tempat_lahir: mhs.tempat_lahir,
        tgl_lahir:    mhs.tgl_lahir,
        tgl_masuk:    mhs.tanggal_masuk,
        tgl_lulus:    mhs.tanggal_lulus,
        nomor_ijazah: mhs.nomor_ijazah,
        gelar:        mhs.gelar,
        gelar_eng:    mhs.gelar_eng,
        nomor_skpi:   existingSkpi?.nomor_skpi,
      },
      icp:      icpDetail,
      kegiatan: mhs.kegiatanmahasiswa || [],
    });

    /* 2. Simpan ke temp */
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(tmpDocx, docxBuffer);

    /* 3. Convert ke PDF (Word COM on Windows / LibreOffice on Linux) */
    await convertDocxToPdf(tmpDocx, tmpPdf);

    if (!fs.existsSync(tmpPdf)) {
      return res.status(500).json({ error: "Konversi PDF gagal." });
    }

    /* 4. Kirim PDF */
    const pdfBuffer = fs.readFileSync(tmpPdf);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="SKPI_${mhs.nim}.pdf"`);
    res.setHeader("Cache-Control", "no-cache");
    return res.send(pdfBuffer);

  } catch (err) {
    console.error("GET /api/skpi/preview-pdf error:", err);
    const status = err.code === "NO_TEMPLATE" ? 404 : 500;
    return res.status(status).json({
      error:     err.message,
      code:      err.code || "PDF_ERROR",
      available: err.available || [],
    });
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
});

export default router;