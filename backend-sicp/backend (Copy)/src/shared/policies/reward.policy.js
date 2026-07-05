// ============================================================================
// reward.policy.js
// CENTRAL REWARD POLICY
// ============================================================================

// ============================================================================
const validateRewardPoint = (
  point
) => {

  const num = Number(point)

  if (
    isNaN(num) ||
    num <= 0
  ) {
    throw new Error(
      "Reward point tidak valid"
    )
  }

  return num
}

// ============================================================================
const validateRewardDuplicate = (
  existing
) => {

  if (existing?.length) {
    throw new Error(
      "Reward sudah pernah didistribusikan"
    )
  }

  return true
}

// ============================================================================
const validatePanitiaReward = (
  panitia
) => {

  if (
    !Array.isArray(panitia) ||
    panitia.length === 0
  ) {
    throw new Error(
      "Tidak ada panitia aktif"
    )
  }

  return true
}

module.exports = {
  validateRewardPoint,
  validateRewardDuplicate,
  validatePanitiaReward
}
