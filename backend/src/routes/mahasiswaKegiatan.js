/**
 * /api/mahasiswa/kegiatan  — Kegiatan milik mahasiswa yang sedang login
 *
 * GET    /           → daftar kegiatan milik mahasiswa ini
 * POST   /           → ajukan kegiatan baru
 * GET    /:id        → detail satu kegiatan
 * PATCH  /:id        → edit kegiatan (hanya yang masih diproses/revisi)
 * DELETE /:id        → hapus kegiatan (hanya yang masih diproses/revisi)
 * POST   /:id/bukti  → upload bukti kegiatan
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";

import prisma from "../lib/prisma.js";
import { requireMahasiswaAuth } from "../middleware/mahasiswaAuth.js";

const router = Router();

// Semua route wajib terautentikasi sebagai mahasiswa
router.use(requireMahasiswaAuth);

// ── Multer untuk bukti kegiatan ─────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // maks 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            "image/jpeg", "image/png", "image/webp",
            "application/pdf",
        ];
        cb(null, allowed.includes(file.mimetype));
    },
});

const EXT_MAP = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "application/pdf": "pdf",
};
const BUKTI_DIR = path.join(process.cwd(), "public", "uploads", "bukti");

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/kegiatan
//  Query: ?status=diproses|disetujui|ditolak|revisi&page=1
// ════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
    try {
        const { mahasiswa } = req;
        const { status, page: pageStr } = req.query;
        const page = parseInt(pageStr || "1", 10) || 1;
        const pageSize = 20;

        const where = { id_mahasiswa: mahasiswa.id_mahasiswa };
        if (status) where.status_verifikasi = status;

        const [total, rows] = await Promise.all([
            prisma.kegiatanmahasiswa.count({ where }),
            prisma.kegiatanmahasiswa.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
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

        res.json({ total, page, pageSize, rows });
    } catch (err) {
        console.error("GET /mahasiswa/kegiatan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/kegiatan  → ajukan kegiatan baru
// ════════════════════════════════════════════════════════════
router.post("/", async (req, res) => {
    try {
        const { mahasiswa } = req;
        const {
            nama_kegiatan, nama_kegiatan_eng,
            id_jenis, id_kategori, id_kelompok, id_level, id_posisi,
            penyelenggara, lokasi, tanggal_kegiatan,
            periode_kegiatan, tingkat_prestasi, peringkat,
        } = req.body;

        if (!nama_kegiatan) {
            return res.status(400).json({ error: "Nama kegiatan wajib diisi" });
        }

        const kegiatan = await prisma.kegiatanmahasiswa.create({
            data: {
                id_mahasiswa: mahasiswa.id_mahasiswa,
                nama_kegiatan,
                nama_kegiatan_eng: nama_kegiatan_eng || null,
                id_jenis: id_jenis ? parseInt(id_jenis) : null,
                id_kategori: id_kategori ? parseInt(id_kategori) : null,
                id_kelompok: id_kelompok ? parseInt(id_kelompok) : null,
                id_level: id_level ? parseInt(id_level) : null,
                id_posisi: id_posisi ? parseInt(id_posisi) : null,
                penyelenggara: penyelenggara || null,
                lokasi: lokasi || null,
                tanggal_kegiatan: tanggal_kegiatan ? new Date(tanggal_kegiatan) : null,
                periode_kegiatan: periode_kegiatan || null,
                tingkat_prestasi: tingkat_prestasi || null,
                peringkat: peringkat || null,
                status_verifikasi: "diproses",
            },
        });

        res.status(201).json({ success: true, data: kegiatan });
    } catch (err) {
        console.error("POST /mahasiswa/kegiatan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/kegiatan/:id
// ════════════════════════════════════════════════════════════
router.get("/:id", async (req, res) => {
    try {
        const { mahasiswa } = req;
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

        const kegiatan = await prisma.kegiatanmahasiswa.findFirst({
            where: { id_kegiatan: id, id_mahasiswa: mahasiswa.id_mahasiswa },
            include: {
                jenisaktivitas: true,
                kategoriaktivitas: true,
                kelompokaktivitas: true,
                levelkegiatan: true,
                posisikegiatan: true,
                buktikegiatan: true,
            },
        });

        if (!kegiatan) return res.status(404).json({ error: "Kegiatan tidak ditemukan" });

        res.json(kegiatan);
    } catch (err) {
        console.error("GET /mahasiswa/kegiatan/:id error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/mahasiswa/kegiatan/:id  → edit (hanya diproses/revisi)
// ════════════════════════════════════════════════════════════
router.patch("/:id", async (req, res) => {
    try {
        const { mahasiswa } = req;
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

        const existing = await prisma.kegiatanmahasiswa.findFirst({
            where: { id_kegiatan: id, id_mahasiswa: mahasiswa.id_mahasiswa },
        });
        if (!existing) return res.status(404).json({ error: "Kegiatan tidak ditemukan" });

        if (!["diproses", "revisi"].includes(existing.status_verifikasi)) {
            return res.status(400).json({ error: "Kegiatan yang sudah disetujui/ditolak tidak dapat diubah" });
        }

        const {
            nama_kegiatan, nama_kegiatan_eng,
            id_jenis, id_kategori, id_kelompok, id_level, id_posisi,
            penyelenggara, lokasi, tanggal_kegiatan,
            periode_kegiatan, tingkat_prestasi, peringkat,
        } = req.body;

        const updated = await prisma.kegiatanmahasiswa.update({
            where: { id_kegiatan: id },
            data: {
                nama_kegiatan: nama_kegiatan || undefined,
                nama_kegiatan_eng,
                id_jenis: id_jenis ? parseInt(id_jenis) : undefined,
                id_kategori: id_kategori ? parseInt(id_kategori) : undefined,
                id_kelompok: id_kelompok ? parseInt(id_kelompok) : undefined,
                id_level: id_level ? parseInt(id_level) : undefined,
                id_posisi: id_posisi ? parseInt(id_posisi) : undefined,
                penyelenggara,
                lokasi,
                tanggal_kegiatan: tanggal_kegiatan ? new Date(tanggal_kegiatan) : undefined,
                periode_kegiatan,
                tingkat_prestasi,
                peringkat,
                // Jika revisi → kembalikan ke diproses setelah edit
                status_verifikasi: existing.status_verifikasi === "revisi" ? "diproses" : undefined,
            },
        });

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("PATCH /mahasiswa/kegiatan/:id error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/mahasiswa/kegiatan/:id
// ════════════════════════════════════════════════════════════
router.delete("/:id", async (req, res) => {
    try {
        const { mahasiswa } = req;
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

        const existing = await prisma.kegiatanmahasiswa.findFirst({
            where: { id_kegiatan: id, id_mahasiswa: mahasiswa.id_mahasiswa },
        });
        if (!existing) return res.status(404).json({ error: "Kegiatan tidak ditemukan" });

        if (existing.status_verifikasi === "disetujui") {
            return res.status(400).json({ error: "Kegiatan yang sudah disetujui tidak dapat dihapus" });
        }

        // Hapus bukti dulu
        await prisma.buktikegiatan.deleteMany({ where: { id_kegiatan: id } });
        await prisma.kegiatanmahasiswa.delete({ where: { id_kegiatan: id } });

        res.json({ success: true });
    } catch (err) {
        console.error("DELETE /mahasiswa/kegiatan/:id error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/kegiatan/:id/bukti  → upload bukti
// ════════════════════════════════════════════════════════════
router.post("/:id/bukti", upload.single("file"), async (req, res) => {
    try {
        const { mahasiswa } = req;
        const id = parseInt(req.params.id, 10);
        const file = req.file;

        if (!file) return res.status(400).json({ error: "File tidak ditemukan" });

        const kegiatan = await prisma.kegiatanmahasiswa.findFirst({
            where: { id_kegiatan: id, id_mahasiswa: mahasiswa.id_mahasiswa },
        });
        if (!kegiatan) return res.status(404).json({ error: "Kegiatan tidak ditemukan" });

        if (!existsSync(BUKTI_DIR)) await mkdir(BUKTI_DIR, { recursive: true });

        const ext = EXT_MAP[file.mimetype];
        const filename = `bukti_${id}_${Date.now()}.${ext}`;
        await writeFile(path.join(BUKTI_DIR, filename), file.buffer);

        const publicPath = `/uploads/bukti/${filename}`;

        const bukti = await prisma.buktikegiatan.create({
            data: {
                id_kegiatan: id,
                file_path: publicPath,
                tipe_file: file.mimetype,
                ukuran_file: file.size,
            },
        });

        res.status(201).json({ success: true, data: bukti });
    } catch (err) {
        console.error("POST /mahasiswa/kegiatan/:id/bukti error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;