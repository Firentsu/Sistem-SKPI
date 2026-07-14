const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpDebt.controller")
const auth = require("../../../shared/middlewares/auth.middleware")

router.use(auth)

// ===============================
// 👤 GET MY DEBT
router.get("/", controller.getMyDebt)

module.exports = router 