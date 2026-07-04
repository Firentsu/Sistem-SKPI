/**
 * generateIcpChart.js — Membuat pie chart Pencapaian ICP sebagai PNG.
 * Dipakai untuk disisipkan ke dokumen SKPI (di bawah tabel ICP).
 */
import { createCanvas } from "@napi-rs/canvas";

// Warna per kategori (urutan sama dgn data): Fisik, Iman, Intelektualitas,
// Kepribadian, Keterampilan, Moral.
const COLORS = ["#e15759", "#4e79a7", "#59a14f", "#b07aa1", "#f28e2b", "#edc948"];

/**
 * @param {{label:string, value:number}[]} data
 * @returns {Buffer} PNG
 */
export function generateIcpChartPng(data) {
  const W = 900, H = 540;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#2c1a0e";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Grafik Pencapaian ICP", W / 2, 46);

  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  const cx = 285, cy = 300, r = 185;

  if (total <= 0) {
    ctx.fillStyle = "#9c7a5e";
    ctx.font = "22px Arial";
    ctx.fillText("Belum ada poin ICP", W / 2, H / 2);
    return canvas.toBuffer("image/png");
  }

  // ── Pie slices ──
  let ang = -Math.PI / 2;
  data.forEach((d, i) => {
    const v = Math.max(0, d.value);
    if (v <= 0) return;
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, ang, ang + slice);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Label nilai di tengah slice
    const mid = ang + slice / 2;
    const lx = cx + Math.cos(mid) * r * 0.62;
    const ly = cy + Math.sin(mid) * r * 0.62;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(v), lx, ly);

    ang += slice;
  });

  // ── Legend (kanan) ──
  const lx0 = 545, rowH = 52;
  const ly0 = cy - (data.length * rowH) / 2 + rowH / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  data.forEach((d, i) => {
    const y = ly0 + i * rowH;
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fillRect(lx0, y - 13, 28, 28);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(lx0, y - 13, 28, 28);
    ctx.fillStyle = "#2c1a0e";
    ctx.font = "22px Arial";
    ctx.fillText(`${d.label} (${Math.max(0, d.value)})`, lx0 + 42, y);
  });

  return canvas.toBuffer("image/png");
}
