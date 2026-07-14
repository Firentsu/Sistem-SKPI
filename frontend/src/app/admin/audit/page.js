/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardCheck, ShieldCheck, Target, Layers, Gauge,
  ChevronDown, RotateCcw, CheckCircle2, AlertTriangle,
  Lightbulb, ListChecks, Info, TrendingUp, Users, Building2,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import styles from "./audit.module.css";

// ============================================================
//  METADATA TINGKAT KAPABILITAS COBIT 2019 (Level 0 - 5)
// ============================================================
const CAPABILITY_LEVELS = [
  { level: 0, name: "Incomplete",  label: "Tidak Lengkap", color: "#9ca3af", desc: "Proses tidak diterapkan atau gagal mencapai tujuannya." },
  { level: 1, name: "Performed",   label: "Dijalankan",    color: "#f59e0b", desc: "Proses telah dijalankan dan mencapai tujuan dasarnya." },
  { level: 2, name: "Managed",     label: "Dikelola",      color: "#eab308", desc: "Proses direncanakan, dipantau, dan disesuaikan." },
  { level: 3, name: "Established", label: "Ditetapkan",    color: "#84cc16", desc: "Proses distandarkan dan didokumentasikan di organisasi." },
  { level: 4, name: "Predictable", label: "Terprediksi",   color: "#22c55e", desc: "Proses beroperasi dalam batas yang terukur dan konsisten." },
  { level: 5, name: "Optimizing",  label: "Optimasi",      color: "#16a34a", desc: "Proses ditingkatkan secara berkelanjutan." },
];

// ============================================================
//  IDENTITAS AUDIT — SISTEM SKPI INSTITUT SHANTI BHUANA
// ============================================================
const AUDIT_INFO = {
  framework: "COBIT 2019",
  domain: "BAI (Build, Acquire and Implement)",
  auditor: "Tim Audit Penelitian (Peneliti)",
  auditee: "Unit Sistem Informasi (SISFO)",
  metode:
    "Data primer berupa kuesioner dan wawancara kepada pihak SISFO (Unit Sistem Informasi), didukung observasi terhadap kode dan sistem",
};

