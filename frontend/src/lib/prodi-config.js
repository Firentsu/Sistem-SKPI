// Centralized prodi (program studi) color configuration
export const PRODI_CONFIG = {
  "Teknologi Informasi": {
    primary: "#ff7f00",
    color: "#ff7f00",
    light: "#fff0df",
    dark: "#cc6600",
    bg: "#fff6eb",
    border: "#ffc88a",
    gradient: "linear-gradient(135deg,#ff9a2b,#ff7f00)",
    label: "TI",
  },
  "Sistem Informasi": {
    primary: "#1a0909",
    color: "#1a0909",
    light: "#f6eaea",
    dark: "#120606",
    bg: "#fbf5f5",
    border: "#c9b2b2",
    gradient: "linear-gradient(135deg,#3b1f1f,#1a0909)",
    label: "SI",
  },
  "Manajemen": {
    primary: "#0099cc",
    color: "#0099cc",
    light: "#e6f8ff",
    dark: "#006f99",
    bg: "#f0fbff",
    border: "#8fd8f3",
    gradient: "linear-gradient(135deg,#00a6d6,#0099cc)",
    label: "MNJ",
  },
  "Kewirausahaan": {
    primary: "#ff3300",
    color: "#ff3300",
    light: "#ffe6e0",
    dark: "#cc2900",
    bg: "#fff2f0",
    border: "#ffb8a3",
    gradient: "linear-gradient(135deg,#ff5a2b,#ff3300)",
    label: "KWU",
  },
  "Pendidikan Guru Sekolah Dasar": {
    primary: "#800080",
    color: "#800080",
    light: "#f2e6f2",
    dark: "#4d004d",
    bg: "#fbf0fb",
    border: "#d3b3d3",
    gradient: "linear-gradient(135deg,#9a4d9a,#800080)",
    label: "PGSD",
  },
  "Agroekoteknologi": {
    primary: "#00bfb3",
    color: "#00bfb3",
    light: "#e6fffb",
    dark: "#009988",
    bg: "#f0fffd",
    border: "#9ef0e7",
    gradient: "linear-gradient(135deg,#33d9cf,#00bfb3)",
    label: "AGRO",
  },
};

export function getProdiConfig(nama) {
  return PRODI_CONFIG[nama] || {
    primary: "#765439",
    color: "#765439",
    light: "#fdf4ec",
    dark: "#4a2f1a",
    bg: "#fdf4ec",
    border: "#c8945a",
    gradient: "linear-gradient(135deg,#765439,#4a2f1a)",
    label: "?",
  };
}

export default {
  PRODI_CONFIG,
  getProdiConfig,
};
