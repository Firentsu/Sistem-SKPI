const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/user.controller")

const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

router.use(auth)

// POIN 4: calon anggota unit (tanpa mahasiswa) — taruh sebelum '/:id' agar tidak bentrok
router.get(
  "/eligible-unit-members",
  role(["admin", "super_admin"]),
  ctrl.getEligibleUnitMembers
)

// POIN 1: daftar user per role (mahasiswa/dosen/admin/super_admin/multi)
router.get(
  "/by-role/:role",
  role(["admin", "super_admin"]),
  ctrl.getUsersByRole
)

// POIN 1: profil lengkap user tertentu
router.get(
  "/:id/full-profile",
  role(["admin", "super_admin"]),
  ctrl.getFullProfile
)

// ===============================
router.get(
  "/",
  role(["admin", "super_admin"]),
  ctrl.getAllUsers
)

// ===============================
router.get("/profile", ctrl.getProfile)

// 🔥 NEW — UPDATE PROFILE (MAHASISWA)
router.put("/profile", ctrl.updateMyProfile)

// ===============================
router.post(
  "/",
  role(["admin", "super_admin"]),
  ctrl.createUser
)

// CREATE USER PER ROLE — endpoint terpisah, body lengkap per role
router.post("/mahasiswa",   role(["admin", "super_admin"]), ctrl.createMahasiswa)
router.post("/dosen",       role(["admin", "super_admin"]), ctrl.createDosen)
router.post("/admin",       role(["super_admin"]),          ctrl.createAdmin)
router.post("/super-admin", role(["super_admin"]),          ctrl.createSuperAdmin)

// SA#1 & SA#2 (11 Juni): update username & password semua user (termasuk diri sendiri)
router.put("/:id/username", role(["super_admin"]), ctrl.updateUsername)
router.put("/:id/password", role(["super_admin"]), ctrl.updatePassword)

// POIN 2: set status eksplisit (andal ke DB)
router.put("/:id/status", role(["admin", "super_admin"]), ctrl.setUserStatus)

// POIN 1: Super admin update PROFIL user lain (per role)
router.put("/:id/profile-admin", role(["admin", "super_admin"]), ctrl.updateUserProfile)

// ===============================
router.put(
  "/:id",
  role(["admin", "super_admin"]),
  ctrl.updateUser
)

// ===============================
router.put(
  "/:id/deactivate",
  role(["admin", "super_admin"]),
  ctrl.deactivateUser
)

// POIN 6: REACTIVATE USER
router.put(
  "/:id/reactivate",
  role(["admin", "super_admin"]),
  ctrl.reactivateUser
)

// ===============================
router.delete(
  "/:id",
  role(["super_admin"]),
  ctrl.deleteUser
)

module.exports = router 