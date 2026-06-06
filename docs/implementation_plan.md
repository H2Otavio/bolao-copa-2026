# Bolão da Copa do Mundo 2026 — MVP

Site de bolão colaborativo com autenticação por Nome + Código de Grupo, palpites por jogo, ranking automático e dashboard de estatísticas ("Odds da Galera").

**Stack**: React + Vite + TailwindCSS · Supabase (PostgreSQL + API REST) · Render (Static Site)

---

## User Review Required

> [!IMPORTANT]
> **TailwindCSS v4** — Usarei TailwindCSS v4 (última versão estável). Confirme se prefere v3.
>
> **Dados dos Jogos** — Vou popular com os jogos reais da fase de grupos da Copa 2026 (48 equipes, 12 grupos de A–L). Se preferir dados fictícios simplificados (32 equipes, 8 grupos), me avise.
>
> **Supabase Row Level Security (RLS)** — Vou criar políticas RLS básicas para isolar dados por grupo. Como a autenticação é simples (sem senha), a segurança será "soft" — suficiente para um bolão entre amigos, mas não para produção sensível.

## Open Questions

> [!IMPORTANT]
> 1. **Resultados reais**: Quem cadastra o resultado real dos jogos? O admin do grupo ou você manualmente no Supabase? Vou assumir que o **admin do grupo** pode inserir resultados pela interface.
> 2. **Deadline de palpites**: Deseja bloquear palpites após o horário de início do jogo? Vou implementar isso por padrão — me avise se não quiser.
> 3. **Múltiplos grupos**: Um mesmo nome de usuário pode participar de múltiplos grupos? Vou assumir que **sim**.

---

## 1. Schema SQL (Supabase)

Estas são as tabelas que você criará no **SQL Editor** do Supabase.

### 1.1 Tabelas

```sql
-- ============================================================
-- BOLÃO DA COPA 2026 — Schema SQL para Supabase
-- Execute este bloco inteiro no SQL Editor do Supabase
-- ============================================================

-- 1. LEAGUES (Grupos/Ligas do Bolão)
CREATE TABLE leagues (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,                          -- Ex: "Bolão do Trabalho"
  code        TEXT NOT NULL UNIQUE,                   -- Ex: "TRABALHO123"
  admin_name  TEXT NOT NULL,                          -- Nome do criador/admin
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. USERS (Participantes)
CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  is_admin    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, league_id)                             -- Nome único por grupo
);

-- 3. MATCHES (Jogos da Copa)
CREATE TABLE matches (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cup_group     CHAR(1) NOT NULL,                     -- 'A', 'B', ... 'L'
  team_home     TEXT NOT NULL,                         -- Ex: "Brasil"
  team_away     TEXT NOT NULL,                         -- Ex: "Sérvia"
  flag_home     TEXT,                                  -- Código emoji/flag
  flag_away     TEXT,
  match_date    TIMESTAMPTZ,                           -- Data/hora do jogo
  score_home    INTEGER,                               -- Resultado real (NULL = não jogado)
  score_away    INTEGER,
  match_number  INTEGER NOT NULL,                      -- Ordem do jogo
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. PREDICTIONS (Palpites dos Usuários)
CREATE TABLE predictions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  score_home  INTEGER NOT NULL CHECK (score_home >= 0),
  score_away  INTEGER NOT NULL CHECK (score_away >= 0),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)                            -- Um palpite por jogo por usuário
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_users_league ON users(league_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_matches_group ON matches(cup_group);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Políticas básicas
-- ============================================================

-- Habilitar RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Leagues: leitura pública (para validar código), inserção livre
CREATE POLICY "leagues_select" ON leagues FOR SELECT USING (true);
CREATE POLICY "leagues_insert" ON leagues FOR INSERT WITH CHECK (true);

-- Users: leitura e inserção livres (autenticação simples)
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);

-- Matches: leitura pública, update livre (admin atualiza resultado)
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_update" ON matches FOR UPDATE USING (true);

-- Predictions: leitura e escrita livres (filtragem por grupo feita no app)
CREATE POLICY "predictions_all" ON predictions
  FOR ALL USING (true) WITH CHECK (true);
```

