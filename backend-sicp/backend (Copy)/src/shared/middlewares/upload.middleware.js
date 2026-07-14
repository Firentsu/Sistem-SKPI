const multer = require("multer")
const path = require("path")
const fs = require("fs")

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

ensureDir("src/uploads/excel")
ensureDir("src/uploads/bukti")
ensureDir("src/uploads/informasi")

const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/excel")
  },

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const buktiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/bukti")
  },

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const informasiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/informasi")
  },

  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")
    cb(null, `${Date.now()}-${safe}`)
  }
})

const excelFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname)

  if (ext !== ".xlsx" && ext !== ".xls") {
    return cb(new Error("File harus excel"))
  }

  cb(null, true)
}

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".pdf"]
  const ext = path.extname(file.originalname).toLowerCase()

  if (!allowed.includes(ext)) {
    return cb(new Error("Format file tidak didukung"))
  }

  cb(null, true)
}

// Khusus foto informasi kampus — hanya gambar (tanpa PDF).
const informasiImageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"]
  const ext = path.extname(file.originalname).toLowerCase()

  if (!allowed.includes(ext)) {
    return cb(new Error("Format foto harus jpg/jpeg/png/webp"))
  }

  cb(null, true)
}

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

const uploadBukti = multer({
  storage: buktiStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

const uploadInformasiFoto = multer({
  storage: informasiStorage,
  fileFilter: informasiImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

module.exports = {
  uploadExcel,
  uploadBukti,
  uploadInformasiFoto
}