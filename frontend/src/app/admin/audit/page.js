/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardCheck, ShieldCheck, Target, Layers, Gauge,
  ChevronDown, RotateCcw, CheckCircle2, AlertTriangle,
  Lightbulb, ListChecks, Info, TrendingUp, Upload, X,
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

const TARGET_LEVEL = 4;

// ============================================================
//  DATA AUDIT — DOMAIN BAI
// ============================================================
const PROCESSES = [
  {
    id: "BAI02",
    title: "Pengelolaan Definisi Kebutuhan",
    en: "Managed Requirements Definition",
    purpose:
      "Memastikan kebutuhan fungsional dan teknis dari sistem SKPI diidentifikasi, dianalisis, dan disetujui pemangku kepentingan (Prodi, BAAK, Mahasiswa) sehingga solusi yang dibangun sesuai dengan kebutuhan bisnis.",
    practices: [
      { id: "BAI02.01", name: "Menentukan & memelihara kebutuhan bisnis fungsional dan teknis", level: 3 },
      { id: "BAI02.02", name: "Melakukan studi kelayakan & merumuskan solusi alternatif", level: 2 },
      { id: "BAI02.03", name: "Mengelola risiko kebutuhan", level: 2 },
      { id: "BAI02.04", name: "Memperoleh persetujuan atas kebutuhan dan solusi", level: 3 },
    ],
    findings: [
      "Kebutuhan fungsional (input kegiatan, verifikasi, generate SKPI) sudah terdokumentasi, namun keterunutan (traceability) ke pengujian belum formal.",
      "Studi kelayakan dilakukan secara informal tanpa dokumen pembanding solusi alternatif.",
      "Persetujuan kebutuhan dari pemangku kepentingan belum tercatat dalam berita acara resmi.",
    ],
    recommendations: [
      "Susun Requirement Traceability Matrix (RTM) yang menautkan kebutuhan ke fitur & pengujian.",
      "Formalkan proses sign-off kebutuhan oleh Prodi/BAAK dalam dokumen persetujuan.",
      "Lakukan analisis risiko kebutuhan (mis. perubahan regulasi SKPI) secara berkala.",
    ],
  },
  {
    id: "BAI03",
    title: "Pengelolaan Identifikasi & Pembangunan Solusi",
    en: "Managed Solutions Identification and Build",
    purpose:
      "Memastikan solusi (aplikasi SKPI berbasis web) dirancang, dikembangkan, dan diuji sesuai desain arsitektur agar mendukung tujuan organisasi secara andal dan mudah dipelihara.",
    practices: [
      { id: "BAI03.01", name: "Merancang solusi tingkat tinggi (arsitektur)", level: 4 },
      { id: "BAI03.02", name: "Merancang komponen solusi terperinci (ERD, UI)", level: 3 },
      { id: "BAI03.03", name: "Mengembangkan komponen solusi", level: 4 },
      { id: "BAI03.04", name: "Memperoleh komponen solusi (library/dependensi)", level: 3 },
      { id: "BAI03.05", name: "Membangun solusi", level: 4 },
      { id: "BAI03.06", name: "Melakukan penjaminan mutu (Quality Assurance)", level: 2 },
      { id: "BAI03.07", name: "Menyiapkan pengujian solusi", level: 2 },
      { id: "BAI03.08", name: "Melaksanakan pengujian solusi", level: 3 },
      { id: "BAI03.09", name: "Mengelola perubahan kebutuhan", level: 3 },
      { id: "BAI03.10", name: "Memelihara solusi", level: 2 },
      { id: "BAI03.11", name: "Menentukan layanan TI & memelihara portofolio layanan", level: 3 },
      { id: "BAI03.12", name: "Merancang solusi berdasarkan metodologi pengembangan", level: 3 },
    ],
    findings: [
      "Desain sistem (arsitektur, ERD, use case) tersedia, konsisten, dan diimplementasikan dengan baik.",
      "Pengujian dilakukan manual dan belum tersistematis — belum ada test case & prosedur QA terdokumentasi.",
      "Pemeliharaan solusi masih bersifat reaktif (perbaikan saat ada laporan bug).",
    ],
    recommendations: [
      "Terapkan QA terstruktur dengan test plan dan test case yang terdokumentasi.",
      "Tambahkan pengujian otomatis (unit/integration test) pada modul kritis.",
      "Susun jadwal pemeliharaan preventif dan changelog versi aplikasi.",
    ],
  },
  {
    id: "BAI07",
    title: "Pengelolaan Penerimaan Perubahan & Transisi TI",
    en: "Managed IT Change Acceptance and Transitioning",
    purpose:
      "Memastikan solusi SKPI diterima pengguna (UAT), dirilis ke lingkungan produksi secara terkendali, dan ditinjau pasca-implementasi untuk meminimalkan gangguan layanan.",
    practices: [
      { id: "BAI07.01", name: "Menetapkan rencana implementasi", level: 3 },
      { id: "BAI07.02", name: "Merencanakan konversi proses bisnis, sistem & data", level: 2 },
      { id: "BAI07.03", name: "Merencanakan pengujian penerimaan (UAT)", level: 2 },
      { id: "BAI07.04", name: "Menetapkan lingkungan pengujian", level: 2 },
      { id: "BAI07.05", name: "Melaksanakan pengujian penerimaan", level: 3 },
      { id: "BAI07.06", name: "Mempromosikan ke produksi & mengelola rilis", level: 3 },
      { id: "BAI07.07", name: "Menyediakan dukungan produksi awal", level: 2 },
      { id: "BAI07.08", name: "Melakukan tinjauan pasca-implementasi", level: 1 },
    ],
    findings: [
      "Rencana implementasi tersedia, namun hasil UAT belum terdokumentasi dengan kriteria penerimaan yang jelas.",
      "Lingkungan pengujian belum sepenuhnya terpisah dari lingkungan produksi.",
      "Belum ada tinjauan pasca-implementasi (post-implementation review) formal setelah rilis.",
    ],
    recommendations: [
      "Dokumentasikan rencana & hasil UAT beserta kriteria penerimaan yang terukur.",
      "Pisahkan lingkungan staging dan produksi untuk mengurangi risiko rilis.",
      "Lakukan post-implementation review terjadwal untuk mengevaluasi keberhasilan rilis.",
    ],
  },
];

