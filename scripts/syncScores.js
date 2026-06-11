import { createClient } from '@supabase/supabase-js';

const API_SPORTS_KEY = process.env.API_SPORTS_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!API_SPORTS_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables. Make sure API_SPORTS_KEY, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY are set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncScores() {
  console.log("Starting score synchronization with API-Sports...");

  // API-Sports league 1 is World Cup, season 2026
  // We fetch ALL matches for the tournament (104 matches) at once.
  // This costs exactly 1 request per run, avoiding timezone/date edge cases.
  const url = `https://v3.football.api-sports.io/fixtures?league=1&season=2026`;

  const response = await fetch(url, {
    headers: {
      'x-apisports-key': API_SPORTS_KEY
    }
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status}`);
    const text = await response.text();
    console.error(text);
    process.exit(1);
  }

  const data = await response.json();
  const fixtures = data.response || [];

  console.log(`Found ${fixtures.length} matches in the tournament.`);

  if (fixtures.length === 0) return;

  // We fetch all current matches from Supabase to match them
  const { data: dbMatches, error: dbError } = await supabase.from('matches').select('*');
  if (dbError) {
    console.error("Error fetching DB matches:", dbError);
    process.exit(1);
  }
  
  // Mapping API names to our names if necessary, though mostly identical in English
  const nameMap = {
    "United States": "USA",
    "Korea Republic": "South Korea",
    "Korea DPR": "North Korea"
  };

  let updatedCount = 0;

  for (const fixtureObj of fixtures) {
    const fixture = fixtureObj.fixture;
    const teams = fixtureObj.teams;
    const goals = fixtureObj.goals;
    const score = fixtureObj.score;
    
    // Statuses that mean the match is finished:
    // 'FT' (Full Time), 'AET' (After Extra Time), 'PEN' (Penalties)
    const status = fixture.status.short;
    if (['FT', 'AET', 'PEN'].includes(status)) {
      
      const homeTeamAPI = teams.home.name;
      const awayTeamAPI = teams.away.name;
      
      const homeTeam = nameMap[homeTeamAPI] || homeTeamAPI;
      const awayTeam = nameMap[awayTeamAPI] || awayTeamAPI;

      // Find match in DB by comparing team names
      const match = dbMatches.find(m => 
        m.team_home.toLowerCase() === homeTeam.toLowerCase() && 
        m.team_away.toLowerCase() === awayTeam.toLowerCase()
      );

      if (match) {
        // Check if we actually need to update (to avoid unnecessary DB writes)
        const needsUpdate = 
          match.score_home !== goals.home || 
          match.score_away !== goals.away ||
          (status === 'PEN' && score.penalty.home !== null && score.penalty.away !== null && !match.advance_on_penalties);

        if (needsUpdate) {
          const updatePayload = {
            score_home: goals.home,
            score_away: goals.away
          };

          // Handle penalties if applicable
          if (status === 'PEN' && score.penalty.home !== null && score.penalty.away !== null) {
            if (score.penalty.home > score.penalty.away) {
              updatePayload.advance_on_penalties = match.team_home;
            } else {
              updatePayload.advance_on_penalties = match.team_away;
            }
          }

          const { error: updateError } = await supabase
            .from('matches')
            .update(updatePayload)
            .eq('id', match.id);

          if (updateError) {
            console.error(`Failed to update ${homeTeam} vs ${awayTeam}:`, updateError);
          } else {
            console.log(`Successfully updated ${homeTeam} vs ${awayTeam} (${goals.home} - ${goals.away}) in database.`);
            updatedCount++;
          }
        }
      }
    }
  }

  console.log(`Synchronization complete. Updated ${updatedCount} matches.`);
}

syncScores().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
