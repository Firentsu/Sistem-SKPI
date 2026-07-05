const express = require("express")
const router = express.Router()

const systemService = require("../services/system.service")
const authMiddleware = require("../../../shared/middlewares/auth.middleware")
const roleMiddleware = require("../../../shared/middlewares/role.middleware")
const systemController = require("../controllers/system.controller")
const integrityController = require("../controllers/systemIntegrity.controller")
const auditController = require("../../audit/controllers/auditReport.controller")
const semesterController = require("../../akademik/controllers/semester.controller")

// ===============================
// 🔥 SYSTEM HEALTH (REAL-TIME)
router.get(
  "/health",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  systemController.getSystemHealth
)

// ===============================
// 🔥 GET ALL CONFIG (root) — Postman PRO
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  systemController.getConfig
)

// ===============================
router.post(
  "/users",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  systemController.createUser
)

router.get(
  "/potongan",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  systemController.listPotongan
)

// ===============================
// 🔥 AUDIT LOG (FILTERABLE)
router.get(
  "/audit",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  auditController.getAuditLogs
)

// ===============================
// ICP TRACKING (SIAPA MEMBERI & VALIDASI)
router.get(
  "/audit/icp",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  auditController.getICPTracking
)

// ===============================
router.get(
  "/integrity-check",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  integrityController.runFullCheck
)

// ===============================
// 🔥 SET CONFIG (SUPER ADMIN ONLY)
router.post(
  "/config",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  async (req, res) => {
    try {
      const { key, value } = req.body
      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          message: "key dan value wajib diisi"
        })
      }

      await systemService.setConfig(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
        req.user
      )

      return res.json({
        success: true,
        message: "Config berhasil disimpan"
      })
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message
      })
    }
  }
)

module.exports = router