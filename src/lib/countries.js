const countryDict = {
  "Mexico": "México",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  "Czech Republic": "República Tcheca",
  "Canada": "Canadá",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "United States": "Estados Unidos",
  "Paraguay": "Paraguai",
  "Haiti": "Haiti",
  "Scotland": "Escócia",
  "Australia": "Austrália",
  "Turkey": "Turquia",
  "Brazil": "Brasil",
  "Morocco": "Marrocos",
  "Qatar": "Catar",
  "Switzerland": "Suíça",
  "Ivory Coast": "Costa do Marfim",
  "Ecuador": "Equador",
  "Germany": "Alemanha",
  "Curaçao": "Curaçao",
  "Netherlands": "Holanda",
  "Japan": "Japão",
  "Sweden": "Suécia",
  "Tunisia": "Tunísia",
  "Iran": "Irã",
  "New Zealand": "Nova Zelândia",
  "Spain": "Espanha",
  "Cape Verde": "Cabo Verde",
  "Belgium": "Bélgica",
  "Egypt": "Egito",
  "Saudi Arabia": "Arábia Saudita",
  "Uruguay": "Uruguai",
  "France": "França",
  "Senegal": "Senegal",
  "Iraq": "Iraque",
  "Norway": "Noruega",
  "Argentina": "Argentina",
  "Algeria": "Argélia",
  "Austria": "Áustria",
  "Jordan": "Jordânia",
  "Portugal": "Portugal",
  "Democratic Republic of the Congo": "R.D. Congo",
  "England": "Inglaterra",
  "Croatia": "Croácia",
  "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia",
  "Ghana": "Gana",
  "Panama": "Panamá"
}

export function translateTeam(name) {
  if (!name) return '';
  
  if (countryDict[name]) return countryDict[name];

  // Traduzir os nomes genéricos de mata-mata
  let translated = name;
  translated = translated.replace(/Winner Group/g, '1º do Grupo');
  translated = translated.replace(/Runner-up Group/g, '2º do Grupo');
  translated = translated.replace(/3rd Group/g, '3º do Gr.');
  translated = translated.replace(/Winner Match/g, 'Vencedor Jogo');
  translated = translated.replace(/Loser Match/g, 'Perdedor Jogo');
  
  return translated;
}
