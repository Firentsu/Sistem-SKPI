// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Helper: buat user admin jika belum ada ───────────────────────────────
async function ensureAdmin({ username, plainPassword, nama_admin, email }) {
  let user = await prisma.users.findFirst({ where: { username } });
  if (!user) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    user = await prisma.users.create({
      data: {
        username,
        password:    hashed,
        role:        "admin",
        email,
        status_akun: "aktif",
        updated_at:  new Date(),
      },
    });
  }
  let admin = await prisma.admin.findFirst({ where: { id_user: user.user_id } });
  if (!admin) {
    admin = await prisma.admin.create({
      data: { id_user: user.user_id, nama_admin, email, is_active: true },
    });
  }
  return { user, admin };
}

// ─── Helper: buat user mahasiswa jika belum ada ───────────────────────────
async function ensureMahasiswaUser(nim, plainPassword, email) {
  let user = await prisma.users.findFirst({ where: { username: nim } });
  if (!user) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    user = await prisma.users.create({
      data: {
        username:    nim,
        password:    hashed,
        role:        "mahasiswa",
        email,
        status_akun: "aktif",
        updated_at:  new Date(),
      },
    });
  }
  return user;
}

async function main() {
  console.log("🌱 Mulai seeding...\n");

  // ════════════════════════════════════════════════════════════
  // 1. ADMIN
  // ════════════════════════════════════════════════════════════
  const { user: adminUser, admin } = await ensureAdmin({
    username:      "superadmin",
    plainPassword: "SuperAdmin123!",
    nama_admin:    "Admin Utama",
    email:         "superadmin@isb.ac.id",
  });
  console.log(`✅ Admin   : username=superadmin  password=SuperAdmin123!`);

  // ════════════════════════════════════════════════════════════
  // 2. PROGRAM STUDI
  // ════════════════════════════════════════════════════════════
  const prodiData = [
    { nama_prodi: "Teknologi Informasi",           fakultas: "Teknologi" },
    { nama_prodi: "Sistem Informasi",              fakultas: "Teknologi" },
    { nama_prodi: "Manajemen",                     fakultas: "Bisnis" },
    { nama_prodi: "Kewirausahaan",                 fakultas: "Bisnis" },
    { nama_prodi: "Pendidikan Guru Sekolah Dasar", fakultas: "Pendidikan" },
    { nama_prodi: "Agroekoteknologi",              fakultas: "Pertanian" },
  ];
  const prodiMap = {};
  for (const p of prodiData) {
    let prodi = await prisma.programstudi.findFirst({ where: { nama_prodi: p.nama_prodi } });
    if (!prodi) prodi = await prisma.programstudi.create({ data: p });
    prodiMap[p.nama_prodi] = prodi.id_prodi;
  }
  console.log(`✅ Program Studi : ${prodiData.length} prodi`);

  // ════════════════════════════════════════════════════════════
  // 3. JENIS AKTIVITAS
  // ════════════════════════════════════════════════════════════
  const jenisData = [
    { nama_indo: "Prestasi dan Kegiatan",                       nama_eng: "Achievement and Activity" },
    { nama_indo: "Peningkatan Keterampilan Profesional",        nama_eng: "Professional Skill Development" },
    { nama_indo: "Pengalaman Berorganisasi dan Kepemimpinan",   nama_eng: "Organizational and Leadership Experience" },
    { nama_indo: "Pengembangan Intelektual",                    nama_eng: "Intellectual Development" },
    { nama_indo: "Praktik Kerja",                               nama_eng: "Work Practice" },
    { nama_indo: "Pengabdian Masyarakat",                       nama_eng: "Community Service" },
    { nama_indo: "Penelitian",                                  nama_eng: "Research" },
  ];
  for (const j of jenisData) {
    const exists = await prisma.jenisaktivitas.findFirst({ where: { nama_indo: j.nama_indo } });
    if (!exists) await prisma.jenisaktivitas.create({ data: { ...j, status: true } });
  }
  console.log(`✅ Jenis Aktivitas : ${jenisData.length} jenis`);

  // ════════════════════════════════════════════════════════════
  // 4. KATEGORI AKTIVITAS
  // ════════════════════════════════════════════════════════════
  const kategoriData = [
    // Prestasi
    { nama_indo: "Lomba / Kompetisi",             nama_eng: "Competition" },
    { nama_indo: "Olimpiade",                     nama_eng: "Olympiad" },
    { nama_indo: "Penghargaan / Award",           nama_eng: "Award" },
    // Keterampilan Profesional
    { nama_indo: "Workshop / Pelatihan",          nama_eng: "Workshop / Training" },
    { nama_indo: "Seminar / Webinar",             nama_eng: "Seminar / Webinar" },
    { nama_indo: "Sertifikasi Profesi",           nama_eng: "Professional Certification" },
    { nama_indo: "Kursus",                        nama_eng: "Course" },
    { nama_indo: "Kuliah Umum / Studium Generale",nama_eng: "Public Lecture / Studium Generale" },
    // Organisasi
    { nama_indo: "Pengurus Organisasi",           nama_eng: "Organization Executive" },
    { nama_indo: "Kepanitiaan Kegiatan",          nama_eng: "Event Committee" },
    { nama_indo: "Komunitas / UKM",               nama_eng: "Community / Student Activity Unit" },
    { nama_indo: "Relawan / Sukarelawan",         nama_eng: "Volunteer" },
    { nama_indo: "Mentoring / Pembimbing",        nama_eng: "Mentoring" },
    // Intelektual
    { nama_indo: "Asisten Penelitian / Riset",   nama_eng: "Research Assistant" },
    { nama_indo: "Publikasi Ilmiah",              nama_eng: "Scientific Publication" },
    { nama_indo: "Konferensi Ilmiah",             nama_eng: "Scientific Conference" },
    { nama_indo: "Pertukaran Pelajar / Exchange", nama_eng: "Student Exchange" },
    // Praktik Kerja
    { nama_indo: "Magang / PKL",                  nama_eng: "Internship" },
    { nama_indo: "Praktik Kerja Lapangan",        nama_eng: "Field Work Practice" },
    { nama_indo: "Kewirausahaan / Startup",       nama_eng: "Entrepreneurship / Startup" },
    // Legacy (jaga data lama)
    { nama_indo: "Seminar",       nama_eng: "Seminar" },
    { nama_indo: "Workshop",      nama_eng: "Workshop" },
    { nama_indo: "Lomba",         nama_eng: "Competition" },
    { nama_indo: "Magang",        nama_eng: "Internship" },
    { nama_indo: "Organisasi",    nama_eng: "Organization" },
    { nama_indo: "Pelatihan",     nama_eng: "Training" },
    { nama_indo: "KKN",           nama_eng: "Community Service Program" },
    { nama_indo: "Publikasi",     nama_eng: "Publication" },
  ];
  for (const k of kategoriData) {
    const exists = await prisma.kategoriaktivitas.findFirst({ where: { nama_indo: k.nama_indo } });
    if (!exists) await prisma.kategoriaktivitas.create({ data: { ...k, status: true } });
  }
  console.log(`✅ Kategori Aktivitas : ${kategoriData.length} kategori`);

  // ════════════════════════════════════════════════════════════
  // 5. KELOMPOK AKTIVITAS
  // ════════════════════════════════════════════════════════════
  const kelompokData = [
    { nama_indo: "Akademik",       nama_eng: "Academic" },
    { nama_indo: "Non-Akademik",   nama_eng: "Non-Academic" },
    { nama_indo: "Profesional",    nama_eng: "Professional" },
    { nama_indo: "Organisasi",     nama_eng: "Organization" },
    { nama_indo: "Kepemimpinan",   nama_eng: "Leadership" },
    { nama_indo: "Penelitian",     nama_eng: "Research" },
    { nama_indo: "Kewirausahaan",  nama_eng: "Entrepreneurship" },
  ];
  for (const k of kelompokData) {
    const exists = await prisma.kelompokaktivitas.findFirst({ where: { nama_indo: k.nama_indo } });
    if (!exists) await prisma.kelompokaktivitas.create({ data: { ...k, status: true } });
  }
  console.log(`✅ Kelompok Aktivitas : ${kelompokData.length} kelompok`);

  // ════════════════════════════════════════════════════════════
  // 6. LEVEL KEGIATAN
  // ════════════════════════════════════════════════════════════
  const levelData = ["Internal Kampus", "Lokal/Kota", "Regional", "Nasional", "Internasional"];
  for (const l of levelData) {
    const exists = await prisma.levelkegiatan.findFirst({ where: { nama_level: l } });
    if (!exists) await prisma.levelkegiatan.create({ data: { nama_level: l } });
  }
  console.log(`✅ Level Kegiatan : ${levelData.length} level`);

  // ════════════════════════════════════════════════════════════
  // 7. POSISI KEGIATAN
  // ════════════════════════════════════════════════════════════
  const posisiData = ["Peserta", "Panitia", "Pembicara", "Ketua", "Anggota", "Juri", "Moderator"];
  for (const p of posisiData) {
    const exists = await prisma.posisikegiatan.findFirst({ where: { nama_posisi: p } });
    if (!exists) await prisma.posisikegiatan.create({ data: { nama_posisi: p } });
  }
  console.log(`✅ Posisi Kegiatan : ${posisiData.length} posisi`);

  // ════════════════════════════════════════════════════════════
  // 8. PERIODE AKADEMIK
  // ════════════════════════════════════════════════════════════
  const periodeData = [
    { nama_periode: "2023/2024 Ganjil", semester: "Ganjil" },
    { nama_periode: "2023/2024 Genap",  semester: "Genap" },
    { nama_periode: "2024/2025 Ganjil", semester: "Ganjil" },
    { nama_periode: "2024/2025 Genap",  semester: "Genap" },
    { nama_periode: "2025/2026 Ganjil", semester: "Ganjil" },
    { nama_periode: "2025/2026 Genap",  semester: "Genap" },
  ];
  for (const p of periodeData) {
    const exists = await prisma.periodeakademik.findFirst({ where: { nama_periode: p.nama_periode } });
    if (!exists) await prisma.periodeakademik.create({ data: { ...p, status: true } });
  }
  console.log(`✅ Periode Akademik : ${periodeData.length} periode`);

  // ════════════════════════════════════════════════════════════
  // 9. ICP KATEGORI
  // ════════════════════════════════════════════════════════════
  const icpData = [
    { nama_indo: "Kegiatan Akademik",           nama_eng: "Academic Activity",           bobot_poin: 10 },
    { nama_indo: "Kegiatan Non-Akademik",        nama_eng: "Non-Academic Activity",       bobot_poin: 8  },
    { nama_indo: "Kepemimpinan & Organisasi",    nama_eng: "Leadership & Organization",   bobot_poin: 12 },
    { nama_indo: "Kewirausahaan",                nama_eng: "Entrepreneurship",            bobot_poin: 15 },
    { nama_indo: "Pengabdian Masyarakat",        nama_eng: "Community Service",           bobot_poin: 10 },
    { nama_indo: "Sertifikasi & Kompetensi",     nama_eng: "Certification & Competency",  bobot_poin: 20 },
  ];
  for (const i of icpData) {
    const exists = await prisma.icpkategori.findFirst({ where: { nama_indo: i.nama_indo } });
    if (!exists) await prisma.icpkategori.create({ data: i });
  }
  console.log(`✅ ICP Kategori : ${icpData.length} kategori`);

  // ════════════════════════════════════════════════════════════
  // 10. MAHASISWA DEMO (dengan akun login)
  // ════════════════════════════════════════════════════════════
  const mahasiswaDemo = [
    {
      nim:       "2021001",
      nama:      "Andi Pratama",
      email:     "andi@student.isb.ac.id",
      angkatan:  2021,
      prodi:     "Teknologi Informasi",
      password:  "mhs123",
    },
    {
      nim:       "2021002",
      nama:      "Budi Santoso",
      email:     "budi@student.isb.ac.id",
      angkatan:  2021,
      prodi:     "Manajemen",
      password:  "mhs123",
    },
    {
      nim:       "2022001",
      nama:      "Citra Dewi",
      email:     "citra@student.isb.ac.id",
      angkatan:  2022,
      prodi:     "Sistem Informasi",
      password:  "mhs123",
    },
  ];

  for (const m of mahasiswaDemo) {
    // Cek apakah mahasiswa sudah ada
    let mhs = await prisma.mahasiswa.findFirst({ where: { nim: m.nim } });

    if (!mhs) {
      // Buat user login dulu
      const userMhs = await ensureMahasiswaUser(m.nim, m.password, m.email);

      mhs = await prisma.mahasiswa.create({
        data: {
          id_user:  userMhs.user_id,
          nim:      m.nim,
          nama:     m.nama,
          email:    m.email,
          angkatan: m.angkatan,
          id_prodi: prodiMap[m.prodi] ?? null,
        },
      });
    }

    console.log(`✅ Mahasiswa : NIM=${m.nim}  nama="${m.nama}"  password=${m.password}`);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("✅ Seeding selesai!");
  console.log("   Admin    : superadmin / SuperAdmin123!");
  console.log("   Mahasiswa: 2021001, 2021002, 2022001 / mhs123");
  console.log("═══════════════════════════════════════");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });