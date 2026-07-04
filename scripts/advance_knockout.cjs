const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const flagMap = {
  'South Africa': '🇿🇦', 'Canada': '🇨🇦', 'Germany': '🇩🇪', 'Paraguay': '🇵🇾',
  'Netherlands': '🇳🇱', 'Morocco': '🇲🇦', 'Brazil': '🇧🇷', 'Japan': '🇯🇵',
  'France': '🇫🇷', 'Sweden': '🇸🇪', 'Ivory Coast': '🇨🇮', 'Norway': '🇳🇴',
  'Mexico': '🇲🇽', 'Ecuador': '🇪🇨', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Democratic Republic of the Congo': '🇨🇩',
  'United States': '🇺🇸', 'Bosnia and Herzegovina': '🇧🇦', 'Belgium': '🇧🇪', 'Senegal': '🇸🇳',
  'Portugal': '🇵🇹', 'Croatia': '🇭🇷', 'Spain': '🇪🇸', 'Austria': '🇦🇹',
  'Switzerland': '🇨🇭', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷', 'Cape Verde': '🇨🇻',
  'Colombia': '🇨🇴', 'Ghana': '🇬🇭', 'Australia': '🇦🇺', 'Egypt': '🇪🇬',
};

async function run() {
  const { data: matches, error } = await supabase.from('matches').select('*');
  if (error || !matches) {
    console.error("Error fetching matches:", error);
    return;
  }
  
  const results = {};
  for (const m of matches) {
    if (m.team_home && m.flag_home) flagMap[m.team_home] = m.flag_home;
    if (m.team_away && m.flag_away) flagMap[m.team_away] = m.flag_away;

    if (m.score_home !== null && m.score_away !== null) {
      let winner = null;
      let loser = null;
      if (m.score_home > m.score_away) {
        winner = m.team_home;
        loser = m.team_away;
      } else if (m.score_away > m.score_home) {
        winner = m.team_away;
        loser = m.team_home;
      } else if (m.advance_on_penalties) {
        winner = m.advance_on_penalties;
        loser = m.team_home === winner ? m.team_away : m.team_home;
      }
      
      if (winner && loser) {
        results[m.match_number] = { winner, loser };
      }
    }
  }

  let updated = 0;
  for (const m of matches) {
    if (!m.cup_group || m.cup_group.length === 1) continue;
    
    let newHome = m.team_home;
    let newAway = m.team_away;

    const homeWinMatch = m.team_home?.match(/Winner Match (\d+)/);
    if (homeWinMatch && results[homeWinMatch[1]]) {
      newHome = results[homeWinMatch[1]].winner;
    }
    const awayWinMatch = m.team_away?.match(/Winner Match (\d+)/);
    if (awayWinMatch && results[awayWinMatch[1]]) {
      newAway = results[awayWinMatch[1]].winner;
    }

    const homeLoseMatch = m.team_home?.match(/Loser Match (\d+)/);
    if (homeLoseMatch && results[homeLoseMatch[1]]) {
      newHome = results[homeLoseMatch[1]].loser;
    }
    const awayLoseMatch = m.team_away?.match(/Loser Match (\d+)/);
    if (awayLoseMatch && results[awayLoseMatch[1]]) {
      newAway = results[awayLoseMatch[1]].loser;
    }

    if (newHome !== m.team_home || newAway !== m.team_away) {
      const payload = {
        team_home: newHome,
        flag_home: flagMap[newHome] || null,
        team_away: newAway,
        flag_away: flagMap[newAway] || null
      };
      
      console.log(`Updating Match ${m.match_number}: ${newHome} vs ${newAway}`);
      await supabase.from('matches').update(payload).eq('id', m.id);
      updated++;
    }
  }
  
  console.log(`Successfully updated ${updated} matches!`);
}

run();
