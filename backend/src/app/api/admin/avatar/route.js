import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Password lama dan baru wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password baru minimal 6 karakter.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get first admin (adjust with your auth/session logic as needed)
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Admin tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify current password
    // If passwords are stored as plain text, use: admin.password === currentPassword
    // If hashed with bcrypt:
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Password saat ini tidak sesuai.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { id_admin: admin.id_admin },
      data: { password: hashed },
    });

    return new Response(
      JSON.stringify({ message: 'Password berhasil diperbarui.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Password change error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 