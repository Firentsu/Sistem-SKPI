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
import { createNotif, notifAllAdmins } from "../utils/notifikasi.js";

const router = Router();

// Resolve a text name OR integer-string to an integer FK id.
// model      — prisma model name (e.g. "jenisaktivitas")
// idField    — PK field name    (e.g. "id_jenis")
// nameField  — text column name (e.g. "nama_indo")
async function resolveId(model, idField, nameField, value) {
    if (!value) return null;
    const asNum = parseInt(value, 10);
    if (!isNaN(asNum) && String(asNum) === String(value).trim()) return asNum;
    const record = await prisma[model].findFirst({
        where: { [nameField]: String(value) },
    });
    return record ? record[idField] : null;
}

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
        const body = req.body;

        // Accept both backend field names and frontend field names
        const nama_kegiatan     = body.nama_kegiatan || body.nama_id;
        const nama_kegiatan_eng = body.nama_kegiatan_eng || body.nama_en;
        const periode_kegiatan  = body.periode_kegiatan || body.periode;
        const { penyelenggara, lokasi, tanggal_kegiatan, tingkat_prestasi, peringkat } = body;

        if (!nama_kegiatan) {
            return res.status(400).json({ error: "Nama kegiatan wajib diisi" });
        }

        // Resolve FK IDs — accept integer IDs or text names from the frontend
        const [id_jenis, id_kategori, id_kelompok, id_level] = await Promise.all([
            resolveId("jenisaktivitas",    "id_jenis",    "nama_indo",   body.id_jenis    || body.jenis_aktivitas),
            resolveId("kategoriaktivitas", "id_kategori", "nama_indo",   body.id_kategori || body.kategori),
            resolveId("kelompokaktivitas", "id_kelompok", "nama_indo",   body.id_kelompok || body.kelompok),
            resolveId("levelkegiatan",     "id_level",    "nama_level",  body.id_level    || body.level),
        ]);
        const id_posisi = body.id_posisi ? parseInt(body.id_posisi) : null;

        const kegiatan = await prisma.kegiatanmahasiswa.create({
            data: {
                id_mahasiswa: mahasiswa.id_mahasiswa,
                nama_kegiatan,
                nama_kegiatan_eng: nama_kegiatan_eng || null,
                id_jenis,
                id_kategori,
                id_kelompok,
                id_level,
                id_posisi,
                penyelenggara: penyelenggara || null,
                lokasi: lokasi || null,
                tanggal_kegiatan: tanggal_kegiatan ? new Date(tanggal_kegiatan) : null,
                periode_kegiatan: periode_kegiatan || null,
                tingkat_prestasi: tingkat_prestasi || null,
                peringkat: peringkat || null,
                status_verifikasi: "diproses",
            },
        });

        res.status(201).json({ success: true, data: kegiatan, id_kegiatan: kegiatan.id_kegiatan });

        // Notifikasi: mahasiswa → konfirmasi pengajuan
        createNotif(
            mahasiswa.id_user ?? req.mahasiswaUser.user_id,
            "Kegiatan Berhasil Diajukan",
            `Kegiatan "${nama_kegiatan}" telah diajukan dan menunggu verifikasi admin.`
        );
        // Notifikasi: semua admin → ada kegiatan baru
        notifAllAdmins(
            "Pengajuan Kegiatan Baru",
            `${mahasiswa.nama} (${mahasiswa.nim}) mengajukan kegiatan baru: "${nama_kegiatan}".`
        );
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

        const body = req.body;

        // Accept both backend field names and frontend field names
        const nama_kegiatan     = body.nama_kegiatan || body.nama_id;
        const nama_kegiatan_eng = body.nama_kegiatan_eng || body.nama_en;
        const periode_kegiatan  = body.periode_kegiatan || body.periode;
        const { penyelenggara, lokasi, tanggal_kegiatan, tingkat_prestasi, peringkat } = body;

        // Resolve FK IDs — accept integer IDs or text names from the frontend
        const [id_jenis, id_kategori, id_kelompok, id_level] = await Promise.all([
            resolveId("jenisaktivitas",    "id_jenis",    "nama_indo",  body.id_jenis    || body.jenis_aktivitas),
            resolveId("kategoriaktivitas", "id_kategori", "nama_indo",  body.id_kategori || body.kategori),
            resolveId("kelompokaktivitas", "id_kelompok", "nama_indo",  body.id_kelompok || body.kelompok),
            resolveId("levelkegiatan",     "id_level",    "nama_level", body.id_level    || body.level),
        ]);
        const id_posisi = body.id_posisi ? parseInt(body.id_posisi) : undefined;

        const updated = await prisma.kegiatanmahasiswa.update({
            where: { id_kegiatan: id },
            data: {
                nama_kegiatan: nama_kegiatan || undefined,
                nama_kegiatan_eng: nama_kegiatan_eng ?? undefined,
                id_jenis:    id_jenis    ?? undefined,
                id_kategori: id_kategori ?? undefined,
                id_kelompok: id_kelompok ?? undefined,
                id_level:    id_level    ?? undefined,
                id_posisi,
                penyelenggara:   penyelenggara   ?? undefined,
                lokasi:          lokasi          ?? undefined,
                tanggal_kegiatan: tanggal_kegiatan ? new Date(tanggal_kegiatan) : undefined,
                periode_kegiatan: periode_kegiatan ?? undefined,
                tingkat_prestasi: tingkat_prestasi ?? undefined,
                peringkat:        peringkat        ?? undefined,
                // Jika revisi → kembalikan ke diproses setelah edit
                status_verifikasi: existing.status_verifikasi === "revisi" ? "diproses" : undefined,
            },
        });

        res.json({ success: true, data: updated });

        // Notifikasi mahasiswa: jika dari revisi → diajukan ulang
        if (existing.status_verifikasi === "revisi") {
            createNotif(
                mahasiswa.id_user ?? req.mahasiswaUser.user_id,
                "Kegiatan Diperbarui & Diajukan Ulang",
                `Kegiatan "${existing.nama_kegiatan}" telah diperbarui dan kembali menunggu verifikasi admin.`
            );
            notifAllAdmins(
                "Kegiatan Diperbarui",
                `${mahasiswa.nama} (${mahasiswa.nim}) memperbarui kegiatan setelah revisi: "${existing.nama_kegiatan}".`
            );
        }
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
router.post("/:id/bukti", upload.single("bukti"), async (req, res) => {
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