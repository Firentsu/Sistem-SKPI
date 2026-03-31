export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await prisma.users.findFirst({ where: { username } });
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Invalid username" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = {
      userId: user.user_id,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24,
    }; // 1 day
    const token = signToken(payload);

    const headers = new Headers({ "Content-Type": "application/json" });
    const cookie = `skpi_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;
    headers.append("Set-Cookie", cookie);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