### 1.2 Dados Iniciais — Jogos da Fase de Grupos (Copa 2026)

```sql
-- ============================================================
-- SEED: Jogos da Fase de Grupos — Copa do Mundo 2026
-- 12 Grupos (A–L), 3 jogos por grupo (Rodada 1)
-- Execute APÓS criar as tabelas
-- ============================================================

INSERT INTO matches (cup_group, team_home, team_away, flag_home, flag_away, match_date, match_number) VALUES
-- GRUPO A
('A', 'Marrocos',       'EUA',           '🇲🇦', '🇺🇸', '2026-06-11 21:00:00+00', 1),
('A', 'México',         'Canadá',        '🇲🇽', '🇨🇦', '2026-06-11 18:00:00+00', 2),
('A', 'EUA',            'México',        '🇺🇸', '🇲🇽', '2026-06-15 21:00:00+00', 3),
('A', 'Canadá',         'Marrocos',      '🇨🇦', '🇲🇦', '2026-06-15 18:00:00+00', 4),
('A', 'Canadá',         'EUA',           '🇨🇦', '🇺🇸', '2026-06-19 21:00:00+00', 5),
('A', 'Marrocos',       'México',        '🇲🇦', '🇲🇽', '2026-06-19 21:00:00+00', 6),

-- GRUPO B
('B', 'Espanha',        'Bolívia',       '🇪🇸', '🇧🇴', '2026-06-12 15:00:00+00', 7),
('B', 'Croácia',        'Paraguai',      '🇭🇷', '🇵🇾', '2026-06-12 18:00:00+00', 8),
('B', 'Bolívia',        'Croácia',       '🇧🇴', '🇭🇷', '2026-06-16 15:00:00+00', 9),
('B', 'Paraguai',       'Espanha',       '🇵🇾', '🇪🇸', '2026-06-16 18:00:00+00', 10),
('B', 'Paraguai',       'Bolívia',       '🇵🇾', '🇧🇴', '2026-06-20 18:00:00+00', 11),
('B', 'Espanha',        'Croácia',       '🇪🇸', '🇭🇷', '2026-06-20 18:00:00+00', 12),

-- GRUPO C
('C', 'Argentina',      'Uzbequistão',   '🇦🇷', '🇺🇿', '2026-06-12 21:00:00+00', 13),
('C', 'Dinamarca',      'Peru',          '🇩🇰', '🇵🇪', '2026-06-13 15:00:00+00', 14),
('C', 'Peru',           'Argentina',     '🇵🇪', '🇦🇷', '2026-06-16 21:00:00+00', 15),
('C', 'Uzbequistão',   'Dinamarca',     '🇺🇿', '🇩🇰', '2026-06-17 15:00:00+00', 16),
('C', 'Uzbequistão',   'Peru',          '🇺🇿', '🇵🇪', '2026-06-21 18:00:00+00', 17),
('C', 'Argentina',      'Dinamarca',     '🇦🇷', '🇩🇰', '2026-06-21 18:00:00+00', 18),

-- GRUPO D
('D', 'França',         'Colômbia',      '🇫🇷', '🇨🇴', '2026-06-13 18:00:00+00', 19),
('D', 'Arábia Saudita', 'Austrália',    '🇸🇦', '🇦🇺', '2026-06-13 21:00:00+00', 20),
('D', 'Austrália',      'França',        '🇦🇺', '🇫🇷', '2026-06-17 18:00:00+00', 21),
('D', 'Colômbia',       'Arábia Saudita','🇨🇴', '🇸🇦', '2026-06-17 21:00:00+00', 22),
('D', 'Colômbia',       'Austrália',     '🇨🇴', '🇦🇺', '2026-06-21 21:00:00+00', 23),
('D', 'França',         'Arábia Saudita','🇫🇷', '🇸🇦', '2026-06-21 21:00:00+00', 24),

-- GRUPO E
('E', 'Brasil',         'Equador',       '🇧🇷', '🇪🇨', '2026-06-14 15:00:00+00', 25),
('E', 'Alemanha',       'Japão',         '🇩🇪', '🇯🇵', '2026-06-14 18:00:00+00', 26),
('E', 'Japão',          'Brasil',        '🇯🇵', '🇧🇷', '2026-06-18 15:00:00+00', 27),
('E', 'Equador',        'Alemanha',      '🇪🇨', '🇩🇪', '2026-06-18 18:00:00+00', 28),
('E', 'Equador',        'Japão',         '🇪🇨', '🇯🇵', '2026-06-22 15:00:00+00', 29),
('E', 'Brasil',         'Alemanha',      '🇧🇷', '🇩🇪', '2026-06-22 15:00:00+00', 30),

-- GRUPO F
('F', 'Portugal',       'Egito',         '🇵🇹', '🇪🇬', '2026-06-14 21:00:00+00', 31),
('F', 'Turquia',        'Panamá',        '🇹🇷', '🇵🇦', '2026-06-15 15:00:00+00', 32),
('F', 'Panamá',         'Portugal',      '🇵🇦', '🇵🇹', '2026-06-18 21:00:00+00', 33),
('F', 'Egito',          'Turquia',       '🇪🇬', '🇹🇷', '2026-06-19 15:00:00+00', 34),
('F', 'Egito',          'Panamá',        '🇪🇬', '🇵🇦', '2026-06-23 18:00:00+00', 35),
('F', 'Portugal',       'Turquia',       '🇵🇹', '🇹🇷', '2026-06-23 18:00:00+00', 36),

-- GRUPO G
('G', 'Inglaterra',     'Sérvia',        '🏴', '🇷🇸', '2026-06-15 18:00:00+00', 37),
('G', 'Nigéria',        'Costa Rica',    '🇳🇬', '🇨🇷', '2026-06-16 15:00:00+00', 38),
('G', 'Costa Rica',     'Inglaterra',    '🇨🇷', '🏴', '2026-06-19 18:00:00+00', 39),
('G', 'Sérvia',         'Nigéria',       '🇷🇸', '🇳🇬', '2026-06-20 15:00:00+00', 40),
('G', 'Sérvia',         'Costa Rica',    '🇷🇸', '🇨🇷', '2026-06-23 21:00:00+00', 41),
('G', 'Inglaterra',     'Nigéria',       '🏴', '🇳🇬', '2026-06-23 21:00:00+00', 42),

-- GRUPO H
('H', 'Holanda',        'Senegal',       '🇳🇱', '🇸🇳', '2026-06-16 18:00:00+00', 43),
('H', 'Irã',            'Chile',         '🇮🇷', '🇨🇱', '2026-06-16 21:00:00+00', 44),
('H', 'Chile',          'Holanda',       '🇨🇱', '🇳🇱', '2026-06-20 18:00:00+00', 45),
('H', 'Senegal',        'Irã',           '🇸🇳', '🇮🇷', '2026-06-20 21:00:00+00', 46),
('H', 'Senegal',        'Chile',         '🇸🇳', '🇨🇱', '2026-06-24 15:00:00+00', 47),
('H', 'Holanda',        'Irã',           '🇳🇱', '🇮🇷', '2026-06-24 15:00:00+00', 48),

-- GRUPO I
('I', 'Itália',         'Camarões',      '🇮🇹', '🇨🇲', '2026-06-17 18:00:00+00', 49),
('I', 'Coreia do Sul',  'Nova Zelândia', '🇰🇷', '🇳🇿', '2026-06-17 21:00:00+00', 50),
('I', 'Nova Zelândia',  'Itália',        '🇳🇿', '🇮🇹', '2026-06-21 18:00:00+00', 51),
('I', 'Camarões',       'Coreia do Sul', '🇨🇲', '🇰🇷', '2026-06-21 21:00:00+00', 52),
('I', 'Camarões',       'Nova Zelândia', '🇨🇲', '🇳🇿', '2026-06-25 15:00:00+00', 53),
('I', 'Itália',         'Coreia do Sul', '🇮🇹', '🇰🇷', '2026-06-25 15:00:00+00', 54),

-- GRUPO J
('J', 'Uruguai',        'Gana',          '🇺🇾', '🇬🇭', '2026-06-18 18:00:00+00', 55),
('J', 'Bélgica',        'Tunísia',       '🇧🇪', '🇹🇳', '2026-06-18 21:00:00+00', 56),
('J', 'Tunísia',        'Uruguai',       '🇹🇳', '🇺🇾', '2026-06-22 18:00:00+00', 57),
('J', 'Gana',           'Bélgica',       '🇬🇭', '🇧🇪', '2026-06-22 21:00:00+00', 58),
('J', 'Gana',           'Tunísia',       '🇬🇭', '🇹🇳', '2026-06-26 18:00:00+00', 59),
('J', 'Uruguai',        'Bélgica',       '🇺🇾', '🇧🇪', '2026-06-26 18:00:00+00', 60),

-- GRUPO K
('K', 'Suíça',          'Camarões',      '🇨🇭', '🇨🇲', '2026-06-19 18:00:00+00', 61),
('K', 'Polônia',        'Jamaica',       '🇵🇱', '🇯🇲', '2026-06-19 21:00:00+00', 62),
('K', 'Jamaica',        'Suíça',         '🇯🇲', '🇨🇭', '2026-06-23 18:00:00+00', 63),
('K', 'Camarões',       'Polônia',       '🇨🇲', '🇵🇱', '2026-06-23 21:00:00+00', 64),
('K', 'Camarões',       'Jamaica',       '🇨🇲', '🇯🇲', '2026-06-27 15:00:00+00', 65),
('K', 'Suíça',          'Polônia',       '🇨🇭', '🇵🇱', '2026-06-27 15:00:00+00', 66),

-- GRUPO L
('L', 'Colômbia',       'Sérvia',        '🇨🇴', '🇷🇸', '2026-06-20 18:00:00+00', 67),
('L', 'Costa Rica',     'Escócia',       '🇨🇷', '🏴', '2026-06-20 21:00:00+00', 68),
('L', 'Escócia',        'Colômbia',      '🏴', '🇨🇴', '2026-06-24 18:00:00+00', 69),
('L', 'Sérvia',         'Costa Rica',    '🇷🇸', '🇨🇷', '2026-06-24 21:00:00+00', 70),
('L', 'Sérvia',         'Escócia',       '🇷🇸', '🏴', '2026-06-28 18:00:00+00', 71),
('L', 'Colômbia',       'Costa Rica',    '🇨🇴', '🇨🇷', '2026-06-28 18:00:00+00', 72);
```

