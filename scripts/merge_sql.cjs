const fs = require('fs');

const files = [
  'sql/schema.sql',
  'sql/add_password_and_unique_name.sql',
  'sql/create_admin_table.sql',
  'sql/update_predictions.sql',
  'supabase/migrations/20260609_add_penalties_matches.sql',
  'C:/Users/Otavio/.gemini/antigravity/brain/f9075341-269b-4de9-bd44-f2910e8f08b7/create_view.sql'
];

let fullSql = '';
for (const file of files) {
  if (fs.existsSync(file)) {
    fullSql += `\n\n-- File: ${file}\n`;
    fullSql += fs.readFileSync(file, 'utf8');
  } else {
    console.error(`File not found: ${file}`);
  }
}

// Add app_cache table creation if not exists in schema
if (!fullSql.includes('CREATE TABLE app_cache')) {
  fullSql += `

-- File: app_cache
CREATE TABLE IF NOT EXISTS public.app_cache (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.app_cache FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.app_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.app_cache FOR UPDATE USING (true);
`;
}

fs.writeFileSync('sql/full_schema.sql', fullSql, 'utf8');
console.log('Merged SQL created at sql/full_schema.sql');
