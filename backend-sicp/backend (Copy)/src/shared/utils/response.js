const success = (res, data = null, message = "Success", code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data
  })
}

const fail = (res, message = "Error", code = 400) => {
  return res.status(code).json({
    success: false,
    message
  })
}

module.exports = {
  success,
  fail
} 