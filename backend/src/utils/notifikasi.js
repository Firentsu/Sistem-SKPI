/**
 * Utility pembuatan notifikasi — dipakai di berbagai route.
 * Semua fungsi bersifat fire-and-forget: error tidak melempar exception.
 */

import prisma from "../lib/prisma.js";
import { send as sseSend } from "./sseManager.js";

/** Kirim notifikasi ke satu user */
export async function createNotif(id_user, judul, pesan) {
  if (!id_user) return;
  try {
    const notif = await prisma.notifikasi.create({
      data: { id_user, judul, pesan },
      select: { id_notifikasi: true, judul: true, pesan: true, status_baca: true, created_at: true },
    });
    // Push real-time ke client yang sedang online
    sseSend(id_user, { type: "notif", ...notif });
  } catch (err) {
    console.error("createNotif error:", err.message);
  }
}

/** Kirim notifikasi ke semua user admin aktif */
export async function notifAllAdmins(judul, pesan) {
  try {
    const admins = await prisma.users.findMany({
      where: { role: "admin", status_akun: "aktif" },
      select: { user_id: true },
    });
    if (!admins.length) return;
    await prisma.notifikasi.createMany({
      data: admins.map(a => ({ id_user: a.user_id, judul, pesan })),
    });
  } catch (err) {
    console.error("notifAllAdmins error:", err.message);
  }
}

/** Ambil id_user milik mahasiswa (dari tabel mahasiswa) */
export async function getMahasiswaUserId(id_mahasiswa) {
  try {
    const mhs = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa },
      select: { id_user: true },
    });
    return mhs?.id_user ?? null;
  } catch {
    return null;
  }
}
