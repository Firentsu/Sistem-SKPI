/**
 * api.js — Utility terpusat untuk semua request ke backend SKPI
 *
 * Cara kerja:
 * 1. Coba request ke backend (NEXT_PUBLIC_API_URL)
 * 2. Jika backend tidak aktif → otomatis pakai MOCK DATA (fallback)
 * 3. Frontend tetap bisa jalan walaupun tanpa backend
 */

// Gunakan NEXT_PUBLIC_API_URL untuk backend lokal, atau opts tambahan untuk
// koneksi jaringan jika diperlukan.
const API_URL_PUBLIC  = process.env.NEXT_PUBLIC_API_URL || "";
const API_URL_LOCAL   = process.env.NEXT_PUBLIC_API_URL_LOCAL   || API_URL_PUBLIC;
const API_URL_NETWORK = process.env.NEXT_PUBLIC_API_URL_NETWORK || API_URL_PUBLIC;

function resolveApiUrl() {
  if (typeof window === "undefined") return API_URL_LOCAL; // SSR
  const hostname = window.location.hostname;
  const isLocal  = hostname === "localhost" || hostname === "127.0.0.1";
  return isLocal ? API_URL_LOCAL : API_URL_NETWORK;
}

const API_URL = resolveApiUrl();

/**
 * Konversi path avatar relatif → URL lengkap ke backend.
 * Contoh: "/uploads/avatars/foto.jpg" → "http://localhost:5000/uploads/avatars/foto.jpg"
 */
export function getAvatarUrl(path) {
  if (!path) return "/img/avatar.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/uploads/") && API_URL) return `${API_URL}${path}`;
  return path;
}

/**
 * Konversi path file upload (bukti, dsb) → URL lengkap ke backend.
 * Backend menyajikan file statis di `${API_URL}/uploads/...`.
 * - "http(s)://…"                         → dipakai apa adanya
 * - "/uploads/bukti/x.png"                → `${API_URL}/uploads/bukti/x.png`
 * - "x.png" (nama file polos)             → `${API_URL}/uploads/bukti/x.png`
 */
export function getUploadUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_URL || "";
  if (path.startsWith("/uploads/")) return `${base}${path}`;
  return `${base}/uploads/bukti/${path}`;
}

let _mockMode = false;
export function isMockMode() { return _mockMode; }

export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  return fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export async function apiFetchForm(path, formData) {
  const url = `${API_URL}${path}`;
  return fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
}

const MOCK_USER = {
  user: { user_id: 1, username: "admin_demo", email: "admin@isb.ac.id" },
  admin: {
    id_admin: 1,
    nama_admin: "Administrator Demo",
    email: "admin@isb.ac.id",
    avatar: "/img/avatar.jpg",
  },
};

const MOCK_PROFILE = {
  user_id: 1,
  username: "admin_demo",
  email: "admin@isb.ac.id",
  nama_admin: "Administrator Demo",
  avatar: "/img/avatar.jpg",
  id_admin: 1,
  created_at: "2026-01-01T00:00:00.000Z",
};

/**
 * Verifikasi gate captcha (dipanggil di layar captcha sebelum landing page).
 * Menandai sesi backend `captchaVerified` agar login berikutnya diloloskan.
 */
export async function verifyCaptcha(token) {
  if (!API_URL) return { ok: true }; // mode demo / tanpa backend → lewati
  try {
    const res = await apiFetch("/api/captcha/verify", {
      method: "POST",
      body: JSON.stringify({ captchaToken: token }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error };
  } catch {
    // Backend tidak bisa dihubungi → jangan kunci pengguna (fail-open).
    return { ok: true };
  }
}

export async function login(username, password) {
  if (!API_URL) {
    _mockMode = true;
    if (username === "admin" && password === "admin123") return { ok: true };
    return { ok: false, error: "Username atau password salah (mode demo)" };
  }
  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) { _mockMode = false; return { ok: true }; }
    return { ok: false, error: data.error || "Login gagal", rateLimited: res.status === 429 };
  } catch {
    _mockMode = true;
    if (username === "admin" && password === "admin123") return { ok: true };
    return { ok: false, error: "Server tidak aktif. <\n> Gunakan admin / admin123 untuk demo." };
  }
}

export async function logout() {
  if (_mockMode || !API_URL) return;
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch { }
  _mockMode = false;
}

export async function getMe() {
  if (_mockMode || !API_URL) return MOCK_USER;
  try {
    const res = await apiFetch("/api/auth/me");
    if (res.ok) { _mockMode = false; return res.json(); }
    return null;
  } catch {
    _mockMode = true;
    return MOCK_USER;
  }
}

