const url = 'https://lnhkoexqppewtmjopfun.supabase.co/rest/v1/predictions?select=match_id,score_home,score_away,is_simulated,simulated_team_home,simulated_team_away,advance_on_penalties';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGtvZXhxcHBld3Rtam9wZnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MzU2NjYsImV4cCI6MjA5NjExMTY2Nn0.6oTnhhDtJjBORCYuSvdo4MVduncGH0_M84RhCYdTzyg';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(res => res.json()).then(data => {
  console.log("Total predictions:", data.length);
  const sim = data.filter(d => d.is_simulated);
  console.log("Simulated predictions:", sim.length);
  console.log(sim.slice(0, 5));
});
