const express = require("express")
const router = express.Router()
const controller  = require("../controllers/icpValidation.controller")
const editCtrl    = require("../controllers/pengajuanEdit.controller")
const auth        = require("../../../shared/middlewares/auth.middleware")
const role        = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

// ============================================================================
// GET eligible validators — dropdown frontend (semua role login)
// ============================================================================
router.get("/eligible-validators", auth, controller.eligibleValidators)

// ============================================================================
// LIST inbox validasi final — Super Admin / Admin AS (validasi_final)
// ============================================================================
router.get(
  "/",
  auth,
  role(["admin", "super_admin"]),
  controller.getValidasiPengajuan
)

// ============================================================================
// VALIDASI FINAL pengajuan ICP — Super Admin / Admin AS (validasi_final)
// ============================================================================
router.put(
  "/:id",
  auth,
  role(["admin", "super_admin"]),
  accessSuper("validasi_final"),
  idempotency,
  controller.validasiPengajuan
)

// ============================================================================
// REJECT FINAL pengajuan ICP — Super Admin / Admin AS (validasi_final)
// ============================================================================
router.put(
  "/:id/reject",
  auth,
  role(["admin", "super_admin"]),
  accessSuper("validasi_final"),
  idempotency,
  controller.rejectValidasi
)

// ============================================================================
// EDIT + APPROVE FINAL (REV3) — Super Admin / Admin AS (validasi_final)
// ============================================================================
router.put(
  "/:id/edit-and-approve",
  auth,
  role(["admin", "super_admin"]),
  accessSuper("validasi_final"),
  idempotency,
  editCtrl.editAndApproveFinal
)

// ============================================================================
// HISTORY EDIT — semua admin/SA
// ============================================================================
router.get(
  "/edit-history",
  auth,
  role(["admin", "super_admin"]),
  editCtrl.getHistory
)

module.exports = router
