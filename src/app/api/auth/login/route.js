import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const user = await prisma.users.findFirst({ where: { username }, include: { admin: true } });
    if (!user || !user.admin) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Set-Cookie": `adminId=${user.admin.id_admin}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24}`
      }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
