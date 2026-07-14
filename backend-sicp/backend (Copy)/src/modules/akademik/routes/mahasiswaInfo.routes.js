const express = require("express")
const router = express.Router()

const controller = require("../controllers/mahasiswaInfo.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// ============================================================================
// /api/mahasiswa-info  (NEW)
// ----------------------------------------------------------------------------
// Untuk role mahasiswa — lihat profile & kelas akademik yang diikuti.
//   GET /profile  → profil akademik (nim, nama, jurusan, angkatan, motto, dll)
//   GET /kelas    → daftar kelas yg diikuti (default semester aktif)
//                   query opsional: ?semester_id=N atau ?all_sem=1
// ============================================================================

router.use(auth, role(["mahasiswa"]))
router.get("/profile", controller.profile)
router.get("/kelas",   controller.myKelas)

module.exports = router
