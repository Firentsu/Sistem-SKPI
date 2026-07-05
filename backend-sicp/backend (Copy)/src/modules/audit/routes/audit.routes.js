const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/audit.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// 🔒 SUPER ADMIN ONLY
router.use(auth, role(["super_admin"]))

// ===============================
// RUN AUDIT
router.get("/run", ctrl.runAudit)

// FIX (HARUS POST)
router.post("/fix", ctrl.runAutoFix)

module.exports = router 