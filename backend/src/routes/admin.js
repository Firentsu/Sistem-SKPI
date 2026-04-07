import { Router } from "express";
import bcrypt     from "bcryptjs";

import prisma          from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Semua route admin wajib login
router.use(requireAuth);

// ════════════════════════════════════════════════════════════
//  GET  /api/admin/profile    → ambil profil admin
//  PATCH /api/admin/profile   → update nama admin
// ════════════════════════════════════════════════════════════
router.get("/profile", async (req, res) => {
  try {
    const admin = await prisma.admin.findFirst({ include: { users: true } });
    if (!admin) return res.json({});

    res.json({
      id_admin:   admin.id_admin,
      id_user:    admin.id_user,
      nama_admin: admin.nama_admin,
      email:      admin.email || admin.users?.email || null,
      avatar:     admin.avatar || null,
      is_active:  admin.is_active,
    });
  } catch (err) {
    console.error("GET /admin/profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const { user }       = req;
    const admin          = user.admin ?? null;
    const { nama_admin } = req.body;

    if (!nama_admin || nama_admin.trim().length < 2) {
      return res.status(400).json({ error: "Nama minimal 2 karakter" });
    }

    if (admin) {
      await prisma.admin.update({
        where: { id_admin: admin.id_admin },
        data:  { nama_admin: nama_admin.trim() },
      });
    }

    res.json({ success: true, message: "Profil berhasil diperbarui" });
  } catch (err) {
    console.error("PATCH /admin/profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/admin/password   → ganti password admin
// ════════════════════════════════════════════════════════════
router.post("/password", async (req, res) => {
  try {
    const { user }                       = req;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Password lama dan baru wajib diisi" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password baru minimal 6 karakter" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: "Password saat ini tidak sesuai" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({ where: { user_id: user.user_id }, data: { password: hashed } });

    res.json({ message: "Password berhasil diperbarui" });
  } catch (err) {
    console.error("POST /admin/password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
