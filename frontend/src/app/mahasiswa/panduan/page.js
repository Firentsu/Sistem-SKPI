"use client";

import { useState } from "react";
import styles from "./panduan.module.css";
import {
  BookMarked, ChevronDown, ChevronRight,
  UserPlus, ClipboardList, CheckCircle2,
  FileText, Download, HelpCircle, AlertCircle,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: UserPlus,
    title: "Login ke Sistem",
    color: "#765439",
    bg: "#fdf4ec",
    description: "Masuk menggunakan akun yang telah diberikan oleh admin.",
    details: [
      "Buka halaman utama sistem SKPI Institut Shanti Bhuana.",
      "Masukkan NIM Anda sebagai username.",
      "Masukkan password (default: NIM Anda, atau password yang telah diubah).",
      "Klik tombol Login untuk masuk ke dashboard.",
      "Jika lupa password, hubungi admin untuk reset password.",
    ],
  },
  {
    id: 2,
    icon: ClipboardList,
    title: "Mengajukan Kegiatan",
    color: "#047857",
    bg: "#f0fdf4",
    description: "Daftarkan semua kegiatan yang telah Anda ikuti selama perkuliahan.",
    details: [
      "Klik menu Kegiatan di sidebar kiri.",
      "Klik tombol Tambah Kegiatan.",
      "Isi formulir dengan data kegiatan: nama kegiatan, jenis, kategori, tingkat, tanggal, dan posisi/peran Anda.",
      "Unggah bukti kegiatan berupa sertifikat, foto, atau dokumen pendukung (JPG, PNG, PDF, maks. 5 MB).",
      "Klik Simpan untuk mengajukan kegiatan. Status akan menjadi Menunggu verifikasi.",
      "Kegiatan yang sudah berstatus Disetujui tidak dapat diubah.",
    ],
  },
  {
    id: 3,
    icon: CheckCircle2,
    title: "Proses Verifikasi",
    color: "#b45309",
    bg: "#fffbeb",
    description: "Admin akan memeriksa dan memverifikasi setiap kegiatan yang Anda ajukan.",
    details: [
      "Menunggu: Kegiatan baru diajukan dan sedang menunggu diperiksa admin.",
      "Disetujui: Kegiatan terverifikasi dan akan diperhitungkan dalam SKPI.",
      "Revisi: Admin meminta perbaikan data atau bukti. Cek catatan admin dan perbarui kegiatan.",
      "Ditolak: Kegiatan tidak memenuhi syarat. Periksa keterangan penolakan.",
      "Pantau status kegiatan secara berkala melalui menu Kegiatan.",
    ],
  },
  {
    id: 4,
    icon: FileText,
    title: "Mengajukan SKPI",
    color: "#7c3aed",
    bg: "#f5f3ff",
    description: "Setelah kegiatan cukup terverifikasi, ajukan SKPI untuk diterbitkan.",
    details: [
      "Buka menu Pengajuan di sidebar kiri.",
      "Periksa ringkasan kegiatan yang telah disetujui.",
      "Pastikan semua data profil mahasiswa sudah lengkap dan benar.",
      "Klik Ajukan SKPI untuk mengirim permohonan penerbitan SKPI.",
      "Admin akan memeriksa dan menerbitkan SKPI jika semua syarat terpenuhi.",
      "Status pengajuan dapat dipantau melalui menu Riwayat.",
    ],
  },
  {
    id: 5,
    icon: Download,
    title: "Melihat & Mengunduh SKPI",
    color: "#0891b2",
    bg: "#f0fdfe",
    description: "SKPI yang telah diterbitkan dapat dilihat dan diunduh melalui menu Riwayat.",
    details: [
      "Buka menu Riwayat di sidebar kiri.",
      "Daftar SKPI yang pernah diterbitkan akan ditampilkan.",
      "Klik Lihat / Preview untuk melihat isi SKPI.",
      "Klik Unduh / Download untuk mengunduh SKPI dalam format PDF.",
      "Simpan SKPI Anda sebagai dokumen resmi akademik.",
    ],
  },
];

