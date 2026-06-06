const fs = require('fs');
const teamsData = require('C:/Users/Otavio/.gemini/antigravity/scratch/worldcup_api/football.teams.json');
const matchesData = require('C:/Users/Otavio/.gemini/antigravity/scratch/worldcup_api/football.matches.json');

const teamsMap = {};
teamsData.forEach(t => {
  let flagEmoji = '🏳️';
  if (t.iso2) {
    flagEmoji = String.fromCodePoint(
      t.iso2.toUpperCase().charCodeAt(0) + 127397,
      t.iso2.toUpperCase().charCodeAt(1) + 127397
    );
  }
  teamsMap[t.id] = { name: t.name_en, flag: flagEmoji };
});

let sql = `-- ============================================================
-- BOLÃO DA COPA 2026 — Schema Atualizado com 104 Jogos
-- ============================================================

-- 1. Alterar tamanho do cup_group para suportar 'R32', 'FINAL' etc.
ALTER TABLE matches ALTER COLUMN cup_group TYPE VARCHAR(10);

-- 2. Limpar os jogos atuais para inserir os oficiais
DELETE FROM matches;

-- 3. Inserir os 104 jogos
INSERT INTO matches (cup_group, match_date, team_home, team_away, flag_home, flag_away, match_number) VALUES
`;

const values = [];
matchesData.forEach(m => {
  const isTBDHome = m.home_team_id === "0";
  const isTBDAway = m.away_team_id === "0";

  const tHome = isTBDHome ? m.home_team_label : (teamsMap[m.home_team_id]?.name || 'TBD');
  const tAway = isTBDAway ? m.away_team_label : (teamsMap[m.away_team_id]?.name || 'TBD');
  
  const fHome = isTBDHome ? '❓' : (teamsMap[m.home_team_id]?.flag || '🏳️');
  const fAway = isTBDAway ? '❓' : (teamsMap[m.away_team_id]?.flag || '🏳️');

  let dateStr = m.local_date;
  if(dateStr) {
     const [datePart, timePart] = dateStr.split(' ');
     const [mm, dd, yyyy] = datePart.split('/');
     dateStr = `${yyyy}-${mm}-${dd} ${timePart}:00+00`;
  } else {
     dateStr = '2026-06-11 00:00:00+00';
  }

  const esc = str => (str || '').replace(/'/g, "''");

  values.push(`('${m.group.toUpperCase()}', '${dateStr}', '${esc(tHome)}', '${esc(tAway)}', '${fHome}', '${fAway}', ${m.id})`);
});

sql += values.join(',\n') + ';\n';

fs.mkdirSync('E:/Workspaces/bolao-copa-2026/sql', { recursive: true });
fs.writeFileSync('E:/Workspaces/bolao-copa-2026/sql/seed_104_matches.sql', sql);
console.log('Arquivo gerado com sucesso em sql/seed_104_matches.sql');
