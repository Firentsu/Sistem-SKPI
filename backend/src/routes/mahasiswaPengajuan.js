/**
 * /api/mahasiswa/pengajuan  — Pengajuan SKPI oleh mahasiswa
 *
 * GET   /       → status pengajuan milik mahasiswa ini
 * POST  /       → ajukan SKPI (hanya jika belum ada pengajuan aktif)
 * GET   /riwayat→ riwayat semua pengajuan
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireMahasiswaAuth } from "../middleware/mahasiswaAuth.js";

const router = Router();
router.use(requireMahasiswaAuth);

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/pengajuan  → pengajuan aktif
// ════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
    try {
        const { mahasiswa } = req;

        const pengajuan = await prisma.pengajuanskpi.findFirst({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            orderBy: { tanggal_pengajuan: "desc" },
        });

        res.json(pengajuan ?? null);
    } catch (err) {
        console.error("GET /mahasiswa/pengajuan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/pengajuan/riwayat
// ════════════════════════════════════════════════════════════
router.get("/riwayat", async (req, res) => {
    try {
        const { mahasiswa } = req;

        const riwayat = await prisma.pengajuanskpi.findMany({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            orderBy: { tanggal_pengajuan: "desc" },
        });

        res.json(riwayat);
    } catch (err) {
        console.error("GET /mahasiswa/pengajuan/riwayat error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/pengajuan  → ajukan SKPI
// ════════════════════════════════════════════════════════════
router.post("/", async (req, res) => {
    try {
        const { mahasiswa } = req;

        // Cek ada pengajuan yang masih menunggu
        const existing = await prisma.pengajuanskpi.findFirst({
            where: {
                id_mahasiswa: mahasiswa.id_mahasiswa,
                status_pengajuan: "menunggu",
            },
        });
        if (existing) {
            return res.status(409).json({ error: "Anda sudah memiliki pengajuan yang sedang diproses" });
        }

        // Cek minimal ada 1 kegiatan yang disetujui
        const kegiatanDisetujui = await prisma.kegiatanmahasiswa.count({
            where: {
                id_mahasiswa: mahasiswa.id_mahasiswa,
                status_verifikasi: "disetujui",
            },
        });
        if (kegiatanDisetujui === 0) {
            return res.status(400).json({
                error: "Belum ada kegiatan yang disetujui. Ajukan minimal 1 kegiatan terlebih dahulu.",
            });
        }

        const pengajuan = await prisma.pengajuanskpi.create({
            data: {
                id_mahasiswa: mahasiswa.id_mahasiswa,
                tanggal_pengajuan: new Date(),
                status_pengajuan: "menunggu",
            },
        });

        // Update status mahasiswa
        await prisma.mahasiswa.update({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            data: { status_skpi: "diajukan" },
        });

        res.status(201).json({ success: true, data: pengajuan });
    } catch (err) {
        console.error("POST /mahasiswa/pengajuan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;