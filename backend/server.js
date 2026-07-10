import "dotenv/config";
import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import session      from "express-session";
import connectMySQL from "express-mysql-session";

// ── Routes admin ────────────────────────────────────────────
import authRoutes       from "./src/routes/auth.js";
import adminRoutes      from "./src/routes/admin.js";
import aktivitasRoutes  from "./src/routes/aktivitas.js";
import skpiRoutes       from "./src/routes/skpi.js";
import masterDataRoutes from "./src/routes/masterData.js";
import icpRoutes           from "./src/routes/icp.js";
import templateSkpiRoutes  from "./src/routes/templateSkpi.js";
import sicpSyncRoutes      from "./src/routes/sicpSync.js";

// ── Routes mahasiswa ────────────────────────────────────────
import mahasiswaAuthRoutes       from "./src/routes/mahasiswaAuth.js";
import mahasiswaRoutes           from "./src/routes/mahasiswa.js";
import mahasiswaKegiatanRoutes   from "./src/routes/mahasiswaKegiatan.js";
import mahasiswaPengajuanRoutes  from "./src/routes/mahasiswaPengajuan.js";
import mahasiswaMasterDataRoutes   from "./src/routes/mahasiswaMasterData.js";
import mahasiswaNotifikasiRoutes   from "./src/routes/mahasiswaNotifikasi.js";

// -- Routes dokumentasi -------
import dokumentasiRoutes from "./src/routes/dokumentasi.js";

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

// Di belakang reverse proxy Railway (TLS di-terminate di proxy). Wajib agar
// cookie `secure` bisa di-set dan req.protocol terbaca sebagai https.
app.set("trust proxy", 1);

// ── MySQL Session Store ─────────────────────────────────────
// FIX: gunakan pola default export yang kompatibel dengan ES modules
const MySQLStore   = connectMySQL(session);
const sessionStore = new MySQLStore({
  host:                    process.env.DB_HOST     || "localhost",
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:                    process.env.DB_USER     || "root",
  password:                process.env.DB_PASSWORD || "",
  database:                process.env.DB_NAME     || "skpi_db",
  clearExpired:            true,
  checkExpirationInterval: 900_000,    // cek sesi expired setiap 15 menit
  expiration:              86_400_000, // sesi hidup 1 hari
  createDatabaseTable:     true,       // otomatis buat tabel sessions jika belum ada
  schema: {
    tableName:   "sessions",
    columnNames: {
      session_id: "session_id",
      expires:    "expires",
      data:       "data",
    },
  },
});

// Tangkap error session store agar tidak crash diam-diam
sessionStore.on("error", (err) => {
  console.error("❌ Session store error:", err.message);
});

// ── Middleware ──────────────────────────────────────────────
// FRONTEND_URL boleh berisi beberapa URL dipisah koma
// (mis. URL produksi + http://localhost:3000 untuk dev).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Izinkan request tanpa Origin (curl, health check) & origin terdaftar
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
  },
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
    // Cross-site (frontend & backend beda domain Railway) → wajib "none" + secure.
    // Di dev (http localhost) pakai "lax" + non-secure.
    sameSite: isProd ? "none" : "lax",
    secure:   isProd,
    maxAge:   86_400_000,                            // 1 hari
  },
}));

// Sajikan folder uploads (cache 1 jam agar PDF loading cepat)
app.use("/uploads", express.static("public/uploads", { maxAge: "1h" }));

// ── Routes admin ─────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/aktivitas",   aktivitasRoutes);
app.use("/api/skpi",        skpiRoutes);
app.use("/api/master-data",    masterDataRoutes);
app.use("/api/template-skpi", templateSkpiRoutes);
app.use("/api/icp",         icpRoutes);
app.use("/api/sicp-sync",   sicpSyncRoutes);

// ── Routes mahasiswa (spesifik dulu, umum belakangan) ────────
app.use("/api/mahasiswa/auth",        mahasiswaAuthRoutes);
app.use("/api/mahasiswa/notifikasi",  mahasiswaNotifikasiRoutes);
app.use("/api/mahasiswa/kegiatan",    mahasiswaKegiatanRoutes);
app.use("/api/mahasiswa/pengajuan",   mahasiswaPengajuanRoutes);
app.use("/api/mahasiswa/master-data", mahasiswaMasterDataRoutes);
app.use("/api/mahasiswa",             mahasiswaRoutes);

// Dokumentasi ----------------------------------
app.use("/api/dokumentasi", dokumentasiRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});




// ── Start server ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SKPI Backend berjalan di http://localhost:${PORT}`);
  console.log(`   Auth     : Session-based (MySQL Store)`);
  console.log(`   Database : ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`   Admin    : /api/auth | /api/admin | /api/aktivitas | /api/skpi | /api/master-data | /api/icp`);
  console.log(`   Mahasiswa: /api/mahasiswa/auth | /api/mahasiswa/kegiatan | /api/mahasiswa/pengajuan`);
  console.log(`   Tailscale: /api/tailscale-sync/test | /api/tailscale-sync/mahasiswa | /api/tailscale-sync/icp | /api/tailscale-sync/both\n`);
});