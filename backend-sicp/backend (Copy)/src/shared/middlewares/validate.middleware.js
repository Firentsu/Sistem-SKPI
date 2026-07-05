const { fail } = require("../utils/response")

// ===============================
const parseRule = (rule) => {
  const parts = rule.split("|")
  return parts.map(r => r.trim())
}

// ===============================
const validate = (schema = {}) => {
  return (req, res, next) => {
    try {
      const body = req.body || {}

      for (const field in schema) {
        const rules = parseRule(schema[field])
        const value = body[field]

        for (const rule of rules) {

          // ===============================
          if (rule === "required") {
            if (value === undefined || value === null || value === "") {
              return fail(res, `${field} wajib diisi`, 400)
            }
          }

          // ===============================
          if (rule === "string") {
            if (value && typeof value !== "string") {
              return fail(res, `${field} harus berupa string`, 400)
            }
          }

          // ===============================
          if (rule.startsWith("min:")) {
            const min = Number(rule.split(":")[1])
            if (value && value.length < min) {
              return fail(res, `${field} minimal ${min} karakter`, 400)
            }
          }

          // ===============================
          if (rule.startsWith("max:")) {
            const max = Number(rule.split(":")[1])
            if (value && value.length > max) {
              return fail(res, `${field} maksimal ${max} karakter`, 400)
            }
          }

        }
      }

      next()

    } catch (err) {
      console.error("VALIDATION ERROR:", err.message)
      return fail(res, "Validation error", 400)
    }
  }
}

module.exports = validate 