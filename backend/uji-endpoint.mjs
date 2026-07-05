/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UJI ENDPOINT API — Sistem SKPI (Institut Shanti Bhuana)
 * ═══════════════════════════════════════════════════════════════════════════
 *  Script pengujian endpoint backend TANPA Postman.
 *  Menjalankan login (admin & mahasiswa) lalu memanggil endpoint-endpoint
 *  utama, dan mencetak hasil rapi di terminal untuk bukti/screenshot laporan.
 *
 *  Cara pakai (dari folder backend/):
 *      node uji-endpoint.mjs
 *
 *  Opsional (ganti base URL):
 *      node uji-endpoint.mjs http://localhost:5000
 *
 *  Syarat: server backend sudah berjalan (npm start / npm run dev)
 *          dan database sudah di-seed (npm run seed).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const BASE = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");

// ── Kredensial dari prisma/seed.js ─────────────────────────────────────────
const ADMIN     = { username: "superadmin", password: "SuperAdmin123!" };
const MAHASISWA = { nim: "2021001", password: "mhs123" };

// ── Warna ANSI (agar output enak dibaca & bagus untuk screenshot) ──────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m",
};
const pad = (s, n) => String(s).padEnd(n);

// ── Cookie jar sederhana per sesi (admin / mahasiswa) ──────────────────────
function makeSession() {
  const jar = new Map();
  return {
    cookieHeader() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    store(res) {
      const list = res.headers.getSetCookie?.() ?? [];
      for (const raw of list) {
        const [pair] = raw.split(";");
        const idx = pair.indexOf("=");
        if (idx > -1) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
    },
  };
}

const results = [];

/**
 * Panggil satu endpoint, catat & cetak hasilnya.
 */
async function call({ no, label, method = "GET", path, body, session, expect = 200 }) {
  const url = BASE + path;
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (session) headers["Cookie"] = session.cookieHeader();

  const t0 = performance.now();
  let status = 0, ms = 0, preview = "", ok = false;
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    ms = Math.round(performance.now() - t0);
    status = res.status;
    if (session) session.store(res);

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    preview = summarize(parsed);
    ok = status === expect;
  } catch (err) {
    ms = Math.round(performance.now() - t0);
    const cause = err.cause ? ` (${err.cause.code || err.cause.message})` : "";
    preview = `‼ ${err.message}${cause}`;
  }

  results.push({ no, label, method, path, status, expect, ok, ms });

  const tag   = ok ? `${c.green}[LULUS]${c.reset}` : `${c.red}[GAGAL]${c.reset}`;
  const scol  = status >= 200 && status < 300 ? c.green : status >= 400 ? c.red : c.yellow;
  console.log(
    `${c.gray}${pad(no, 3)}${c.reset} ${tag}  ` +
    `${c.bold}${scol}${pad(status || "ERR", 4)}${c.reset} ` +
    `${c.cyan}${pad(method, 6)}${c.reset}${pad(path, 40)} ` +
    `${c.gray}${pad(ms + "ms", 7)}${c.reset}`
  );
  console.log(`      ${c.dim}${label}${c.reset}`);
  console.log(`      ${c.gray}↳ ${preview}${c.reset}\n`);
}

/** Ringkas body respons menjadi satu baris pendek. */
function summarize(data) {
  if (typeof data !== "object" || data === null) return String(data).slice(0, 90);
  if (Array.isArray(data)) {
    return `Array[${data.length}]` + (data.length ? `  contoh: ${short(JSON.stringify(data[0]))}` : "");
  }
  const keys = Object.keys(data);
  const flat = short(JSON.stringify(data));
  return `${flat}${keys.length > 6 ? `  (${keys.length} field)` : ""}`;
}
const short = (s) => (s.length > 110 ? s.slice(0, 107) + "…" : s);

