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
import { fetchStudentsWithIcp, fetchIcpByCategory, testConnection, isSicpConfigured } from "../utils/sicpClient.js";

const router = express.Router();

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

// Bagi `total` ke n bagian bilangan bulat yang jumlahnya PERSIS = total (merata).
function splitEven(total, n) {
  const base = Math.trunc(total / n);
  const rem  = total - base * n;
  const step = rem >= 0 ? 1 : -1;
  return Array.from({ length: n }, (_, i) =>
    (rem !== 0 && ((step > 0 && i < rem) || (step < 0 && i < -rem))) ? base + step : base);
}

/**
 * Resolver nama kategori ICP SICP → id_icp SKPI, DICOCOKKAN BERDASARKAN NAMA
 * (bukan ID), karena ID kategori kedua sistem TIDAK selaras. Contoh:
 *   SICP: 4=MORAL, 5=KEPRIBADIAN, 6=KETERAMPILAN
 *   SKPI: 4=Kepribadian, 5=Keterampilan, 6=Moral
 */
async function buildIcpKategoriResolver() {
  const cats = await prisma.icpkategori.findMany({ orderBy: { id_icp: "asc" } });
  const norm = (v) => String(v || "").trim().toUpperCase();
  const map = {};
  cats.forEach(c => { map[norm(c.nama_indo)] = c.id_icp; });
  const allIds = cats.map(c => c.id_icp);
  const resolve = (nama) => {
    const n = norm(nama);
    if (!n) return null;
    if (map[n] !== undefined) return map[n];
    // Cocokkan sebagian: "INTELEKTUAL" (SICP) ↔ "INTELEKTUALITAS" (SKPI)
    const key = Object.keys(map).find(k => k.startsWith(n) || n.startsWith(k) || k.includes(n) || n.includes(k));
    return key ? map[key] : null;
  };
  return { resolve, allIds };
}

/**
 * Simpan poin ICP per mahasiswa PER KATEGORI dari SICP.
 * Untuk tiap mahasiswa, ambil rincian /icp/balance/by-category/:sicp_id lalu
 * petakan nama kategori → id_icp SKPI. Bila rincian tak tersedia (mis. sicp_id
 * kosong / endpoint gagal), fallback: total dibagi rata ke semua kategori.
 */
async function runIcpSync(students) {
  const { resolve: resolveKat, allIds } = await buildIcpKategoriResolver();

  let updated = 0, notFound = 0, perKategori = 0, fallbackSplit = 0;
  const errors = [];

  const CONC = 6; // batasi konkurensi panggilan ke SICP + tulis DB
  for (let i = 0; i < students.length; i += CONC) {
    const chunk = students.slice(i, i + CONC);
    await Promise.all(chunk.map(async (s) => {
      try {
        const mhs = await prisma.mahasiswa.findFirst({ where: { nim: s.nim } });
        if (!mhs) { notFound++; return; }

        let data = null;
        if (s.sicp_id) {
          const cats = await fetchIcpByCategory(s.sicp_id).catch(() => null);
          if (Array.isArray(cats) && cats.length) {
            const rows = [];
            for (const c of cats) {
              const id_icp = resolveKat(c.kategori);
              if (id_icp != null) rows.push({ id_mahasiswa: mhs.id_mahasiswa, id_icp, total_poin: Math.round(Number(c.total) || 0) });
            }
            if (rows.length) data = rows;
          }
        }

        if (!data) {
          const parts = splitEven(s.total_icp || 0, allIds.length);
          data = allIds.map((id_icp, idx) => ({ id_mahasiswa: mhs.id_mahasiswa, id_icp, total_poin: parts[idx] }));
          fallbackSplit++;
        } else {
          perKategori++;
        }

        // Tulis ulang: hapus baris lama, buat baris baru per kategori.
        await prisma.icpmahasiswa.deleteMany({ where: { id_mahasiswa: mhs.id_mahasiswa } });
        await prisma.icpmahasiswa.createMany({ data });
        updated++;
      } catch (e) {
        errors.push({ nim: s.nim || "?", error: e.message });
      }
    }));
  }
  return { total: students.length, updated, notFound, perKategori, fallbackSplit, failed: errors.length, errors: errors.slice(0, 20) };
}

/**
 * Bersihkan mahasiswa DUPLIKAT (NIM sama). Menyisakan SATU baris per NIM
 * (id terkecil), lalu menghapus duplikat yang BENAR-BENAR KOSONG (tanpa
 * kegiatan / pengajuan / SKPI / riwayat) beserta baris ICP-nya. Duplikat yang
 * sudah punya data TIDAK dihapus (dilaporkan agar bisa ditinjau manual).
 */
async function runCleanupDuplicates() {
  const all = await prisma.mahasiswa.findMany({
    orderBy: { id_mahasiswa: "asc" },
    select: { id_mahasiswa: true, nim: true },
  });

  const groups = new Map();
  for (const m of all) {
    const key = (m.nim || "").trim();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m.id_mahasiswa);
  }

  let dupGroups = 0, removed = 0, keptWithData = 0;
  const errors = [];

  for (const [nim, ids] of groups) {
    if (ids.length < 2) continue;
    dupGroups++;
    const extras = ids.slice(1); // sisakan id terkecil
    for (const extraId of extras) {
      try {
        const [keg, peng, sk, riw] = await Promise.all([
          prisma.kegiatanmahasiswa.count({ where: { id_mahasiswa: extraId } }),
          prisma.pengajuanskpi.count({ where: { id_mahasiswa: extraId } }),
          prisma.skpi.count({ where: { id_mahasiswa: extraId } }),
          prisma.riwayatskpi.count({ where: { id_mahasiswa: extraId } }),
        ]);
        if (keg + peng + sk + riw === 0) {
          await prisma.icpmahasiswa.deleteMany({ where: { id_mahasiswa: extraId } });
          await prisma.mahasiswa.delete({ where: { id_mahasiswa: extraId } });
          removed++;
        } else {
          keptWithData++;
        }
      } catch (e) {
        errors.push({ nim, id: extraId, error: e.message });
      }
    }
  }
  return { dupGroups, removed, keptWithData, failed: errors.length, errors: errors.slice(0, 20) };
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
    const icp       = await runIcpSync(students);         // baru isi poin ICP per kategori
    return res.json({ success: true, mahasiswa, icp });
  } catch (err) {
    console.error("POST /sicp-sync/both:", err.message);
    return res.status(sicpErrorStatus(err)).json({ error: err.message, code: err.code || "SICP_ERROR" });
  }
});

// ── POST /cleanup-duplicates ─────────────────────────────────
// Hapus mahasiswa duplikat (NIM sama) yang kosong. Tidak menghubungi SICP.
router.post("/cleanup-duplicates", requireAuth, async (_req, res) => {
  try {
    const cleanup = await runCleanupDuplicates();
    return res.json({ success: true, cleanup });
  } catch (err) {
    console.error("POST /sicp-sync/cleanup-duplicates:", err.message);
    return res.status(500).json({ error: err.message, code: "CLEANUP_ERROR" });
  }
});

export default router;
