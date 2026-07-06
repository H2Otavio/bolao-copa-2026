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
  let winnerPoints = 0
  let exactOnePoints = 0
  let exactBothPoints = 0
  let teamPoints = 0
  const details = []

  const isKnockout = match.cup_group && match.cup_group.length > 1

  // 1. Evaluate Team Points (Only for Knockout R32)
  let teamsMatchPerfectly = false
  if (isKnockout) {
    let teamsHit = 0
    if (match.team_home && prediction.simulated_team_home === match.team_home) teamsHit++
    if (match.team_away && prediction.simulated_team_away === match.team_away) teamsHit++

    if (teamsHit > 0 && match.cup_group === 'R32') {
      teamPoints = teamsHit * 2
      details.push(`Acertou ${teamsHit} seleç${teamsHit > 1 ? 'ões' : 'ão'} (${teamPoints}pts)`)
    }
    
    if (teamsHit === 2) {
      teamsMatchPerfectly = true
    }
  }

  if (
    match.score_home === null ||
    match.score_away === null ||
    prediction.score_home === null ||
    prediction.score_away === null
  ) {
    if (details.length === 0) details.push('Aguardando resultado');
    return { total: teamPoints, winnerPoints: 0, exactOnePoints: 0, exactBothPoints: 0, teamPoints, details: details.join(' | ') };
  }

  // Score is always valid now that simulator is removed
  const isScoreValid = true;

  let penaltyPoints = 0
  if (isScoreValid) {
    // Determine winner/draw
    const predResult = Math.sign(prediction.score_home - prediction.score_away)
    const realResult = Math.sign(match.score_home - match.score_away)

    if (predResult === realResult) {
      winnerPoints = 3
      details.push('Acertou o resultado')
      
      // If it's a draw in knockout, check for correct penalty winner
      if (predResult === 0 && isKnockout && prediction.advance_on_penalties && match.advance_on_penalties) {
        if (prediction.advance_on_penalties === match.advance_on_penalties) {
          penaltyPoints = 1
          details.push('Acertou vencedor nos pênaltis')
        }
      }
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
  }
  const total = winnerPoints + exactOnePoints + exactBothPoints + teamPoints + penaltyPoints

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
export const MAX_POINTS_PER_MATCH = 10 // 5 for score + 4 for teams + 1 for penalty // 5 for score + 4 for teams
