// src/app/api/proxy/sicp-sync/test-public/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('https://sistem-skpi-production.up.railway.app/api/sicp-sync/test-public');
  const data = await response.json();
  return NextResponse.json(data);
}