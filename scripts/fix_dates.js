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

const input = `
Sexta-feira, 12 de junho
    16h00 — Canadá x Bósnia e Herzegovina (Grupo B) — Toronto
    22h00 — Estados Unidos x Paraguai (Grupo D) — Los Angeles
Sábado, 13 de junho
    16h00 — Catar x Suíça (Grupo B) — São Francisco
    19h00 — Brasil x Marrocos (Grupo C) — Nova York
    22h00 — Haiti x Escócia (Grupo C) — Boston
Domingo, 14 de junho
    01h00 — Austrália x Turquia (Grupo D) — Vancouver
    14h00 — Alemanha x Curaçao (Grupo E) — Houston
    17h00 — Holanda x Japão (Grupo F) — Dallas
    20h00 — Costa do Marfim x Equador (Grupo E) — Filadélfia
    23h00 — Suécia x Tunísia (Grupo F) — Monterrey
Segunda-feira, 15 de junho
    13h00 — Espanha x Cabo Verde (Grupo H) — Atlanta
    16h00 — Bélgica x Egito (Grupo G) — Seattle
    19h00 — Arábia Saudita x Uruguai (Grupo H) — Miami
    22h00 — Irã x Nova Zelândia (Grupo G) — Los Angeles
Terça-feira, 16 de junho
    16h00 — França x Senegal (Grupo I) — Nova York
    19h00 — Iraque x Noruega (Grupo I) — Boston
    22h00 — Argentina x Argélia (Grupo J) — Kansas City
Quarta-feira, 17 de junho
    01h00 — Áustria x Jordânia (Grupo J) — São Francisco
    14h00 — Portugal x República Democrática do Congo (Grupo K) — Houston
    17h00 — Inglaterra x Croácia (Grupo L) — Dallas
    20h00 — Gana x Panamá (Grupo L) — Toronto
    23h00 — Uzbequistão x Colômbia (Grupo K) — Cidade do México
Quinta-feira, 18 de junho
    13h00 — República Tcheca x África do Sul (Grupo A) — Atlanta
    16h00 — Suíça x Bósnia e Herzegovina (Grupo B) — Los Angeles
    19h00 — Canadá x Catar (Grupo B) — Vancouver
    22h00 — México x Coreia do Sul (Grupo A) — Guadalajara
Sexta-feira, 19 de junho
    16h00 — Estados Unidos x Austrália (Grupo D) — Seattle
    19h00 — Escócia x Marrocos (Grupo C) — Boston
    21h30 — Brasil x Haiti (Grupo C) — Filadélfia
Sábado, 20 de junho
    00h00 — Turquia x Paraguai (Grupo D) — São Francisco
    14h00 — Holanda x Suécia (Grupo F) — Houston
    17h00 — Alemanha x Costa do Marfim (Grupo E) — Toronto
    21h00 — Equador x Curaçao (Grupo E) — Kansas City
Domingo, 21 de junho
    01h00 — Tunísia x Japão (Grupo F) — Monterrey
    13h00 — Espanha x Arábia Saudita (Grupo H) — Atlanta
    16h00 — Bélgica x Irã (Grupo G) — Los Angeles
    19h00 — Uruguai x Cabo Verde (Grupo H) — Miami
    22h00 — Nova Zelândia x Egito (Grupo G) — Vancouver
Segunda-feira, 22 de junho
    14h00 — Argentina x Áustria (Grupo J) — Dallas
    18h00 — França x Iraque (Grupo I) — Filadélfia
    21h00 — Noruega x Senegal (Grupo I) — Nova York
Terça-feira, 23 de junho
    00h00 — Jordânia x Argélia (Grupo J) — São Francisco
    14h00 — Portugal x Uzbequistão (Grupo K) — Houston
    17h00 — Inglaterra x Gana (Grupo L) — Boston
    20h00 — Panamá x Croácia (Grupo L) — Toronto
    23h00 — Colômbia x República Democrática do Congo (Grupo K) — Guadalajara
Quarta-feira, 24 de junho
    16h00 — Suíça x Canadá (Grupo B) — Vancouver
    16h00 — Bósnia e Herzegovina x Catar (Grupo B) — Seattle
    19h00 — Escócia x Brasil (Grupo C) — Miami
    19h00 — Marrocos x Haiti (Grupo C) — Atlanta
    22h00 — República Tcheca x México (Grupo A) — Cidade do México
    22h00 — África do Sul x Coreia do Sul (Grupo A) — Monterrey
Quinta-feira, 25 de junho
    17h00 — Curaçao x Costa do Marfim (Grupo E) — Filadélfia
    17h00 — Equador x Alemanha (Grupo E) — Nova York
    20h00 — Japão x Suécia (Grupo F) — Dallas
    20h00 — Tunísia x Holanda (Grupo F) — Kansas City
    23h00 — Turquia x Estados Unidos (Grupo D) — Los Angeles
    23h00 — Paraguai x Austrália (Grupo D) — São Francisco
Sexta-feira, 26 de junho
    16h00 — Noruega x França (Grupo I) — Boston
    16h00 — Senegal x Iraque (Grupo I) — Toronto
    21h00 — Cabo Verde x Arábia Saudita (Grupo H) — Houston
    21h00 — Uruguai x Espanha (Grupo H) — Guadalajara
Sábado, 27 de junho
    00h00 — Egito x Irã (Grupo G) — Seattle
    00h00 — Nova Zelândia x Bélgica (Grupo G) — Vancouver
    18h00 — Panamá x Inglaterra (Grupo L) — Nova York
    18h00 — Croácia x Gana (Grupo L) — Filadélfia
    20h30 — Colômbia x Portugal (Grupo K) — Miami
    20h30 — República Democrática do Congo x Uzbequistão (Grupo K) — Atlanta
    23h00 — Argélia x Áustria (Grupo J) — Kansas City
    23h00 — Jordânia x Argentina (Grupo J) — Dallas
Domingo, 28 de junho
    16h00 — Jogo 73 — 2º do Grupo A x 2º do Grupo B — Los Angeles
Segunda-feira, 29 de junho
    14h00 — Jogo 76 — 1º do Grupo C x 2º do Grupo F — Houston
    17h30 — Jogo 74 — 1º do Grupo E x 3º dos Grupos A/B/C/D/F — Boston
    22h00 — Jogo 75 — 1º do Grupo F x 2º do Grupo C — Monterrey
Terça-feira, 30 de junho
    14h00 — Jogo 78 — 2º do Grupo E x 2º do Grupo I — Dallas
    18h00 — Jogo 77 — 1º do Grupo I x 3º dos Grupos C/D/F/G/H — Nova York
    22h00 — Jogo 79 — 1º do Grupo A x 3º dos Grupos C/E/F/H/I — Cidade do México
Quarta-feira, 1º de julho
    13h00 — Jogo 80 — 1º do Grupo L x 3º dos Grupos E/H/I/J/K — Atlanta
    17h00 — Jogo 82 — 1º do Grupo G x 3º dos Grupos A/E/H/I/J — Seattle
    21h00 — Jogo 81 — 1º do Grupo D x 3º dos Grupos B/E/F/I/J — São Francisco
Quinta-feira, 2 de julho
    16h00 — Jogo 84 — 1º do Grupo H x 2º do Grupo J — Los Angeles
    20h00 — Jogo 83 — 2º do Grupo K x 2º do Grupo L — Toronto
Sexta-feira, 3 de julho
    00h00 — Jogo 85 — 1º do Grupo B x 3º dos Grupos E/F/G/I/J — Vancouver
    15h00 — Jogo 88 — 2º do Grupo D x 2º do Grupo G — Dallas
    19h00 — Jogo 86 — 1º do Grupo J x 2º do Grupo H — Miami
    22h30 — Jogo 87 — 1º do Grupo K x 3º dos Grupos D/E/I/J/L — Kansas City
Sábado, 4 de julho
    14h00 — Jogo 90 — Vencedor do Jogo 73 x Vencedor do Jogo 75 — Houston
    18h00 — Jogo 89 — Vencedor do Jogo 74 x Vencedor do Jogo 77 — Filadélfia
Domingo, 5 de julho
    17h00 — Jogo 91 — Vencedor do Jogo 76 x Vencedor do Jogo 78 — Nova York
    21h00 — Jogo 92 — Vencedor do Jogo 79 x Vencedor do Jogo 80 — Cidade do México
Segunda-feira, 6 de julho
    16h00 — Jogo 93 — Vencedor do Jogo 83 x Vencedor do Jogo 84 — Dallas
    21h00 — Jogo 94 — Vencedor do Jogo 81 x Vencedor do Jogo 82 — Seattle
Terça-feira, 7 de julho
    13h00 — Jogo 95 — Vencedor do Jogo 86 x Vencedor do Jogo 88 — Atlanta
    17h00 — Jogo 96 — Vencedor do Jogo 85 x Vencedor do Jogo 87 — Vancouver
Quinta-feira, 9 de julho
    17h00 — Jogo 97 — Vencedor do Jogo 89 x Vencedor do Jogo 90 — Boston
Sexta-feira, 10 de julho
    16h00 — Jogo 98 — Vencedor do Jogo 93 x Vencedor do Jogo 94 — Los Angeles
Sábado, 11 de julho
    18h00 — Jogo 99 — Vencedor do Jogo 91 x Vencedor do Jogo 92 — Miami
    22h00 — Jogo 100 — Vencedor do Jogo 95 x Vencedor do Jogo 96 — Kansas City
Terça-feira, 14 de julho
    16h00 — Jogo 101 — Vencedor do Jogo 97 x Vencedor do Jogo 98 — Dallas
Quarta-feira, 15 de julho
    16h00 — Jogo 102 — Vencedor do Jogo 99 x Vencedor do Jogo 100 — Atlanta
Sábado, 18 de julho
    18h00 — Jogo 103 — Perdedor do Jogo 101 x Perdedor do Jogo 102 — Miami
Domingo, 19 de julho
    16h00 — Jogo 104 — Vencedor do Jogo 101 x Vencedor do Jogo 102 — Nova York/Nova Jersey
`;

