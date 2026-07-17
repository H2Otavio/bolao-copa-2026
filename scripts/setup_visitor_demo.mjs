import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envStr = fs.readFileSync('.env', 'utf8')
const urlMatch = envStr.match(/VITE_SUPABASE_URL=(.*)/)
const keyMatch = envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/)

if (!urlMatch || !keyMatch) {
  console.error("Missing supabase URL or VITE_SUPABASE_ANON_KEY in .env")
  process.exit(1)
}

const url = urlMatch[1].trim()
const key = keyMatch[1].trim()

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const email = 'visitante@bolao2026.com'
  const password = 'visitante2026'

  // Log in as visitor
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (loginErr) throw loginErr
  
  const authUser = loginData.user

  // Get user profile
  const { data: userProfile, error: profileErr } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single()
    
  if (profileErr) throw profileErr
  
  console.log('Updating league name to "Demonstração"...')
  const { error: leagueErr } = await supabase
    .from('leagues')
    .update({ name: 'Demonstração' })
    .eq('id', userProfile.league_id)
    
  if (leagueErr) throw leagueErr
  
  console.log('Fetching all matches...')
  const { data: matches, error: matchesErr } = await supabase
    .from('matches')
    .select('id, cup_group, team_home, team_away')
    
  if (matchesErr) throw matchesErr
  
  console.log('Generating random predictions...')
  const predictions = matches.map(m => {
    // Random score between 0 and 3
    const p = {
      user_id: userProfile.id,
      match_id: m.id,
      score_home: Math.floor(Math.random() * 4),
      score_away: Math.floor(Math.random() * 4),
      is_simulated: false
    }
    
    // For knockout matches, add a simulated team just in case
    if (m.cup_group && m.cup_group.length > 1) {
      p.is_simulated = true
      p.simulated_team_home = m.team_home
      p.simulated_team_away = m.team_away
      if (p.score_home === p.score_away) {
        p.advance_on_penalties = Math.random() > 0.5 ? m.team_home : m.team_away
      }
    }
    
    return p
  })
  
  console.log('Upserting predictions...')
  const { error: insertErr } = await supabase
    .from('predictions')
    .upsert(predictions)
    
  if (insertErr) throw insertErr
  
  console.log('Done! League updated and random predictions inserted.')
}

run().catch(console.error)
