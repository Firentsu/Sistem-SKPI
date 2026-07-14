"use client";

/**
 * AktivitasStatusChart — column chart jumlah kegiatan per status verifikasi
 * (Diproses / Disetujui / Revisi / Ditolak) untuk halaman Aktivitas admin.
 * Warna = warna status resmi aplikasi, tiap batang juga dilabeli di sumbu-X
 * sehingga identitas tidak bergantung pada warna saja.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { BarChart3 } from "lucide-react";
import styles from "./StatChart.module.css";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel} style={{ color: d.color }}>{d.label}</p>
      <p className={styles.tooltipVal}>{d.value} kegiatan</p>
    </div>
  );
}

export default function AktivitasStatusChart({ data = [], accent = "#765439" }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headIcon} style={{ background: `${accent}18`, color: accent }}>
          <BarChart3 size={18} />
        </div>
        <div>
          <p className={styles.title}>Distribusi Status Verifikasi Kegiatan</p>
          <p className={styles.sub}>Perbandingan jumlah kegiatan berdasarkan status verifikasi</p>
        </div>
      </div>

      {total === 0 ? (
        <div className={styles.empty}>
          <BarChart3 size={30} />
          <span>Belum ada kegiatan untuk ditampilkan pada grafik.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }} barCategoryGap="26%">
            <CartesianGrid vertical={false} stroke="#f0ebe4" />
            <XAxis
              dataKey="label" tickLine={false} axisLine={{ stroke: "#e7ddd2" }}
              tick={{ fontSize: 12, fill: "#8a7a6b" }}
            />
            <YAxis
              allowDecimals={false} tickLine={false} axisLine={false}
              tick={{ fontSize: 11, fill: "#a89a8c" }} width={34}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(118,84,57,0.06)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
              <LabelList
                dataKey="value" position="top"
                style={{ fontSize: 11, fontWeight: 700, fill: "#6b5a49" }}
                formatter={(v) => (v > 0 ? v : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
