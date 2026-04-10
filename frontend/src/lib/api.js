/**
 * api.js — Utility terpusat untuk semua request ke backend SKPI
 *
 * Cara kerja:
 * 1. Coba request ke backend (NEXT_PUBLIC_API_URL)
 * 2. Jika backend tidak aktif → otomatis pakai MOCK DATA (fallback)
 * 3. Frontend tetap bisa jalan walaupun tanpa backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

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

export async function login(username, password) {
  if (!API_URL) {
    _mockMode = true;
    if (username === "admin" && password === "admin123") return { ok: true };
    return { ok: false, error: "Username atau password salah (mode demo)" };
  }
  try {
    const res  = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) { _mockMode = false; return { ok: true }; }
    return { ok: false, error: data.error || "Login gagal" };
  } catch {
    _mockMode = true;
    if (username === "admin" && password === "admin123") return { ok: true };
    return { ok: false, error: "Server tidak aktif. Gunakan admin / admin123 untuk demo." };
  }
}

export async function logout() {
  if (_mockMode || !API_URL) return;
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {}
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
    const res  = await apiFetch("/api/auth/profile", {
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
    const res  = await apiFetchForm("/api/auth/avatar", formData);
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
    const res    = await apiFetch(`/api/mahasiswa?${params}`);
    if (res.ok) return res.json();
    return null;
  } catch {
    _mockMode = true;
    return null;
  }
}

// =============================================================================
// MAHASISWA — Auth & Profile
// Setiap fungsi adalah padanan 1-to-1 dari fungsi admin di atas,
// sehingga layout & halaman mahasiswa bekerja dengan pola yang sama persis.
// =============================================================================

/** Mock sesi mahasiswa — dipakai saat backend tidak aktif */
const MOCK_MAHASISWA_SESSION = {
  user: { user_id: 2, username: "mhs_demo", email: "mhs@isb.ac.id", role: "mahasiswa" },
  mahasiswa: {
    id_mahasiswa: 1,
    nim:          "2021001",
    nama:         "Mio Haimiya",
    email:        "mhs@isb.ac.id",
    prodi:        "Teknik Informatika",
    angkatan:     2021,
    avatar:       "/img/avatar.jpg",
  },
};

/** Mock profil mahasiswa — dipakai saat backend tidak aktif */
const MOCK_MAHASISWA_PROFILE = {
  id_mahasiswa: 1,
  nim:          "2021001",
  nama:         "Mio Haimiya",
  email:        "mhs@isb.ac.id",
  username:     "mhs_demo",
  prodi:        "Teknik Informatika",
  angkatan:     2021,
  avatar:       "/img/avatar.jpg",
  created_at:   "2026-01-01T00:00:00.000Z",
};

/**
 * Login mahasiswa — padanan login() admin.
 * Endpoint : POST /api/mahasiswa/auth/login
 * Body     : { nim, password }
 * Demo     : nim bebas + password "mhs123"
 */
export async function loginMahasiswa(nim, password) {
  if (!API_URL) {
    _mockMode = true;
    if (password === "mhs123") return { ok: true };
    return { ok: false, error: "NIM atau password salah (mode demo)" };
  }
  try {
    const res  = await apiFetch("/api/mahasiswa/auth/login", {
      method: "POST",
      body: JSON.stringify({ nim, password }),
    });
    const data = await res.json();
    if (res.ok) { _mockMode = false; return { ok: true }; }
    return { ok: false, error: data.error || "Login mahasiswa gagal" };
  } catch {
    _mockMode = true;
    if (password === "mhs123") return { ok: true };
    return { ok: false, error: "Server tidak aktif. Gunakan NIM terdaftar & password mhs123 untuk demo." };
  }
}

/**
 * Ambil sesi mahasiswa — padanan getMe() admin.
 * Dipakai layout mahasiswa untuk auth-check pertama kali.
 * Endpoint : GET /api/mahasiswa/auth/me
 */
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

/**
 * Ambil profil mahasiswa yang sedang login — padanan getProfile() admin.
 * Endpoint : GET /api/mahasiswa/auth/profile
 */
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

/**
 * Update profil mahasiswa — padanan updateProfile() admin.
 * Endpoint : PATCH /api/mahasiswa/auth/profile
 */
export async function updateMahasiswaProfile(payload) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, message: "Tersimpan (mode demo)" } };
  }
  try {
    const res  = await apiFetch("/api/mahasiswa/auth/profile", {
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

/**
 * Upload avatar mahasiswa — padanan uploadAvatar() admin.
 * Endpoint : POST /api/mahasiswa/auth/avatar
 */
export async function uploadMahasiswaAvatar(formData) {
  if (_mockMode || !API_URL) {
    return { ok: true, data: { success: true, avatar: "/img/avatar.jpg" } };
  }
  try {
    const res  = await apiFetchForm("/api/mahasiswa/auth/avatar", formData);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    _mockMode = true;
    return { ok: true, data: { success: true, avatar: "/img/avatar.jpg" } };
  }
}

/**
 * Logout mahasiswa — padanan logout() admin.
 * Endpoint : POST /api/mahasiswa/auth/logout
 */
export async function logoutMahasiswa() {
  if (_mockMode || !API_URL) return;
  try { await apiFetch("/api/mahasiswa/auth/logout", { method: "POST" }); } catch {}
}

/**
 * Ganti password mahasiswa.
 * Endpoint : PATCH /api/mahasiswa/auth/password
 * Body     : { password_lama, password_baru }
 */
export async function updateMahasiswaPassword({ password_lama, password_baru }) {
  if (_mockMode || !API_URL) {
    if (password_lama !== "mhs123")
      return { ok: false, error: "Password lama salah (mode demo)" };
    return { ok: true, data: { success: true, message: "Password berhasil diubah (mode demo)" } };
  }
  try {
    const res  = await apiFetch("/api/mahasiswa/auth/password", {
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