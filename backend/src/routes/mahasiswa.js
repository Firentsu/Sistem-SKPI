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

    const [total, rows] = await Promise.all([
      prisma.mahasiswa.count({ where }),
      prisma.mahasiswa.findMany({
        where,
        skip:    (pageNum - 1) * pageSize,
        take:    pageSize,
        include: {
          programstudi: true,
          users: { select: { status_akun: true } },
          _count: { select: { kegiatanmahasiswa: true } },
        },
        orderBy: { nama: "asc" },
      }),
    ]);

    res.json({ total, page: pageNum, pageSize, rows });
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
        ...(status_skpi !== undefined && { status_skpi }),
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