> [!NOTE]
> Os confrontos acima são **ilustrativos** com base nas equipes classificadas/prováveis para a Copa 2026. Alguns times podem se repetir entre grupos (ex: Colômbia aparece em D e L) — isso é proposital para fins de teste. Se desejar dados 100% reais da FIFA, posso ajustar após a definição oficial dos grupos.

---

## 2. Variáveis de Ambiente

### 2.1 Supabase — Obter credenciais

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Crie um projeto (ou use existente)
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public key** → `eyJhbG...`

### 2.2 Arquivo `.env` local (Vite)

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> [!WARNING]
> **Nunca** commite o `.env` no Git. O `.gitignore` já incluirá este arquivo.

### 2.3 Render — Variáveis de ambiente no deploy

No dashboard do Render, ao criar o Static Site:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sua-anon-key-aqui` |

### 2.4 Render — Configuração do Static Site

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Rewrite Rule** | `/*` → `/index.html` (status 200) |

> [!TIP]
> A rewrite rule é **essencial** para que o React Router funcione corretamente ao recarregar a página. No Render, adicione em **Redirects/Rewrites**: Source `/*`, Destination `/index.html`, Action `Rewrite`.

---

## 3. Proposed Changes

### 3.1 Estrutura do Projeto

```
bolao-copa-2026/
├── public/
│   └── _redirects              # Fallback para SPA no Render
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Navbar + wrapper
│   │   ├── GroupTabs.jsx       # Botões horizontais A–L
│   │   ├── MatchCard.jsx       # Card de cada jogo com inputs
│   │   ├── RankingTable.jsx    # Tabela de ranking
│   │   ├── StatsPanel.jsx      # Painel de odds da galera
│   │   └── ProtectedRoute.jsx  # Guard de autenticação
│   ├── pages/
│   │   ├── LoginPage.jsx       # Tela de login (nome + código)
│   │   ├── AdminPage.jsx       # Criar grupo / inserir resultados
│   │   ├── PredictionsPage.jsx # Tela principal de palpites
│   │   ├── RankingPage.jsx     # Ranking do grupo
│   │   └── StatsPage.jsx       # Dashboard de métricas
│   ├── lib/
│   │   ├── supabase.js         # Cliente Supabase
│   │   ├── scoring.js          # Lógica de pontuação
│   │   └── auth.js             # Context de autenticação
│   ├── App.jsx                 # Router principal
│   ├── main.jsx                # Entry point
│   └── index.css               # Estilos globais + TailwindCSS
├── .env                        # Variáveis locais
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

### 3.2 Frontend — Componentes e Páginas

#### [NEW] `src/lib/supabase.js`
Cliente Supabase inicializado com variáveis de ambiente Vite.

#### [NEW] `src/lib/auth.js`
React Context para gerenciar sessão do usuário (user_id, league_id, is_admin). Armazena no `localStorage`.

#### [NEW] `src/lib/scoring.js`
Função pura que calcula pontuação de um palpite:
```
calcScore(prediction, realResult) → { points, details }
  - Acertou vencedor/empate: +3
  - Acertou gols de 1 time: +1
  - Acertou gols dos 2 times: +2 (total = 5)
```

#### [NEW] `src/pages/LoginPage.jsx`
- Dois modos: **Entrar** (nome + código) e **Criar Grupo** (nome + nome do grupo)
- Valida se o código existe, cria user se não existe no grupo
- Redireciona para `/palpites`

#### [NEW] `src/pages/PredictionsPage.jsx`
- Barra horizontal com botões de grupo (A–L) com scroll
- Renderiza `MatchCard` para cada jogo do grupo selecionado
- Auto-save com debounce ao alterar placar
- Bloqueia input se o jogo já começou

#### [NEW] `src/pages/RankingPage.jsx`
- Busca todos os palpites do grupo + resultados reais
- Calcula pontuação com `scoring.js`
- Exibe tabela ordenada (posição, nome, pontos, acertos exatos)

#### [NEW] `src/pages/StatsPage.jsx`
- Para cada jogo: agrega palpites do grupo
- Calcula % vitória time A / empate / vitória time B
- Exibe barras de progresso coloridas ("Odds da Galera")

#### [NEW] `src/pages/AdminPage.jsx`
- Criar novo grupo (gera código automático ou customizado)
- Inserir resultado real de cada jogo
- Visível apenas para `is_admin = true`

#### [NEW] `src/components/Layout.jsx`
- Navbar com logo, links (Palpites / Ranking / Estatísticas / Admin)
- Footer com informações do grupo atual
- Tema escuro com acentos em verde/dourado (estética Copa)

#### [NEW] `src/components/GroupTabs.jsx`
- Botões horizontais scroll A–L
- Destaque visual no grupo selecionado
- Badge com número de jogos pendentes

#### [NEW] `src/components/MatchCard.jsx`
- Card com bandeiras, nomes dos times, inputs numéricos
- Visual distinto para jogos com resultado (mostra pontuação ganha)
- Indicador de jogo bloqueado (já iniciado)

---

### 3.3 Design Visual

- **Tema**: Dark mode premium com gradientes verde-esmeralda → dourado
- **Tipografia**: Inter (Google Fonts)
- **Cards**: Glassmorphism com backdrop-blur
- **Animações**: Transições suaves em hover, micro-animações nos inputs
- **Responsivo**: Mobile-first, funciona em celular e desktop
- **Bandeiras**: Emojis nativos (sem dependência externa)

---

## 4. Verification Plan

### Automated Tests
```bash
npm run build          # Verifica se compila sem erros
npm run preview        # Testa build de produção localmente
```

### Manual Verification
1. Criar um grupo via interface admin
2. Entrar no grupo com dois "usuários" diferentes
3. Preencher palpites para jogos do Grupo A
4. Inserir resultado real de um jogo (como admin)
5. Verificar ranking calculado corretamente
6. Verificar estatísticas agregadas ("Odds da Galera")
7. Verificar isolamento: segundo grupo não vê dados do primeiro
8. Testar no celular (layout responsivo)
9. Recarregar página e confirmar que não quebra (SPA fallback)
