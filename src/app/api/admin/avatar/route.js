import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();
    // Expecting { filename, data } where data is base64 string (data URL or pure base64)
    const { filename, data } = body;
    if (!filename || !data) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // strip data URL prefix if present
    const base64 = data.includes(',') ? data.split(',')[1] : data;
    const buffer = Buffer.from(base64, 'base64');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);

    // update first admin's avatar (no auth) — store path relative to /public
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      return new Response(JSON.stringify({ error: 'No admin found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const avatarPath = `/uploads/avatars/${safeName}`;
    await prisma.admin.update({ where: { id_admin: admin.id_admin }, data: { avatar: avatarPath } });

    return new Response(JSON.stringify({ avatar: avatarPath }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
