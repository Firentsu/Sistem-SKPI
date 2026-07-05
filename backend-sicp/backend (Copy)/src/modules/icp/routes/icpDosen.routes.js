const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpDosen.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

router.use(auth, role(["dosen"]))

router.post("/kelas", idempotency, controller.createKelas)
router.post("/partisipasi", idempotency, controller.createPartisipasi)

module.exports = router 