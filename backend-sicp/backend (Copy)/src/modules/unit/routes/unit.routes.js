const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/unit.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

// REVISI 11POIN: kelola unit organisasi kini boleh Admin ber-akses-super
// (Super Admin lolos otomatis di dalam accessSuper).
router.use(auth, accessSuper("input_unit_organisasi"))

router.post("/", ctrl.create)
router.get("/", ctrl.getAll)
router.put("/:id", ctrl.update)
router.delete("/:id", ctrl.remove)

module.exports = router 