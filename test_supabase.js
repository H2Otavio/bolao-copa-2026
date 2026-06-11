import { createClient } from '@supabase/supabase-js';

const url = 'https://lnhkoexqppewtmjopfun.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGtvZXhxcHBld3Rtam9wZnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MzU2NjYsImV4cCI6MjA5NjExMTY2Nn0.6oTnhhDtJjBORCYuSvdo4MVduncGH0_M84RhCYdTzyg';

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('matches').update({score_home: 0}).eq('match_number', 1).select();
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
