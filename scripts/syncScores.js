import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncScores() {
  console.log("Starting score synchronization with worldcup26.ir...");

  const url = `https://worldcup26.ir/get/games`;

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`API Error: ${response.status}`);
    const text = await response.text();
    console.error(text);
    process.exit(1);
  }

  const json = await response.json();
  // The API returns an object with a "games" array
  const fixtures = Array.isArray(json.games) ? json.games : (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));

  console.log(`Found ${fixtures.length} matches in the API.`);

  if (fixtures.length === 0) return;

  // We fetch all current matches from Supabase to match them
  const { data: dbMatches, error: dbError } = await supabase.from('matches').select('*');
  if (dbError) {
    console.error("Error fetching DB matches:", dbError);
    process.exit(1);
  }
  
  let updatedCount = 0;

  for (const fixture of fixtures) {
    // API match id usually maps directly to our match_number
    const apiId = fixture.id || fixture.match_number;
    const isFinished = fixture.finished === "TRUE" || fixture.finished === true;
    
    // Convert scores to numbers safely
    const scoreHome = parseInt(fixture.home_score, 10);
    const scoreAway = parseInt(fixture.away_score, 10);

    // Only process if the match has started
    if (fixture.time_elapsed !== 'notstarted' && !isNaN(scoreHome) && !isNaN(scoreAway)) {
      
      const match = dbMatches.find(m => m.match_number === apiId || (m.team_home === fixture.home_team_en && m.team_away === fixture.away_team_en));

      if (match) {
        // Check if we actually need to update (to avoid unnecessary DB writes)
        const needsUpdate = 
          match.score_home !== scoreHome || 
          match.score_away !== scoreAway ||
          match.finished !== isFinished;

        if (needsUpdate) {
          const updatePayload = {
            score_home: scoreHome,
            score_away: scoreAway,
            finished: isFinished
          };

          const { error: updateError } = await supabase
            .from('matches')
            .update(updatePayload)
            .eq('id', match.id);

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

  console.log(`Synchronization complete. Updated ${updatedCount} matches.`);
}

syncScores().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
