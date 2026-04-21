/**
 * /api/mahasiswa/master-data
 *
 * GET /  → semua master data yang dibutuhkan form pengajuan kegiatan mahasiswa
 *          (jenis, kategori, kelompok, level, posisi, periode, prodi)
 *
 * Route ini pakai requireMahasiswaAuth sehingga hanya mahasiswa yang login
 * yang bisa akses. Tidak ada operasi tulis — hanya baca.
 */

import express from "express";
import prisma from "../lib/prisma.js";
import { requireMahasiswaAuth } from "../middleware/mahasiswaAuth.js";

const router = express.Router();

router.get("/", requireMahasiswaAuth, async (_req, res) => {
    try {
        const [
            programStudi,
            jenisAktivitas,
            kategoriAktivitas,
            kelompokAktivitas,
            levelKegiatan,
            posisiKegiatan,
            periodeAkademik,
        ] = await Promise.all([
            prisma.programstudi.findMany({ orderBy: { nama_prodi: "asc" } }),
            prisma.jenisaktivitas.findMany({ where: { status: true }, orderBy: { nama_indo: "asc" } }),
            prisma.kategoriaktivitas.findMany({ where: { status: true }, orderBy: { nama_indo: "asc" } }),
            prisma.kelompokaktivitas.findMany({ where: { status: true }, orderBy: { nama_indo: "asc" } }),
            prisma.levelkegiatan.findMany({ orderBy: { nama_level: "asc" } }),
            prisma.posisikegiatan.findMany({ orderBy: { nama_posisi: "asc" } }),
            prisma.periodeakademik.findMany({ where: { status: true }, orderBy: { nama_periode: "desc" } }),
        ]);

        return res.json({
            programStudi,
            jenisAktivitas,
            kategoriAktivitas,
            kelompokAktivitas,
            levelKegiatan,
            posisiKegiatan,
            periodeAkademik,
        });
    } catch (err) {
        console.error("GET /api/mahasiswa/master-data error:", err);
        return res.status(500).json({ error: "Server error." });
    }
});

export default router;