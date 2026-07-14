const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/roleManagement.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// ============================================================================
// ROLE MANAGEMENT ROUTES
// Kelola PERAN GANDA & AKSES SUPER. SELURUH endpoint KHUSUS Super Admin
// (poin B & C revisi 11 poin: "hanya Super Admin yang menetapkan").
// ============================================================================

router.use(auth)
router.use(role(["super_admin"]))

// daftar access_key yang valid
router.get("/access-keys", ctrl.getAccessKeys)

// detail roles + akses 1 user
router.get("/users/:id", ctrl.getUserAuthDetail)

// peran ganda
router.post("/users/:id/roles", ctrl.grantRole)
router.delete("/users/:id/roles/:role", ctrl.revokeRole)

// akses super granular
router.post("/users/:id/access", ctrl.grantAccess)
router.delete("/users/:id/access/:access_key", ctrl.revokeAccess)


// ★ REV2 UNIFIED — set akses sekaligus (replace mode)
router.put("/users/:id/access", ctrl.setUserAccess)

module.exports = router
