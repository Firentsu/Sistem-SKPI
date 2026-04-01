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
    include: { admin: true }, // ✅ admin adalah object tunggal (one-to-one)
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
════════════════════════════════════════ */
export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Not authenticated" }, 401);

    // ✅ admin adalah object tunggal, BUKAN array
    const admin = user.admin ?? null;

    return json({
      user_id:    user.user_id,
      username:   user.username,
      email:      user.email,
      nama_admin: admin?.nama_admin ?? user.username,
      avatar:     admin?.avatar ?? null,
      id_admin:   admin?.id_admin ?? null,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("GET /api/auth/profile error:", err);
    return json({ error: "Server error" }, 500);
  }
}

/* ════════════════════════════════════════
   PATCH  /api/auth/profile
   body: { action: "username"|"email"|"password", ...fields }
════════════════════════════════════════ */
export async function PATCH(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json();
    const { action } = body;

    // ✅ admin adalah object tunggal, BUKAN array
    const admin = user.admin ?? null;

    /* ── Update Username ── */
    if (action === "username") {
      const { username } = body;

      if (!username || username.trim().length < 3) {
        return json({ error: "Username minimal 3 karakter." }, 400);
      }

      const trimmed = username.trim();

      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return json({ error: "Username hanya boleh huruf, angka, dan underscore (_)." }, 400);
      }

      const existing = await prisma.users.findFirst({
        where: { username: trimmed, NOT: { user_id: user.user_id } },
      });
      if (existing) return json({ error: "Username sudah digunakan akun lain." }, 409);

      await prisma.users.update({
        where: { user_id: user.user_id },
        data:  { username: trimmed },
      });

      return json({ success: true, message: "Username berhasil diperbarui." });
    }

    /* ── Update Email ── */
    if (action === "email") {
      const { email } = body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return json({ error: "Format email tidak valid." }, 400);
      }

      const trimmed = email.trim().toLowerCase();

      const existing = await prisma.users.findFirst({
        where: { email: trimmed, NOT: { user_id: user.user_id } },
      });
      if (existing) return json({ error: "Email sudah digunakan akun lain." }, 409);

      await prisma.users.update({
        where: { user_id: user.user_id },
        data:  { email: trimmed },
      });

      if (admin) {
        await prisma.admin.update({
          where: { id_admin: admin.id_admin },
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

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return json({ error: "Password saat ini tidak tepat." }, 400);

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