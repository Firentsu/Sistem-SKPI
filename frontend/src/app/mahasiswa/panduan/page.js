"use client";

import { useState } from "react";
import styles from "./panduan.module.css";
import {
  BookMarked, ChevronDown, ChevronRight,
  UserPlus, ClipboardList, CheckCircle2,
  FileText, Download, HelpCircle, AlertCircle,
  Award, Trophy, Medal, Shield, Star, Info,
  Phone, Mail, MessageCircle,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: UserPlus,
    title: "Login ke Sistem",
    color: "#765439",
    bg: "#fdf4ec",
    border: "#e4cdb8",
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
    border: "#86efac",
    description: "Daftarkan semua kegiatan yang telah Anda ikuti selama perkuliahan.",
    details: [
      "Klik menu Kegiatan di sidebar kiri.",
      "Klik tombol Tambah Kegiatan.",
      "Isi formulir: nama kegiatan, jenis, kategori, tingkat, tanggal, dan peran Anda.",
      "Unggah bukti kegiatan berupa sertifikat, foto, atau dokumen (JPG, PNG, PDF, maks. 5 MB).",
      "Klik Simpan — status akan menjadi Menunggu verifikasi.",
      "Kegiatan yang sudah berstatus Disetujui tidak dapat diubah.",
    ],
  },
  {
    id: 3,
    icon: CheckCircle2,
    title: "Proses Verifikasi",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    description: "Admin akan memeriksa dan memverifikasi setiap kegiatan yang Anda ajukan.",
    details: [
      "Menunggu: Kegiatan baru diajukan, sedang menunggu diperiksa admin.",
      "Disetujui: Kegiatan terverifikasi dan diperhitungkan dalam SKPI.",
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
    border: "#c4b5fd",
    description: "Setelah syarat terpenuhi (kegiatan disetujui + ICP ≥ 100 poin), ajukan SKPI.",
    details: [
      "Buka menu Pengajuan di sidebar kiri.",
      "Pastikan minimal 1 kegiatan sudah berstatus Disetujui.",
      "Pastikan total poin ICP Anda sudah mencapai minimal 100 poin (Bronze).",
      "Periksa kelengkapan data profil mahasiswa.",
      "Klik Ajukan SKPI untuk mengirim permohonan penerbitan.",
      "Admin akan memeriksa dan menerbitkan SKPI jika semua syarat terpenuhi.",
    ],
  },
  {
    id: 5,
    icon: Download,
    title: "Melihat & Mengunduh SKPI",
    color: "#0891b2",
    bg: "#f0fdfe",
    border: "#67e8f9",
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

const ICP_LEVELS = [
  { label: "Bronze", min: 100, max: 149, color: "#92400e", bg: "#fef3c7", border: "#fcd34d", Icon: Award,  desc: "Syarat minimum pengajuan SKPI" },
  { label: "Silver", min: 150, max: 199, color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", Icon: Medal,  desc: "Pencapaian menengah ICP" },
  { label: "Gold",   min: 200, max: null, color: "#92400e", bg: "#fef9c3", border: "#fde047", Icon: Trophy, desc: "Pencapaian tertinggi ICP" },
];

const FAQS = [
  {
    q: "Apa itu SKPI?",
    a: "Surat Keterangan Pendamping Ijazah (SKPI) adalah dokumen resmi yang diterbitkan perguruan tinggi untuk menerangkan capaian pembelajaran dan kegiatan mahasiswa selama masa studi, sebagai pendamping ijazah.",
  },
  {
    q: "Apa saja syarat untuk mengajukan SKPI?",
    a: "Ada dua syarat utama: (1) Minimal 1 kegiatan berstatus Disetujui oleh admin, dan (2) Total poin ICP minimal 100 poin (level Bronze). Pastikan kedua syarat ini terpenuhi sebelum mengajukan SKPI.",
  },
  {
    q: "Apa itu ICP dan bagaimana cara mendapatkan poin?",
    a: "ICP (Integrity Credit Points) adalah sistem penilaian yang mencakup aspek Fisik, Iman, Intelektualitas, Kepribadian, Keterampilan, dan Moral. Poin ICP dikelola dan diverifikasi oleh admin. Hubungi admin atau pembimbing akademik untuk informasi lebih lanjut tentang perolehan poin ICP.",
  },
  {
    q: "Berapa banyak kegiatan yang harus saya ajukan?",
    a: "Minimal 1 kegiatan harus disetujui admin. Namun semakin banyak kegiatan yang disetujui, semakin lengkap isi SKPI Anda. Hubungi pembimbing akademik untuk informasi persyaratan program studi Anda.",
  },
  {
    q: "Apa format bukti kegiatan yang diterima?",
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
    <div className={`${styles.stepCard} ${open ? styles.stepCardOpen : ""}`}
      style={{ "--step-border": step.border }}>
      <button className={styles.stepHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.stepLeft}>
          <div className={styles.stepNum} style={{ background: step.bg, color: step.color, border: `1.5px solid ${step.border}` }}>
            {index + 1}
          </div>
          <div className={styles.stepIconWrap} style={{ background: step.bg, color: step.color, border: `1px solid ${step.border}` }}>
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
        <ul className={styles.stepDetailList}>
          {step.details.map((d, i) => (
            <li key={i} className={styles.stepDetailItem}>
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

      {/* ── Header Banner ── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <div className={styles.heroIcon}><BookMarked size={26} /></div>
          <div>
            <h1 className={styles.heroTitle}>Buku Panduan Penggunaan</h1>
            <p className={styles.heroSubtitle}>
              Panduan lengkap cara menggunakan Sistem SKPI Institut Shanti Bhuana
            </p>
          </div>
        </div>
        <div className={styles.heroBadge}>
          <Star size={13} style={{ marginRight: 5 }} />
          5 Langkah Mudah
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className={styles.infoBanner}>
        <AlertCircle size={15} />
        <p>
          Pastikan Anda telah menerima akun dari admin sebelum memulai.
          Jika belum memiliki akun, hubungi bagian akademik atau admin sistem.
        </p>
      </div>

      {/* ── Syarat Pengajuan ── */}
      <div className={styles.syaratSection}>
        <div className={styles.syaratHeader}>
          <Shield size={15} />
          <span>Syarat Pengajuan SKPI</span>
        </div>
        <div className={styles.syaratGrid}>
          <div className={styles.syaratCard} style={{ borderColor: "#86efac" }}>
            <div className={styles.syaratCardIcon} style={{ background: "#dcfce7", color: "#047857" }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className={styles.syaratCardTitle} style={{ color: "#065f46" }}>Kegiatan Disetujui</p>
              <p className={styles.syaratCardDesc}>Minimal <strong>1 kegiatan</strong> harus berstatus Disetujui oleh admin</p>
            </div>
          </div>
          <div className={styles.syaratCard} style={{ borderColor: "#fcd34d" }}>
            <div className={styles.syaratCardIcon} style={{ background: "#fef3c7", color: "#92400e" }}>
              <Award size={18} />
            </div>
            <div>
              <p className={styles.syaratCardTitle} style={{ color: "#78350f" }}>ICP Minimal 100 Poin</p>
              <p className={styles.syaratCardDesc}>Total poin ICP harus mencapai level <strong>Bronze (≥ 100 poin)</strong></p>
            </div>
          </div>
          <div className={styles.syaratCard} style={{ borderColor: "#c4b5fd" }}>
            <div className={styles.syaratCardIcon} style={{ background: "#f5f3ff", color: "#7c3aed" }}>
              <FileText size={18} />
            </div>
            <div>
              <p className={styles.syaratCardTitle} style={{ color: "#4c1d95" }}>Profil Lengkap</p>
              <p className={styles.syaratCardDesc}>Data profil mahasiswa (NIM, nama, prodi) sudah lengkap dan benar</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ICP Levels ── */}
      <div className={styles.icpSection}>
        <div className={styles.icpHeader}>
          <Trophy size={15} />
          <span>Level ICP (Integrity Credit Points)</span>
        </div>
        <div className={styles.icpGrid}>
          {ICP_LEVELS.map(lvl => {
            const LvlIcon = lvl.Icon;
            return (
              <div key={lvl.label} className={styles.icpCard}
                style={{ background: lvl.bg, borderColor: lvl.border }}>
                <div className={styles.icpCardIcon} style={{ color: lvl.color }}>
                  <LvlIcon size={20} />
                </div>
                <div>
                  <p className={styles.icpCardLabel} style={{ color: lvl.color }}>{lvl.label}</p>
                  <p className={styles.icpCardRange} style={{ color: lvl.color }}>
                    {lvl.max ? `${lvl.min} – ${lvl.max} poin` : `≥ ${lvl.min} poin`}
                  </p>
                  <p className={styles.icpCardDesc}>{lvl.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className={styles.icpNote}>
          <Info size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
          Poin ICP dikelola oleh admin. Hubungi admin atau pembimbing akademik untuk informasi perolehan poin ICP Anda.
        </p>
      </div>

      {/* ── Steps ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <CheckCircle2 size={16} />
          <h2 className={styles.sectionTitle}>Langkah-Langkah Penggunaan</h2>
        </div>
        <p className={styles.sectionSubtitle}>Klik setiap langkah untuk melihat petunjuk detail.</p>
        <div className={styles.stepListWrap}>
          {STEPS.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* ── Bottom Row: FAQ + Contact ── */}
      <div className={styles.bottomRow}>

        {/* FAQ */}
        <div className={styles.section} style={{ flex: 2 }}>
          <div className={styles.sectionHead}>
            <HelpCircle size={16} />
            <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>

          {/* Contact Box */}
          <div className={styles.contactBox}>
            <div className={styles.contactHeader}>
              <div className={styles.contactIcon}><HelpCircle size={18} /></div>
              <p className={styles.contactTitle}>Butuh Bantuan?</p>
            </div>
            <p className={styles.contactText}>
              Hubungi admin atau bagian akademik Institut Shanti Bhuana jika mengalami
              kesulitan dalam penggunaan sistem ini.
            </p>
            <div className={styles.contactLinks}>
              <div className={styles.contactLink}>
                <Mail size={13} />
                <span>akademik@isb.ac.id</span>
              </div>
              <div className={styles.contactLink}>
                <Phone size={13} />
                <span>Bagian Akademik ISB</span>
              </div>
              <div className={styles.contactLink}>
                <MessageCircle size={13} />
                <span>Hubungi Admin Sistem</span>
              </div>
            </div>
          </div>

          {/* Tips Box */}
          <div className={styles.tipsBox}>
            <div className={styles.tipsHeader}>
              <Star size={14} />
              <span>Tips Penggunaan</span>
            </div>
            <ul className={styles.tipsList}>
              <li>Unggah bukti kegiatan yang jelas dan terbaca</li>
              <li>Isi semua field formulir dengan lengkap dan benar</li>
              <li>Pantau status kegiatan secara berkala</li>
              <li>Segera perbaiki kegiatan yang berstatus Revisi</li>
              <li>Pastikan ICP sudah ≥ 100 sebelum mengajukan SKPI</li>
              <li>Simpan salinan SKPI setelah diterbitkan</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
