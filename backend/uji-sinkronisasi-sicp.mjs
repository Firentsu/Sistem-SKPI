/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UJI KONEKSI & SINKRONISASI SICP — Sistem SKPI (Institut Shanti Bhuana)
 * ═══════════════════════════════════════════════════════════════════════════
 *  Menguji integrasi ke sistem SICP melalui backend SKPI, lalu mencetak hasil
 *  rapi di terminal untuk BUKTI / TANGKAP LAYAR laporan:
 *
 *    A. Uji koneksi + autentikasi ke SICP   → GET  /api/sicp-sync/test
 *    B. (opsional) Sinkron data mahasiswa   → POST /api/sicp-sync/mahasiswa
 *    C. (opsional) Sinkron total poin ICP   → POST /api/sicp-sync/icp
 *
 *  Cara pakai (dari folder backend/):
 *      node uji-sinkronisasi-sicp.mjs                 # HANYA uji koneksi (aman, read-only)
 *      node uji-sinkronisasi-sicp.mjs --sync          # uji koneksi + sinkron mahasiswa & ICP
 *      node uji-sinkronisasi-sicp.mjs http://localhost:5000 --sync
 *
 *  Syarat: server backend berjalan (npm start / npm run dev), database ter-seed,
 *          dan SICP dapat dijangkau (Tailscale aktif + kredensial di backend/.env).
 *
 *  PERINGATAN: opsi --sync MENGUBAH DATA (upsert mahasiswa/akun & menulis ulang
 *              poin ICP). Tanpa --sync, script hanya menguji koneksi.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const args    = process.argv.slice(2);
const DO_SYNC  = args.includes("--sync");
// Default 127.0.0.1 (bukan "localhost") agar tidak salah-arah ke IPv6 ::1 di Windows.
const BASE     = (args.find(a => a.startsWith("http")) || "http://127.0.0.1:5000").replace(/\/$/, "");

/**
 * Akhiri script dengan bersih. TIDAK memakai process.exit() agar tidak memicu
 * assertion libuv (UV_HANDLE_CLOSING) di Windows saat soket keep-alive fetch
 * masih terbuka; cukup set exitCode lalu biarkan event loop selesai sendiri.
 */
function finish(code) { process.exitCode = code; }

// Kredensial admin dari prisma/seed.js
const ADMIN = { username: "superadmin", password: "SuperAdmin123!" };

// ── Warna ANSI (agar output enak dibaca & bagus untuk screenshot) ──────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m",
};
const pad = (s, n) => String(s).padEnd(n);

// ── Cookie jar sederhana untuk sesi admin ──────────────────────────────────
function makeSession() {
  const jar = new Map();
  return {
    cookieHeader() { return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "); },
    store(res) {
      for (const raw of res.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(";");
        const i = pair.indexOf("=");
        if (i > -1) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
      }
    },
  };
}

async function req({ method = "GET", path, body, session }) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (session) headers["Cookie"] = session.cookieHeader();
  const t0 = performance.now();
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ms = Math.round(performance.now() - t0);
  if (session) session.store(res);
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, ms };
}