export async function getProfile() {
  if (_mockMode || !API_URL) return MOCK_PROFILE;
  try {
    const res = await apiFetch("/api/auth/profile");
    if (res.ok) return res.json();
    return MOCK_PROFILE;
  } catch {
    _mockMode = true;
    return MOCK_PROFILE;
  }
}

export async function updateProfile(payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
}

export async function uploadAvatar(formData) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, avatar: "/img/avatar.jpg" } };
  }
  try {
    const res = await apiFetchForm("/api/auth/avatar", formData);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, avatar: "/img/avatar.jpg" } };
  }
}

export async function getMahasiswa({ q = "", prodi = "Semua", page = 1 } = {}) {
  if (_mockMode || !API_URL) return null;
  try {
    const params = new URLSearchParams({ q, prodi, page });
    const res = await apiFetch(`/api/mahasiswa?${params}`);
    if (res.ok) return res.json();
    return null;
  } catch {
    _mockMode = true;
    return null;
  }
}

// =============================================================================
// MAHASISWA — Auth & Profile
// =============================================================================

const MOCK_MAHASISWA_SESSION = {
  user: { user_id: 2, username: "mhs_demo", email: "mhs@isb.ac.id", role: "mahasiswa" },
  mahasiswa: {
    id_mahasiswa: 1,
    nim: "2021001",
    nama: "Mio Haimiya",
    email: "mhs@isb.ac.id",
    prodi: "Teknik Informatika",
    angkatan: 2021,
    avatar: "/img/avatar.jpg",
  },
};

const MOCK_MAHASISWA_PROFILE = {
  id_mahasiswa: 1,
  nim: "2021001",
  nama: "Mio Haimiya",
  email: "mhs@isb.ac.id",
  username: "mhs_demo",
  prodi: "Teknik Informatika",
  angkatan: 2021,
  avatar: "/img/avatar.jpg",
  created_at: "2026-01-01T00:00:00.000Z",
};

export async function loginMahasiswa(nim, password) {
  if (!API_URL) {
    _mockMode = true;
    if (password === "mhs123") return { ok: true };
    return { ok: false, error: "NIM atau password salah (mode demo)" };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/auth/login", {
      method: "POST",
      body: JSON.stringify({ nim, password }),
    });
    const data = await res.json();
    if (res.ok) { _mockMode = false; return { ok: true }; }
    return { ok: false, error: data.error || "Login mahasiswa gagal", rateLimited: res.status === 429 };
  } catch {
    _mockMode = true;
    if (password === "mhs123") return { ok: true };
    return { ok: false, error: "Server tidak aktif. Gunakan NIM terdaftar & password mhs123 untuk demo." };
  }
}

export async function getMahasiswaMe() {
  if (_mockMode || !API_URL) return MOCK_MAHASISWA_SESSION;
  try {
    const res = await apiFetch("/api/mahasiswa/auth/me");
    if (res.ok) { _mockMode = false; return res.json(); }
    return null;
  } catch {
    _mockMode = true;
    return MOCK_MAHASISWA_SESSION;
  }
}

export async function getMahasiswaProfile() {
  if (_mockMode || !API_URL) return MOCK_MAHASISWA_PROFILE;
  try {
    const res = await apiFetch("/api/mahasiswa/auth/profile");
    if (res.ok) return res.json();
    return MOCK_MAHASISWA_PROFILE;
  } catch {
    _mockMode = true;
    return MOCK_MAHASISWA_PROFILE;
  }
}

export async function updateMahasiswaProfile(payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
}

export async function updateMahasiswaBiodata(payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/auth/biodata", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
}

export async function uploadMahasiswaAvatar(formData) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, avatar: "/img/avatar.jpg" } };
  }
  try {
    const res = await apiFetchForm("/api/mahasiswa/auth/avatar", formData);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, avatar: "/img/avatar.jpg" } };
  }
}

export async function logoutMahasiswa() {
  if (_mockMode || !API_URL) return;
  try { await apiFetch("/api/mahasiswa/auth/logout", { method: "POST" }); } catch { }
}

export function createAdminSSE() {
  if (typeof window === "undefined" || !API_URL) return null;
  return new EventSource(`${API_URL}/api/auth/sse`, { withCredentials: true });
}

export function createMahasiswaSSE() {
  if (typeof window === "undefined" || !API_URL) return null;
  return new EventSource(`${API_URL}/api/mahasiswa/auth/sse`, { withCredentials: true });
}

export async function deleteMahasiswaAvatar() {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/auth/avatar", { method: "DELETE" });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Server tidak aktif" } };
  }
}

