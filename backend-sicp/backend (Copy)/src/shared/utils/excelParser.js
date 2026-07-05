const XLSX = require("xlsx")

const parseExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath)

  const sheetName = workbook.SheetNames[0]

  const sheet = workbook.Sheets[sheetName]

  return XLSX.utils.sheet_to_json(sheet)
}

module.exports = {
  parseExcel
}