const FAQS = [
  {
    q: "Apa itu SKPI?",
    a: "Surat Keterangan Pendamping Ijazah (SKPI) adalah dokumen resmi yang diterbitkan perguruan tinggi untuk menerangkan capaian pembelajaran dan kegiatan mahasiswa selama masa studi, sebagai pendamping ijazah.",
  },
  {
    q: "Berapa banyak kegiatan yang harus saya ajukan?",
    a: "Jumlah minimum kegiatan disesuaikan dengan kebijakan program studi masing-masing. Hubungi pembimbing akademik atau admin untuk informasi persyaratan program studi Anda.",
  },
  {
    q: "Apa format bukti yang diterima?",
    a: "Bukti kegiatan dapat berupa file gambar (JPG, PNG, WebP) atau dokumen PDF. Ukuran file maksimal 5 MB per berkas.",
  },
  {
    q: "Bagaimana jika kegiatan saya berstatus Revisi?",
    a: "Buka detail kegiatan yang berstatus Revisi, baca catatan dari admin, kemudian perbarui data atau unggah ulang bukti yang diminta. Setelah disimpan, status akan kembali ke Menunggu.",
  },
  {
    q: "Apakah saya bisa mengubah kegiatan yang sudah Disetujui?",
    a: "Tidak. Kegiatan yang sudah berstatus Disetujui tidak dapat diubah. Jika ada kesalahan data, hubungi admin untuk perbaikan.",
  },
  {
    q: "Bagaimana cara mengubah password?",
    a: "Klik nama profil Anda di sudut kanan atas, pilih Profil, kemudian ubah password di bagian pengaturan akun.",
  },
];

function StepCard({ step, index }) {
  const [open, setOpen] = useState(false);
  const Icon = step.icon;
  return (
    <div className={`${styles.stepCard} ${open ? styles.stepCardOpen : ""}`}>
      <button className={styles.stepHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.stepLeft}>
          <div className={styles.stepNum} style={{ background: step.bg, color: step.color }}>
            {index + 1}
          </div>
          <div className={styles.stepIconWrap} style={{ background: step.bg, color: step.color }}>
            <Icon size={18} />
          </div>
          <div className={styles.stepInfo}>
            <span className={styles.stepTitle}>{step.title}</span>
            <span className={styles.stepDesc}>{step.description}</span>
          </div>
        </div>
        <div className={styles.stepChevron} style={{ color: step.color }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>
      {open && (
        <ul className={styles.stepList}>
          {step.details.map((d, i) => (
            <li key={i} className={styles.stepListItem}>
              <span className={styles.stepBullet} style={{ background: step.color }} />
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.faqCard} ${open ? styles.faqCardOpen : ""}`}>
      <button className={styles.faqQuestion} onClick={() => setOpen(o => !o)}>
        <span>{faq.q}</span>
        <span className={styles.faqChevron}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {open && <p className={styles.faqAnswer}>{faq.a}</p>}
    </div>
  );
}

export default function BukuPanduan() {
  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <BookMarked size={22} />
        </div>
        <div>
          <h1 className={styles.title}>Buku Panduan Penggunaan</h1>
          <p className={styles.subtitle}>
            Panduan lengkap cara menggunakan Sistem SKPI Institut Shanti Bhuana
          </p>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className={styles.infoBanner}>
        <AlertCircle size={15} />
        <p>
          Pastikan Anda telah menerima akun dari admin sebelum memulai. Jika belum memiliki akun,
          hubungi bagian akademik atau admin sistem.
        </p>
      </div>

      {/* ── Steps ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <CheckCircle2 size={16} />
          <h2 className={styles.sectionTitle}>Langkah-Langkah Penggunaan</h2>
        </div>
        <p className={styles.sectionSubtitle}>
          Klik setiap langkah untuk melihat petunjuk detail.
        </p>
        <div className={styles.stepList2}>
          {STEPS.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <HelpCircle size={16} />
          <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan (FAQ)</h2>
        </div>
        <div className={styles.faqList}>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} />
          ))}
        </div>
      </div>

      {/* ── Contact Box ── */}
      <div className={styles.contactBox}>
        <div className={styles.contactIcon}>
          <HelpCircle size={20} />
        </div>
        <div>
          <p className={styles.contactTitle}>Butuh Bantuan?</p>
          <p className={styles.contactText}>
            Hubungi admin atau bagian akademik Institut Shanti Bhuana jika mengalami
            kesulitan dalam penggunaan sistem ini.
          </p>
        </div>
      </div>
    </div>
  );
}