export async function deleteAdminAvatar() {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true } };
  }
  try {
    const res = await apiFetch("/api/auth/avatar", { method: "DELETE" });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Server tidak aktif" } };
  }
}

export async function updateMahasiswaPassword({ password_lama, password_baru }) {
  if (_mockMode || !API_URL) {
    if (password_lama !== "mhs123")
      return { ok: false, error: "Password lama salah (mode demo)" };
    return { ok: true, data: { success: true, message: "Password berhasil diubah (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ password_lama, password_baru }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return updateMahasiswaPassword({ password_lama, password_baru });
  }
}

// =============================================================================
// MAHASISWA — Kegiatan
// =============================================================================

export async function getMahasiswaKegiatan() {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch("/api/mahasiswa/kegiatan");
    if (res.ok) return res.json();
    return null;
  } catch {
    _mockMode = true;
    return null;
  }
}

export async function submitKegiatan(payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Kegiatan ditambahkan (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/kegiatan", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Kegiatan ditambahkan (mode demo)" } };
  }
}

export async function editKegiatan(id, payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Kegiatan diupdate (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/kegiatan/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Kegiatan diupdate (mode demo)" } };
  }
}

export async function deleteKegiatan(id) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Kegiatan dihapus (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/kegiatan/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Kegiatan dihapus (mode demo)" } };
  }
}

export async function getDetailKegiatan(id) {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch(`/api/mahasiswa/kegiatan/${id}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

export async function updateKegiatan(id, payload, file = null) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Kegiatan diupdate (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/kegiatan/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, data };
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const url = `${API_URL}/api/mahasiswa/kegiatan/${id}/bukti`;
      const uploadRes = await fetch(url, { method: "POST", credentials: "include", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) return { ok: false, data: uploadData };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, data: { error: "Tidak dapat terhubung ke server." } };
  }
}

export async function uploadBuktiKegiatan(id, formData) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, file_path: "/uploads/bukti/demo.pdf" } };
  }
  try {
    const url = `${API_URL}/api/mahasiswa/kegiatan/${id}/bukti`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, file_path: "/uploads/bukti/demo.pdf" } };
  }
}

// =============================================================================
// MAHASISWA — Pengajuan SKPI
// Base endpoint: /api/mahasiswa/pengajuan
// =============================================================================

export async function getMahasiswaIcp() {
  const ICP_API_URL = process.env.NEXT_PUBLIC_ICP_API_URL;

  // Jika ada endpoint ICP eksternal (sistem ICP sudah di-hosting)
  if (ICP_API_URL) {
    try {
      const res = await fetch(`${ICP_API_URL}/mahasiswa/icp`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) return res.json();
    } catch { /* fallback ke backend utama */ }
  }

  // Fallback: endpoint di backend SKPI (sementara)
  if (_mockMode || !API_URL) return { total_poin: 0, detail: [] };
  try {
    const res = await apiFetch("/api/mahasiswa/pengajuan/icp");
    if (res.ok) return res.json();
    return { total_poin: 0, detail: [] };
  } catch { return { total_poin: 0, detail: [] }; }
}

export async function getPengajuanStatus() {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch("/api/mahasiswa/pengajuan");
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

export async function submitPengajuanSkpi() {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Pengajuan berhasil (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/pengajuan", { method: "POST" });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Tidak dapat terhubung ke server." } };
  }
}

export async function getPengajuanRiwayat() {
  if (_mockMode || !API_URL) return [];
  try {
    const res = await apiFetch("/api/mahasiswa/pengajuan/riwayat");
    if (res.ok) return res.json();
    return [];
  } catch { return []; }
}

/** Unduh PDF SKPI milik mahasiswa yang login (hanya bila sudah diterbitkan). */
export async function downloadMahasiswaSkpi() {
  const res = await apiFetch("/api/mahasiswa/pengajuan/download");
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Gagal mengunduh SKPI (${res.status})`);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "SKPI.pdf";
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// ADMIN — Manajemen Akun Administrator
// Base endpoint: /api/admin/admins
// =============================================================================

/**
 * In-memory mock store — mensimulasikan tabel admin + users di database.
 * Dipakai saat backend tidak aktif (NEXT_PUBLIC_API_URL kosong / server mati).
 */
let _mockAdmins = [
  {
    id: 1,
    nama: "Dr. Antonius Wibowo",
    username: "antonius",
    email: "antonius@isb.ac.id",
    aktif: true,
    created_at: "2022-01-10",
    last_login: "2026-04-17",
  },
  {
    id: 2,
    nama: "Maria Goreti, S.Kom",
    username: "maria_g",
    email: "mariag@isb.ac.id",
    aktif: true,
    created_at: "2022-03-05",
    last_login: "2026-04-16",
  },
  {
    id: 3,
    nama: "Benediktus Hartono",
    username: "bene_h",
    email: "benediktus@isb.ac.id",
    aktif: true,
    created_at: "2023-07-14",
    last_login: "2026-04-10",
  },
  {
    id: 4,
    nama: "Theresia Lestari",
    username: "theresia",
    email: "theresia@isb.ac.id",
    aktif: true,
    created_at: "2024-01-20",
    last_login: "2026-03-28",
  },
  {
    id: 5,
    nama: "Fransiskus Daud",
    username: "fran_d",
    email: "fransiskus@isb.ac.id",
    aktif: false,
    created_at: "2023-09-01",
    last_login: "2025-12-01",
  },
  {
    id: 6,
    nama: "Yosefina Kartika",
    username: "yosefina_k",
    email: "yosefina@isb.ac.id",
    aktif: true,
    created_at: "2024-06-15",
    last_login: "2026-04-20",
  },
  {
    id: 7,
    nama: "Robertus Hendra",
    username: "robertus_h",
    email: "robertus@isb.ac.id",
    aktif: false,
    created_at: "2023-03-22",
    last_login: "2026-01-05",
  },
];

let _mockAdminNextId = 8;

function _mockGetAdmins({ q = "", page = 1, perPage = 10 }) {
  const lower = q.toLowerCase();
  const filtered = q
    ? _mockAdmins.filter(
      a =>
        a.nama.toLowerCase().includes(lower) ||
        a.username.toLowerCase().includes(lower) ||
        a.email.toLowerCase().includes(lower)
    )
    : [..._mockAdmins];

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return { rows, total, page: safePage, totalPages };
}

/**
 * Ambil daftar semua admin.
 * Endpoint : GET /api/admin/admins?q=&page=1
 */
export async function getAdmins({ q = "", page = 1 } = {}) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    return _mockGetAdmins({ q, page });
  }
  try {
    const params = new URLSearchParams({ q, page });
    const res = await apiFetch(`/api/admin/admins?${params}`);
    if (res.ok) return res.json();
    return null;
  } catch {
    _mockMode = true;
    return _mockGetAdmins({ q, page });
  }
}

