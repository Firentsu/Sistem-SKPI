export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

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

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_MAP       = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES     = 2 * 1024 * 1024; // 2 MB
const UPLOAD_DIR    = path.join(process.cwd(), "public", "uploads", "avatars");

/* ════════════════════════════════════════
   POST  /api/auth/avatar
════════════════════════════════════════ */
export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return json({ error: "Not authenticated" }, 401);

    // ✅ admin adalah object tunggal, BUKAN array
    const admin = user.admin ?? null;

    const formData = await req.formData();
    const file     = formData.get("avatar");

    if (!file || typeof file === "string") {
      return json({ error: "File avatar tidak ditemukan." }, 400);
    }
    if (!ACCEPTED_MIME.includes(file.type)) {
      return json({ error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_BYTES) {
      return json({ error: "Ukuran file maksimal 2 MB." }, 400);
    }

    // Buat direktori jika belum ada
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Hapus avatar lama jika ada
    if (admin?.avatar) {
      const oldPath = path.join(process.cwd(), "public", admin.avatar);
      if (existsSync(oldPath)) {
        await unlink(oldPath).catch(() => {});
      }
    }

    // Nama file unik
    const ext      = EXT_MAP[file.type];
    const filename = `admin_${admin?.id_admin ?? user.user_id}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${filename}`;

    // ✅ Update atau buat row admin
    if (admin) {
      await prisma.admin.update({
        where: { id_admin: admin.id_admin },
        data:  { avatar: publicUrl },
      });
    } else {
      // Belum ada row admin → buat baru
      await prisma.admin.create({
        data: {
          id_user:    user.user_id,
          nama_admin: user.username,
          email:      user.email ?? "",
          avatar:     publicUrl,
        },
      });
    }

    return json({ success: true, avatar: publicUrl });
  } catch (err) {
    console.error("POST /api/auth/avatar error:", err);
    return json({ error: "Server error" }, 500);
  }
}