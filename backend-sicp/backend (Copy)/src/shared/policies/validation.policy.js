// ============================================================================
// validation.policy.js
// CENTRAL VALIDATION POLICY
// ============================================================================

const required = (value, field) => {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new Error(`${field} wajib diisi`)
  }

  return true
}

// ============================================================================
const toNumber = (value, field = "Field") => {

  required(value, field)

  const num = Number(value)

  if (isNaN(num)) {
    throw new Error(`${field} harus angka`)
  }

  return num
}

// ============================================================================
const positiveNumber = (
  value,
  field = "Field"
) => {

  const num = toNumber(value, field)

  if (num <= 0) {
    throw new Error(`${field} harus lebih dari 0`)
  }

  return num
}

// ============================================================================
const validateEnum = (
  value,
  allowed,
  field = "Field"
) => {

  if (!allowed.includes(value)) {
    throw new Error(
      `${field} tidak valid`
    )
  }

  return true
}

// ============================================================================
const validateString = (
  value,
  field = "Field",
  min = 1
) => {

  required(value, field)

  if (
    typeof value !== "string"
  ) {
    throw new Error(
      `${field} harus string`
    )
  }

  if (
    value.trim().length < min
  ) {
    throw new Error(
      `${field} terlalu pendek`
    )
  }

  return value.trim()
}

module.exports = {
  required,
  toNumber,
  positiveNumber,
  validateEnum,
  validateString
}
