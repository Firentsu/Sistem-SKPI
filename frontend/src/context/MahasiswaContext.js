"use client";

import { createContext, useContext, useState } from "react";

// Data prodi beserta warna tema
export const PRODI_CONFIG = {
  "Teknologi Informasi": {
    primary: "#ff7f00",
    light: "#fff3e6",
    dark: "#cc6600",
    gradient: "linear-gradient(135deg, #ff7f00, #ffaa33)"
  },
  "Manajemen": {
    primary: "#0099cc",
    light: "#e6f5fa",
    dark: "#0077aa",
    gradient: "linear-gradient(135deg, #0099cc, #33ccff)"
  },
  "Kewirausahaan": {
    primary: "#ff3300",
    light: "#ffe6e0",
    dark: "#cc2900",
    gradient: "linear-gradient(135deg, #ff3300, #ff7755)"
  },
  "Pendidikan Guru Sekolah Dasar": {
    primary: "#800080",
    light: "#f3e6f3",
    dark: "#660066",
    gradient: "linear-gradient(135deg, #800080, #b300b3)"
  },
  "Agroekoteknologi": {
    primary: "#00bfb3",
    light: "#e6faf8",
    dark: "#009988",
    gradient: "linear-gradient(135deg, #00bfb3, #33ffdd)"
  },
  "Sistem Informasi": {
    primary: "#1a0909",
    light: "#f0ecec",
    dark: "#0d0404",
    gradient: "linear-gradient(135deg, #1a0909, #4a2525)"
  }
};

const MahasiswaContext = createContext();

export function MahasiswaProvider({ children }) {
  // Mock data user (nanti diganti dengan data dari login)
  const [user, setUser] = useState({
    id: 1,
    nama: "Ahmad Rizki",
    nim: "2021001001",
    prodi: "Teknologi Informasi", // ganti sesuai testing
    email: "ahmad@student.isb.ac.id",
    foto: "/img/avatar-default.jpg",
    angkatan: "2021",
    status_skpi: "Belum"
  });

  const prodiConfig = PRODI_CONFIG[user.prodi] || PRODI_CONFIG["Teknologi Informasi"];

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <MahasiswaContext.Provider value={{ user, updateUser, prodiConfig }}>
      {children}
    </MahasiswaContext.Provider>
  );
}

export function useMahasiswa() {
  return useContext(MahasiswaContext);
}