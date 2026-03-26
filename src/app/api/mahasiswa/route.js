import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const prodi = url.searchParams.get('prodi') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const pageSize = 10;

    const where = {};
    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { nim: { contains: q } },
      ];
    }
    if (prodi && prodi !== 'Semua') {
      // find prodi id by name
      const p = await prisma.programStudi.findFirst({ where: { nama_prodi: prodi } });
      if (p) where.id_prodi = p.id_prodi;
    }

    const total = await prisma.mahasiswa.count({ where });
    const rows = await prisma.mahasiswa.findMany({ where, skip: (page - 1) * pageSize, take: pageSize });

    return new Response(JSON.stringify({ total, page, pageSize, rows }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
