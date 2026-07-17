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

  // 1. Fetch leagues to pick one
  const { data: leagues, error: lError } = await supabase.from('leagues').select('*').limit(1)
  if (lError) throw lError
  
  let leagueId = null
  if (leagues && leagues.length > 0) {
    leagueId = leagues[0].id
  } else {
    // create a mock league
    const { data: newL, error: nlErr } = await supabase.from('leagues').insert({ name: 'Visitantes', is_private: false }).select().single()
    if (nlErr) throw nlErr
    leagueId = newL.id
  }

  // 2. Create user in Auth
  console.log('Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in auth. We can try to log in to get the ID.')
    } else {
      throw authError
    }
  }

  // Find user id by logging in
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (loginErr) throw loginErr
  
  const authUser = loginData.user
  
  if (!authUser) {
    throw new Error('Could not find auth user after creation/login')
  }

  // 3. Insert user in `users` table if not exists
  console.log('Checking user table record...')
  const { data: existingUser } = await supabase.from('users').select('*').eq('auth_id', authUser.id).maybeSingle()
  if (!existingUser) {
    console.log('Inserting user table record...')
    const { error: dbError } = await supabase.from('users').insert({
      auth_id: authUser.id,
      name: 'Visitante (Demo)',
      league_id: leagueId
    })
    if (dbError) throw dbError
  } else {
    console.log('User already exists in users table.')
  }

  console.log('Visitor account created/verified successfully!')
}

run().catch(console.error)
