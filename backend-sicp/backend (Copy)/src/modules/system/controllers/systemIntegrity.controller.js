const integrityService = require("../services/systemIntegrity.service")

const runFullCheck = async (req, res, next) => {
  try {
    const negative = await integrityService.checkNegativeBalance()
    const invalid = await integrityService.checkTransactionConsistency()

    res.json({
      success: true,
      data: {
        negative_balance: negative,
        invalid_transactions: invalid
      }
    })

  } catch (err) {
    next(err)
  }
}

module.exports = { runFullCheck } 