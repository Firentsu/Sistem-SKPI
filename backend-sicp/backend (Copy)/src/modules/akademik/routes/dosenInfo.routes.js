const express = require("express")
const router = express.Router()

const controller = require("../controllers/dosenInfo.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// ============================================================================
// /api/dosen-info  (FINAL — multi-role aware)
// ----------------------------------------------------------------------------
// Endpoint ini terbuka untuk staff (dosen / admin / super_admin).
// Untuk admin + super_admin yang juga ber-role 'dosen' (multi-role) →
//   akan mendapatkan data kelas/mahasiswa via tabel dosen.
// Untuk admin tanpa role dosen → /units & /jurusan tetap berfungsi
//   (sumber dari user_kategori_access.unit_id & admin_profile.jurusan_id).
//   Endpoint /kelas & /mahasiswa akan return [] / 4xx.
// ============================================================================

router.use(auth, role(["dosen", "admin", "super_admin"]))

router.get("/profile",                 controller.profile)
router.get("/units",                   controller.myUnits)
router.get("/jurusan",                 controller.myJurusan)
router.get("/kategori-access",         controller.myKategoriAccess)
router.get("/kelas",                   controller.myKelas)
router.get("/kelas/:kelas_id/mahasiswa", controller.mahasiswaInKelas)

module.exports = router
