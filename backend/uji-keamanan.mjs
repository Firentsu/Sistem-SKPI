/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UJI KEAMANAN API — Sistem SKPI (Institut Shanti Bhuana)
 * ═══════════════════════════════════════════════════════════════════════════
 *  Pengujian kontrol keamanan secara fungsional, memetakan langsung ke
 *  "Tabel 3.8 Hasil Pengujian" pada laporan. Menguji 6 skenario:
 *
 *    1. Akses endpoint tanpa sesi login          → wajib ditolak (401)
 *    2. Akses endpoint admin oleh akun mahasiswa → wajib ditolak
 *    3. Login dengan password salah              → gagal, sesi tak terbentuk
 *    4. Akses menggunakan akun berstatus nonaktif→ sesi dihentikan, ditolak (403)
 *    5. Unggah berkas tipe tidak diizinkan       → ditolak filter unggahan
 *    6. Unggah berkas melebihi batas ukuran      → ditolak pembatas ukuran
 *
 *  Cara pakai (dari folder backend/):
 *      node uji-keamanan.mjs
 *
 *  Syarat: server backend berjalan + database ter-seed.
 *  Catatan: script membuat 1 akun uji nonaktif sementara lalu MENGHAPUSNYA
 *           kembali secara otomatis (non-destruktif).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "./src/lib/prisma.js";

const BASE = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");

const ADMIN     = { username: "superadmin", password: "SuperAdmin123!" };
const MAHASISWA = { nim: "2021001", password: "mhs123" };
const NONAKTIF  = { username: `uji_nonaktif_${Date.now()}`, password: "UjiNonaktif123!" };

// ── Warna ANSI ─────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m",
};
const pad = (s, n) => String(s).padEnd(n);

// ── HTTP helper dengan cookie session ──────────────────────────────────────
function jarHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function storeCookies(jar, res) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const i = pair.indexOf("=");
    if (i > -1) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http({ method = "GET", path, body, form, jar }) {
  const headers = {};
  if (jar) headers["Cookie"] = jarHeader(jar);
  const jsonBody = body ? JSON.stringify(body) : undefined;
  if (jsonBody) headers["Content-Type"] = "application/json";

  // Retry otomatis saat koneksi terputus (mis. server dev restart oleh --watch)
  let lastErr;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      // form dibangun ulang tiap percobaan (FormData tidak bisa dipakai ulang)
      const payload = form ? form() : jsonBody;
      const res = await fetch(BASE + path, { method, headers, body: payload });
      const setCookies = res.headers.getSetCookie?.() ?? [];
      if (jar) storeCookies(jar, res);
      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { json = text; }
      return { status: res.status, json, setCookies };
    } catch (err) {
      lastErr = err;
      await sleep(700 * attempt); // tunggu server siap kembali
    }
  }
  throw lastErr;
}

// Apakah respons memicu pembentukan cookie sesi login?
const membentukSesi = (r) => r.setCookies.some((ck) => ck.startsWith("skpi_session="));

const rows = [];
function record(no, skenario, diharapkan, status, buktiText, pass) {
  rows.push({ no, skenario, diharapkan, status, pass });
  const verdict = pass ? `${c.green}${c.bold}SESUAI${c.reset}` : `${c.red}${c.bold}TIDAK SESUAI${c.reset}`;
  const scol = status >= 200 && status < 300 ? c.green : status >= 400 ? c.yellow : c.gray;
  console.log(`${c.bold}${c.cyan}[Skenario ${no}]${c.reset} ${c.bold}${skenario}${c.reset}`);
  console.log(`   ${c.gray}Diharapkan :${c.reset} ${diharapkan}`);
  console.log(`   ${c.gray}Status HTTP:${c.reset} ${scol}${c.bold}${status}${c.reset}`);
  console.log(`   ${c.gray}Respons    :${c.reset} ${c.dim}${buktiText}${c.reset}`);
  console.log(`   ${c.gray}Hasil      :${c.reset} ${verdict}\n`);
}
const oneLine = (j) => {
  const s = typeof j === "object" ? JSON.stringify(j) : String(j);
  return s.length > 100 ? s.slice(0, 97) + "…" : s;
};

// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  console.log(`${c.bold}${c.magenta}`);
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║       UJI KEAMANAN ENDPOINT API — SISTEM SKPI                 ║");
  console.log("║       Kontrol Akses, Autentikasi & Unggahan Berkas           ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log(c.reset);
  console.log(`${c.gray}Base URL  :${c.reset} ${BASE}`);
  console.log(`${c.gray}Waktu uji :${c.reset} ${new Date().toLocaleString("id-ID")}\n`);

  let tempUserId = null;
  try {
    // ── Persiapan: buat akun uji berstatus NONAKTIF (dihapus lagi di akhir) ──
    const hashed = await bcrypt.hash(NONAKTIF.password, 10);
    const created = await prisma.users.create({
      data: {
        username: NONAKTIF.username, password: hashed,
        role: "admin", status_akun: "nonaktif",
        email: "uji.nonaktif@isb.ac.id", updated_at: new Date(),
      },
    });
    tempUserId = created.user_id;
    console.log(`${c.gray}(disiapkan akun uji nonaktif sementara: ${NONAKTIF.username})${c.reset}\n`);
    console.log(`${c.blue}${c.bold}${"─".repeat(65)}${c.reset}\n`);

    // ── Skenario 1: akses endpoint tanpa sesi login ──────────────────────────
    {
      const r = await http({ path: "/api/admin/stats" }); // tanpa cookie
      record(1, "Akses endpoint tanpa sesi login",
        "Permintaan ditolak dengan status tidak terautentikasi (401)",
        r.status, oneLine(r.json), r.status === 401);
    }

    // ── Skenario 2: akses endpoint admin oleh akun mahasiswa ────────────────
    {
      const jar = new Map();
      const login = await http({ method: "POST", path: "/api/mahasiswa/auth/login", body: MAHASISWA, jar });
      const r = await http({ path: "/api/admin/stats", jar }); // pakai sesi mahasiswa
      record(2, "Akses endpoint admin oleh akun mahasiswa",
        "Permintaan ditolak, akses tidak diberikan ke non-admin (401)",
        r.status, `login mhs=${login.status}; akses admin → ${oneLine(r.json)}`,
        r.status === 401 || r.status === 403);
    }

    // ── Skenario 3: login dengan password salah ─────────────────────────────
    {
      const jar = new Map();
      const r = await http({ method: "POST", path: "/api/auth/login",
        body: { username: ADMIN.username, password: "PasswordSalah_999" }, jar });
      const noSession = !membentukSesi(r);
      record(3, "Login dengan password salah",
        "Login gagal (401) dan sesi tidak terbentuk",
        r.status, `${oneLine(r.json)} | sesi terbentuk: ${membentukSesi(r) ? "YA" : "TIDAK"}`,
        r.status === 401 && noSession);
    }

    // ── Skenario 4: akses menggunakan akun berstatus nonaktif ───────────────
    {
      const jar = new Map();
      const r = await http({ method: "POST", path: "/api/auth/login",
        body: { username: NONAKTIF.username, password: NONAKTIF.password }, jar });
      const noSession = !membentukSesi(r);
      record(4, "Akses menggunakan akun berstatus nonaktif",
        "Ditolak (403), sesi tidak dibentuk / dihentikan",
        r.status, `${oneLine(r.json)} | sesi terbentuk: ${membentukSesi(r) ? "YA" : "TIDAK"}`,
        r.status === 403 && noSession);
    }

    // ── Skenario 5 & 6 butuh sesi admin yang sah ────────────────────────────
    const adminJar = new Map();
    await http({ method: "POST", path: "/api/auth/login", body: ADMIN, jar: adminJar });

    // ── Skenario 5: unggah berkas dengan tipe tidak diizinkan ───────────────
    {
      const makeForm = () => {
        const fd = new FormData();
        fd.set("avatar", new Blob([Buffer.from("ini file teks, bukan gambar")], { type: "text/plain" }), "dokumen.txt");
        return fd;
      };
      const r = await http({ method: "POST", path: "/api/auth/avatar", form: makeForm, jar: adminJar });
      const ditolak = r.status !== 200 && !(r.json && r.json.success);
      record(5, "Unggah berkas dengan tipe tidak diizinkan (.txt)",
        "Berkas ditolak oleh filter unggahan (hanya gambar diizinkan)",
        r.status, oneLine(r.json), ditolak);
    }

    // ── Skenario 6: unggah berkas melebihi batas ukuran (limit 2 MB) ────────
    {
      const big = Buffer.alloc(3 * 1024 * 1024, 0); // 3 MB > batas 2 MB
      const makeForm = () => {
        const fd = new FormData();
        fd.set("avatar", new Blob([big], { type: "image/png" }), "gambar-besar.png");
        return fd;
      };
      const r = await http({ method: "POST", path: "/api/auth/avatar", form: makeForm, jar: adminJar });
      const ditolak = r.status !== 200 && !(r.json && r.json.success);
      record(6, "Unggah berkas melebihi batas ukuran (3 MB > 2 MB)",
        "Berkas ditolak oleh pembatas ukuran (limits.fileSize 2 MB)",
        r.status, oneLine(r.json), ditolak);
    }
  } finally {
    // ── Bersihkan akun uji sementara ────────────────────────────────────────
    if (tempUserId) {
      await prisma.users.delete({ where: { user_id: tempUserId } }).catch(() => {});
      console.log(`${c.gray}(akun uji nonaktif sementara dihapus kembali)${c.reset}`);
    }
    await prisma.$disconnect();
  }

  // ── RINGKASAN (format Tabel 3.8) ───────────────────────────────────────────
  const lulus = rows.filter((r) => r.pass).length;
  console.log(`\n${c.bold}${c.blue}══ RINGKASAN HASIL PENGUJIAN (Tabel 3.8) ${"═".repeat(24)}${c.reset}\n`);
  console.log(`  ${c.bold}${pad("No", 4)}${pad("Skenario Pengujian", 44)}${pad("Kode", 6)}Hasil${c.reset}`);
  console.log(`  ${c.gray}${"─".repeat(72)}${c.reset}`);
  for (const r of rows) {
    const verdict = r.pass ? `${c.green}SESUAI${c.reset}` : `${c.red}TIDAK SESUAI${c.reset}`;
    console.log(`  ${pad(r.no, 4)}${pad(r.skenario.slice(0, 42), 44)}${c.yellow}${pad(r.status, 6)}${c.reset}${verdict}`);
  }
  console.log(`  ${c.gray}${"─".repeat(72)}${c.reset}`);
  const allPass = lulus === rows.length;
  const badge = allPass ? `${c.green}${c.bold}` : `${c.yellow}${c.bold}`;
  console.log(`\n  ${badge}HASIL: ${lulus}/${rows.length} skenario keamanan SESUAI harapan${c.reset}`);
  console.log(`  ${c.gray}Selesai ${new Date().toLocaleString("id-ID")}${c.reset}\n`);

  process.exit(allPass ? 0 : 1);
})();
