// src/app/api/proxy/sicp-sync/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Ambil cookie dari request asli (agar sesi admin tetap terbawa)
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch('https://sistem-skpi-production.up.railway.app/api/sicp-sync/both', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('Proxy SICP error:', error);
    return NextResponse.json(
      { error: 'Gagal menghubungi server SICP' },
      { status: 500 }
    );
  }
}