const teamMap = {
  'Canadá': 'Canada',
  'Bósnia e Herzegovina': 'Bosnia and Herzegovina',
  'Estados Unidos': 'United States',
  'Paraguai': 'Paraguay',
  'Catar': 'Qatar',
  'Suíça': 'Switzerland',
  'Brasil': 'Brazil',
  'Marrocos': 'Morocco',
  'Haiti': 'Haiti',
  'Escócia': 'Scotland',
  'Austrália': 'Australia',
  'Turquia': 'Turkey',
  'Alemanha': 'Germany',
  'Curaçao': 'Curaçao',
  'Holanda': 'Netherlands',
  'Japão': 'Japan',
  'Costa do Marfim': 'Ivory Coast',
  'Equador': 'Ecuador',
  'Suécia': 'Sweden',
  'Tunísia': 'Tunisia',
  'Espanha': 'Spain',
  'Cabo Verde': 'Cape Verde',
  'Bélgica': 'Belgium',
  'Egito': 'Egypt',
  'Arábia Saudita': 'Saudi Arabia',
  'Uruguai': 'Uruguay',
  'Irã': 'Iran',
  'Nova Zelândia': 'New Zealand',
  'França': 'France',
  'Senegal': 'Senegal',
  'Iraque': 'Iraq',
  'Noruega': 'Norway',
  'Argentina': 'Argentina',
  'Argélia': 'Algeria',
  'Áustria': 'Austria',
  'Jordânia': 'Jordan',
  'Portugal': 'Portugal',
  'República Democrática do Congo': 'Democratic Republic of the Congo',
  'Inglaterra': 'England',
  'Croácia': 'Croatia',
  'Gana': 'Ghana',
  'Panamá': 'Panama',
  'Uzbequistão': 'Uzbekistan',
  'Colômbia': 'Colombia',
  'República Tcheca': 'Czech Republic',
  'África do Sul': 'South Africa',
  'Coreia do Sul': 'South Korea',
  'México': 'Mexico'
};

