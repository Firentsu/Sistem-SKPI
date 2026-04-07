import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes     from "./src/routes/auth.js";
import adminRoutes    from "./src/routes/admin.js";
import mahasiswaRoutes from "./src/routes/mahasiswa.js";

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,               // izinkan cookie lintas origin
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sajikan folder public/uploads agar avatar bisa diakses
app.use("/uploads", express.static("public/uploads"));

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

// ── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ SKPI Backend berjalan di http://localhost:${PORT}`);
});
