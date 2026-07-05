const express = require("express")
const router = express.Router()

const controller = require("../controllers/potonganLimit.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

// ============================================================================
// /api/potongan-limit
// ----------------------------------------------------------------------------
// Super Admin / Admin AS dgn 'kelola_limit' yang dapat set limit potongan
// per user (dosen/admin/admin-AS yg tidak punya 'potongan_super').
// ============================================================================

router.use(auth, role(["admin", "super_admin"]))

router.post("/", accessSuper("kelola_limit"), controller.set)
router.post("/bundle", accessSuper("kelola_limit"), controller.setBundle)  // POIN 5
router.get("/:user_id/:semester_id", accessSuper("kelola_limit"), controller.list)
router.delete("/:id", accessSuper("kelola_limit"), controller.remove)

module.exports = router
