/**
 * Calculate points for a prediction against the real result.
 *
 * Rules:
 * - Correct winner (or draw): +3 points
 * - Exact goals for ONE team: +1 point
 * - Exact goals for BOTH teams (exact score): +2 points (total = 5 with winner bonus)
 *
 * @param {Object} prediction - { score_home, score_away }
 * @param {Object} result - { score_home, score_away }
 * @returns {Object} { total, winnerPoints, exactOnePoints, exactBothPoints, details }
 */
export function calcScore(prediction, result) {
  if (
    result.score_home === null ||
    result.score_away === null ||
    prediction.score_home === null ||
    prediction.score_away === null
  ) {
    return { total: 0, winnerPoints: 0, exactOnePoints: 0, exactBothPoints: 0, details: 'Aguardando resultado' }
  }

  let winnerPoints = 0
  let exactOnePoints = 0
  let exactBothPoints = 0
  const details = []

  // Determine winner/draw
  const predResult = Math.sign(prediction.score_home - prediction.score_away)
  const realResult = Math.sign(result.score_home - result.score_away)

  if (predResult === realResult) {
    winnerPoints = 3
    details.push('Acertou o resultado')
  }

  // Exact goals
  const homeExact = prediction.score_home === result.score_home
  const awayExact = prediction.score_away === result.score_away

  if (homeExact && awayExact) {
    exactBothPoints = 2
    details.push('Placar exato!')
  } else if (homeExact || awayExact) {
    exactOnePoints = 1
    details.push('Acertou gols de 1 time')
  }

  const total = winnerPoints + exactOnePoints + exactBothPoints

  return {
    total,
    winnerPoints,
    exactOnePoints,
    exactBothPoints,
    details: details.length > 0 ? details.join(' + ') : 'Nenhum acerto',
  }
}

/**
 * Get the max possible points for display
 */
export const MAX_POINTS_PER_MATCH = 5
