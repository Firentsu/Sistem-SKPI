import "dotenv/config";
import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import session      from "express-session";
import MySQLStore   from "express-mysql-session";

// ── Routes admin ────────────────────────────────────────────
import authRoutes       from "./src/routes/auth.js";
import adminRoutes      from "./src/routes/admin.js";
import aktivitasRoutes  from "./src/routes/aktivitas.js";
import skpiRoutes       from "./src/routes/skpi.js";
import masterDataRoutes from "./src/routes/masterData.js";
import icpRoutes        from "./src/routes/icp.js";

// ── Routes mahasiswa ────────────────────────────────────────
import mahasiswaAuthRoutes       from "./src/routes/mahasiswaAuth.js";
import mahasiswaRoutes           from "./src/routes/mahasiswa.js";
import mahasiswaKegiatanRoutes   from "./src/routes/mahasiswaKegiatan.js";
import mahasiswaPengajuanRoutes  from "./src/routes/mahasiswaPengajuan.js";
import mahasiswaMasterDataRoutes from "./src/routes/mahasiswaMasterData.js";

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MySQL Session Store ─────────────────────────────────────
const SessionStore = MySQLStore(session);

const sessionStore = new SessionStore({
  host:                    process.env.DB_HOST     || "localhost",
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:                    process.env.DB_USER     || "root",
  password:                process.env.DB_PASSWORD || "",
  database:                process.env.DB_NAME     || "skpi_db",
  clearExpired:            true,
  checkExpirationInterval: 900_000,   // cek sesi expired setiap 15 menit
  expiration:              86_400_000, // sesi hidup 1 hari
  createDatabaseTable:     true,       // otomatis buat tabel sessions
});

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  name:              "skpi_session",
  secret:            process.env.SESSION_SECRET || "skpi-dev-secret",
  resave:            false,
  saveUninitialized: false,
  store:             sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   86_400_000,                             // 1 hari
    secure:   process.env.NODE_ENV === "production",
  },
}));

// Sajikan folder uploads
app.use("/uploads", express.static("public/uploads"));

// ── Routes admin (daftar semua) ─────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/aktivitas",   aktivitasRoutes);
app.use("/api/skpi",        skpiRoutes);
app.use("/api/master-data", masterDataRoutes);
app.use("/api/icp",         icpRoutes);

// ── Routes mahasiswa (spesifik dulu, umum belakangan) ───────
app.use("/api/mahasiswa/auth",        mahasiswaAuthRoutes);
app.use("/api/mahasiswa/kegiatan",    mahasiswaKegiatanRoutes);
app.use("/api/mahasiswa/pengajuan",   mahasiswaPengajuanRoutes);
app.use("/api/mahasiswa/master-data", mahasiswaMasterDataRoutes);
app.use("/api/mahasiswa",             mahasiswaRoutes);

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

// ── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n✅ SKPI Backend berjalan di http://localhost:${PORT}`);
  console.log(`   Auth     : Session-based (MySQL Store)`);
  console.log(`   Database : ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`   Admin    : /api/auth | /api/admin | /api/aktivitas | /api/skpi | /api/master-data | /api/icp`);
  console.log(`   Mahasiswa: /api/mahasiswa/auth | /api/mahasiswa/kegiatan | /api/mahasiswa/pengajuan\n`);
});