import { Router } from "express";

import prisma          from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Semua route mahasiswa wajib login
router.use(requireAuth);

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa
//  Query params: q (search), prodi, page
// ════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { q, prodi, page = "1" } = req.query;
    const pageNum  = parseInt(page, 10) || 1;
    const pageSize = 10;

    const where = {};
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { nim:  { contains: q } },
      ];
    }
    if (prodi && prodi !== "Semua") {
      const p = await prisma.programstudi.findFirst({ where: { nama_prodi: prodi } });
      if (p) where.id_prodi = p.id_prodi;
    }

    const [total, rows, aktif, selesai, icpAgg, grouped, prodiAll] = await Promise.all([
      prisma.mahasiswa.count({ where }),
      prisma.mahasiswa.findMany({
        where,
        skip:    (pageNum - 1) * pageSize,
        take:    pageSize,
        include: {
          programstudi: true,
          users: { select: { status_akun: true } },
          _count: { select: { kegiatanmahasiswa: true } },
          icpmahasiswa: { select: { total_poin: true } },
        },
        orderBy: { id_mahasiswa: "desc" },
      }),
      // Agregat di bawah dihitung atas SELURUH data terfilter (bukan per halaman),
      // supaya kartu statistik & grafik distribusi cocok dengan total mahasiswa.
      prisma.mahasiswa.count({ where: { ...where, users: { is: { status_akun: "aktif" } } } }),
      prisma.mahasiswa.count({ where: { ...where, status_skpi: "diterbitkan" } }),
      prisma.icpmahasiswa.aggregate({ _sum: { total_poin: true }, where: { mahasiswa: { is: where } } }),
      prisma.mahasiswa.groupBy({ by: ["id_prodi"], where, _count: { _all: true } }),
      prisma.programstudi.findMany({ select: { id_prodi: true, nama_prodi: true } }),
    ]);

    // Hitung total poin ICP per mahasiswa (jumlah semua kategori), lalu buang
    // array mentah icpmahasiswa agar respons tetap ringkas.
    const rowsWithIcp = rows.map(({ icpmahasiswa, ...m }) => ({
      ...m,
      total_icp: (icpmahasiswa || []).reduce((s, r) => s + (r.total_poin ?? 0), 0),
    }));

    // Distribusi per prodi atas SELURUH data; gabungkan yang belum punya prodi.
    const prodiNameById = Object.fromEntries(prodiAll.map(p => [p.id_prodi, p.nama_prodi]));
    const distMap = {};
    for (const g of grouped) {
      const nama = g.id_prodi != null ? (prodiNameById[g.id_prodi] ?? "Belum ada prodi") : "Belum ada prodi";
      distMap[nama] = (distMap[nama] || 0) + g._count._all;
    }
    const prodiDist = Object.entries(distMap).map(([nama_prodi, count]) => ({ nama_prodi, count }));

    const stats = {
      total,
      aktif,
      selesai,
      avgIcp: total ? Math.round((icpAgg._sum.total_poin || 0) / total) : 0,
      prodiDist,
    };

    res.json({ total, page: pageNum, pageSize, rows: rowsWithIcp, stats });
  } catch (err) {
    console.error("GET /mahasiswa error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/mahasiswa/:id   → detail satu mahasiswa
// ════════════════════════════════════════════════════════════
router.get("/:id", async (req, res) => {
  try {
    const id  = parseInt(req.params.id, 10);
    const mhs = await prisma.mahasiswa.findUnique({
      where:   { id_mahasiswa: id },
      include: { programstudi: true, kegiatanmahasiswa: true },
    });
    if (!mhs) return res.status(404).json({ error: "Mahasiswa tidak ditemukan" });
    res.json(mhs);
  } catch (err) {
    console.error("GET /mahasiswa/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa   → tambah mahasiswa baru
// ════════════════════════════════════════════════════════════
router.post("/", async (req, res) => {
  try {
    const { nim, nama, id_prodi, angkatan, email, password, aktif } = req.body;

    if (!nim || !nama) return res.status(400).json({ error: "NIM dan nama wajib diisi" });

    // Cek NIM duplikat
    const existing = await prisma.mahasiswa.findFirst({ where: { nim } });
    if (existing) return res.status(409).json({ error: "NIM sudah terdaftar" });

    // Cek username duplikat (NIM dipakai sebagai username)
    const existingUser = await prisma.users.findFirst({ where: { username: nim } });
    if (existingUser) return res.status(409).json({ error: "Username (NIM) sudah dipakai akun lain" });

    // Buat akun login (password default = NIM jika tidak diisi)
    const bcrypt = await import("bcryptjs");
    const plainPassword = password?.trim() || nim;
    const hashed = await bcrypt.default.hash(plainPassword, 10);

    const user = await prisma.users.create({
      data: {
        username:    nim,
        password:    hashed,
        role:        "mahasiswa",
        email:       email ?? null,
        status_akun: aktif === false ? "nonaktif" : "aktif",
        updated_at:  new Date(),
      },
    });

    // Buat data mahasiswa & hubungkan ke akun
    const mhs = await prisma.mahasiswa.create({
      data: {
        nim,
        nama,
        id_prodi:  id_prodi  ? parseInt(id_prodi)  : null,
        angkatan:  angkatan  ? parseInt(angkatan)   : null,
        email:     email     ?? null,
        id_user:   user.user_id,
      },
    });

    res.status(201).json({
      success: true,
      message: `Mahasiswa ${nama} berhasil ditambahkan. Username: ${nim}, Password: ${plainPassword}`,
      id_mahasiswa: mhs.id_mahasiswa,
    });
  } catch (err) {
    console.error("POST /mahasiswa error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /api/mahasiswa/:id   → update data mahasiswa
// ════════════════════════════════════════════════════════════
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID tidak valid" });

    const { nama, email, id_prodi, angkatan, status_skpi, aktif } = req.body;

    // Update data mahasiswa — hanya field yang dikenal Prisma
    const mhs = await prisma.mahasiswa.update({
      where: { id_mahasiswa: id },
      data: {
        ...(nama        !== undefined && { nama }),
        ...(email       !== undefined && { email }),
        ...(id_prodi    !== undefined && { id_prodi: id_prodi ? parseInt(id_prodi) : null }),
        ...(angkatan    !== undefined && { angkatan: angkatan ? parseInt(angkatan) : null }),
        ...(status_skpi !== undefined && {
          // Map label UI → enum Prisma
          status_skpi: {
            Selesai:    'diterbitkan',
            Proses:     'diajukan',
            Revisi:     'direvisi',
            Belum:      'belum',
            diterbitkan:'diterbitkan',
            diajukan:   'diajukan',
            direvisi:   'direvisi',
            belum:      'belum',
          }[status_skpi] ?? 'belum',
        }),
      },
    });

    // Jika status aktif dikirim, update juga tabel users
    if (aktif !== undefined) {
      const linked = await prisma.mahasiswa.findUnique({
        where:  { id_mahasiswa: id },
        select: { id_user: true },
      });
      if (linked?.id_user) {
        await prisma.users.update({
          where: { user_id: linked.id_user },
          data:  { status_akun: aktif ? "aktif" : "nonaktif", updated_at: new Date() },
        });
      }
    }

    res.json({ success: true, message: "Data mahasiswa diperbarui", data: mhs });
  } catch (err) {
    console.error("PATCH /mahasiswa/:id error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/mahasiswa/bulk   → import massal dari Excel
// ════════════════════════════════════════════════════════════
router.post("/bulk", async (req, res) => {
  try {
    const { list } = req.body;
    if (!Array.isArray(list) || list.length === 0) {
      return res.status(400).json({ error: "List mahasiswa kosong" });
    }

    const bcrypt = await import("bcryptjs");

    // Pre-load semua prodi untuk resolusi nama prodi → id_prodi
    const allProdi = await prisma.programstudi.findMany();
    const prodiNameMap = {};
    allProdi.forEach(p => {
      prodiNameMap[p.nama_prodi.trim().toLowerCase()] = p.id_prodi;
    });

    // Fungsi resolusi prodi: exact match dulu, lalu partial match
    const resolveProdi = (val) => {
      if (val === undefined || val === null || val === "") return null;
      const asNum = parseInt(val);
      if (!isNaN(asNum) && String(asNum) === String(val).trim()) return asNum;
      const lower = String(val).trim().toLowerCase();
      if (prodiNameMap[lower] !== undefined) return prodiNameMap[lower];
      // Partial match: cari prodi yang namanya mengandung kata kunci
      const partialKey = Object.keys(prodiNameMap).find(k => k.includes(lower) || lower.includes(k));
      return partialKey ? prodiNameMap[partialKey] : null;
    };

    let success = 0, skipped = 0;
    const errors = [];

    for (const item of list) {
      try {
        const { nim, nama, id_prodi, angkatan, email, password } = item;
        if (!nim || !nama) {
          errors.push({ nim: nim || "?", error: "NIM dan nama wajib diisi" });
          continue;
        }

        const resolvedProdi = resolveProdi(id_prodi);

        // Jika mahasiswa sudah ada → skip
        const existingMhs = await prisma.mahasiswa.findFirst({ where: { nim } });
        if (existingMhs) { skipped++; continue; }

        const plainPw = (password?.toString().trim()) || nim;
        const hashed  = await bcrypt.default.hash(plainPw, 10);

        // Cek apakah ada orphaned user (users ada, mahasiswa tidak)
        const existingUser = await prisma.users.findFirst({ where: { username: nim } });

        if (existingUser) {
          // Perbaiki orphaned user: buat mahasiswa dan hubungkan ke user yang sudah ada
          await prisma.mahasiswa.create({
            data: {
              nim,
              nama,
              id_prodi:  resolvedProdi,
              angkatan:  angkatan ? parseInt(angkatan) : null,
              email:     email ?? null,
              id_user:   existingUser.user_id,
            },
          });
        } else {
          // Buat user + mahasiswa secara atomik dalam satu transaksi
          await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
              data: {
                username:    nim,
                password:    hashed,
                role:        "mahasiswa",
                email:       email ?? null,
                status_akun: "aktif",
                updated_at:  new Date(),
              },
            });
            await tx.mahasiswa.create({
              data: {
                nim,
                nama,
                id_prodi:  resolvedProdi,
                angkatan:  angkatan ? parseInt(angkatan) : null,
                email:     email ?? null,
                id_user:   user.user_id,
              },
            });
          });
        }

        success++;
      } catch (err) {
        errors.push({ nim: item.nim || "?", error: err.message });
      }
    }

    res.json({ success, skipped, failed: errors.length, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error("POST /mahasiswa/bulk error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/mahasiswa/:id
// ════════════════════════════════════════════════════════════
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.mahasiswa.delete({ where: { id_mahasiswa: id } });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /mahasiswa/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;