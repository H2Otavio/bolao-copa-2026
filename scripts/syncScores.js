import { createClient } from '@supabase/supabase-js';
import { calcScore } from '../src/lib/scoring.js';
import { generateKnockoutBracket, getGroupPlacements } from '../src/lib/simulator.js';
import { translateTeam } from '../src/lib/countries.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncScores() {
  console.log("Starting score synchronization with worldcup26.ir...");

  let updatedCount = 0;

  try {
    const url = `https://worldcup26.ir/get/games`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`API Error: ${response.status}`);
      const text = await response.text();
      console.error(text);
      throw new Error('API down');
    }

    const json = await response.json();
    const fixtures = Array.isArray(json.games) ? json.games : (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));

    console.log(`Found ${fixtures.length} matches in the API.`);

    if (fixtures.length > 0) {
      const { data: dbMatches, error: dbError } = await supabase.from('matches').select('*');
      if (dbError) {
        console.error("Error fetching DB matches:", dbError);
        throw new Error('DB fetch error');
      }
      
      for (const fixture of fixtures) {
        const apiId = fixture.id || fixture.match_number;
        const isFinished = fixture.finished === "TRUE" || fixture.finished === true;
        const scoreHome = parseInt(fixture.home_score, 10);
        const scoreAway = parseInt(fixture.away_score, 10);

        if (fixture.time_elapsed !== 'notstarted' && !isNaN(scoreHome) && !isNaN(scoreAway)) {
          const match = dbMatches.find(m => m.match_number === parseInt(apiId, 10) || (m.team_home === fixture.home_team_en && m.team_away === fixture.away_team_en));

          if (match) {
            let penaltyWinner = match.advance_on_penalties || null;
            if (fixture.home_penalty_score !== undefined && fixture.away_penalty_score !== undefined) {
              const homePen = parseInt(fixture.home_penalty_score, 10);
              const awayPen = parseInt(fixture.away_penalty_score, 10);
              if (!isNaN(homePen) && !isNaN(awayPen)) {
                if (homePen > awayPen) penaltyWinner = match.team_home;
                else if (awayPen > homePen) penaltyWinner = match.team_away;
              }
            }

            const needsUpdate = match.score_home !== scoreHome || match.score_away !== scoreAway || match.advance_on_penalties !== penaltyWinner;

            if (needsUpdate) {
              const updatePayload = { score_home: scoreHome, score_away: scoreAway, advance_on_penalties: penaltyWinner };
              const { error: updateError } = await supabase.from('matches').update(updatePayload).eq('id', match.id);

              if (updateError) {
                console.error(`Failed to update Match ${match.match_number} (${match.team_home} vs ${match.team_away}):`, updateError);
              } else {
                console.log(`Successfully updated Match ${match.match_number} (${match.team_home} vs ${match.team_away}) to ${scoreHome} - ${scoreAway}. Finished: ${isFinished}`);
                updatedCount++;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Skipping external API sync due to error:", err.message);
  }

  console.log(`Synchronization step complete. Updated ${updatedCount} matches from external API.`);

  // --- BEGIN STATS & RANKING CALCULATION ---
  console.log("Calculating rankings locally to include knockout team bonuses...");

  const { data: allMatchesFinal } = await supabase.from('matches').select('*').order('match_number');
  const allMatches = allMatchesFinal || [];

  const { data: allUsers } = await supabase.from('users').select('id, name, league_id');
  const users = allUsers || [];

  let allPredictions = [];
  let page = 0;
  while (true) {
    const { data: pData } = await supabase.from('predictions').select('*').range(page * 1000, (page + 1) * 1000 - 1);
    if (!pData || pData.length === 0) break;
    allPredictions.push(...pData);
    if (pData.length < 1000) break;
    page++;
  }
  const predictions = allPredictions || [];

  const userScores = [];

  for (const user of users) {
    const userPreds = predictions.filter(p => p.user_id === user.id);
    const bracket = generateKnockoutBracket(allMatches, userPreds);
    
    let totalPoints = 0;
    let exactBothPoints = 0;
    let correctResults = 0;

    for (const match of allMatches) {
      let pred = userPreds.find(p => p.match_id === match.id);

      const isKnockout = match.cup_group && match.cup_group.length > 1;

      if (!pred) {
        if (!isKnockout) continue;
        // For knockout matches, missing predictions still earn team points
        pred = {
          match_id: match.id,
          score_home: null,
          score_away: null,
          is_simulated: true
        };
      }
      
      // Inject the dynamically calculated simulated teams so scoring.js can use them
      if (isKnockout && bracket && bracket[match.match_number]) {
        pred.simulated_team_home = bracket[match.match_number].team_home;
        pred.simulated_team_away = bracket[match.match_number].team_away;
      }

      const score = calcScore(pred, match);
      
      totalPoints += score.total;
      if (score.exactBothPoints > 0) exactBothPoints += 1;
      if (score.winnerPoints > 0) correctResults += 1;
    }

    userScores.push({
      id: user.id,
      name: user.name,
      league_id: user.league_id,
      totalPoints,
      exactBothPoints,
      correctResults,
      avgOrder: 0 // Simplification for now, or you can calculate it based on submission times if needed
    });
  }

  if (userScores) {
    const sortRanking = (rankingArray) => {
      rankingArray.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.exactBothPoints !== a.exactBothPoints) return b.exactBothPoints - a.exactBothPoints;
        if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
        return a.avgOrder - b.avgOrder; // Lowest average order wins the tie
      });
    };

    // Sort Global Ranking
    sortRanking(userScores);
    await supabase.from('app_cache').upsert({ key: 'global_ranking', value: userScores });

    // Group by league and cache
    const leagueScores = {};
    userScores.forEach(u => {
      if (!leagueScores[u.league_id]) leagueScores[u.league_id] = [];
      leagueScores[u.league_id].push(u);
    });

    const appCacheUpdates = Object.keys(leagueScores).map(leagueId => {
      const scores = leagueScores[leagueId];
      sortRanking(scores);
      return { key: `ranking_data_${leagueId}`, value: scores };
    });

    if (appCacheUpdates.length > 0) {
      await supabase.from('app_cache').upsert(appCacheUpdates);
    }
    console.log("Rankings updated successfully in app_cache.");
  }

  // 2. Calculate Global Stats (HEAVY EGRESS - RUN ONLY ONCE A DAY)
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const isDailyStatsUpdate = (currentHour === 3 && currentMinute < 10) || process.env.FORCE_STATS_UPDATE === 'true';

  if (isDailyStatsUpdate) {
    console.log("Calculating global stats (Daily Heavy Calculation)...");
    
    // Data already fetched above

    const statsMap = {};
    
    // Group and Knockout Match Stats
    const CUP_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL'];
    CUP_GROUPS.forEach(group => {
      const groupMatches = allMatches.filter(m => m.cup_group === group);
      const matchIds = groupMatches.map(m => m.id);
      const groupPreds = predictions.filter(p => matchIds.includes(p.match_id));

      statsMap[group] = groupMatches.map(match => {
        const matchPreds = groupPreds.filter(p => p.match_id === match.id);
        const total = matchPreds.length;
        let homeWins = 0, draws = 0, awayWins = 0, avgHome = 0, avgAway = 0;

        matchPreds.forEach(p => {
          if (p.score_home > p.score_away) homeWins++;
          else if (p.score_home === p.score_away) draws++;
          else awayWins++;
          avgHome += p.score_home;
          avgAway += p.score_away;
        });

        return {
          ...match,
          totalPredictions: total,
          homeWinPct: total > 0 ? Math.round((homeWins / total) * 100) : 0,
          drawPct: total > 0 ? Math.round((draws / total) * 100) : 0,
          awayWinPct: total > 0 ? Math.round((awayWins / total) * 100) : 0,
          avgHome: total > 0 ? (avgHome / total).toFixed(1) : '–',
          avgAway: total > 0 ? (avgAway / total).toFixed(1) : '–',
        };
      });
    });

    // Knockout Stats
    console.log("Calculating knockout stats...");
    const flagMap = {};
    allMatches.forEach(m => {
      if (m.team_home && m.flag_home) flagMap[m.team_home] = m.flag_home;
      if (m.team_away && m.flag_away) flagMap[m.team_away] = m.flag_away;
    });

    const championVotes = {};
    const runnerUpVotes = {};
    const thirdPlaceVotes = {};
    const advancedVotes = {};

    const incrementVote = (map, teamId) => {
      if (!teamId || teamId.length > 3) return; 
      if (!map[teamId]) map[teamId] = { id: teamId, votes: 0, flag: flagMap[teamId] };
      map[teamId].votes++;
    };

    const predsByUser = {};
    predictions.forEach(p => {
      if (!predsByUser[p.user_id]) predsByUser[p.user_id] = [];
      predsByUser[p.user_id].push(p);
    });

    Object.values(predsByUser).forEach(userPreds => {
      const bracket = generateKnockoutBracket(allMatches, userPreds);
      if (!bracket) return;

      for (let i = 73; i <= 88; i++) {
        if (bracket[i]) {
          incrementVote(advancedVotes, bracket[i].team_home);
          incrementVote(advancedVotes, bracket[i].team_away);
        }
      }

      const m103 = bracket[103];
      const p103 = userPreds.find(p => p.match_id === allMatches.find(m => m.match_number === 103)?.id);
      if (m103 && p103 && p103.score_home !== null && p103.score_away !== null) {
        let hTeam = m103.team_home, aTeam = m103.team_away;
        if (p103.score_home > p103.score_away) incrementVote(thirdPlaceVotes, hTeam);
        else if (p103.score_away > p103.score_home) incrementVote(thirdPlaceVotes, aTeam);
        else {
          if (p103.advance_on_penalties === hTeam) incrementVote(thirdPlaceVotes, hTeam);
          else if (p103.advance_on_penalties === aTeam) incrementVote(thirdPlaceVotes, aTeam);
        }
      }

      const m104 = bracket[104];
      const p104 = userPreds.find(p => p.match_id === allMatches.find(m => m.match_number === 104)?.id);
      if (m104 && p104 && p104.score_home !== null && p104.score_away !== null) {
        let hTeam = m104.team_home, aTeam = m104.team_away;
        if (p104.score_home > p104.score_away) { incrementVote(championVotes, hTeam); incrementVote(runnerUpVotes, aTeam); }
        else if (p104.score_away > p104.score_home) { incrementVote(championVotes, aTeam); incrementVote(runnerUpVotes, hTeam); }
        else {
          if (p104.advance_on_penalties === hTeam) { incrementVote(championVotes, hTeam); incrementVote(runnerUpVotes, aTeam); }
          else if (p104.advance_on_penalties === aTeam) { incrementVote(championVotes, aTeam); incrementVote(runnerUpVotes, hTeam); }
        }
      }
    });

    const groupAndSort = (voteMap) => {
      const arr = Object.values(voteMap).sort((a, b) => b.votes - a.votes);
      const grouped = [];
      arr.forEach(item => {
        const last = grouped[grouped.length - 1];
        if (last && last.votes === item.votes) last.teams.push(item);
        else grouped.push({ votes: item.votes, teams: [item] });
      });
      grouped.forEach(g => g.teams.sort((a, b) => translateTeam(a.id).localeCompare(translateTeam(b.id))));
      return grouped;
    };

    const advancedRankings = groupAndSort(advancedVotes);
    let currentRank = 1;
    const advancedList = advancedRankings.map(group => {
      const item = { rank: currentRank, ...group };
      currentRank += group.teams.length;
      return item;
    });

    statsMap['Mata-Mata'] = {
      champion: groupAndSort(championVotes)[0] || null,
      runnerUp: groupAndSort(runnerUpVotes)[0] || null,
      thirdPlace: groupAndSort(thirdPlaceVotes)[0] || null,
      advanced: advancedList,
      maxAdvancedVotes: advancedList.length > 0 ? advancedList[0].votes : 0,
      totalVoters: users.length
    };

    await supabase.from('app_cache').upsert({ key: 'global_stats', value: statsMap });
    console.log("Cached stats updated successfully.");
  } else {
    console.log("Skipping global stats calculation (done daily at 03:00 UTC) to save Egress.");
  }
}

syncScores().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
