/**
 * sicpClient.js — Klien untuk sistem SICP (Student Integrity Credit Point) milik teman.
 *
 * Semua endpoint data SICP butuh JWT Bearer. Klien ini LOGIN OTOMATIS memakai
 * kredensial admin SICP yang disimpan di backend/.env (TIDAK di frontend, agar
 * token/kredensial tidak bocor ke browser), lalu men-cache token. Node 18+
 * menyediakan `fetch` global sehingga tak perlu dependency tambahan.
 *
 * Sumber data utama: GET /icp/balance/ranking — satu panggilan sudah memuat
 * identitas mahasiswa (nama, username/NIM, jurusan) SEKALIGUS total poin ICP.
 * Catatan: endpoint ini hanya mengembalikan mahasiswa berstatus AKTIF dan
 * dibatasi `limit` (maks 100 di sisi SICP).
 */

const RAW_URL      = process.env.SICP_API_URL || "";
const BASE_URL     = RAW_URL.replace(/\/+$/, "");                    // buang trailing slash
const USERNAME     = process.env.SICP_USERNAME || "";
const PASSWORD     = process.env.SICP_PASSWORD || "";
const STATIC_TOKEN = process.env.SICP_TOKEN || "";                  // opsional: token manual
const RANKING_LIMIT = parseInt(process.env.SICP_RANKING_LIMIT || "100", 10);

const TOKEN_TTL = 50 * 60 * 1000;   // 50 menit (JWT SICP umumnya berlaku 1 jam)
let _token   = null;
let _tokenAt = 0;

function ensureConfigured() {
  if (!BASE_URL) {
    throw Object.assign(
      new Error("SICP_API_URL belum diisi di backend/.env"),
      { code: "SICP_NOT_CONFIGURED" },
    );
  }
}

export function isSicpConfigured() {
  return !!BASE_URL && (!!STATIC_TOKEN || (!!USERNAME && !!PASSWORD));
}

async function login() {
  ensureConfigured();
  if (!USERNAME || !PASSWORD) {
    throw Object.assign(
      new Error("SICP_USERNAME / SICP_PASSWORD belum diisi di backend/.env"),
      { code: "SICP_NO_CREDENTIALS" },
    );
  }
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
  } catch (e) {
    throw Object.assign(
      new Error(`Tidak bisa menghubungi SICP (${BASE_URL}). Pastikan Tailscale aktif & URL benar. [${e.message}]`),
      { code: "SICP_UNREACHABLE" },
    );
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success || !json?.data?.token) {
    throw Object.assign(
      new Error(json?.message || `Login SICP gagal (HTTP ${res.status})`),
      { code: "SICP_LOGIN_FAILED" },
    );
  }
  _token   = json.data.token;
  _tokenAt = Date.now();
  return _token;
}

function canLogin() {
  return !!(USERNAME && PASSWORD);
}

async function getToken() {
  // Prioritaskan LOGIN OTOMATIS bila ada username/password — token hasil login
  // bisa DIPERBARUI sehingga tahan kadaluarsa. Token statis (SICP_TOKEN) hanya
  // dipakai sebagai cadangan bila username/password tidak diisi.
  if (canLogin()) {
    if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
    return login();
  }
  if (STATIC_TOKEN) return STATIC_TOKEN;
  throw Object.assign(
    new Error("SICP_USERNAME/PASSWORD atau SICP_TOKEN belum diisi di backend/.env"),
    { code: "SICP_NO_CREDENTIALS" },
  );
}

async function sicpGet(path, { retryOn401 = true } = {}) {
  ensureConfigured();
  const token = await getToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch (e) {
    throw Object.assign(
      new Error(`Tidak bisa menghubungi SICP (${BASE_URL}). [${e.message}]`),
      { code: "SICP_UNREACHABLE" },
    );
  }
  // Token kadaluarsa → login ulang sekali (hanya berguna bila bisa auto-login)
  if (res.status === 401 && retryOn401 && canLogin()) {
    _token = null;
    return sicpGet(path, { retryOn401: false });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw Object.assign(
      new Error(json?.message || `Request SICP gagal (HTTP ${res.status})`),
      { code: "SICP_REQUEST_FAILED", status: res.status },
    );
  }
  return json.data;
}

/**
 * Ambil daftar mahasiswa + total ICP sekaligus dari ranking saldo SICP.
 * Item response SICP: { mahasiswa_id, nama, username, jurusan_id, nama_jurusan, total_icp }
 * → dipetakan ke bentuk netral yang dipakai proses sinkronisasi SKPI.
 *
 * Di-DEDUP berdasarkan NIM (username) — bila SICP mengembalikan lebih dari satu
 * baris untuk NIM yang sama (mis. beberapa data mahasiswa berbagi 1 akun),
 * hanya SATU yang diambil (total ICP tertinggi) agar tidak dobel di SKPI.
 */
export async function fetchStudentsWithIcp() {
  const data = await sicpGet(`/icp/balance/ranking?limit=${RANKING_LIMIT}`);
  const rows = Array.isArray(data) ? data : (data?.ranking || []);
  const mapped = rows
    .map(r => ({
      sicp_id:      r.mahasiswa_id ?? r.id ?? r.mahasiswaId ?? null,
      nim:          String(r.username ?? r.nim ?? r.user_id ?? "").trim(),
      nama:         String(r.nama ?? r.name ?? r.full_name ?? "").trim(),
      nama_jurusan: r.nama_jurusan ?? r.jurusan ?? null,
      jurusan_id:   r.jurusan_id ?? null,
      total_icp:    Number(r.total_icp ?? r.total_poin ?? r.balance ?? r.poin ?? 0) || 0,
    }))
    .filter(r => r.nim);

  const byNim = new Map();
  for (const s of mapped) {
    const prev = byNim.get(s.nim);
    if (!prev || (s.total_icp || 0) > (prev.total_icp || 0)) byNim.set(s.nim, s);
  }
  return [...byNim.values()];
}

/**
 * Ambil rincian saldo ICP PER KATEGORI untuk satu mahasiswa SICP.
 * Endpoint SICP (khusus SKPI): GET /icp/balance/by-category/:mahasiswaId
 * Response item: { kategori_id, kategori, total }  (selalu 6 kategori).
 */
export async function fetchIcpByCategory(sicpMahasiswaId) {
  if (!sicpMahasiswaId) return [];
  const data = await sicpGet(`/icp/balance/by-category/${sicpMahasiswaId}`);
  const rows = Array.isArray(data) ? data : (data?.categories || data?.rows || data?.kategori || []);
  return rows.map(r => ({
    kategori_id: r.kategori_id ?? r.id ?? null,
    kategori:    String(r.kategori ?? r.nama_kategori ?? r.nama ?? "").trim(),
    total:       Number(r.total ?? r.total_icp ?? r.total_poin ?? r.point ?? 0) || 0,
  }));
}

/** Cek koneksi + auth ke SICP dan berapa baris data yang terbaca. */
export async function testConnection() {
  ensureConfigured();
  await getToken();                       // pastikan login berhasil
  const rows = await fetchStudentsWithIcp();
  return { baseUrl: BASE_URL, sampleCount: rows.length, sample: rows.slice(0, 3) };
}