// ============================================================
//  DATA AUDIT — DOMAIN BAI (Build, Acquire and Implement)
//  Sistem : Sistem SKPI Institut Shanti Bhuana
//
//  Dasar penilaian kapabilitas (HASIL AUDIT = REKAP KUESIONER):
//  - Level tiap praktik DITURUNKAN dari hasil kuesioner (data
//    primer) yang selaras dengan butir K1 - K12, sehingga hasil
//    audit dan rekap kuesioner menjadi SATU acuan yang konsisten
//    di seluruh grafik, gap, dan rata-rata kapabilitas.
//  - Hasil kuesioner per proses: BAI02 = 3,75 (Level 4);
//    BAI03 = 4,00 (Level 4); BAI07 = 3,75 (Level 4).
//  - Target seluruh proses -> Level 5 (Optimizing) sebagai arah
//    pengembangan berkelanjutan, sehingga tetap terdapat GAP yang
//    dapat dianalisis sebagai acuan perkembangan Sistem SKPI.
// ============================================================
const PROCESSES = [
  {
    id: "BAI02",
    title: "Pengelolaan Definisi Kebutuhan",
    en: "Managed Requirements Definition",
    target: 5,
    purpose:
      "Memastikan kebutuhan fungsional dan non-fungsional Sistem SKPI diidentifikasi, dianalisis, dan disepakati bersama pemangku kepentingan (Unit SISFO dan pengembang sistem) sehingga solusi yang dibangun sesuai proses bisnis pengelolaan dan penerbitan dokumen SKPI.",
    practices: [
      { id: "BAI02.01", k: "K1", name: "Kebutuhan fungsional & non-fungsional diidentifikasi bersama pemangku kepentingan (SISFO dan pengembang sistem)", level: 4 },
      { id: "BAI02.02", k: "K2", name: "Kebutuhan sistem didokumentasikan secara jelas (use case, ERD, daftar kebutuhan)", level: 4 },
      { id: "BAI02.03", k: "K3", name: "Fitur yang dibangun sesuai proses bisnis pengelolaan dan penerbitan dokumen SKPI", level: 3 },
      { id: "BAI02.04", k: "K4", name: "Perubahan kebutuhan selama pengembangan dianalisis dan disepakati sebelum diterapkan", level: 4 },
    ],
    findings: [
      "Kebutuhan sistem dikumpulkan melalui observasi dan diskusi dengan pihak SISFO, kemudian didokumentasikan dalam laporan yang mencakup kebutuhan fungsional, non-fungsional, use case, dan ERD.",
      "Dokumentasi kebutuhan telah tersedia dan konsisten sebagai acuan pengembangan, namun belum dibakukan dalam dokumen SRS (Software Requirement Specification) tersendiri.",
    ],
    recommendations: [
      "Membakukan dokumentasi kebutuhan sistem ke dalam dokumen SRS tersendiri agar menjadi acuan pengembangan yang lebih formal.",
      "Menautkan setiap kebutuhan ke fitur dan pengujiannya (traceability) untuk memudahkan verifikasi kelengkapan sistem.",
    ],
  },
  {
    id: "BAI03",
    title: "Pengelolaan Identifikasi & Pembangunan Solusi",
    en: "Managed Solutions Identification and Build",
    target: 5,
    purpose:
      "Memastikan solusi backend Sistem SKPI (RESTful API berbasis Express.js dengan Prisma ORM dan MySQL) dirancang, dikembangkan, dan diuji sesuai rancangan agar andal, modular, dan mudah dipelihara.",
    practices: [
      { id: "BAI03.01", k: "K5", name: "Sistem dibangun sesuai rancangan yang disepakati (arsitektur, ERD, use case)", level: 4 },
      { id: "BAI03.03", k: "K6", name: "Perubahan kode & basis data terkelola (version control GitHub, migrasi Prisma tercatat)", level: 4 },
      { id: "BAI03.05", k: "K7", name: "Fitur utama berfungsi sesuai kebutuhan (data master, kegiatan & bukti, poin ICP dari SICP, generate SKPI per prodi, notifikasi realtime)", level: 4 },
      { id: "BAI03.08", k: "K8", name: "Keamanan aplikasi diterapkan (autentikasi session, kontrol akses per peran, validasi masukan & unggahan)", level: 4 },
    ],
    findings: [
      "Layanan API dibangun secara modular menggunakan Express.js dan Prisma; endpoint utama, fitur generate dokumen SKPI (.docx) per program studi, notifikasi realtime (SSE), dan migrasi basis data yang terkelola telah berjalan sesuai kebutuhan.",
      "Dokumentasi API belum disusun secara lengkap dan formal, sehingga berpotensi menyulitkan pemeliharaan dan pengembangan lanjutan oleh pengembang berikutnya.",
    ],
    recommendations: [
      "Menyusun dokumentasi API yang lengkap dan terstruktur (misalnya OpenAPI/Swagger) untuk memudahkan pemeliharaan, integrasi, dan pengembangan lanjutan.",
      "Menambahkan pengujian otomatis (unit/integration test) pada modul kritis seperti autentikasi dan generate dokumen SKPI.",
    ],
  },
  {
    id: "BAI07",
    title: "Pengelolaan Penerimaan Perubahan & Transisi TI",
    en: "Managed IT Change Acceptance and Transitioning",
    target: 5,
    purpose:
      "Memastikan Sistem SKPI diuji, diterima pengguna, dan dirilis ke lingkungan produksi (frontend pada Vercel, backend pada Railway) secara terkendali sehingga dapat digunakan tanpa gangguan layanan.",
    practices: [
      { id: "BAI07.01", k: "K9",  name: "Fungsi-fungsi utama sistem diuji terlebih dahulu sebelum digunakan", level: 4 },
      { id: "BAI07.05", k: "K10", name: "Sistem diterapkan (deploy) ke lingkungan produksi dan dapat diakses secara daring", level: 4 },
      { id: "BAI07.06", k: "K11", name: "Proses pengujian dan penerapan sistem terdokumentasi dengan baik", level: 3 },
      { id: "BAI07.08", k: "K12", name: "Sistem yang diterapkan dapat diterima dan digunakan pengguna sesuai kebutuhan", level: 4 },
    ],
    findings: [
      "Sistem telah diuji secara fungsional dan diterapkan (deploy) ke lingkungan produksi sehingga dapat diakses secara daring.",
      "Proses pengujian dan penerapan belum didokumentasikan secara formal dan sistematis sebagai acuan pemeliharaan.",
    ],
    recommendations: [
      "Menyusun dokumentasi pengujian dan penerapan sistem secara sistematis sebagai acuan pemeliharaan dan pengembangan di masa mendatang.",
      "Mengintegrasikan mekanisme Single Sign-On (SSO) sebagai autentikasi terpusat untuk meningkatkan keamanan dan kemudahan pengelolaan akun.",
    ],
  },
];

