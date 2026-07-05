const path = require("path")

require("dotenv").config({
  path: path.resolve(__dirname, ".env")
})

console.log("JWT_SECRET:", process.env.JWT_SECRET)

const app = require("./src/app")

const PORT = process.env.PORT || 5001

// app.listen(PORT, () => { // TANPA TAILSCALE
app.listen(PORT, "0.0.0.0", () => { // DENGAN TAILSCALE
  console.log(`SERVER RUNNING, STUDENT INTEGRITY CREDIT POINT (SICP) HAVE PORT: ${PORT}`)
  console.log(`EDITOR DETAIL BY:`)
  console.log(`1. JIMMY PERSON (BACKEND - NODE.JS EXPRESS)`)
  console.log(`2. EGI SAPUTRA (FRONTEND - REACT.JS)`)

  //Scheduler kegiatan (WIB): auto buka-tutup pendaftaran,
  //auto mulai & selesai kegiatan + reward icp sesuai jadwal.
  try {
    const kegiatanService = require("./src/modules/kegiatan/services/kegiatan.service")
    const tick = () => kegiatanService.runScheduler().catch(() => {})
    tick()
    setInterval(tick, 60 * 1000)
    console.log("[SCHEDULER] Kegiatan auto-jadwal aktif (interval 60s, WIB)")
  } catch (e) {
    console.error("[SCHEDULER] gagal start:", e.message)
  }
}) 