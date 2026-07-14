const express = require("express")
const router = express.Router()
const c = require("../controllers/userLimit.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

router.put("/",       auth, role(["admin","super_admin"]), c.set)
router.get("/",       auth, role(["admin","super_admin"]), c.list)
router.delete("/:id", auth, role(["admin","super_admin"]), c.delete)

module.exports = router
