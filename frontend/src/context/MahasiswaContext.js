// frontend/src/context/MahasiswaContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getMahasiswaMe,
  getMahasiswaProfile,
  updateMahasiswaProfile,
  uploadMahasiswaAvatar,
  logoutMahasiswa,
  updateMahasiswaPassword,
  isMockMode,
  getAvatarUrl,
} from "@/lib/api";

import { getProdiConfig } from "@/lib/prodi-config";

const MahasiswaContext = createContext();

export function MahasiswaProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Ambil data user saat pertama kali
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Coba ambil sesi mahasiswa dari API (atau mock)
        const session = await getMahasiswaMe();
        if (session && session.mahasiswa) {
          // Jika ada data mahasiswa, set user
          const mahasiswa = session.mahasiswa;
          setUser({
            id: mahasiswa.id_mahasiswa,
            nama: mahasiswa.nama,
            nim: mahasiswa.nim,
            prodi: mahasiswa.prodi,
            email: mahasiswa.email,
            foto: getAvatarUrl(mahasiswa.avatar),
            angkatan: mahasiswa.angkatan?.toString() || "",
            status_skpi: mahasiswa.status_skpi || "Belum",
          });
        } else {
          // Tidak ada sesi, redirect ke login
          router.push("/");
        }
      } catch (err) {
        console.error("Gagal load user mahasiswa:", err);
        setError("Gagal memuat data profil");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const prodiConfig = user ? getProdiConfig(user.prodi) : getProdiConfig("Teknologi Informasi");

  const updateUser = async (data) => {
    // Update ke API
    const result = await updateMahasiswaProfile(data);
    if (result.ok) {
      setUser(prev => ({ ...prev, ...data }));
      return { success: true };
    } else {
      return { success: false, error: result.data?.error || "Gagal update profil" };
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    const result = await updateMahasiswaPassword({ password_lama: oldPassword, password_baru: newPassword });
    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.data?.error || result.error || "Gagal ubah password" };
    }
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const result = await uploadMahasiswaAvatar(formData);
    if (result.ok && result.data?.avatar) {
      const newAvatarUrl = getAvatarUrl(result.data.avatar);
      setUser(prev => ({ ...prev, foto: newAvatarUrl }));
      return { success: true, avatarUrl: newAvatarUrl };
    } else {
      return { success: false, error: result.data?.error || "Gagal upload avatar" };
    }
  };

  const logout = async () => {
    await logoutMahasiswa();
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Memuat data mahasiswa...</div>
      </div>
    );
  }

  if (error || !user) {
    return null; // redirect sudah terjadi
  }

  return (
    <MahasiswaContext.Provider value={{ user, updateUser, updatePassword, uploadAvatar, logout, prodiConfig }}>
      {children}
    </MahasiswaContext.Provider>
  );
}

export function useMahasiswa() {
  const context = useContext(MahasiswaContext);
  if (!context) {
    throw new Error("useMahasiswa harus digunakan di dalam MahasiswaProvider");
  }
  return context;
}