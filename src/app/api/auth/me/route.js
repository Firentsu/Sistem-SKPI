import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('skpi_auth='));
    if (!match) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    const token = match.split('=')[1];
    const payload = verifyToken(token);
    if (!payload) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const user = await prisma.users.findUnique({ where: { user_id: payload.userId }, include: { admin: true } });
    if (!user || user.role !== 'admin') return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ user: { user_id: user.user_id, username: user.username, email: user.email }, admin: user.admin ? { id_admin: user.admin.id_admin, nama_admin: user.admin.nama_admin, email: user.admin.email, avatar: user.admin.avatar } : null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