/**
 * Tambah admin baru.
 * Endpoint : POST /api/admin/admins
 * Body     : { nama, username, email, password, aktif }
 */
export async function createAdmin(payload) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    if (_mockAdmins.find(a => a.username === payload.username)) {
      return { ok: false, data: { error: "Username sudah digunakan (mode demo)" } };
    }
    const today = new Date().toISOString().split("T")[0];
    const newAdmin = {
      id: _mockAdminNextId++,
      nama: payload.nama,
      username: payload.username,
      email: payload.email,
      aktif: payload.aktif ?? true,
      created_at: today,
      last_login: "-",
    };
    _mockAdmins = [newAdmin, ..._mockAdmins];
    return { ok: true, data: { success: true, message: "Admin ditambahkan (mode demo)", id: newAdmin.id } };
  }
  try {
    const res = await apiFetch("/api/admin/admins", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return createAdmin(payload);
  }
}

/**
 * Edit data admin (nama, email, status aktif).
 * Endpoint : PATCH /api/admin/admins/:id
 */
export async function updateAdmin(id, payload) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    _mockAdmins = _mockAdmins.map(a =>
      a.id === id
        ? {
          ...a,
          ...(payload.nama !== undefined && { nama: payload.nama }),
          ...(payload.email !== undefined && { email: payload.email }),
          ...(payload.aktif !== undefined && { aktif: payload.aktif }),
        }
        : a
    );
    return { ok: true, data: { success: true, message: "Admin diupdate (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/admin/admins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return updateAdmin(id, payload);
  }
}

/**
 * Hapus admin.
 * Endpoint : DELETE /api/admin/admins/:id
 */
export async function deleteAdmin(id) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    _mockAdmins = _mockAdmins.filter(a => a.id !== id);
    return { ok: true, data: { success: true, message: "Admin dihapus (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/admin/admins/${id}`, { method: "DELETE" });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return deleteAdmin(id);
  }
}

/**
 * Reset password admin.
 * Endpoint : POST /api/admin/admins/:id/reset
 * Body     : { password? }  — opsional, default = "Admin1234!"
 */
