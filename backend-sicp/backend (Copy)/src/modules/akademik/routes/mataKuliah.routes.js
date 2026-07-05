const router = require("express").Router()
const ctrl = require("../controllers/mataKuliah.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

router.use(auth, accessSuper("input_mata_kuliah"))

router.get("/",     ctrl.getAll)
router.post("/",    ctrl.create)
router.get("/:id",  ctrl.getDetail)
router.put("/:id",  ctrl.update)
router.delete("/:id", ctrl.remove)

// Multi-dosen
router.post("/:id/dosen",            ctrl.addDosen)
router.delete("/:id/dosen/:uid",     ctrl.removeDosen)

// Mahasiswa enrollment
router.post("/:id/mahasiswa",        ctrl.enroll)
router.delete("/:id/mahasiswa/:mid", ctrl.drop)

module.exports = router
