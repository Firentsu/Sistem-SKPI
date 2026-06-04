"use client";

import { useState, useCallback, useEffect } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  TrendingUp, Trophy, Medal, Award, AlertCircle,
  RefreshCw, Info, CheckCircle,
} from "lucide-react";
import styles from "./icp.module.css";
import { getMahasiswaIcp } from "@/lib/api";

const MIN_ICP = 100;

function getIcpLevel(poin) {
  if (poin >= 200) return { label: "Gold",   color: "#ca8a04", bg: "#fef9c3", border: "#fde047", Icon: Trophy,       emoji: "🏆", next: null,  nextLabel: "Tertinggi" };
  if (poin >= 150) return { label: "Silver", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", Icon: Medal,        emoji: "🥈", next: 200,   nextLabel: "Gold" };
  if (poin >= 100) return { label: "Bronze", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", Icon: Award,        emoji: "🥉", next: 150,   nextLabel: "Silver" };
  return           { label: "Belum",  color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", Icon: AlertCircle, emoji: "⏳", next: 100,   nextLabel: "Bronze" };
}

const ICP_READY = !!(process.env.NEXT_PUBLIC_ICP_API_URL);

export default function IcpPage() {
  const { prodiConfig } = useMahasiswa();

  const [icpData, setIcpData] = useState({ total_poin: 0, detail: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMahasiswaIcp();
      setIcpData(data ?? { total_poin: 0, detail: [] });
    } catch {
      setIcpData({ total_poin: 0, detail: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "ICP | SKPI Mahasiswa";
    loadData();
  }, [loadData]);

  const total    = icpData.total_poin ?? 0;
  const detail   = icpData.detail ?? [];
  const level    = getIcpLevel(total);
  const LevelIcon = level.Icon;

  // Progress ke level berikutnya
  const progressBase  = level.label === "Belum" ? 0 : level.label === "Bronze" ? 100 : level.label === "Silver" ? 150 : 200;
  const progressNext  = level.next;
  const progressPct   = progressNext
    ? Math.min(100, Math.round(((total - progressBase) / (progressNext - progressBase)) * 100))
    : 100;

  // Progress bar segments (0→100→150→200)
  const seg1Pct = Math.min(100, Math.round((Math.min(total, 100) / 100) * 100));
  const seg2Pct = total >= 100 ? Math.min(100, Math.round(((Math.min(total, 150) - 100) / 50) * 100)) : 0;
  const seg3Pct = total >= 150 ? Math.min(100, Math.round(((Math.min(total, 200) - 150) / 50) * 100)) : 0;

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}><TrendingUp size={20} /></div>
          <div>
            <h1 className={styles.title}>ICP Saya</h1>
            <p className={styles.subtitle}>Integrity Credit Point — rekam jejak poin integritas mahasiswa</p>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={loadData} disabled={loading} title="Refresh">
          <RefreshCw size={15} className={loading ? styles.spinIcon : ""} />
        </button>
      </div>

      {!ICP_READY && (
        <div style={{
          background: "#fff7ed", border: "1.5px solid #fed7aa",
          borderRadius: 12, padding: "14px 18px",
          display: "flex", alignItems: "flex-start", gap: 12,
          fontSize: 13, color: "#92400e",
        }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Sistem ICP belum terhubung.</strong>{" "}
            Data akan tampil otomatis setelah sistem Integrity Credit Point selesai di-hosting.
            Hubungi admin untuk informasi lebih lanjut.
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrap}>
          <RefreshCw size={22} className={styles.spinIcon} />
          <span>Memuat data ICP…</span>
        </div>
      ) : (
        <>
          {/* ── Level Hero Card ── */}
          <div className={styles.levelCard}>
            <div
              className={styles.levelIconWrap}
              style={{ background: level.bg, border: `2px solid ${level.border}` }}
            >
              <LevelIcon size={36} color={level.color} />
            </div>
            <div className={styles.levelBody}>
              <div className={styles.levelName} style={{ color: level.color }}>
                Level {level.label}
              </div>
              <p className={styles.levelDesc}>
                {level.label === "Gold"   && "Anda telah mencapai level tertinggi. Luar biasa!"}
                {level.label === "Silver" && "Pencapaian luar biasa! Terus tingkatkan untuk meraih Gold."}
                {level.label === "Bronze" && "Selamat! Anda telah memenuhi syarat minimum pengajuan SKPI."}
                {level.label === "Belum"  && "Terus kumpulkan poin untuk mencapai level Bronze dan memenuhi syarat SKPI."}
              </p>
              <div
                className={styles.levelBadge}
                style={{ background: level.bg, color: level.color, borderColor: level.border }}
              >
                <LevelIcon size={12} />
                {level.label === "Belum" ? "Belum Memenuhi Syarat" : `${level.label} Achievement`}
              </div>
            </div>
            <div className={styles.levelRight}>
              <div className={styles.poinValue} style={{ color: level.color }}>{total}</div>
              <div className={styles.poinLabel}>Total Poin ICP</div>
            </div>
          </div>

          {/* ── Progress Levels ── */}
          <div className={styles.progressCard}>
            <p className={styles.progressTitle}>Progress Level ICP</p>
            <div className={styles.levelTrack}>
              {/* Milestone: Start */}
              <div className={styles.levelMilestone}>
                <div className={styles.milestoneCircle}
                  style={{ background: total >= 0 ? "#dcfce7" : "#f5f0eb", borderColor: total >= 0 ? "#047857" : "#e8d5c4", color: "#047857" }}>
                  {total >= 0 ? <CheckCircle size={14} /> : "0"}
                </div>
                <span className={styles.milestoneLabel} style={{ color: "#047857" }}>Start</span>
                <span className={styles.milestonePoin}>0 poin</span>
              </div>

              {/* Bar: 0 → 100 (Bronze) */}
              <div className={styles.trackBar}>
                <div className={styles.trackFill}
                  style={{ width: `${seg1Pct}%`, background: "#92400e" }} />
              </div>

              {/* Milestone: Bronze (100) */}
              <div className={styles.levelMilestone}>
                <div className={styles.milestoneCircle}
                  style={{ background: total >= 100 ? "#fef3c7" : "#f5f0eb", borderColor: total >= 100 ? "#fcd34d" : "#e8d5c4", color: total >= 100 ? "#92400e" : "#b09880" }}>
                  {total >= 100 ? <Award size={13} /> : "B"}
                </div>
                <span className={styles.milestoneLabel} style={{ color: total >= 100 ? "#92400e" : "#b09880" }}>Bronze</span>
                <span className={styles.milestonePoin}>100 poin</span>
              </div>

              {/* Bar: 100 → 150 (Silver) */}
              <div className={styles.trackBar}>
                <div className={styles.trackFill}
                  style={{ width: `${seg2Pct}%`, background: "#2563eb" }} />
              </div>

              {/* Milestone: Silver (150) */}
              <div className={styles.levelMilestone}>
                <div className={styles.milestoneCircle}
                  style={{ background: total >= 150 ? "#dbeafe" : "#f5f0eb", borderColor: total >= 150 ? "#93c5fd" : "#e8d5c4", color: total >= 150 ? "#2563eb" : "#b09880" }}>
                  {total >= 150 ? <Medal size={13} /> : "S"}
                </div>
                <span className={styles.milestoneLabel} style={{ color: total >= 150 ? "#2563eb" : "#b09880" }}>Silver</span>
                <span className={styles.milestonePoin}>150 poin</span>
              </div>

              {/* Bar: 150 → 200 (Gold) */}
              <div className={styles.trackBar}>
                <div className={styles.trackFill}
                  style={{ width: `${seg3Pct}%`, background: "#ca8a04" }} />
              </div>

              {/* Milestone: Gold (200) */}
              <div className={styles.levelMilestone}>
                <div className={styles.milestoneCircle}
                  style={{ background: total >= 200 ? "#fef9c3" : "#f5f0eb", borderColor: total >= 200 ? "#fde047" : "#e8d5c4", color: total >= 200 ? "#ca8a04" : "#b09880" }}>
                  {total >= 200 ? <Trophy size={13} /> : "G"}
                </div>
                <span className={styles.milestoneLabel} style={{ color: total >= 200 ? "#ca8a04" : "#b09880" }}>Gold</span>
                <span className={styles.milestonePoin}>200 poin</span>
              </div>
            </div>

            {level.next && (
              <p style={{ fontSize: 12.5, color: "#9c7a5e", margin: 0 }}>
                Butuh <strong style={{ color: level.color }}>{level.next - total} poin</strong> lagi untuk mencapai level <strong>{level.nextLabel}</strong>.
              </p>
            )}
            {!level.next && (
              <p style={{ fontSize: 12.5, color: "#047857", margin: 0, fontWeight: 600 }}>
                ✓ Anda telah mencapai level tertinggi (Gold).
              </p>
            )}
          </div>

          {/* ── Stats Row ── */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: level.color }}>{total}</span>
              <span className={styles.statLabel}>Total Poin ICP</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: total >= MIN_ICP ? "#047857" : "#dc2626" }}>
                {total >= MIN_ICP ? "Ya" : "Belum"}
              </span>
              <span className={styles.statLabel}>Syarat Minimum SKPI (100 poin)</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: "#765439" }}>{detail.length || "—"}</span>
              <span className={styles.statLabel}>Komponen ICP</span>
            </div>
          </div>

          {/* ── Detail Komponen ── */}
          {detail.length > 0 && (
            <div className={styles.detailCard}>
              <h3 className={styles.detailTitle}>Detail Komponen ICP</h3>
              <div style={{ overflowX: "auto" }}>
                <table className={styles.detailTable}>
                  <thead>
                    <tr>
                      <th>Komponen</th>
                      <th>Poin</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.nama || item.komponen || `Komponen ${idx + 1}`}</td>
                        <td>
                          <span style={{
                            fontWeight: 700, color: prodiConfig.primary,
                            background: `${prodiConfig.primary}14`,
                            padding: "3px 10px", borderRadius: 20, fontSize: 12.5,
                          }}>
                            {item.poin ?? item.nilai ?? 0} poin
                          </span>
                        </td>
                        <td style={{ color: "#765439", fontSize: 12.5 }}>
                          {item.keterangan || item.deskripsi || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Info tentang ICP ── */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>
              <Info size={16} color="#c8945a" />
              Tentang Integrity Credit Point (ICP)
            </h3>
            <ul className={styles.infoList}>
              <li className={styles.infoItem}>
                <span className={styles.infoDot} />
                ICP (Integrity Credit Point) adalah sistem poin integritas yang mengukur pencapaian dan karakter mahasiswa di luar akademik.
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoDot} />
                Poin ICP dikumpulkan melalui kegiatan kemahasiswaan, organisasi, kepemimpinan, dan pengembangan diri.
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoDot} />
                Minimal <strong>100 poin (Bronze)</strong> diperlukan untuk mengajukan SKPI.
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoDot} />
                Level: <strong style={{ color: "#92400e" }}>Bronze</strong> (100 poin) →{" "}
                <strong style={{ color: "#2563eb" }}>Silver</strong> (150 poin) →{" "}
                <strong style={{ color: "#ca8a04" }}>Gold</strong> (200 poin).
              </li>
              <li className={styles.infoItem}>
                <span className={styles.infoDot} />
                Hubungi admin atau pembimbing akademik untuk informasi lebih lanjut tentang poin ICP Anda.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