const STORAGE_KEY = "cobit-audit-skpi-bai";

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

// ============================================================
//  KOMPONEN UTAMA
// ============================================================
export default function AuditPage() {
  const [levels, setLevels] = useState(buildDefaultLevels);
  const [expanded, setExpanded] = useState("BAI02");
  const [hydrated, setHydrated] = useState(false);

  // State untuk import CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

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
  }, []);

  // ── Hitung rata-rata kapabilitas per proses ──
  const processScores = useMemo(() => {
    return PROCESSES.map((p) => {
      const vals = p.practices.map((pr) => levels[pr.id] ?? pr.level);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { id: p.id, title: p.title, avg, gap: TARGET_LEVEL - avg };
    });
  }, [levels]);

  const overall = useMemo(() => {
    const avg = processScores.reduce((a, b) => a + b.avg, 0) / processScores.length;
    return Math.round(avg * 100) / 100;
  }, [processScores]);

  const totalPractices = useMemo(
    () => PROCESSES.reduce((a, p) => a + p.practices.length, 0),
    []
  );

  const radarData = useMemo(
    () => processScores.map((s) => ({
      subject: s.id,
      "Kapabilitas Saat Ini": Math.round(s.avg * 100) / 100,
      "Target": TARGET_LEVEL,
    })),
    [processScores]
  );

  // ── Import CSV ──────────────────────────────────────────────
  const handleImportCSV = useCallback(() => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter(line => line.trim() !== "");
        if (lines.length < 2) throw new Error("File kosong atau hanya header");
        const headers = lines[0].split(",").map(h => h.trim());
        if (headers.length < 2 || headers[0] !== "practice_id" || headers[1] !== "level") {
          throw new Error("Format header harus: practice_id,level");
        }
        const data = lines.slice(1).map(line => {
          const cols = line.split(",").map(c => c.trim());
          return {
            practice_id: cols[0],
            level: parseInt(cols[1], 10),
          };
        });

        const newLevels = {};
        let valid = true;
        data.forEach(item => {
          if (item.practice_id && !isNaN(item.level) && item.level >= 0 && item.level <= 5) {
            newLevels[item.practice_id] = item.level;
          } else {
            valid = false;
          }
        });

        if (!valid) {
          setImportStatus({ type: 'error', msg: 'Format CSV tidak valid. Pastikan kolom: practice_id,level' });
          return;
        }

        setLevels(prev => ({ ...prev, ...newLevels }));
        setImportStatus({ type: 'success', msg: `Berhasil import ${Object.keys(newLevels).length} praktik` });
        setTimeout(() => setImportStatus(null), 3000);
        setShowImportModal(false);
        setImportFile(null);
      } catch (err) {
        setImportStatus({ type: 'error', msg: 'Gagal membaca file: ' + err.message });
      }
    };
    reader.readAsText(importFile);
  }, [importFile]);

  return (
    <div className={styles.container}>
      {/* ══════════ HEADER ══════════ */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <ClipboardCheck size={26} className={styles.titleIcon} />
            Audit Tata Kelola TI
          </h1>
          <p className={styles.subtitle}>
            Evaluasi kapabilitas sistem SKPI menggunakan kerangka kerja{" "}
            <strong>COBIT 2019</strong> — Domain <strong>BAI (Build, Acquire and Implement)</strong>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.importBtn} onClick={() => setShowImportModal(true)}>
            <Upload size={15} /> Import Kuesioner
          </button>
          <button className={styles.resetBtn} onClick={resetAssessment} title="Kembalikan ke penilaian awal">
            <RotateCcw size={15} /> Reset Penilaian
          </button>
        </div>
      </div>

      {/* ══════════ KARTU INFORMASI KERANGKA ══════════ */}
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
            <span className={styles.infoValue}>Level {TARGET_LEVEL} — Predictable</span>
          </div>
        </div>
      </div>

      {/* ══════════ RINGKASAN + RADAR ══════════ */}
      <div className={styles.summaryGrid}>
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
            <div className={styles.scoreBarTarget} style={{ left: `${(TARGET_LEVEL / 5) * 100}%` }} title={`Target: Level ${TARGET_LEVEL}`} />
          </div>
          <div className={styles.scoreMeta}>
            <span><strong>{PROCESSES.length}</strong> Proses</span>
            <span><strong>{totalPractices}</strong> Praktik Manajemen</span>
            <span className={styles.scoreGap}>
              <TrendingUp size={12} /> Gap {(TARGET_LEVEL - overall).toFixed(2)}
            </span>
          </div>
        </div>

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
              <div className={styles.procBarTarget} style={{ left: `${(TARGET_LEVEL / 5) * 100}%` }} />
            </div>
            <div className={styles.procGap}>
              {s.gap <= 0
                ? <span className={styles.gapOk}><CheckCircle2 size={12} /> Target tercapai</span>
                : <span className={styles.gapWarn}><AlertTriangle size={12} /> Gap {s.gap.toFixed(2)} ke target</span>}
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

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.colId}>Kode</th>
                        <th>Praktik Manajemen</th>
                        <th className={styles.colLevel}>Tingkat Kapabilitas (0 – 5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.practices.map((pr) => {
                        const val = levels[pr.id] ?? pr.level;
                        return (
                          <tr key={pr.id}>
                            <td className={styles.colId}><code>{pr.id}</code></td>
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
        Penilaian bersifat mandiri (self‑assessment) dan tersimpan otomatis di perangkat ini.
        Skala mengacu pada model kapabilitas proses COBIT 2019 (Level 0 – 5).
      </p>

      {/* ══════════ MODAL IMPORT CSV ══════════ */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Import Hasil Kuesioner</h3>
              <button className={styles.modalClose} onClick={() => setShowImportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>
                Unggah file CSV dengan format:
              </p>
              <div className={styles.csvFormatBox}>
                <code>practice_id,level</code>
                <br />
                <small>Contoh: <br />BAI02.01,3<br />BAI02.02,2</small>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className={styles.fileInput}
              />
              {importStatus && (
                <div className={`${styles.importStatus} ${importStatus.type === 'success' ? styles.importSuccess : styles.importError}`}>
                  {importStatus.msg}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowImportModal(false)}>Batal</button>
              <button className={styles.btnImport} onClick={handleImportCSV} disabled={!importFile}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}