export async function resetAdminPassword(id, password) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    const admin = _mockAdmins.find(a => a.id === id);
    if (!admin) return { ok: false, data: { error: "Admin tidak ditemukan (mode demo)" } };
    return { ok: true, data: { success: true, message: `Password ${admin.username} direset ke Admin1234! (mode demo)` } };
  }
  try {
    const res = await apiFetch(`/api/admin/admins/${id}/reset`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return resetAdminPassword(id, password);
  }
}

// =============================================================================
// ADMIN — Dashboard Stats
// Base endpoint: /api/admin/stats
// =============================================================================

/** Mock stats dashboard — dipakai saat backend tidak aktif */
const MOCK_STATS = {
  totalMahasiswa: 480,
  totalKegiatan: 1340,
  kegiatanMenunggu: 87,
  kegiatanDisetujui: 620,
  kegiatanRevisi: 43,
  kegiatanDitolak: 28,
  pengajuanMenunggu: 15,
  skpiResmi: 215,
  kegiatanBulanan: [],
  prodiStats: [
    { id_prodi: 1, prodi: "Teknologi Informasi", mahasiswa: 140, kegiatan: 420, menunggu: 30, disetujui: 190, verifikasi: 15, ditolak: 8, skpi: 72 },
    { id_prodi: 2, prodi: "Manajemen", mahasiswa: 130, kegiatan: 370, menunggu: 22, disetujui: 170, verifikasi: 12, ditolak: 7, skpi: 60 },
    { id_prodi: 3, prodi: "Pendidikan Guru Sekolah Dasar", mahasiswa: 110, kegiatan: 290, menunggu: 18, disetujui: 145, verifikasi: 9, ditolak: 6, skpi: 48 },
    { id_prodi: 4, prodi: "Kewirausahaan", mahasiswa: 100, kegiatan: 260, menunggu: 17, disetujui: 115, verifikasi: 7, ditolak: 7, skpi: 35 },
  ],
};

/**
 * Ambil statistik dashboard.
 * Endpoint : GET /api/admin/stats?prodi=<id_prodi>
 * @param {number|null} prodiId - filter per prodi, null = semua
 */
export async function getDashboardStats(prodiId = null) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    if (!prodiId) return MOCK_STATS;
    // Filter mock per prodi
    const p = MOCK_STATS.prodiStats.find(r => r.id_prodi === prodiId);
    if (!p) return MOCK_STATS;
    return {
      ...MOCK_STATS,
      totalMahasiswa: p.mahasiswa,
      totalKegiatan: p.kegiatan,
      kegiatanMenunggu: p.menunggu,
      kegiatanDisetujui: p.disetujui,
      kegiatanRevisi: p.verifikasi,
      kegiatanDitolak: p.ditolak,
      skpiResmi: p.skpi,
    };
  }
  try {
    const params = prodiId ? `?prodi=${prodiId}` : "";
    const res = await apiFetch(`/api/admin/stats${params}`);
    if (res.ok) return res.json();
    return MOCK_STATS;
  } catch {
    _mockMode = true;
    return MOCK_STATS;
  }
}

// =============================================================================
// ADMIN — Notifikasi
// Base endpoint: /api/admin/notifikasi
// =============================================================================

/** Inferensi tipe notifikasi admin dari judul untuk pewarnaan UI */
export function inferNotifType(judul = "") {
  const j = judul.toLowerCase();
  if (j.includes("skpi") && (j.includes("ajukan") || j.includes("pengajuan"))) return "skpi";
  if (j.includes("diterbitkan") || j.includes("disetujui") || j.includes("resmi")) return "published";
  if (j.includes("revisi") || j.includes("ditolak")) return "revisi";
  return "verifikasi";
}

/** Inferensi tipe notifikasi mahasiswa dari judul untuk pewarnaan UI */
export function inferMahasiswaNotifType(judul = "") {
  const j = judul.toLowerCase();
  if (j.includes("diterbitkan") || j.includes("terbit")) return "published";
  if (j.includes("disetujui") || j.includes("diterima") || j.includes("diverifikasi") || j.includes("berhasil")) return "approved";
  if (j.includes("ditolak") || j.includes("gagal")) return "rejected";
  if (j.includes("revisi") || j.includes("diperlukan")) return "revision";
  return "info";
}

