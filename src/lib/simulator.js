/**
 * Simulator Engine for the 2026 World Cup
 * Calculates group standings and knockout brackets based on user predictions.
 */

// Helper to calculate standings from an array of group matches and their predictions
export function calculateGroupStandings(groupMatches, predictions, useFallback = true) {
  const teams = {}

  // Initialize teams
  groupMatches.forEach(m => {
    if (!teams[m.team_home]) teams[m.team_home] = { id: m.team_home, flag: m.flag_home, points: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 }
    if (!teams[m.team_away]) teams[m.team_away] = { id: m.team_away, flag: m.flag_away, points: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 }
  })

  // Apply predictions or fallback to real match results
  groupMatches.forEach(m => {
    const pred = predictions.find(p => p.match_id === m.id)
    
    let h = null, a = null
    if (pred && pred.score_home !== null && pred.score_away !== null) {
      h = pred.score_home
      a = pred.score_away
    } else if (useFallback && m.score_home !== null && m.score_away !== null) {
      h = m.score_home
      a = m.score_away
    }

    if (h !== null && a !== null) {

      teams[m.team_home].matchesPlayed++
      teams[m.team_away].matchesPlayed++
      
      teams[m.team_home].goalsFor += h
      teams[m.team_home].goalsAgainst += a
      teams[m.team_away].goalsFor += a
      teams[m.team_away].goalsAgainst += h

      if (h > a) {
        teams[m.team_home].points += 3
      } else if (a > h) {
        teams[m.team_away].points += 3
      } else {
        teams[m.team_home].points += 1
        teams[m.team_away].points += 1
      }
    }
  })

  // Convert to array and calculate goal diff
  const standings = Object.values(teams).map(t => ({
    ...t,
    goalDiff: t.goalsFor - t.goalsAgainst
  }))

  // Sort: Points > GD > GF > Alphabetical
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.id.localeCompare(b.id)
  })

  return standings
}

// Generate placements for all groups
export function getGroupPlacements(allMatches, allPredictions, useFallback = true) {
  const groupMatches = allMatches.filter(m => m.cup_group && m.cup_group.length === 1)
  const groups = {}
  
  groupMatches.forEach(m => {
    if (!groups[m.cup_group]) groups[m.cup_group] = []
    groups[m.cup_group].push(m)
  })

  const firsts = {}
  const seconds = {}
  const thirds = []

  Object.keys(groups).forEach(group => {
    const st = calculateGroupStandings(groups[group], allPredictions, useFallback)
    if (st.length >= 3) {
      firsts[group] = st[0]
      seconds[group] = st[1]
      thirds.push({ ...st[2], group })
    }
  })

  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.id.localeCompare(b.id)
  })
  const bestThirds = thirds.slice(0, 8)

  return { firsts, seconds, bestThirds }
}

