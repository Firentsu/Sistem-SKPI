export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

/* ── helper ── */
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const c of cookieHeader.split(";").map((s) => s.trim())) {
    if (c.startsWith(name + "=")) return c.substring(name.length + 1);
  }
  return null;
}

async function getAuthUser(req) {
  const raw = parseCookie(req.headers.get("cookie") || "", "skpi_auth");
  if (!raw) return null;
  const payload = verifyToken(decodeURIComponent(raw));
  if (!payload) return null;

  const user = await prisma.users.findUnique({
    where: { user_id: payload.userId },
    include: { admin: true },
  });
  if (!user || user.role !== "admin") return null;
  return user;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* ════════════════════════════════════════
   GET  /api/auth/profile
   → kembalikan data profil admin
════════════════════════════════════════ */
export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Not authenticated" }, 401);

    return json({
      user_id:    user.user_id,
      username:   user.username,
      email:      user.email,
      nama_admin: user.admin?.nama_admin ?? user.username,
      avatar:     user.admin?.avatar ?? null,
      id_admin:   user.admin?.id_admin ?? null,
    });
  } catch (err) {
    console.error("GET /api/auth/profile error:", err);
    return json({ error: "Server error" }, 500);
  }
}

/* ════════════════════════════════════════
   PATCH  /api/auth/profile
   body: { action: "email"|"password", ...fields }
════════════════════════════════════════ */
export async function PATCH(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json();
    const { action } = body;

    /* ── Update Email ── */
    if (action === "email") {
      const { email } = body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return json({ error: "Format email tidak valid." }, 400);
      }

      const trimmed = email.trim().toLowerCase();

      // cek email sudah dipakai user lain
      const existing = await prisma.users.findFirst({
        where: { email: trimmed, NOT: { user_id: user.user_id } },
      });
      if (existing) return json({ error: "Email sudah digunakan akun lain." }, 409);

      // update di tabel Users
      await prisma.users.update({
        where: { user_id: user.user_id },
        data:  { email: trimmed },
      });

      // update juga di tabel Admin jika ada
      if (user.admin) {
        await prisma.admin.update({
          where: { id_admin: user.admin.id_admin },
          data:  { email: trimmed },
        });
      }

      return json({ success: true, message: "Email berhasil diperbarui." });
    }

    /* ── Update Password ── */
    if (action === "password") {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return json({ error: "Semua field password wajib diisi." }, 400);
      }
      if (newPassword.length < 8) {
        return json({ error: "Password baru minimal 8 karakter." }, 400);
      }

      // verifikasi password lama
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return json({ error: "Password saat ini tidak tepat." }, 400);

      // hash password baru
      const hashed = await bcrypt.hash(newPassword, 12);

      await prisma.users.update({
        where: { user_id: user.user_id },
        data:  { password: hashed },
      });

      return json({ success: true, message: "Password berhasil diperbarui." });
    }

    return json({ error: "Action tidak dikenal." }, 400);
  } catch (err) {
    console.error("PATCH /api/auth/profile error:", err);
    return json({ error: "Server error" }, 500);
  }
}