const express = require("express")
const router = express.Router()
const controller  = require("../controllers/icpApproval.controller")
const editCtrl    = require("../controllers/pengajuanEdit.controller")
const auth        = require("../../../shared/middlewares/auth.middleware")
const role        = require("../../../shared/middlewares/role.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

// Tier-1 approval: dosen, admin biasa, admin AS, super_admin
// (Mahasiswa tidak bisa approve pengajuan orang lain)
router.use(auth, role(["dosen", "admin", "super_admin"]))

// 📥 INBOX TIER 1 — pengajuan mahasiswa menunggu approve/reject handler
router.get("/inbox", controller.inboxTier1)

router.put("/:id/approve",          idempotency, controller.approve)
router.put("/:id/reject",           idempotency, controller.reject)
router.put("/:id/edit-and-approve", idempotency, editCtrl.editAndApproveTier1)

module.exports = router
