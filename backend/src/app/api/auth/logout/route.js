export async function POST() {
  const headers = new Headers();
  headers.append('Set-Cookie', `skpi_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  headers.append('Set-Cookie', `adminId=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
