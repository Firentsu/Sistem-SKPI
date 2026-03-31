export const runtime = "nodejs";

import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(s => s.trim());
  for (const c of cookies) {
    if (c.startsWith(name + '=')) {
      return c.substring(name.length + 1);
    }
  }
  return null;
}

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const rawToken = parseCookie(cookieHeader, 'skpi_auth');

    if (!rawToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = decodeURIComponent(rawToken);
    const payload = verifyToken(token);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: payload.userId },
      include: { admin: true },
    });

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Admin adalah array (Users -> Admin[] di schema)
    const adminRecord = user.admin?.[0] ?? null;

    const body = {
      user: {
        user_id:  user.user_id,
        username: user.username,
        email:    user.email,
      },
      admin: adminRecord
        ? {
            id_admin:   adminRecord.id_admin,
            nama_admin: adminRecord.nama_admin,
            email:      adminRecord.email,
            avatar:     adminRecord.avatar,
          }
        : null,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ME error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}