"use client";

/**
 * KegiatanKategoriChart — column chart jumlah kegiatan mahasiswa per kategori SKPI.
 * Satu seri (jumlah) di 9 kategori → satu warna (warna prodi), sumbu-X = nomor
 * kategori (1–9), nama lengkap muncul di tooltip.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { BarChart3 } from "lucide-react";
import styles from "./StatChart.module.css";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{d.no}. {d.label}</p>
      <p className={styles.tooltipVal}>{d.count} kegiatan</p>
    </div>
  );
}

export default function KegiatanKategoriChart({ kegiatan = [], categories = [], color = "#765439" }) {
  const data = categories.map((k) => ({
    no: k.no,
    label: k.label,
    count: kegiatan.filter((g) => g.kategori_skpi === k.id).length,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headIcon} style={{ background: `${color}18`, color }}>
          <BarChart3 size={18} />
        </div>
        <div>
          <p className={styles.title}>Distribusi Kegiatan per Kategori SKPI</p>
          <p className={styles.sub}>Jumlah kegiatan yang Anda input di tiap kategori (nomor 1–9)</p>
        </div>
      </div>

      {total === 0 ? (
        <div className={styles.empty}>
          <BarChart3 size={30} />
          <span>Belum ada kegiatan untuk ditampilkan pada grafik.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="#f0ebe4" />
            <XAxis
              dataKey="no" tickLine={false} axisLine={{ stroke: "#e7ddd2" }}
              tick={{ fontSize: 12, fill: "#8a7a6b" }}
            />
            <YAxis
              allowDecimals={false} tickLine={false} axisLine={false}
              tick={{ fontSize: 11, fill: "#a89a8c" }} width={34}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(118,84,57,0.06)" }} />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={46}>
              <LabelList
                dataKey="count" position="top"
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
