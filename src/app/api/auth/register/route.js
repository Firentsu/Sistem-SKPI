import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const body = await req.json();
  const { username, password, email } = body;

  // cek user sudah ada
  const existing = await prisma.users.findFirst({
    where: { username },
  });

  if (existing) {
    return NextResponse.json(
      { message: "Username sudah digunakan" },
      { status: 400 }
    );
  }

  const user = await prisma.users.create({
    data: {
      username,
      password,
      email,
      role: "mahasiswa", // default
      status_akun: "aktif",
    },
  });

  return NextResponse.json({
    message: "Register berhasil",
    user,
  });
}