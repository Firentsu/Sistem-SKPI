const express = require("express")
const router = express.Router()

const controller = require("../controllers/dosenManagement.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// ============================================================================
// /api/dosen-management
// ----------------------------------------------------------------------------
// Helper endpoint untuk Super Admin / Admin Akses-Super:
//   - Promote akun (admin/SA) jadi dosen dgn isi NIDN sekaligus
//   - Assign dosen ke unit / jurusan
//   - Assign mata kuliah / kelas ke dosen
//   - Update profile dosen
//   - List dosen (untuk dropdown assign MK/kelas)
//
// Service akan re-cek role di dalam (super_admin atau admin AS dgn akses tertentu)
// supaya lebih ketat per-aksi.
// ============================================================================

router.use(auth, role(["super_admin", "admin"]))

router.get   ("/",                                  controller.list)
router.post  ("/promote/:user_id",                  controller.promote)
router.put   ("/:dosen_id/unit",                    controller.setUnit)
router.put   ("/:dosen_id/jurusan",                 controller.setJurusan)
router.put   ("/:dosen_id/profile",                 controller.updateProfile)
router.put   ("/mata-kuliah/:mk_id/dosen",          controller.setMataKuliahDosen)
router.put   ("/kelas/:kelas_id/dosen",             controller.setKelasDosen)

module.exports = router