// Generate the Simulated Knockout Bracket
export function generateKnockoutBracket(allMatches, allPredictions) {
  const placements = getGroupPlacements(allMatches, allPredictions)
  const { firsts, seconds, bestThirds } = placements

  // Wait until we have enough teams to form the bracket
  if (Object.keys(firsts).length < 12 || bestThirds.length < 8) {
    return null // Not all groups are fully populated/predicted
  }

  // 4. Bracket Mapping (Dynamic Third-Place Permutations)
  const simulatedMatches = {}

  // Function to create a match
  const setMatch = (mNum, homeTeam, awayTeam) => {
    simulatedMatches[mNum] = {
      match_number: mNum,
      team_home: homeTeam?.id,
      flag_home: homeTeam?.flag,
      team_away: awayTeam?.id,
      flag_away: awayTeam?.flag,
    }
  }

  // Dynamic allocator to find a valid 495-permutation match for the 8 best thirds
  const mapThirds = (thirds) => {
    // R32 Target groups that play against 3rd place teams
    const targets = ['E', 'I', 'A', 'L', 'D', 'G', 'B', 'K']
    const assigned = new Array(8).fill(null)
    const used = new Array(8).fill(false)

    // Backtracking to find a valid assignment where a 3rd place team does not play its own group winner
    const backtrack = (targetIndex) => {
      if (targetIndex === 8) return true // Found valid mapping
      
      for (let i = 0; i < 8; i++) {
        if (!used[i]) {
          // Rule: 3rd place team cannot play against the winner of its own group
          if (thirds[i]?.cup_group !== targets[targetIndex]) {
            assigned[targetIndex] = thirds[i]
            used[i] = true
            if (backtrack(targetIndex + 1)) return true
            used[i] = false
            assigned[targetIndex] = null
          }
        }
      }
      return false
    }

    if (backtrack(0)) {
      return assigned
    }
    return thirds // Fallback (should theoretically never happen with 8 targets and 12 groups)
  }

  const assignedThirds = mapThirds(bestThirds)

  // R32 (Matches 73 to 88)
  setMatch(73, seconds['A'], seconds['B'])
  setMatch(74, firsts['E'], assignedThirds[0])
  setMatch(75, firsts['F'], seconds['C'])
  setMatch(76, firsts['C'], seconds['F'])
  setMatch(77, firsts['I'], assignedThirds[1])
  setMatch(78, seconds['E'], seconds['I'])
  setMatch(79, firsts['A'], assignedThirds[2])
  setMatch(80, firsts['L'], assignedThirds[3])
  setMatch(81, firsts['D'], assignedThirds[4])
  setMatch(82, firsts['G'], assignedThirds[5])
  setMatch(83, seconds['K'], seconds['L'])
  setMatch(84, firsts['H'], seconds['J'])
  setMatch(85, firsts['B'], assignedThirds[6])
  setMatch(86, firsts['J'], seconds['H'])
  setMatch(87, firsts['K'], assignedThirds[7])
  setMatch(88, seconds['D'], seconds['G'])

  // Helper to resolve winner of a match
  const getWinner = (mNum) => {
    const match = allMatches.find(m => m.match_number === mNum)
    if (!match) return null
    
    const pred = allPredictions.find(p => p.match_id === match.id)
    const sim = simulatedMatches[mNum]
    
    if (!pred || pred.score_home === null || pred.score_away === null) {
      // Fallback to real match if it has happened
      if (match.score_home !== null && match.score_away !== null) {
        if (match.score_home > match.score_away) return { id: match.team_home, flag: match.flag_home }
        if (match.score_away > match.score_home) return { id: match.team_away, flag: match.flag_away }
        
        // Fallback for real draw using advance_on_penalties
        if (match.advance_on_penalties === match.team_home) return { id: match.team_home, flag: match.flag_home }
        if (match.advance_on_penalties === match.team_away) return { id: match.team_away, flag: match.flag_away }
        
        return { id: match.team_home, flag: match.flag_home } // Emergency fallback if penalty data is missing
      }
      return null
    }
    if (pred.is_simulated) {
      if (pred.simulated_team_home !== sim.team_home || pred.simulated_team_away !== sim.team_away) {
        return null // Mismatch! Do not propagate winner.
      }
    }
    
    const homeTeam = pred.is_simulated ? sim.team_home : match.team_home
    const homeFlag = pred.is_simulated ? sim.flag_home : match.flag_home
    const awayTeam = pred.is_simulated ? sim.team_away : match.team_away
    const awayFlag = pred.is_simulated ? sim.flag_away : match.flag_away

    if (pred.score_home > pred.score_away) return { id: homeTeam, flag: homeFlag }
    if (pred.score_away > pred.score_home) return { id: awayTeam, flag: awayFlag }
    
    // Draw -> resolved by penalties
    if (pred.advance_on_penalties === homeTeam) return { id: homeTeam, flag: homeFlag }
    if (pred.advance_on_penalties === awayTeam) return { id: awayTeam, flag: awayFlag }
    
    // Fallback if penalties logic failed but we have a winner
    if (pred.advance_on_penalties === pred.simulated_team_home) return { id: homeTeam, flag: homeFlag }
    if (pred.advance_on_penalties === pred.simulated_team_away) return { id: awayTeam, flag: awayFlag }

    return null // Needs penalty resolution
  }

  // R16 (Matches 89 to 96)
  setMatch(89, getWinner(74), getWinner(77))
  setMatch(90, getWinner(73), getWinner(75))
  setMatch(91, getWinner(76), getWinner(78))
  setMatch(92, getWinner(79), getWinner(80))
  setMatch(93, getWinner(83), getWinner(84))
  setMatch(94, getWinner(81), getWinner(82))
  setMatch(95, getWinner(86), getWinner(88))
  setMatch(96, getWinner(85), getWinner(87))

  // QF (Matches 97 to 100)
  setMatch(97, getWinner(89), getWinner(90))
  setMatch(98, getWinner(93), getWinner(94))
  setMatch(99, getWinner(91), getWinner(92))
  setMatch(100, getWinner(95), getWinner(96))

  // SF (Matches 101 to 102)
  setMatch(101, getWinner(97), getWinner(98))
  setMatch(102, getWinner(99), getWinner(100))

  // Third Place (Match 103) & Final (Match 104)
  const getLoser = (mNum) => {
    const winner = getWinner(mNum)
    if (!winner) return null
    const sim = simulatedMatches[mNum]
    return winner.id === sim.team_home ? { id: sim.team_away, flag: sim.flag_away } : { id: sim.team_home, flag: sim.flag_home }
  }

  setMatch(103, getLoser(101), getLoser(102)) // Losers of SF
  setMatch(104, getWinner(101), getWinner(102)) // Winners of SF

  return simulatedMatches
}
