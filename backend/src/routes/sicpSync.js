/**
 * sicpSync.js — Endpoint sinkronisasi data dari sistem SICP ke database SKPI.
 *
 * Mengambil data mahasiswa & total poin ICP dari SICP (via sicpClient), lalu
 * meng-UPSERT ke tabel `mahasiswa`, `users`, dan `icpmahasiswa` SKPI.
 * Semua endpoint butuh sesi admin (requireAuth).
 *
 *   GET  /api/sicp-sync/test        → cek koneksi + auth ke SICP
 *   POST /api/sicp-sync/mahasiswa   → sinkron data mahasiswa (buat/update akun)
 *   POST /api/sicp-sync/icp         → sinkron total poin ICP (match by NIM)
 *   POST /api/sicp-sync/both        → keduanya sekaligus
 */
import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchStudentsWithIcp, testConnection, isSicpConfigured } from "../utils/sicpClient.js";

const router = express.Router();

// Kategori ICP tujuan penyimpanan total poin dari SICP (bisa diubah via env).
const ICP_CATEGORY_ID = parseInt(process.env.SICP_ICP_CATEGORY_ID || "1", 10);

/** Resolver nama jurusan SICP → id_prodi SKPI (exact → partial, case-insensitive). */
async function buildProdiResolver() {
  const allProdi = await prisma.programstudi.findMany();
  const map = {};
  allProdi.forEach(p => { map[p.nama_prodi.trim().toLowerCase()] = p.id_prodi; });
  return (val) => {
    if (val === undefined || val === null || val === "") return null;
    const asNum = parseInt(val);
    if (!isNaN(asNum) && String(asNum) === String(val).trim()) {
      return allProdi.some(p => p.id_prodi === asNum) ? asNum : null;
    }
    const lower = String(val).trim().toLowerCase();
    if (map[lower] !== undefined) return map[lower];
    const partial = Object.keys(map).find(k => k.includes(lower) || lower.includes(k));
    return partial ? map[partial] : null;
  };
}

/** UPSERT data mahasiswa + akun login. Password default = NIM. */
async function runMahasiswaSync(students) {
  const resolveProdi = await buildProdiResolver();
  const bcrypt = await import("bcryptjs");

  let created = 0, updated = 0;
  const errors = [];

  for (const s of students) {
    try {
      if (!s.nim || !s.nama) { errors.push({ nim: s.nim || "?", error: "NIM/nama kosong" }); continue; }
      const id_prodi = resolveProdi(s.nama_jurusan) ?? resolveProdi(s.jurusan_id);

      const existing = await prisma.mahasiswa.findFirst({ where: { nim: s.nim } });
      if (existing) {
        await prisma.mahasiswa.update({
          where: { id_mahasiswa: existing.id_mahasiswa },
          data:  { nama: s.nama, ...(id_prodi ? { id_prodi } : {}) },
        });
        updated++;
        continue;
      }

      // Baru: pakai user (username=NIM) yang mungkin sudah ada, atau buat baru.
      const existingUser = await prisma.users.findFirst({ where: { username: s.nim } });
      if (existingUser) {
        await prisma.mahasiswa.create({
          data: { nim: s.nim, nama: s.nama, id_prodi, id_user: existingUser.user_id },
        });
      } else {
        const hashed = await bcrypt.default.hash(s.nim, 10);
        await prisma.$transaction(async (tx) => {
          const user = await tx.users.create({
            data: { username: s.nim, password: hashed, role: "mahasiswa", status_akun: "aktif", updated_at: new Date() },
          });
          await tx.mahasiswa.create({
            data: { nim: s.nim, nama: s.nama, id_prodi, id_user: user.user_id },
          });
        });
      }
      created++;
    } catch (e) {
      errors.push({ nim: s.nim || "?", error: e.message });
    }
  }
  return { total: students.length, created, updated, failed: errors.length, errors: errors.slice(0, 20) };
}

/** UPSERT total poin ICP per mahasiswa (dicocokkan berdasarkan NIM). */
async function runIcpSync(students) {
  let created = 0, updated = 0, notFound = 0;
  const errors = [];

  for (const s of students) {
    try {
      const mhs = await prisma.mahasiswa.findFirst({ where: { nim: s.nim } });
      if (!mhs) { notFound++; continue; }

      const existing = await prisma.icpmahasiswa.findFirst({
        where: { id_mahasiswa: mhs.id_mahasiswa, id_icp: ICP_CATEGORY_ID },
      });
      if (existing) {
        await prisma.icpmahasiswa.update({
          where: { id_icp_mahasiswa: existing.id_icp_mahasiswa },
          data:  { total_poin: s.total_icp },
        });
        updated++;
      } else {
        await prisma.icpmahasiswa.create({
          data: { id_mahasiswa: mhs.id_mahasiswa, id_icp: ICP_CATEGORY_ID, total_poin: s.total_icp },
        });
        created++;
      }
    } catch (e) {
      errors.push({ nim: s.nim || "?", error: e.message });
    }
  }
  return { total: students.length, created, updated, notFound, failed: errors.length, errors: errors.slice(0, 20) };
}

function sicpErrorStatus(err) {
  if (err.code === "SICP_NOT_CONFIGURED" || err.code === "SICP_NO_CREDENTIALS") return 400;
  return 502; // masalah menghubungi/otentikasi SICP
}

// ── GET /test ────────────────────────────────────────────────
router.get("/test", requireAuth, async (_req, res) => {
  if (!isSicpConfigured()) {
    return res.status(400).json({ error: "SICP belum dikonfigurasi. Isi SICP_API_URL & kredensial di backend/.env." });
  }
  try {
    const result = await testConnection();
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("GET /sicp-sync/test:", err.message);
    return res.status(sicpErrorStatus(err)).json({ error: err.message, code: err.code || "SICP_ERROR" });
  }
});

// ── POST /mahasiswa ──────────────────────────────────────────
router.post("/mahasiswa", requireAuth, async (_req, res) => {
  try {
    const students = await fetchStudentsWithIcp();
    const result   = await runMahasiswaSync(students);
    return res.json({ success: true, mahasiswa: result });
  } catch (err) {
    console.error("POST /sicp-sync/mahasiswa:", err.message);
    return res.status(sicpErrorStatus(err)).json({ error: err.message, code: err.code || "SICP_ERROR" });
  }
});

// ── POST /icp ────────────────────────────────────────────────
router.post("/icp", requireAuth, async (_req, res) => {
  try {
    const students = await fetchStudentsWithIcp();
    const result   = await runIcpSync(students);
    return res.json({ success: true, icp: result });
  } catch (err) {
    console.error("POST /sicp-sync/icp:", err.message);
    return res.status(sicpErrorStatus(err)).json({ error: err.message, code: err.code || "SICP_ERROR" });
  }
});

// ── POST /both ───────────────────────────────────────────────
router.post("/both", requireAuth, async (_req, res) => {
  try {
    const students  = await fetchStudentsWithIcp();
    const mahasiswa = await runMahasiswaSync(students);   // buat/update dulu
    const icp       = await runIcpSync(students);         // baru isi poin ICP
    return res.json({ success: true, mahasiswa, icp });
  } catch (err) {
    console.error("POST /sicp-sync/both:", err.message);
    return res.status(sicpErrorStatus(err)).json({ error: err.message, code: err.code || "SICP_ERROR" });
  }
});

export default router;
