import prisma from "../lib/prisma.js";

/**
 * Middleware: cek sesi admin aktif.
 * Sesi disimpan di MySQL via express-session.
 * Jika valid → req.user berisi data lengkap user + admin.
 */
export async function requireAuth(req, res, next) {
  try {
    const { userId, role } = req.session ?? {};

    if (!userId || role !== "admin") {
      return res.status(401).json({ error: "Tidak terautentikasi" });
    }

    const user = await prisma.users.findUnique({
      where:   { user_id: userId },
      include: { admin: true },
    });

    if (!user || user.role !== "admin") {
      req.session.destroy(() => {});
      return res.status(403).json({ error: "Akses ditolak" });
    }

    if (user.status_akun === "nonaktif") {
      req.session.destroy(() => {});
      return res.status(403).json({ error: "Akun dinonaktifkan. Hubungi administrator." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    res.status(500).json({ error: "Server error" });
  }
}