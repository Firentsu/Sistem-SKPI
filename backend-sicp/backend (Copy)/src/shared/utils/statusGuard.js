const allowedTransitions = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: []
}

function validateTransition(current, next) {
  if (!allowedTransitions[current]?.includes(next)) {
    throw new Error(`Invalid status transition: ${current} → ${next}`)
  }
}

function ensureNotFinal(status) {
  if (["approved", "rejected"].includes(status)) {
    throw new Error("Data sudah final dan tidak bisa diubah")
  }
}

module.exports = {
  validateTransition,
  ensureNotFinal
} 