// ============================================================
//  INSTRUMEN KUESIONER (DATA PRIMER)
//  Dibagikan kepada pihak SISFO sebagai
//  validasi (triangulasi) hasil observasi.
//  Skala 1-4, dipetakan ke level kapabilitas:
//  1,0-1,4 -> L1 | 1,5-2,4 -> L2 | 2,5-3,4 -> L3 | 3,5-4,0 -> L4
// ============================================================
const KUESIONER_SKALA = [
  { skor: 1, label: "Tidak Ada", desc: "Proses belum dilakukan" },
  { skor: 2, label: "Minimal",   desc: "Dilakukan sebagian dan belum konsisten" },
  { skor: 3, label: "Lengkap",   desc: "Dilakukan secara konsisten dan terdokumentasi" },
  { skor: 4, label: "Terukur",   desc: "Dilakukan, terdokumentasi, dan dievaluasi" },
];

// ============================================================
//  REKAP JAWABAN KUESIONER (DATA PRIMER — HASIL PENGISIAN)
//  Sumber: Google Form "Kuesioner Audit Sistem SKPI —
//  COBIT 2019 Domain BAI". Skor tiap butir mengikuti skala
//  1-4 di atas. Untuk responden > 1, tambahkan skor tiap
//  responden ke array butir terkait; nilai akan dirata-rata
//  secara otomatis.
// ============================================================
const KUESIONER_RESPONDEN = [
  { nama: "Angela Eva Permanda", jabatan: "Staff", unit: "PROA", tanggal: "14 Juli 2026" },
];

// Skor per butir (K1-K12), selaras dengan properti `k` pada PROCESSES.
const KUESIONER_JAWABAN = {
  // BAI02 — Pengelolaan Definisi Kebutuhan
  K1: [4], K2: [4], K3: [3], K4: [4],
  // BAI03 — Pengelolaan Identifikasi & Pembangunan Solusi
  K5: [4], K6: [4], K7: [4], K8: [4],
  // BAI07 — Pengelolaan Penerimaan Perubahan & Transisi TI
  K9: [4], K10: [4], K11: [3], K12: [4],
};

// Masukan terbuka (isian bebas) dari responden.
const KUESIONER_MASUKAN = {
  kendala: [], // "Kendala atau kekurangan..." — belum ada jawaban
  saran: ["Dokumen SKPI diperbaiki di bagian tanggalnya."],
};

// v3: level default kini diturunkan dari hasil kuesioner (unified) & target L5.
const STORAGE_KEY = "cobit-audit-skpi-bai-v3";

