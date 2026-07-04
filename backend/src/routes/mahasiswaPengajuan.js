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
import { createNotif, notifAllAdmins } from "../utils/notifikasi.js";
import { generateSkpiDocx } from "../utils/generateSkpiDocx.js";
import { convertDocxToPdf } from "../utils/libreConvert.js";
import { randomUUID } from "crypto";
import os from "os";
import fs from "fs";
import path from "path";

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
//  GET /api/mahasiswa/pengajuan/icp  → ICP summary mahasiswa
// ════════════════════════════════════════════════════════════
router.get("/icp", async (req, res) => {
    try {
        const { mahasiswa } = req;
        const icpRows = await prisma.icpmahasiswa.findMany({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
            include: { icpkategori: true },
        });
        const total_poin = icpRows.reduce((s, r) => s + (r.total_poin ?? 0), 0);
        const detail = icpRows.map(r => ({
            nama_indo:  r.icpkategori?.nama_indo || "",
            nama_eng:   r.icpkategori?.nama_eng  || "",
            total_poin: r.total_poin ?? 0,
        }));
        res.json({ total_poin, detail });
    } catch (err) {
        console.error("GET /mahasiswa/pengajuan/icp error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/pengajuan/download  → unduh PDF SKPI sendiri
//  Hanya jika SKPI mahasiswa ini sudah RESMI diterbitkan.
// ════════════════════════════════════════════════════════════
router.get("/download", async (req, res) => {
    const tmpDir  = path.join(os.tmpdir(), `skpi_dl_${randomUUID()}`);
    const tmpDocx = path.join(tmpDir, "skpi.docx");
    const tmpPdf  = path.join(tmpDir, "skpi.pdf");
    try {
        const id = req.mahasiswa.id_mahasiswa;

        // Syarat: harus sudah ada SKPI berstatus "resmi"
        const published = await prisma.skpi.findFirst({
            where:   { id_mahasiswa: id, status: "resmi" },
            orderBy: { tanggal_terbit: "desc" },
        });
        if (!published) {
            return res.status(403).json({ error: "SKPI Anda belum diterbitkan." });
        }

        const mhs = await prisma.mahasiswa.findUnique({
            where: { id_mahasiswa: id },
            include: {
                programstudi: true,
                kegiatanmahasiswa: {
                    where:   { status_verifikasi: "disetujui" },
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

        // 1. Buat DOCX terisi
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
                nomor_skpi:   published.nomor_skpi,
            },
            icp:      icpDetail,
            kegiatan: mhs.kegiatanmahasiswa || [],
        });

        // 2. Simpan ke temp lalu konversi ke PDF (LibreOffice, sudah tahan-banting)
        fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(tmpDocx, docxBuffer);
        await convertDocxToPdf(tmpDocx, tmpPdf);
        if (!fs.existsSync(tmpPdf)) {
            return res.status(500).json({ error: "Konversi PDF gagal." });
        }

        // 3. Kirim PDF sebagai unduhan
        const safeName = (mhs.nama || "").replace(/[^a-zA-Z0-9]/g, "_");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="SKPI_${mhs.nim}_${safeName}.pdf"`);
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        return res.send(fs.readFileSync(tmpPdf));
    } catch (err) {
        console.error("GET /mahasiswa/pengajuan/download error:", err);
        const status = err.code === "NO_TEMPLATE" ? 404
                     : err.code === "PDF_CONVERT_FAILED" ? 503 : 500;
        return res.status(status).json({ error: err.message, code: err.code || "GENERATE_ERROR" });
    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
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

        // Cek ICP minimal 100 poin (Bronze)
        const icpRows = await prisma.icpmahasiswa.findMany({
            where: { id_mahasiswa: mahasiswa.id_mahasiswa },
        });
        const totalIcp = icpRows.reduce((s, r) => s + (r.total_poin ?? 0), 0);
        if (totalIcp < 100) {
            return res.status(400).json({
                error: `Total ICP Anda ${totalIcp} poin. Minimal 100 poin (Bronze) untuk mengajukan SKPI.`,
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

        // Notifikasi mahasiswa: konfirmasi pengajuan SKPI
        createNotif(
            req.mahasiswaUser.user_id,
            "Pengajuan SKPI Dikirim",
            "Pengajuan SKPI Anda telah dikirim dan sedang menunggu verifikasi admin."
        );
        // Notifikasi semua admin: ada pengajuan SKPI baru
        notifAllAdmins(
            "Pengajuan SKPI Baru",
            `${mahasiswa.nama} (${mahasiswa.nim}) mengajukan SKPI. Segera tinjau di halaman Generate SKPI.`
        );
    } catch (err) {
        console.error("POST /mahasiswa/pengajuan error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;