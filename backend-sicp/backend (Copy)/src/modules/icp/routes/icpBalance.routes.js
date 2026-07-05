const router = require("express").Router()
const ctrl = require("../controllers/icpBalance.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

router.use(auth)

// ===============================
// BALANCE
router.get("/", ctrl.getMyBalance)

// ===============================
// HISTORY
router.get("/history", ctrl.getMyHistory)

// ===============================
// RANKING
router.get("/ranking", ctrl.getRanking)

// ===============================
// BREAKDOWN PER KATEGORI (untuk sistem SKPI) — admin/super_admin only
// GET /api/icp/balance/by-category/:mahasiswaId
router.get("/by-category/:mahasiswaId", role(["admin", "super_admin"]), ctrl.getByCategory)

module.exports = router