const regexDate = /^(.*?),\s+(\d+)\s+de\s+(junho|julho)/i;
const regexMatch = /^\s*(\d{2})h(\d{2})\s+—\s+(.*?)\s+x\s+(.*?)(?:\s+—|\s+\(Grupo|$)/;
const regexJogo = /^\s*(\d{2})h(\d{2})\s+—\s+Jogo\s+(\d+)\s+—/;

async function run() {
  const { data: matches } = await supabase.from('matches').select('*');
  let currentMonth = 6;
  let currentDay = 12;
  
  let updates = [];

  const lines = input.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;

    const dateMatch = line.match(regexDate);
    if (dateMatch) {
      currentDay = parseInt(dateMatch[2]);
      currentMonth = dateMatch[3].toLowerCase() === 'junho' ? 6 : 7;
      continue;
    }

    const jogoMatch = line.match(regexJogo);
    if (jogoMatch) {
      let hh = parseInt(jogoMatch[1]);
      let mm = parseInt(jogoMatch[2]);
      let matchNum = parseInt(jogoMatch[3]);
      
      let dateObj = new Date(Date.UTC(2026, currentMonth - 1, currentDay, hh + 3, mm, 0)); // +3 for BRT
      let isoStr = dateObj.toISOString().replace('T', ' ').replace('.000Z', '+00');
      
      let dbMatch = matches.find(m => m.match_number === matchNum);
      if (dbMatch) {
        updates.push({ match_number: matchNum, match_date: isoStr });
      }
      continue;
    }

    const matchRe = line.match(regexMatch);
    if (matchRe) {
      let hh = parseInt(matchRe[1]);
      let mm = parseInt(matchRe[2]);
      let t1 = matchRe[3].trim();
      let t2 = matchRe[4].split(' (Grupo')[0].trim();
      
      let dateObj = new Date(Date.UTC(2026, currentMonth - 1, currentDay, hh + 3, mm, 0)); // +3 for BRT to UTC
      let isoStr = dateObj.toISOString().replace('T', ' ').replace('.000Z', '+00');
      
      let enT1 = teamMap[t1] || t1;
      let enT2 = teamMap[t2] || t2;
      
      let dbMatch = matches.find(m => 
        (m.team_home === enT1 && m.team_away === enT2) ||
        (m.team_home === enT2 && m.team_away === enT1)
      );
      
      if (dbMatch) {
        updates.push({ match_number: dbMatch.match_number, match_date: isoStr });
      } else {
        console.log("NOT FOUND:", enT1, "vs", enT2);
      }
    }
  }

  console.log(`Found ${updates.length} matches to update.`);
  for (const u of updates) {
    const { error } = await supabase.from('matches').update({ match_date: u.match_date }).eq('match_number', u.match_number);
    if (error) console.error("Error updating match", u.match_number, error);
  }
  console.log("Finished updating matches in the database.");
}

run();