/** Mock notifikasi — dipakai saat backend tidak aktif */
let _mockNotifs = [
  { id_notifikasi: 1, judul: "Pengajuan SKPI Baru", pesan: "Mahasiswa Andi Pratama (TI-2021) mengajukan SKPI", status_baca: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id_notifikasi: 2, judul: "Verifikasi Kegiatan", pesan: "Kegiatan 'Seminar AI 2024' menunggu verifikasi", status_baca: false, created_at: new Date(Date.now() - 12 * 60000).toISOString() },
  { id_notifikasi: 3, judul: "SKPI Diterbitkan", pesan: "SKPI Mahasiswa Sari Dewi telah diterbitkan", status_baca: false, created_at: new Date(Date.now() - 28 * 60000).toISOString() },
  { id_notifikasi: 4, judul: "Revisi Bukti", pesan: "Bukti kegiatan Budi Santoso diminta revisi", status_baca: false, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id_notifikasi: 5, judul: "SKPI Diterbitkan", pesan: "SKPI batch Manajemen 2020 berhasil digenerate", status_baca: false, created_at: new Date(Date.now() - 120 * 60000).toISOString() },
  { id_notifikasi: 6, judul: "Verifikasi Kegiatan", pesan: "3 kegiatan baru dari prodi Akuntansi menunggu", status_baca: false, created_at: new Date(Date.now() - 180 * 60000).toISOString() },
];

/**
 * Ambil daftar notifikasi admin yang sedang login.
 * Endpoint : GET /api/admin/notifikasi?limit=20
 */
export async function getAdminNotifikasi(limit = 20) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    const rows = _mockNotifs.slice(0, limit);
    const unread = _mockNotifs.filter(n => !n.status_baca).length;
    return { rows, unread };
  }
  try {
    const res = await apiFetch(`/api/admin/notifikasi?limit=${limit}`);
    if (res.ok) return res.json();
    return { rows: [], unread: 0 };
  } catch {
    _mockMode = true;
    return getAdminNotifikasi(limit);
  }
}

/**
 * Tandai satu notifikasi sudah dibaca.
 * Endpoint : PATCH /api/admin/notifikasi/:id/baca
 */
export async function markNotifikasiRead(id) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    _mockNotifs = _mockNotifs.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n);
    return { ok: true };
  }
  try {
    const res = await apiFetch(`/api/admin/notifikasi/${id}/baca`, { method: "PATCH" });
    return { ok: res.ok };
  } catch {
    _mockMode = true;
    return markNotifikasiRead(id);
  }
}

/**
 * Tandai semua notifikasi sudah dibaca.
 * Endpoint : PATCH /api/admin/notifikasi/baca-semua
 */
export async function markAllNotifikasiRead() {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    _mockNotifs = _mockNotifs.map(n => ({ ...n, status_baca: true }));
    return { ok: true };
  }
  try {
    const res = await apiFetch("/api/admin/notifikasi/baca-semua", { method: "PATCH" });
    return { ok: res.ok };
  } catch {
    _mockMode = true;
    return markAllNotifikasiRead();
  }
}

/**
 * Hapus satu notifikasi.
 * Endpoint : DELETE /api/admin/notifikasi/:id
 */
export async function deleteAdminNotifikasi(id) {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    _mockNotifs = _mockNotifs.filter(n => n.id_notifikasi !== id);
    return { ok: true };
  }
  try {
    const res = await apiFetch(`/api/admin/notifikasi/${id}`, { method: "DELETE" });
    return { ok: res.ok };
  } catch {
    _mockMode = true;
    return deleteAdminNotifikasi(id);
  }
}

export async function deleteAllReadAdminNotif() {
  if (_mockMode || !API_URL) {
    _mockMode = true;
    _mockNotifs = _mockNotifs.filter(n => !n.status_baca);
    return { ok: true };
  }
  try {
    const res = await apiFetch("/api/admin/notifikasi", { method: "DELETE" });
    return { ok: res.ok };
  } catch { return { ok: false }; }
}

// =============================================================================
// MAHASISWA — Notifikasi
// Base endpoint: /api/mahasiswa/notifikasi
// =============================================================================

