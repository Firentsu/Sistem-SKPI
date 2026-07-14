const express = require("express")
const router = express.Router()

const panitiaController = require("../controllers/panitia.controller")
const {
  removePanitia,
  cancelPanitia
} = require("../controllers/panitiaExtra.controller")

const authMiddleware = require("../../../shared/middlewares/auth.middleware")
const roleMiddleware = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

// ============================================================================
// FINAL CLEANUP — semua operasi panitia (approve/reject/remove/set-co/
// set-group/list pendaftar/list panitia) dilindungi accessSuper("kelola_kegiatan").
//
// Pengecualian:
//   - POST /daftar          → mahasiswa (mendaftar)
//   - GET  /my              → mahasiswa (kepanitiaannya sendiri)
//   - PUT  /:id/cancel      → mahasiswa (batal sendiri sebelum disetujui)
//   - GET  /kegiatan/:id    → publik untuk semua user login (read-only)
//   - approve/reject/set-group untuk MAHASISWA (jika ia CO divisi terkait)
//     dilakukan via cabang controller, bukan via guard route — karena guard
//     route ini sifatnya per-staff.
// ============================================================================

const guardKelolaKegiatan = accessSuper("kelola_kegiatan")

// ===============================
// 📋 GET ALL PANITIA — staff dgn kelola_kegiatan saja
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  panitiaController.getAllPanitia
)

// ===============================
// 🗑️ REMOVE — staff dgn kelola_kegiatan saja
router.delete(
  "/:id/remove",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  removePanitia
)

// ===============================
// 📋 GET BY KEGIATAN (read-only, semua user login)
router.get(
  "/kegiatan/:kegiatan_id",
  authMiddleware,
  panitiaController.getByKegiatan
)

// ===============================
// 🎓 MAHASISWA DAFTAR
router.post(
  "/daftar",
  authMiddleware,
  roleMiddleware(["mahasiswa"]),
  panitiaController.daftarPanitia
)

// ===============================
// ✅ APPROVE / ❌ REJECT
// Boleh: (admin/super_admin yg punya kelola_kegiatan)  ATAU  (mahasiswa CO divisi terkait)
// → controller yang membedakan; route hanya memerlukan auth.
router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "mahasiswa"]),
  panitiaController.approvePanitia
)

router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "mahasiswa"]),
  panitiaController.rejectPanitia
)

// ===============================
// 📋 PENDAFTAR DIVISI — staff dgn kelola_kegiatan saja
router.get(
  "/divisi/:divisi_id/pendaftar",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  panitiaController.getPendaftar
)

// ===============================
// 🎓 MAHASISWA — kepanitiaan saya
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["mahasiswa"]),
  panitiaController.getMyPendaftaran
)

// ===============================
// 🎓 MAHASISWA — batal sendiri
router.put(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(["mahasiswa"]),
  cancelPanitia
)

// ===============================
// 👑 SET CO — staff dgn kelola_kegiatan saja (admin menunjuk mahasiswa jadi CO)
router.put(
  "/divisi/:divisi_id/set-co",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  panitiaController.setCO
)

// ===============================
// 🔗 SET LINK GROUP — admin (dgn kelola_kegiatan) atau mahasiswa CO divisi.
// Controller akan validasi: jika staff, butuh kelola_kegiatan; jika mahasiswa,
// butuh statusnya CO divisi terkait.
router.put(
  "/divisi/:divisi_id/set-group",
  authMiddleware,
  roleMiddleware(["admin", "super_admin", "mahasiswa"]),
  panitiaController.setLinkGroup
)

// ===============================
// 💰 SET REWARD OVERRIDE per panitia — staff dgn kelola_kegiatan (item 11)
router.put(
  "/:id/reward",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  panitiaController.setPanitiaReward
)

module.exports = router
