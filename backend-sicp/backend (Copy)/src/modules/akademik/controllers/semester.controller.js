const SemesterService = require("../services/semester.service")

// ===============================
// 🔥 GET ACTIVE SEMESTER
const getActive = async (req, res, next) => {
  try {
    const data = await SemesterService.getActiveSemester()

    res.json({
      success: true,
      data
    })
  } catch (err) {
    next(err)
  }
}

// ===============================
// 🔥 CREATE SEMESTER (refactored — no raw SQL)
const createSemester = async (req, res, next) => {
  try {
    const data = await SemesterService.createSemester(req.body, req.user)

    res.json({
      success: true,
      message: "Semester berhasil dibuat",
      data
    })
  } catch (err) {
    next(err)
  }
}

// ===============================
// 🔥 GET ALL SEMESTER (refactored — no raw SQL)
const getAllSemester = async (req, res, next) => {
  try {
    const data = await SemesterService.getAllSemester()

    res.json({
      success: true,
      data
    })
  } catch (err) {
    next(err)
  }
}

// ===============================
// 🔥 SET ACTIVE SEMESTER (refactored — no raw SQL)
const setActiveSemester = async (req, res, next) => {
  try {
    const data = await SemesterService.setActiveSemester(req.params.id, req.user)

    res.json({
      success: true,
      message: "Semester aktif berhasil diubah",
      data
    })
  } catch (err) {
    next(err)
  }
}

// ===============================
// 🔥 OPEN EDIT-WINDOW (REVISI 11POIN #10)
const openEditWindow = async (req, res, next) => {
  try {
    const data = await SemesterService.openEditWindow(
      req.params.id,
      req.body,
      req.user
    )
    res.json({
      success: true,
      message: "Edit-window semester dibuka",
      data
    })
  } catch (err) {
    next(err)
  }
}

// ===============================
// 🔥 CLOSE EDIT-WINDOW (REVISI 11POIN #10)
const closeEditWindow = async (req, res, next) => {
  try {
    const data = await SemesterService.closeEditWindow(
      req.params.id,
      req.user
    )
    res.json({
      success: true,
      message: "Edit-window semester ditutup",
      data
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getActive,
  createSemester,
  getAllSemester,
  setActiveSemester,
  openEditWindow,
  closeEditWindow
} 