let _mockMahasiswaNotifs = [
  { id_notifikasi: 1, judul: "SKPI Diterbitkan",              pesan: "Selamat! SKPI Anda telah resmi diterbitkan. Silakan unduh di halaman Riwayat.", status_baca: false, created_at: new Date(Date.now() - 3 * 60000).toISOString() },
  { id_notifikasi: 2, judul: "Kegiatan Disetujui",            pesan: "Kegiatan \"Webinar AI 2024\" Anda telah disetujui oleh admin.", status_baca: false, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id_notifikasi: 3, judul: "Revisi Diperlukan",             pesan: "Kegiatan \"Seminar Nasional\" perlu direvisi. Catatan: Bukti tidak terbaca, mohon upload ulang.", status_baca: false, created_at: new Date(Date.now() - 90 * 60000).toISOString() },
  { id_notifikasi: 4, judul: "Kegiatan Berhasil Diajukan",    pesan: "Kegiatan \"Lomba Programming\" telah diajukan dan menunggu verifikasi admin.", status_baca: true, created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id_notifikasi: 5, judul: "Pengajuan SKPI Dikirim",        pesan: "Pengajuan SKPI Anda telah dikirim dan sedang menunggu verifikasi admin.", status_baca: true, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id_notifikasi: 6, judul: "Foto Profil Diperbarui",        pesan: "Foto profil Anda berhasil diperbarui.", status_baca: true, created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
];

export async function getMahasiswaNotifikasi(limit = 20) {
  if (_mockMode || !API_URL) {
    return { rows: _mockMahasiswaNotifs.slice(0, limit), unread: _mockMahasiswaNotifs.filter(n => !n.status_baca).length };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/notifikasi?limit=${limit}`);
    if (res.ok) return res.json();
    return { rows: [], unread: 0 };
  } catch {
    _mockMode = true;
    return getMahasiswaNotifikasi(limit);
  }
}

export async function markMahasiswaNotifRead(id) {
  if (_mockMode || !API_URL) {
    _mockMahasiswaNotifs = _mockMahasiswaNotifs.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n);
    return { ok: true };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/notifikasi/${id}/baca`, { method: "PATCH" });
    return { ok: res.ok };
  } catch {
    _mockMode = true;
    return markMahasiswaNotifRead(id);
  }
}

export async function markAllMahasiswaNotifRead() {
  if (_mockMode || !API_URL) {
    _mockMahasiswaNotifs = _mockMahasiswaNotifs.map(n => ({ ...n, status_baca: true }));
    return { ok: true };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/notifikasi/baca-semua", { method: "PATCH" });
    return { ok: res.ok };
  } catch {
    _mockMode = true;
    return markAllMahasiswaNotifRead();
  }
}