// ── Bangun peta level default dari data ──────────────────────
function buildDefaultLevels() {
  const map = {};
  PROCESSES.forEach((p) => p.practices.forEach((pr) => { map[pr.id] = pr.level; }));
  return map;
}

// ── Warna berdasarkan level ──────────────────────────────────
function levelColor(level) {
  return CAPABILITY_LEVELS[Math.max(0, Math.min(5, Math.round(level)))].color;
}

// ── Pemetaan rata-rata skor kuesioner (1-4) ke level kapabilitas ──
//    1,0-1,4 → L1 | 1,5-2,4 → L2 | 2,5-3,4 → L3 | 3,5-4,0 → L4
function skorKeLevel(avg) {
  if (avg == null) return null;
  if (avg >= 3.5) return 4;
  if (avg >= 2.5) return 3;
  if (avg >= 1.5) return 2;
  if (avg >= 1.0) return 1;
  return 0;
}

// ============================================================
//  KOMPONEN UTAMA
// ============================================================
export default function AuditPage() {
  const [levels, setLevels] = useState(buildDefaultLevels);
  const [expanded, setExpanded] = useState("BAI02");
  const [hydrated, setHydrated] = useState(false);

  // ── Muat penilaian tersimpan (localStorage) ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLevels((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch { /* abaikan */ }
    setHydrated(true);
  }, []);

  // ── Simpan setiap perubahan penilaian ──
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(levels)); } catch { /* abaikan */ }
  }, [levels, hydrated]);

  const setPracticeLevel = useCallback((practiceId, value) => {
    setLevels((prev) => ({ ...prev, [practiceId]: value }));
  }, []);

  const resetAssessment = useCallback(() => {
    setLevels(buildDefaultLevels());
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* abaikan */ }
  }, []);

  // ── Hitung rata-rata kapabilitas per proses ──
  const processScores = useMemo(() => {
    return PROCESSES.map((p) => {
      const vals = p.practices.map((pr) => levels[pr.id] ?? pr.level);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { id: p.id, title: p.title, avg, target: p.target, gap: p.target - avg };
    });
  }, [levels]);

  const overall = useMemo(() => {
    const avg = processScores.reduce((a, b) => a + b.avg, 0) / processScores.length;
    return Math.round(avg * 100) / 100;
  }, [processScores]);

  const overallTarget = useMemo(() => {
    const t = processScores.reduce((a, b) => a + b.target, 0) / processScores.length;
    return Math.round(t * 100) / 100;
  }, [processScores]);

  const totalPractices = useMemo(
    () => PROCESSES.reduce((a, p) => a + p.practices.length, 0),
    []
  );

  const radarData = useMemo(
    () => processScores.map((s) => ({
      subject: s.id,
      "Kapabilitas Saat Ini": Math.round(s.avg * 100) / 100,
      "Target": s.target,
    })),
    [processScores]
  );

  // ── Rekap skor kuesioner: rata-rata per butir & per proses ──
  const kuesioner = useMemo(() => {
    const butir = {};
    Object.entries(KUESIONER_JAWABAN).forEach(([k, arr]) => {
      butir[k] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    });
    const perProses = PROCESSES.map((p) => {
      const vals = p.practices.map((pr) => butir[pr.k]).filter((v) => v != null);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return {
        id: p.id,
        title: p.title,
        avg,
        level: skorKeLevel(avg),
        target: p.target,
        gap: avg != null ? Math.round((p.target - avg) * 100) / 100 : null,
      };
    });
    return { butir, perProses };
  }, []);

  return (
    <div className={styles.container}>
      {/* ══════════ HEADER ══════════ */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <ClipboardCheck size={26} className={styles.titleIcon} />
            Audit Tata Kelola TI — Sistem SKPI
          </h1>
          <p className={styles.subtitle}>
            Evaluasi kapabilitas Sistem SKPI Institut Shanti Bhuana menggunakan kerangka kerja{" "}
            <strong>{AUDIT_INFO.framework}</strong> — Domain <strong>{AUDIT_INFO.domain}</strong>
          </p>
        </div>
        <button className={styles.resetBtn} onClick={resetAssessment} title="Kembalikan ke hasil penilaian pada laporan">
          <RotateCcw size={15} /> Reset Penilaian
        </button>
      </div>

      {/* ══════════ KARTU INFORMASI AUDIT ══════════ */}
      <div className={styles.infoRow}>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon} style={{ background: "#eef2ff", color: "#4338ca" }}><ShieldCheck size={18} /></div>
          <div>
            <span className={styles.infoLabel}>Kerangka Kerja</span>
            <span className={styles.infoValue}>COBIT 2019</span>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon} style={{ background: "#fdf4ec", color: "#b45309" }}><Layers size={18} /></div>
          <div>
            <span className={styles.infoLabel}>Domain</span>
            <span className={styles.infoValue}>BAI</span>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon} style={{ background: "#f0fdf4", color: "#15803d" }}><ListChecks size={18} /></div>
          <div>
            <span className={styles.infoLabel}>Proses Dinilai</span>
            <span className={styles.infoValue}>BAI02 · BAI03 · BAI07</span>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon} style={{ background: "#fef2f2", color: "#b91c1c" }}><Target size={18} /></div>
          <div>
            <span className={styles.infoLabel}>Target Kapabilitas</span>
            <span className={styles.infoValue}>Semua Proses: L5 (Optimizing)</span>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon} style={{ background: "#f5f3ff", color: "#6d28d9" }}><Users size={18} /></div>
          <div>
            <span className={styles.infoLabel}>Auditor</span>
            <span className={styles.infoValue}>Tim Audit Penelitian (Peneliti)</span>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoIcon} style={{ background: "#ecfeff", color: "#0e7490" }}><Building2 size={18} /></div>
          <div>
            <span className={styles.infoLabel}>Auditee</span>
            <span className={styles.infoValue}>Unit Sistem Informasi (SISFO)</span>
          </div>
        </div>
      </div>

      {/* ══════════ RINGKASAN + RADAR ══════════ */}
      <div className={styles.summaryGrid}>
        {/* Skor keseluruhan */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreHeader}>
            <Gauge size={16} />
            <span>Rata-rata Kapabilitas</span>
          </div>
          <div className={styles.scoreValue} style={{ color: levelColor(overall) }}>
            {overall.toFixed(2)}
          </div>
          <div className={styles.scoreLevelBadge} style={{ background: levelColor(overall) }}>
            Level {Math.round(overall)} — {CAPABILITY_LEVELS[Math.round(overall)].name}
          </div>
          <div className={styles.scoreBarTrack}>
            <div className={styles.scoreBarFill} style={{ width: `${(overall / 5) * 100}%`, background: levelColor(overall) }} />
            <div className={styles.scoreBarTarget} style={{ left: `${(overallTarget / 5) * 100}%` }} title={`Rata-rata target: ${overallTarget.toFixed(2)}`} />
          </div>
          <div className={styles.scoreMeta}>
            <span><strong>{PROCESSES.length}</strong> Proses</span>
            <span><strong>{totalPractices}</strong> Praktik Dinilai</span>
            <span className={styles.scoreGap}>
              <TrendingUp size={12} /> Gap {(overallTarget - overall).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Radar chart */}
        <div className={styles.radarCard}>
          <div className={styles.cardTitle}>Peta Kapabilitas — Saat Ini vs Target</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#e5d9cc" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#5c3317", fontSize: 13, fontWeight: 700 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} tick={{ fill: "#9c7a5e", fontSize: 10 }} />
              <Radar name="Target" dataKey="Target" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.08} strokeDasharray="5 4" />
              <Radar name="Kapabilitas Saat Ini" dataKey="Kapabilitas Saat Ini" stroke="#765439" fill="#765439" fillOpacity={0.35} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #f0e0d0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════ RINGKASAN PER PROSES (bar) ══════════ */}
      <div className={styles.processSummaryRow}>
        {processScores.map((s) => (
          <div key={s.id} className={styles.procSummaryCard}>
            <div className={styles.procSummaryHead}>
              <span className={styles.procSummaryId}>{s.id}</span>
              <span className={styles.procSummaryAvg} style={{ color: levelColor(s.avg) }}>{s.avg.toFixed(2)}</span>
            </div>
            <div className={styles.procSummaryTitle}>{s.title}</div>
            <div className={styles.procBarTrack}>
              <div className={styles.procBarFill} style={{ width: `${(s.avg / 5) * 100}%`, background: levelColor(s.avg) }} />
              <div className={styles.procBarTarget} style={{ left: `${(s.target / 5) * 100}%` }} />
            </div>
            <div className={styles.procGap}>
              {s.gap <= 0
                ? <span className={styles.gapOk}><CheckCircle2 size={12} /> Target tercapai</span>
                : <span className={styles.gapWarn}><AlertTriangle size={12} /> Gap {s.gap.toFixed(2)} ke Level {s.target}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════ DETAIL PER PROSES (akordeon) ══════════ */}
      <div className={styles.sectionTitle}>Rincian Penilaian Proses</div>
      {PROCESSES.map((p) => {
        const score = processScores.find((s) => s.id === p.id);
        const isOpen = expanded === p.id;
        return (
          <div key={p.id} className={styles.procCard}>
            <button
              className={styles.procHeader}
              onClick={() => setExpanded(isOpen ? null : p.id)}
            >
              <div className={styles.procHeaderLeft}>
                <span className={styles.procBadge}>{p.id}</span>
                <div className={styles.procHeaderText}>
                  <span className={styles.procName}>{p.title}</span>
                  <span className={styles.procEn}>{p.en}</span>
                </div>
              </div>
              <div className={styles.procHeaderRight}>
                <div className={styles.procScorePill} style={{ borderColor: levelColor(score.avg) }}>
                  <span style={{ color: levelColor(score.avg) }}>{score.avg.toFixed(2)}</span>
                  <small>Level {Math.round(score.avg)}</small>
                </div>
                <ChevronDown size={18} className={`${styles.procChevron} ${isOpen ? styles.procChevronOpen : ""}`} />
              </div>
            </button>

            {isOpen && (
              <div className={styles.procBody}>
                <p className={styles.procPurpose}>
                  <Info size={14} /> <span>{p.purpose}</span>
                </p>

                {/* Tabel praktik manajemen + penilai level */}
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.colId}>Kode</th>
                        <th>Praktik Manajemen (selaras butir kuesioner)</th>
                        <th className={styles.colLevel}>Tingkat Kapabilitas (0 – 5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.practices.map((pr) => {
                        const val = levels[pr.id] ?? pr.level;
                        return (
                          <tr key={pr.id}>
                            <td className={styles.colId}>
                              <code>{pr.id}</code>
                              <div style={{ marginTop: 4, fontSize: 11, color: "#9c7a5e", fontWeight: 700 }}>{pr.k}</div>
                            </td>
                            <td>{pr.name}</td>
                            <td className={styles.colLevel}>
                              <div className={styles.levelPicker}>
                                {[0, 1, 2, 3, 4, 5].map((lv) => (
                                  <button
                                    key={lv}
                                    className={`${styles.levelDot} ${val === lv ? styles.levelDotActive : ""}`}
                                    style={val === lv ? { background: levelColor(lv), borderColor: levelColor(lv) } : {}}
                                    onClick={() => setPracticeLevel(pr.id, lv)}
                                    title={`Level ${lv} — ${CAPABILITY_LEVELS[lv].label}`}
                                  >
                                    {lv}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Temuan & Rekomendasi */}
                <div className={styles.frGrid}>
                  <div className={styles.frCard}>
                    <div className={styles.frTitle} style={{ color: "#b45309" }}>
                      <AlertTriangle size={15} /> Temuan Audit
                    </div>
                    <ul className={styles.frList}>
                      {p.findings.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                  <div className={styles.frCard}>
                    <div className={styles.frTitle} style={{ color: "#15803d" }}>
                      <Lightbulb size={15} /> Rekomendasi
                    </div>
                    <ul className={styles.frList}>
                      {p.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ══════════ INSTRUMEN KUESIONER (DATA PRIMER) ══════════ */}
      <div className={styles.sectionTitle}>Instrumen Pengumpulan Data — Kuesioner (Data Primer)</div>
      <div className={styles.procCard}>
        <div className={styles.procBody}>
          <p className={styles.procPurpose}>
            <Info size={14} />
            <span>
              Kuesioner dibagikan kepada pihak <strong>SISFO</strong> sebagai
              data primer yang menjadi <strong>dasar penilaian kapabilitas</strong> Sistem SKPI. Butir K1–K12
              selaras dengan praktik yang dinilai pada rincian di atas. Pemetaan rata-rata skor ke level kapabilitas:
              1,0–1,4 → Level 1; 1,5–2,4 → Level 2; 2,5–3,4 → Level 3; 3,5–4,0 → Level 4.
            </span>
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colId}>Skor</th>
                  <th>Label</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {KUESIONER_SKALA.map((k) => (
                  <tr key={k.skor}>
                    <td className={styles.colId}><code>{k.skor}</code></td>
                    <td>{k.label}</td>
                    <td>{k.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════ REKAP JAWABAN KUESIONER (HASIL) ══════════ */}
      <div className={styles.sectionTitle}>Rekap Jawaban Kuesioner (Hasil Pengisian)</div>
      <div className={styles.procCard}>
        <div className={styles.procBody}>
          <p className={styles.procPurpose}>
            <Info size={14} />
            <span>
              Rekapitulasi jawaban responden atas kuesioner audit COBIT 2019 Domain BAI.
              Skor tiap butir (skala 1–4) menjadi <strong>dasar penilaian kapabilitas</strong> pada
              halaman ini — sehingga hasil audit dan rekap kuesioner <strong>menjadi satu acuan</strong>{" "}
              yang konsisten. Setiap proses dibandingkan dengan target <strong>Level 5 (Optimizing)</strong>{" "}
              untuk memperoleh <strong>gap</strong> sebagai acuan pengembangan Sistem SKPI ke depan.
            </span>
          </p>

          {/* Identitas responden */}
          <div className={styles.kuesRespondenBar}>
            <span className={styles.kuesCount}>
              <Users size={13} /> {KUESIONER_RESPONDEN.length} Responden
            </span>
            {KUESIONER_RESPONDEN.map((r, i) => (
              <span key={i} className={styles.respondenChip}>
                <strong>{r.nama}</strong>
                <small>{r.jabatan} · {r.unit} · {r.tanggal}</small>
              </span>
            ))}
          </div>

          {/* Tabel skor per butir */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colId}>Butir</th>
                  <th>Pertanyaan (praktik yang dinilai)</th>
                  <th className={styles.colId}>Proses</th>
                  <th className={styles.colLevelSkor}>Skor (1–4)</th>
                </tr>
              </thead>
              <tbody>
                {PROCESSES.map((p) =>
                  p.practices.map((pr) => {
                    const skor = kuesioner.butir[pr.k];
                    return (
                      <tr key={pr.k}>
                        <td className={styles.colId}><code>{pr.k}</code></td>
                        <td>{pr.name}</td>
                        <td className={styles.colId}>
                          <span className={styles.procTag}>{p.id}</span>
                        </td>
                        <td className={styles.colLevelSkor}>
                          {skor != null ? (
                            <span
                              className={styles.skorBadge}
                              style={{ background: levelColor(skorKeLevel(skor)) }}
                              title={`Setara Level ${skorKeLevel(skor)}`}
                            >
                              {Number.isInteger(skor) ? skor : skor.toFixed(2)}
                            </span>
                          ) : (
                            <span className={styles.skorEmpty}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Ringkasan per proses: kapabilitas (dari kuesioner) vs target & gap */}
          <div className={styles.kuesProcRow}>
            {kuesioner.perProses.map((s) => (
              <div key={s.id} className={styles.kuesProcCard}>
                <div className={styles.kuesProcHead}>
                  <span className={styles.procSummaryId}>{s.id}</span>
                  <span className={styles.kuesProcAvg} style={{ color: levelColor(s.level ?? 0) }}>
                    {s.avg != null ? s.avg.toFixed(2) : "—"}
                  </span>
                </div>
                <div className={styles.procSummaryTitle}>{s.title}</div>
                <div className={styles.kuesLevelCompare}>
                  <span className={styles.kuesLevelPill} style={{ background: levelColor(s.level ?? 0) }}>
                    Kapabilitas: L{s.level}
                  </span>
                  <span className={styles.kuesLevelPillGhost}>
                    Target: L{s.target}
                  </span>
                  {s.gap != null && (
                    <span className={styles.kuesGapPill}>
                      <TrendingUp size={11} /> Gap {s.gap.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Masukan terbuka */}
          <div className={styles.frGrid} style={{ marginTop: 18 }}>
            <div className={styles.frCard}>
              <div className={styles.frTitle} style={{ color: "#b45309" }}>
                <AlertTriangle size={15} /> Kendala / Kekurangan
              </div>
              {KUESIONER_MASUKAN.kendala.length ? (
                <ul className={styles.frList}>
                  {KUESIONER_MASUKAN.kendala.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              ) : (
                <p className={styles.kuesEmptyNote}>Belum ada jawaban untuk pertanyaan ini.</p>
              )}
            </div>
            <div className={styles.frCard}>
              <div className={styles.frTitle} style={{ color: "#15803d" }}>
                <Lightbulb size={15} /> Saran Perbaikan / Pengembangan
              </div>
              {KUESIONER_MASUKAN.saran.length ? (
                <ul className={styles.frList}>
                  {KUESIONER_MASUKAN.saran.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              ) : (
                <p className={styles.kuesEmptyNote}>Belum ada jawaban untuk pertanyaan ini.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ REFERENSI TINGKAT KAPABILITAS ══════════ */}
      <div className={styles.sectionTitle}>Referensi Tingkat Kapabilitas COBIT 2019</div>
      <div className={styles.legendGrid}>
        {CAPABILITY_LEVELS.map((lv) => (
          <div key={lv.level} className={styles.legendCard}>
            <div className={styles.legendDot} style={{ background: lv.color }}>{lv.level}</div>
            <div className={styles.legendText}>
              <span className={styles.legendName}>{lv.name} · {lv.label}</span>
              <span className={styles.legendDesc}>{lv.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.footNote}>
        Auditor: {AUDIT_INFO.auditor} · Auditee: {AUDIT_INFO.auditee}.
        Metode: {AUDIT_INFO.metode}.
        Level kapabilitas diturunkan dari hasil kuesioner (data primer), sehingga hasil audit dan rekap
        kuesioner menjadi satu acuan yang konsisten: BAI02 = 3,75 (L4), BAI03 = 4,00 (L4), BAI07 = 3,75 (L4).
        Target seluruh proses ditetapkan pada Level 5 (Optimizing) sebagai arah pengembangan berkelanjutan,
        sehingga tetap terdapat gap yang menjadi acuan analisis perkembangan Sistem SKPI. Level dapat
        disesuaikan manual dan perubahan tersimpan otomatis di perangkat ini.
        Skala mengacu pada model kapabilitas proses COBIT 2019 (Level 0 – 5).
      </p>
    </div>
  );
}