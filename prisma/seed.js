// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureAdmin({ username, plainPassword, nama_admin, email }) {
  // cari user berdasarkan username
  let user = await prisma.users.findFirst({ where: { username } });

  const hashed = await bcrypt.hash(plainPassword, 10);

  if (!user) {
    // buat user baru (users.updated_at wajib di schema)
    user = await prisma.users.create({
      data: {
        username,
        password: hashed,
        role: "admin",
        email,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  } else {
    // update user yang sudah ada (pakai primary key user_id)
    user = await prisma.users.update({
      where: { user_id: user.user_id },
      data: {
        password: hashed,
        role: "admin",
        email,
        updated_at: new Date(),
      },
    });
  }

  // cek admin terkait user (id_user adalah unique di schema)
  let admin = await prisma.admin.findFirst({ where: { id_user: user.user_id } });

  if (!admin) {
    // buat admin dan connect ke user lewat relation API
    admin = await prisma.admin.create({
      data: {
        users: { connect: { user_id: user.user_id } },
        nama_admin,
        email,
        avatar: null,
        is_active: true,
      },
    });
  } else {
    // update admin yang sudah ada (tidak ada created_at/updated_at di model admin)
    admin = await prisma.admin.update({
      where: { id_admin: admin.id_admin },
      data: {
        nama_admin,
        email,
        avatar: admin.avatar ?? null,
        is_active: true,
      },
    });
  }

  return { user, admin };
}

async function main() {
  const admin = {
    username: "superadmin",
    plainPassword: "SuperAdmin123!",
    nama_admin: "Admin Utama",
    email: "superadmin@campus.id",
  };

  const res = await ensureAdmin(admin);
  console.log(
    `✅ Admin siap: username=${admin.username}, id_user=${res.user.user_id}, id_admin=${res.admin.id_admin}`
  );
  console.log("✅ Seeding selesai.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