export async function deleteMahasiswaNotif(id) {
  if (_mockMode || !API_URL) {
    _mockMahasiswaNotifs = _mockMahasiswaNotifs.filter(n => n.id_notifikasi !== id);
    return { ok: true };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/notifikasi/${id}`, { method: "DELETE" });
    return { ok: res.ok };
  } catch { return { ok: false }; }
}

export async function deleteAllReadMahasiswaNotif() {
  if (_mockMode || !API_URL) {
    _mockMahasiswaNotifs = _mockMahasiswaNotifs.filter(n => !n.status_baca);
    return { ok: true };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/notifikasi", { method: "DELETE" });
    return { ok: res.ok };
  } catch { return { ok: false }; }
}

// =============================================================================
// ADMIN — Manajemen Mahasiswa
// Base endpoint: /api/mahasiswa
// =============================================================================

/**
 * Ambil daftar mahasiswa dengan filter & pagination.
 * Endpoint : GET /api/mahasiswa?q=&prodi=&page=
 */
export async function getMahasiswaList({ q = "", prodi = "Semua", page = 1 } = {}) {
  if (_mockMode || !API_URL) return null;
  try {
    const params = new URLSearchParams({ q, prodi, page });
    const res = await apiFetch(`/api/mahasiswa?${params}`);
    if (res.ok) return res.json();
    return null;
  } catch {
    _mockMode = true;
    return null;
  }
}

/**
 * Ambil daftar program studi.
 * Endpoint : GET /api/master-data/prodi
 */
export async function getProdiList() {
  if (_mockMode || !API_URL) return [];
  try {
    const res = await apiFetch("/api/master-data/prodi");
    if (res.ok) return res.json();
    return [];
  } catch {
    return [];
  }
}

/**
 * Tambah mahasiswa baru beserta akun login.
 * Endpoint : POST /api/mahasiswa
 * Body     : { nim, nama, id_prodi, angkatan, email, password }
 */
export async function createMahasiswa(payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Mahasiswa ditambahkan (mode demo)" } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Mahasiswa ditambahkan (mode demo)" } };
  }
}

/**
 * Update data mahasiswa.
 * Endpoint : PATCH /api/mahasiswa/:id
 */
export async function updateMahasiswa(id, payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Data diperbarui (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/mahasiswa/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Data diperbarui (mode demo)" } };
  }
}

/**
 * Reset password mahasiswa ke NIM.
 * Endpoint : PATCH /api/admin/mahasiswa/:id/akun  { action: "reset_password" }
 */
export async function resetMahasiswaPassword(id) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Password direset (mode demo)" } };
  }2
  try {
    const res = await apiFetch(`/api/admin/mahasiswa/${id}/akun`, {
      method: "PATCH",
      body: JSON.stringify({ action: "reset_password" }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Password direset (mode demo)" } };
  }
}

/**
 * Toggle status akun mahasiswa (aktif ↔ nonaktif).
 * Endpoint : PATCH /api/admin/mahasiswa/:id/akun  { action: "toggle_status" }
 */
export async function toggleMahasiswaAkun(id) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Status diubah (mode demo)" } };
  }
  try {
    const res = await apiFetch(`/api/admin/mahasiswa/${id}/akun`, {
      method: "PATCH",
      body: JSON.stringify({ action: "toggle_status" }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, message: "Status diubah (mode demo)" } };
  }
}

/**
 * Import mahasiswa secara bulk dari Excel.
 * Endpoint : POST /api/mahasiswa/bulk
 * Body     : { list: [...] }
 */
export async function importMahasiswaBulk(list) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: list.length, skipped: 0, failed: 0 } };
  }
  try {
    const res = await apiFetch("/api/mahasiswa/bulk", {
      method: "POST",
      body: JSON.stringify({ list }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    // Jangan set _mockMode — kembalikan error nyata agar tidak menyesatkan
    return { ok: false, data: { error: "Tidak dapat terhubung ke server. Pastikan backend berjalan." } };
  }
}
/* ══════════════════════════════════════════════════════════════
   AKTIVITAS — admin verifikasi kegiatan mahasiswa
══════════════════════════════════════════════════════════════ */

/** GET /api/aktivitas?status=&q=&page= */
export async function getAktivitasList({ status = "", q = "", page = 1 } = {}) {
  if (_mockMode || !API_URL) return null;
  try {
    const params = new URLSearchParams();
    if (status && status !== "Semua") params.set("status", status);
    if (q) params.set("q", q);
    params.set("page", page);
    const res = await apiFetch(`/api/aktivitas?${params}`);
    if (res.ok) return res.json();
    return null;
  } catch { _mockMode = true; return null; }
}

/** GET /api/aktivitas/:id */
export async function getAktivitasDetail(id) {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch(`/api/aktivitas/${id}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

/** PATCH /api/aktivitas/:id/verifikasi — ubah status verifikasi */
export async function verifikasiAktivitas(id, status, catatan_admin = "") {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { id_kegiatan: id, status_verifikasi: status } };
  }
  try {
    const res = await apiFetch(`/api/aktivitas/${id}/verifikasi`, {
      method: "PATCH",
      body: JSON.stringify({ status, catatan_admin }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch { return { ok: false, data: { error: "Network error" } }; }
}

/* ══════════════════════════════════════════════════════════════
   ICP — Integrity Credit Points
══════════════════════════════════════════════════════════════ */

/** GET /api/icp/summary?page= — ringkasan ICP semua mahasiswa */
export async function getIcpSummary({ page = 1 } = {}) {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch(`/api/icp/summary?page=${page}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

/** GET /api/icp/mahasiswa/:id — ICP satu mahasiswa */
export async function getIcpMahasiswa(id) {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch(`/api/icp/mahasiswa/${id}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

/* ══════════════════════════════════════════════════════════════
   SKPI — Generate & Terbitkan
══════════════════════════════════════════════════════════════ */

/** POST /api/skpi/generate — generate SKPI untuk satu mahasiswa */
export async function generateSkpi(id_mahasiswa, nomor_skpi = "") {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { id_skpi: Date.now(), nomor_skpi, status: "draft" } };
  }
  try {
    const res = await apiFetch("/api/skpi/generate", {
      method: "POST",
      body: JSON.stringify({ id_mahasiswa, nomor_skpi: nomor_skpi || undefined }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch { return { ok: false, data: { error: "Network error" } }; }
}

/** PATCH /api/skpi/:id/status — set status draft|resmi */
export async function publishSkpi(id_skpi, status = "resmi") {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { id_skpi, status } };
  }
  try {
    const res = await apiFetch(`/api/skpi/${id_skpi}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch { return { ok: false, data: { error: "Network error" } }; }
}

/** GET /api/skpi?status=&page= — daftar SKPI */
export async function getSkpiList({ status = "", mahasiswa_id = "", page = 1 } = {}) {
  if (_mockMode || !API_URL) return null;
  try {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (mahasiswa_id) params.set("mahasiswa_id", mahasiswa_id);
    params.set("page", page);
    const res = await apiFetch(`/api/skpi?${params}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}

/** GET /api/mahasiswa/:id — detail satu mahasiswa (untuk SKPI preview) */
export async function getMahasiswaDetail(id) {
  if (_mockMode || !API_URL) return null;
  try {
    const res = await apiFetch(`/api/mahasiswa/${id}`);
    if (res.ok) return res.json();
    return null;
  } catch { return null; }
}