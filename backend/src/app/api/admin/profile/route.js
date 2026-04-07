import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Return the first admin (no auth implemented here)
    const admin = await prisma.admin.findFirst({ include: { user: true } });
    if (!admin) {
      return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const payload = {
      id_admin: admin.id_admin,
      id_user: admin.id_user,
      nama_admin: admin.nama_admin,
      email: admin.email || admin.user?.email || null,
      avatar: admin.avatar || null,
      is_active: admin.is_active,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