function header(title) {
  console.log(`\n${c.bold}${c.blue}══ ${title} ${"═".repeat(Math.max(0, 60 - title.length))}${c.reset}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  const now = new Date();
  console.log(`${c.bold}${c.magenta}`);
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║         UJI COBA ENDPOINT API — SISTEM SKPI                    ║");
  console.log("║         Institut Shanti Bhuana                                 ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log(c.reset);
  console.log(`${c.gray}Base URL   :${c.reset} ${BASE}`);
  console.log(`${c.gray}Waktu uji  :${c.reset} ${now.toLocaleString("id-ID")}`);
  console.log(`${c.gray}Metode     :${c.reset} Session-based auth (cookie)\n`);

  const adminSes = makeSession();
  const mhsSes   = makeSession();
  let n = 1;

  // ── 1. ENDPOINT PUBLIK (tanpa login) ─────────────────────────────────────
  header("1. ENDPOINT PUBLIK (Tanpa Autentikasi)");
  await call({ no: n++, label: "Health check — cek server hidup",
    path: "/api/health" });
  await call({ no: n++, label: "Cek ketersediaan akun admin",
    path: "/api/auth/cek-akun?username=superadmin" });

  // ── 2. PROTEKSI (akses tanpa login harus ditolak 401) ────────────────────
  header("2. UJI PROTEKSI (Akses Tanpa Login Harus Ditolak)");
  await call({ no: n++, label: "Akses data admin tanpa login → wajib 401",
    path: "/api/admin/stats", expect: 401 });

  // ── 3. AUTENTIKASI & ENDPOINT ADMIN ──────────────────────────────────────
  header("3. LOGIN ADMIN & ENDPOINT ADMIN");
  await call({ no: n++, label: `Login admin (username: ${ADMIN.username})`,
    method: "POST", path: "/api/auth/login", body: ADMIN, session: adminSes });
  await call({ no: n++, label: "Sesi admin aktif (data user login)",
    path: "/api/auth/me", session: adminSes });
  await call({ no: n++, label: "Statistik dashboard admin",
    path: "/api/admin/stats", session: adminSes });
  await call({ no: n++, label: "Master data (jenis/kategori/kelompok aktivitas)",
    path: "/api/master-data", session: adminSes });
  await call({ no: n++, label: "Daftar program studi",
    path: "/api/master-data/prodi", session: adminSes });
  await call({ no: n++, label: "Daftar aktivitas/kegiatan mahasiswa",
    path: "/api/aktivitas", session: adminSes });
  await call({ no: n++, label: "Daftar mahasiswa",
    path: "/api/mahasiswa", session: adminSes });
  await call({ no: n++, label: "Ringkasan ICP (Indeks Capaian Pembelajaran)",
    path: "/api/icp/summary", session: adminSes });
  await call({ no: n++, label: "Daftar pengajuan SKPI",
    path: "/api/skpi", session: adminSes });

  // ── 4. AUTENTIKASI & ENDPOINT MAHASISWA ──────────────────────────────────
  header("4. LOGIN MAHASISWA & ENDPOINT MAHASISWA");
  await call({ no: n++, label: `Login mahasiswa (NIM: ${MAHASISWA.nim})`,
    method: "POST", path: "/api/mahasiswa/auth/login", body: MAHASISWA, session: mhsSes });
  await call({ no: n++, label: "Sesi mahasiswa aktif (data login)",
    path: "/api/mahasiswa/auth/me", session: mhsSes });
  await call({ no: n++, label: "Profil lengkap mahasiswa",
    path: "/api/mahasiswa/auth/profile", session: mhsSes });
  await call({ no: n++, label: "Daftar kegiatan milik mahasiswa",
    path: "/api/mahasiswa/kegiatan", session: mhsSes });
  await call({ no: n++, label: "Data pengajuan SKPI mahasiswa",
    path: "/api/mahasiswa/pengajuan", session: mhsSes });
  await call({ no: n++, label: "Master data untuk form mahasiswa",
    path: "/api/mahasiswa/master-data", session: mhsSes });
  await call({ no: n++, label: "Notifikasi mahasiswa",
    path: "/api/mahasiswa/notifikasi", session: mhsSes });

  // ── 5. LOGOUT ────────────────────────────────────────────────────────────
  header("5. LOGOUT");
  await call({ no: n++, label: "Logout admin (hapus sesi)",
    method: "POST", path: "/api/auth/logout", session: adminSes });
  await call({ no: n++, label: "Logout mahasiswa (hapus sesi)",
    method: "POST", path: "/api/mahasiswa/auth/logout", session: mhsSes });

  // ── RINGKASAN ────────────────────────────────────────────────────────────
  const lulus = results.filter((r) => r.ok).length;
  const total = results.length;
  header("RINGKASAN HASIL PENGUJIAN");
  console.log(`  ${c.bold}${pad("No", 4)}${pad("Status", 8)}${pad("Kode", 6)}${pad("Metode", 8)}${pad("Endpoint", 42)}Waktu${c.reset}`);
  console.log(`  ${c.gray}${"─".repeat(76)}${c.reset}`);
  for (const r of results) {
    const mark  = r.ok ? `${c.green}LULUS ${c.reset}` : `${c.red}GAGAL ${c.reset}`;
    const scol  = r.status >= 200 && r.status < 300 ? c.green : c.red;
    console.log(
      `  ${pad(r.no, 4)}${mark}${scol}${pad(r.status || "ERR", 6)}${c.reset}` +
      `${c.cyan}${pad(r.method, 8)}${c.reset}${pad(r.path, 42)}${c.gray}${r.ms}ms${c.reset}`
    );
  }
  console.log(`  ${c.gray}${"─".repeat(76)}${c.reset}`);
  const allPass = lulus === total;
  const badge = allPass ? `${c.green}${c.bold}` : `${c.yellow}${c.bold}`;
  console.log(`\n  ${badge}HASIL: ${lulus}/${total} endpoint LULUS pengujian${c.reset}`);
  console.log(`  ${c.gray}Selesai pada ${new Date().toLocaleString("id-ID")}${c.reset}\n`);

  process.exit(allPass ? 0 : 1);
})();
