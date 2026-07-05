// ============================================================================
// kegiatan.policy.js
// CENTRAL KEGIATAN POLICY
// ============================================================================

const ALLOWED_TRANSITIONS = {
  draft: [
    "pendaftaran_dibuka",
    "berjalan",
    "dibatalkan"
  ],

  pendaftaran_dibuka: [
    "berjalan",
    "dibatalkan"
  ],

  berjalan: [
    "selesai",
    "dibatalkan"
  ],

  selesai: [],

  dibatalkan: []
}

// ============================================================================
const validateTransition = (
  current,
  next
) => {

  const allowed =
    ALLOWED_TRANSITIONS[current] || []

  if (!allowed.includes(next)) {
    throw new Error(
      `Transisi status tidak valid: ${current} → ${next}`
    )
  }

  return true
}

// ============================================================================
const validateRewardState = (
  kegiatan
) => {

  if (!kegiatan.kategori_id) {
    throw new Error(
      "Kegiatan tidak punya kategori ICP"
    )
  }

  if (!kegiatan.nama_icp_id) {
    throw new Error(
      "Kegiatan tidak punya nama ICP"
    )
  }

  if (
    !kegiatan.icp_reward ||
    kegiatan.icp_reward <= 0
  ) {
    throw new Error(
      "Kegiatan tidak punya reward valid"
    )
  }

  return true
}

module.exports = {
  validateTransition,
  validateRewardState
}
