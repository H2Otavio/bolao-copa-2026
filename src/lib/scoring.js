/**
 * Calculate points for a prediction against the real result.
 *
 * Rules:
 * Group Stage:
 * - Correct winner (or draw): +3 points
 * - Exact goals for ONE team: +1 point
 * - Exact goals for BOTH teams (exact score): +2 points (total = 5 with winner bonus)
 *
 * Knockout Stage:
 * - Correctly predicted team in home slot: +2 points
 * - Correctly predicted team in away slot: +2 points
 * - Score points (same as group stage) are ONLY awarded if the score was predicted for the REAL teams.
 *   This means either the user perfectly predicted both teams (is_simulated = true AND teams match),
 *   OR the user made/updated the prediction after the real teams were known (is_simulated = false).
 *
 * @param {Object} prediction - { score_home, score_away, is_simulated, simulated_team_home, simulated_team_away }
 * @param {Object} match - { score_home, score_away, cup_group, team_home, team_away }
 * @returns {Object} { total, winnerPoints, exactOnePoints, exactBothPoints, teamPoints, details }
 */
export function calcScore(prediction, match) {
  if (
    match.score_home === null ||
    match.score_away === null ||
    prediction.score_home === null ||
    prediction.score_away === null
  ) {
    return { total: 0, winnerPoints: 0, exactOnePoints: 0, exactBothPoints: 0, teamPoints: 0, details: 'Aguardando resultado' }
  }

  let winnerPoints = 0
  let exactOnePoints = 0
  let exactBothPoints = 0
  let teamPoints = 0
  const details = []

  const isKnockout = match.cup_group && match.cup_group.length > 1

  // 1. Evaluate Team Points (Only for Knockout)
  let teamsMatchPerfectly = false
  if (isKnockout) {
    let teamsHit = 0
    if (prediction.simulated_team_home === match.team_home) teamsHit++
    if (prediction.simulated_team_away === match.team_away) teamsHit++

    if (teamsHit > 0) {
      teamPoints = teamsHit * 2
      details.push(`Acertou ${teamsHit} seleç${teamsHit > 1 ? 'ões' : 'ão'} (${teamPoints}pts)`)
    }
    
    if (teamsHit === 2) {
      teamsMatchPerfectly = true
    }
  }

  // 2. Evaluate Score Points
  // In knockout, score is only valid if they updated the score for the real match (!is_simulated)
  // OR if they perfectly predicted both teams in the simulation.
  const isScoreValid = !isKnockout || (!prediction.is_simulated || teamsMatchPerfectly)

  if (isScoreValid) {
    // Determine winner/draw
    const predResult = Math.sign(prediction.score_home - prediction.score_away)
    const realResult = Math.sign(match.score_home - match.score_away)

    if (predResult === realResult) {
      winnerPoints = 3
      details.push('Acertou o resultado')
    }

    // Exact goals
    const homeExact = prediction.score_home === match.score_home
    const awayExact = prediction.score_away === match.score_away

    if (homeExact && awayExact) {
      exactBothPoints = 2
      details.push('Placar exato!')
    } else if (homeExact || awayExact) {
      exactOnePoints = 1
      details.push('Acertou gols de 1 time')
    }
  } else if (isKnockout) {
    details.push('Placar ignorado (times incorretos)')
  }

  const total = winnerPoints + exactOnePoints + exactBothPoints + teamPoints

  return {
    total,
    winnerPoints,
    exactOnePoints,
    exactBothPoints,
    teamPoints,
    details: details.length > 0 ? details.join(' + ') : 'Nenhum acerto',
  }
}

/**
 * Get the max possible points for display
 */
export const MAX_POINTS_PER_MATCH = 9 // 5 for score + 4 for teams