function header(title) {
  console.log(`\n${c.bold}${c.blue}══ ${title} ${"═".repeat(Math.max(0, 58 - title.length))}${c.reset}\n`);
}
function line(label, value, col = c.reset) {
  console.log(`   ${c.gray}${pad(label, 16)}:${c.reset} ${col}${value}${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  console.log(`${c.bold}${c.magenta}`);
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║     UJI KONEKSI & SINKRONISASI SICP — SISTEM SKPI            ║");
  console.log("║     Institut Shanti Bhuana                                    ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log(c.reset);
  line("Base URL", BASE);
  line("Waktu uji", new Date().toLocaleString("id-ID"));
  line("Mode", DO_SYNC ? "Uji koneksi + SINKRONISASI (mengubah data)" : "Uji koneksi saja (read-only)",
       DO_SYNC ? c.yellow : c.green);

  const ses = makeSession();
  let allOk = true;

  try {
    // ── 0. Login admin ───────────────────────────────────────────────────
    header("0. LOGIN ADMIN");
    const login = await req({ method: "POST", path: "/api/auth/login", body: ADMIN, session: ses });
    if (login.status !== 200) {
      console.log(`   ${c.red}${c.bold}GAGAL login admin (HTTP ${login.status}).${c.reset} ` +
        `Pastikan server berjalan & database ter-seed.`);
      console.log(`   ${c.gray}↳ ${JSON.stringify(login.json)}${c.reset}`);
      return finish(1);
    }
    console.log(`   ${c.green}✔ Sesi admin aktif${c.reset} ${c.gray}(${login.ms}ms)${c.reset}`);

    // ── A. Uji koneksi ke SICP ───────────────────────────────────────────
    header("A. UJI KONEKSI & AUTENTIKASI KE SICP");
    const test = await req({ path: "/api/sicp-sync/test", session: ses });
    if (test.status === 200 && test.json?.success) {
      console.log(`   ${c.green}${c.bold}✔ KONEKSI BERHASIL${c.reset} ${c.gray}(${test.ms}ms)${c.reset}\n`);
      line("Base URL SICP", test.json.baseUrl, c.cyan);
      line("Baris terbaca", test.json.sampleCount, c.bold + c.green);
      const sample = test.json.sample ?? [];
      if (sample.length) {
        console.log(`\n   ${c.gray}Sampel data (maks 3):${c.reset}`);
        console.log(`   ${c.bold}${pad("NIM", 12)}${pad("Nama", 24)}${pad("Jurusan", 22)}ICP${c.reset}`);
        console.log(`   ${c.gray}${"─".repeat(62)}${c.reset}`);
        for (const s of sample) {
          console.log(`   ${pad(s.nim ?? "-", 12)}${pad((s.nama ?? "-").slice(0, 22), 24)}` +
            `${pad((s.nama_jurusan ?? "-").slice(0, 20), 22)}${c.green}${s.total_icp ?? 0}${c.reset}`);
        }
      }
    } else {
      allOk = false;
      console.log(`   ${c.red}${c.bold}✘ KONEKSI GAGAL${c.reset} ${c.gray}(HTTP ${test.status}, ${test.ms}ms)${c.reset}`);
      line("Pesan", test.json?.error ?? JSON.stringify(test.json), c.red);
      line("Kode", test.json?.code ?? "-", c.yellow);
      console.log(`\n   ${c.gray}Kemungkinan: Tailscale belum aktif, SICP_API_URL/kredensial` +
        ` di backend/.env belum benar, atau server SICP mati.${c.reset}`);
    }

    // ── B & C. Sinkronisasi (opsional) ───────────────────────────────────
    if (DO_SYNC && allOk) {
      header("B. SINKRONISASI DATA MAHASISWA");
      const m = await req({ method: "POST", path: "/api/sicp-sync/mahasiswa", session: ses });
      if (m.status === 200 && m.json?.mahasiswa) {
        const r = m.json.mahasiswa;
        console.log(`   ${c.green}${c.bold}✔ SELESAI${c.reset} ${c.gray}(${m.ms}ms)${c.reset}\n`);
        line("Total diproses", r.total, c.bold);
        line("Dibuat baru", r.created, c.green);
        line("Diperbarui", r.updated, c.cyan);
        line("Gagal", r.failed, r.failed ? c.red : c.gray);
        if (r.errors?.length) console.log(`   ${c.gray}↳ contoh error: ${JSON.stringify(r.errors[0])}${c.reset}`);
      } else {
        allOk = false;
        console.log(`   ${c.red}✘ Gagal (HTTP ${m.status}): ${m.json?.error ?? JSON.stringify(m.json)}${c.reset}`);
      }

      header("C. SINKRONISASI TOTAL POIN ICP");
      const i = await req({ method: "POST", path: "/api/sicp-sync/icp", session: ses });
      if (i.status === 200 && i.json?.icp) {
        const r = i.json.icp;
        console.log(`   ${c.green}${c.bold}✔ SELESAI${c.reset} ${c.gray}(${i.ms}ms)${c.reset}\n`);
        line("Total diproses", r.total, c.bold);
        line("Diperbarui", r.updated, c.green);
        line("NIM tak cocok", r.notFound, r.notFound ? c.yellow : c.gray);
        line("Gagal", r.failed, r.failed ? c.red : c.gray);
        if (r.errors?.length) console.log(`   ${c.gray}↳ contoh error: ${JSON.stringify(r.errors[0])}${c.reset}`);
      } else {
        allOk = false;
        console.log(`   ${c.red}✘ Gagal (HTTP ${i.status}): ${i.json?.error ?? JSON.stringify(i.json)}${c.reset}`);
      }
    } else if (!DO_SYNC) {
      console.log(`\n   ${c.gray}(Sinkronisasi dilewati. Jalankan dengan${c.reset} ${c.bold}--sync${c.reset}` +
        ` ${c.gray}untuk menarik & menyimpan data.)${c.reset}`);
    }

    // ── Logout ───────────────────────────────────────────────────────────
    await req({ method: "POST", path: "/api/auth/logout", session: ses });
  } catch (err) {
    allOk = false;
    console.log(`\n   ${c.red}${c.bold}‼ Server SKPI tidak dapat dihubungi di ${BASE}${c.reset}`);
    console.log(`   ${c.gray}↳ ${err.message}${c.reset}`);
    console.log(`   ${c.gray}Pastikan backend berjalan: ${c.reset}${c.bold}npm start${c.reset}`);
  }

  // ── Penutup ────────────────────────────────────────────────────────────
  header("RINGKASAN");
  const badge = allOk ? `${c.green}${c.bold}` : `${c.yellow}${c.bold}`;
  console.log(`  ${badge}HASIL: ${allOk ? "Integrasi SICP BERFUNGSI" : "Ada langkah yang GAGAL — periksa pesan di atas"}${c.reset}`);
  console.log(`  ${c.gray}Selesai ${new Date().toLocaleString("id-ID")}${c.reset}\n`);
  finish(allOk ? 0 : 1);
})();
