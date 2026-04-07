import { verifyToken } from "../lib/auth.js";
import prisma          from "../lib/prisma.js";

/**
 * Middleware: pastikan request punya cookie skpi_auth yang valid (admin).
 * Jika valid, req.user akan berisi data user + admin dari DB.
 */
export async function requireAuth(req, res, next) {
  try {
    const raw = req.cookies?.skpi_auth;
    if (!raw) return res.status(401).json({ error: "Tidak terautentikasi" });

    const payload = verifyToken(decodeURIComponent(raw));
    if (!payload)  return res.status(401).json({ error: "Token tidak valid atau sudah expired" });

    const user = await prisma.users.findUnique({
      where:   { user_id: payload.userId },
      include: { admin: true },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Akses ditolak" });
    }

    req.user = user;           // user.admin → object tunggal (one-to-one)
    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
