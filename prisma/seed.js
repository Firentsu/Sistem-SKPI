// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureAdmin({ username, plainPassword, nama_admin, email }) {
  // check existing user by username
  let user = await prisma.users.findFirst({ where: { username } });

  if (!user) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    user = await prisma.users.create({
      data: {
        username,
        password: hashed,
        role: 'admin',
        email,
      },
    });
  }

  // create admin row if missing (id_user is unique)
  let admin = await prisma.admin.findFirst({ where: { id_user: user.user_id } });
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        id_user: user.user_id,
        nama_admin,
        email,
        avatar: null,
        is_active: true,
      },
    });
  }

  return { user, admin };
}

async function main() {
  // Only create a single admin account (role 'admin').
  const admin = { username: "superadmin", plainPassword: "SuperAdmin123!", nama_admin: "Admin Utama", email: "superadmin@campus.id" };
  const res = await ensureAdmin(admin);
  console.log(`Admin siap: username=${admin.username}, id_user=${res.user.user_id}, id_admin=${res.admin.id_admin}`);

  console.log("Admin telah dibuat/tersedia.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
