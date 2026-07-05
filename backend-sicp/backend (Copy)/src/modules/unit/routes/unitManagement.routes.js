const express = require("express")
const router = express.Router()
const c = require("../controllers/unitManagement.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

const staff = ["admin", "super_admin"]

router.get("/",           auth, role(staff),  c.list)
router.post("/",          auth, role(staff), accessSuper("input_unit_organisasi"), c.create)
router.get("/my-units",   auth,               c.getMyUnits)
router.get("/list-all",   auth,               c.listAll)   // semua role: dropdown pengajuan & riwayat/inbox
router.get("/:id",        auth, role(staff),  c.detail)
router.put("/:id",        auth, role(staff), accessSuper("input_unit_organisasi"), c.update)
router.delete("/:id",     auth, role(["super_admin"]), c.delete)

router.get("/:id/options",                auth, c.getOptions)  // utk dropdown pengajuan
router.post("/:id/kategori",              auth, role(staff), accessSuper("kelola_unit_kategori"), c.assignKategori)
router.delete("/:id/kategori/:kid",       auth, role(staff), accessSuper("kelola_unit_kategori"), c.removeKategori)
router.post("/:id/nama-icp",              auth, role(staff), accessSuper("kelola_nama_icp"), c.addNamaIcp)
router.put("/:id/nama-icp/:nid",          auth, role(staff), accessSuper("kelola_nama_icp"), c.updateNamaIcp)
router.delete("/:id/nama-icp/:nid",       auth, role(staff), accessSuper("kelola_nama_icp"), c.deleteNamaIcp)
router.post("/:id/member",                auth, role(staff), accessSuper("input_unit_organisasi"), c.addMember)
router.delete("/:id/member/:uid",         auth, role(staff), accessSuper("input_unit_organisasi"), c.removeMember)

module.exports = router
