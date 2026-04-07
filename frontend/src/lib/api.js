/**
 * api.js — Utility terpusat untuk semua request ke backend SKPI
 *
 * Cara kerja:
 * 1. Coba request ke backend (NEXT_PUBLIC_API_URL)
 * 2. Jika backend tidak aktif → otomatis pakai MOCK DATA (fallback)
 * 3. Frontend tetap bisa jalan walaupun tanpa backend
 */

// ── Base URL dari environment variable ──────────────────────
// Isi di .env.local:  NEXT_PUBLIC_API_URL=http://localhost:5000
// Kalau kosong → pakai mock mode otomatis
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ── Flag: apakah mode mock sedang aktif ─────────────────────
let _mockMode = false;
export function isMockMode() { return _mockMode; }

// ── Wrapper fetch ke backend ─────────────────────────────────
export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  return fetch(url, {
    credentials: "include",      // wajib agar cookie JWT terkirim
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

// ── Versi khusus untuk FormData (avatar upload) ──────────────
export async function apiFetchForm(path, formData) {
  const url = `${API_URL}${path}`;
  return fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
    // JANGAN set Content-Type, biarkan browser isi boundary
  });
}

// ════════════════════════════════════════════════════════════
//  MOCK DATA — dipakai saat backend tidak aktif
// ════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════
//  API METHODS — tiap method punya fallback mock-nya sendiri
// ════════════════════════════════════════════════════════════

/** Login — kembalikan { ok, error } */
export async function login(username, password) {
  // Kalau tidak ada API_URL, langsung mock mode
  if (!API_URL) {
    _mockMode = true;
    // Mock: hanya terima "admin" / "admin123"
    if (username === "admin" && password === "admin123") {
      return { ok: true };
    }
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
    // Backend tidak aktif → mock login
    _mockMode = true;
    if (username === "admin" && password === "admin123") {
      return { ok: true };
    }
    return { ok: false, error: "Server tidak aktif. Gunakan admin / admin123 untuk demo." };
  }
}

/** Logout */
export async function logout() {
  if (_mockMode || !API_URL) return;
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch { /* abaikan */ }
  _mockMode = false;
}

/** Cek sesi aktif — kembalikan data user atau null */
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

/** Ambil profil admin */
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

/** Update profil (username / email / password) */
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

/** Upload avatar */
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

/** List mahasiswa (dengan fallback mock) */
export async function getMahasiswa({ q = "", prodi = "Semua", page = 1 } = {}) {
  if (_mockMode || !API_URL) return null; // halaman mahasiswa punya mock sendiri

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
