const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

// ===============================
// AUTH & USER
app.use("/api/auth", require("./modules/auth/routes/auth.routes"))
app.use("/api/users", require("./modules/user/routes/user.routes"))
app.use("/api/role-management", require("./modules/user/routes/roleManagement.routes"))

// ===============================
// ICP CORE
app.use("/api/icp/pengajuan", require("./modules/icp/routes/icpPengajuan.routes"))
app.use("/api/icp/approval", require("./modules/icp/routes/icpApproval.routes"))
app.use("/api/icp/balance", require("./modules/icp/routes/icpBalance.routes"))
app.use("/api/icp/validation", require("./modules/icp/routes/icpValidation.routes"))
app.use("/api/icp/ranking", require("./modules/icp/routes/icpRanking.routes"))

// ICP by ROLE
app.use("/api/icp/dosen", require("./modules/icp/routes/icpDosen.routes"))
app.use("/api/icp/admin", require("./modules/icp/routes/icpAdmin.routes"))
app.use("/api/icp/super", require("./modules/icp/routes/icpSuper.routes"))

// ===============================
// ICP SUPPORT (Postman: hyphen paths)
app.use("/api/icp-potongan", require("./modules/potongan/routes/icpPotongan.routes"))
app.use("/api/potongan-limit", require("./modules/potongan/routes/potonganLimit.routes"))
app.use("/api/dosen-info", require("./modules/akademik/routes/dosenInfo.routes"))
app.use("/api/mahasiswa-info", require("./modules/akademik/routes/mahasiswaInfo.routes"))
app.use("/api/dosen-management", require("./modules/user/routes/dosenManagement.routes"))
app.use("/api/unit-management", require("./modules/unit/routes/unitManagement.routes"))
app.use("/api/icp-transaction", require("./modules/icp/routes/icpTransaction.routes"))
app.use("/api/icp/debt", require("./modules/icp/routes/icpDebt.routes"))

// ===============================
// MASTER DATA
app.use("/api/unit", require("./modules/unit/routes/unit.routes"))
app.use("/api/user-limit", require("./modules/unit/routes/userLimit.routes"))
app.use("/api/kategori", require("./modules/akademik/routes/kategori.routes"))
app.use("/api/semester", require("./modules/akademik/routes/semester.routes"))
app.use("/api/jurusan", require("./modules/akademik/routes/jurusan.routes"))
app.use("/api/mata-kuliah", require("./modules/akademik/routes/mataKuliah.routes"))
app.use("/api/informasi", require("./modules/informasi/routes/informasi.routes"))

// ===============================
// KEGIATAN & PANITIA
app.use("/api/kegiatan", require("./modules/kegiatan/routes/kegiatan.routes"))
app.use("/api/panitia", require("./modules/kegiatan/routes/panitia.routes"))
app.use("/api/divisi", require("./modules/kegiatan/routes/divisi.routes"))
app.use("/api/panitia", require("./modules/kegiatan/routes/panitiaPendaftaran.routes"))

// ===============================
// SYSTEM & DASHBOARD
app.use("/api/system", require("./modules/system/routes/system.routes"))
app.use("/api/dashboard", require("./modules/dashboard/routes/dashboard.routes"))
app.use("/api/audit", require("./modules/audit/routes/audit.routes"))
app.use("/api/riwayat", require("./modules/riwayat/routes/riwayat.routes"))
app.use("/api/pengajuan-edit", require("./modules/icp/routes/pengajuanSelfEdit.routes"))

// ===============================
// 🆕 UPGRADE V3 — Tier 1, 4, 5
app.use("/api/jurusan-management", require("./modules/user/routes/jurusanManagement.routes"))
app.use("/api/import", require("./modules/import/routes/import.routes"))

// ===============================
app.get("/", (req, res) => {
  res.json({ success: true, message: "SICP API v2.3 RUNNING (Hardened)" })
})

// ===============================
// 📘 SCALAR API DOCS — tampil di http://localhost:5001/docs
// HARUS sebelum 404 handler agar tidak tertangkap.
const { apiReference } = require("@scalar/express-api-reference")
const openapiSpec = require("./openapi.json")

app.get("/openapi.json", (req, res) => res.json(openapiSpec))

app.use(
  "/docs",
  apiReference({
    theme: "purple",
    spec: { content: openapiSpec }
  })
)

// ===============================
// 404 — endpoint tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan"
  })
})

// ===============================
// 🔥 GLOBAL ERROR HANDLER (SAFETY NET)
// Menangkap unhandled error dari middleware/route agar server tidak crash
// dan response tetap konsisten { success, message }.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[UNHANDLED ERROR]", err && err.stack ? err.stack : err)

  const status = err && err.status ? err.status : 500

  res.status(status).json({
    success: false,
    message:
      (err && err.message) ||
      "Internal server error"
  })
})

module.exports = app 