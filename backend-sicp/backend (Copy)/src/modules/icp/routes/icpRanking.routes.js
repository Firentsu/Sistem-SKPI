const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpRanking.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// ===============================
// READ ranking (hormati flag publish)
router.get("/", auth, controller.getRanking)

// STATUS visibilitas (untuk tombol toggle FE)
router.get("/visibility", auth, controller.getVisibility)

// SET visibilitas — Super Admin only (item SA-1)
router.put("/visibility", auth, role(["super_admin"]), controller.setVisibility)

module.exports = router
