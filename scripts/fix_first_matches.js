import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: matches } = await supabase.from('matches').select('*').in('match_number', [1, 2]);
  
  for (const match of matches) {
    let dateObj = new Date(match.match_date);
    dateObj.setHours(dateObj.getHours() + 6);
    let isoStr = dateObj.toISOString().replace('T', ' ').replace('.000Z', '+00');
    
    console.log(`Updating Match ${match.match_number} to ${isoStr}`);
    
    const { error } = await supabase.from('matches').update({ match_date: isoStr }).eq('match_number', match.match_number);
    if (error) {
      console.error("Error updating match", match.match_number, error);
    }
  }
  
  console.log("Finished updating matches 1 and 2 in the database.");
}

run();
