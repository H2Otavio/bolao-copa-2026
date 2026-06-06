# 🏆 Bolão Copa 2026: Pronto para o Apito Inicial!

A aplicação de MVP para o Bolão da Copa do Mundo foi construída com sucesso! Aqui está um resumo completo do que foi implementado e como testar.

## 🌟 Visão Geral das Funcionalidades

* **Autenticação Simples:** Sistema baseado em "Nome + Código do Grupo".
* **Gerenciamento de Grupos:** Administradores podem criar grupos e inserir os resultados oficiais das partidas.
* **Palpites (Predictions):** Interface interativa para dar palpites com:
    * Divisão por Grupos da Copa (A-L).
    * Salvamento automático (_auto-save_) suave.
    * Bloqueio automático de palpites após o início do jogo (baseado na data/hora).
* **Ranking Automático:** Tabela atualizada dinamicamente com base nas suas regras de pontuação:
    * +3 pontos por acertar o vencedor ou empate.
    * +1 ponto por acertar os gols exatos de um time.
    * +2 pontos extras pelo placar exato (total de 5 pontos).
* **Estatísticas (Odds da Galera):** Painel que agrega todos os palpites do grupo, mostrando em uma barra colorida a porcentagem de vitória/empate, além do placar médio esperado.
* **Isolamento de Dados:** Usuários só veem palpites e rankings do seu próprio grupo (implementado tanto no frontend quanto no RLS do Supabase).
* **Design Premium:** Interface _Dark Mode_ inspirada na Copa do Mundo, com _glassmorphism_, micro-animações e fontes legíveis. Totalmente responsivo para mobile e desktop.

---

## 📂 O Que Foi Criado

A base de código em `React + Vite + TailwindCSS v4` está em `C:\Users\Otavio\.gemini\antigravity\scratch\bolao-copa-2026`.

### Arquivos Principais:

* `src/pages/`
    * **`LoginPage.jsx`:** Tela de login/criação de grupo.
    * **`PredictionsPage.jsx`:** A tela principal para dar palpites.
    * **`RankingPage.jsx`:** Exibe a classificação dos usuários do grupo.
    * **`StatsPage.jsx`:** "Odds da Galera" (estatísticas agregadas).
    * **`AdminPage.jsx`:** Painel exclusivo do criador do grupo para inserir placares reais.
* `src/components/`
    * **`MatchCard.jsx`:** O card reutilizável para cada jogo, com lógica de validação visual e _debounce_ no salvamento.
    * **`GroupTabs.jsx`:** Navegação horizontal suave para os grupos A a L.
    * **`Layout.jsx`:** O invólucro (Navbar e BottomBar no mobile).
* `src/lib/`
    * **`auth.jsx`:** Contexto React que gerencia a sessão armazenada no `localStorage` e a integração com o Supabase.
    * **`scoring.js`:** A lógica isolada e testável que calcula os pontos de um palpite versus o resultado oficial.
    * **`supabase.js`:** Cliente oficial.
* `sql/schema.sql`: Todo o código SQL (DDL + _Row Level Security_ + _Seeds_) pronto para rodar.

---

## 🚀 Próximos Passos: Como colocar no ar

Para ver a aplicação funcionando de verdade, siga estes três passos:

### 1. Configurar o Supabase (Banco de Dados)

1. Acesse [app.supabase.com](https://app.supabase.com) e crie um novo projeto.
2. No painel esquerdo, vá em **SQL Editor**.
3. Abra o arquivo que eu criei em `C:\Users\Otavio\.gemini\antigravity\scratch\bolao-copa-2026\sql\schema.sql`.
4. Copie todo o conteúdo e cole no SQL Editor do Supabase, depois clique em **Run** (Executar).
    * _Isso criará as 4 tabelas (`leagues`, `users`, `matches`, `predictions`), as regras de segurança e já vai preencher a tabela `matches` com 72 jogos ilustrativos da fase de grupos!_

### 2. Configurar o Projeto Local (Testar)

1. No Supabase, vá em **Project Settings** > **API**.
2. Copie a sua **Project URL** e a **anon public key**.
3. Na pasta do projeto (`C:\Users\Otavio\.gemini\antigravity\scratch\bolao-copa-2026`), renomeie o arquivo `.env.example` para `.env` e cole suas chaves lá.
4. Execute o projeto localmente para testar:
   ```bash
   cd C:\Users\Otavio\.gemini\antigravity\scratch\bolao-copa-2026
   npm run dev
   ```

### 3. Fazer o Deploy no Render

A aplicação já está otimizada para o Render (Static Site) e inclui o arquivo `public/_redirects` (embora este seja mais específico do Netlify, a configuração no painel do Render resolve o roteamento SPA).

1. Suba o código desta pasta (`bolao-copa-2026`) para o GitHub.
2. No [Render.com](https://render.com), clique em **New** > **Static Site**.
3. Conecte o repositório do GitHub.
4. Configure assim:
   * **Build Command:** `npm install && npm run build`
   * **Publish Directory:** `dist`
5. Vá na aba **Environment** e adicione as variáveis:
   * `VITE_SUPABASE_URL` = (Sua URL)
   * `VITE_SUPABASE_ANON_KEY` = (Sua Chave)
6. Vá em **Redirects/Rewrites** e adicione uma regra para o React Router não quebrar em recarregamentos:
   * **Source:** `/*`
   * **Destination:** `/index.html`
   * **Action:** `Rewrite`
7. Clique em **Create Static Site**!

> [!TIP]
> **Dica de Teste Rápido:** Após ligar o app, na tela de login, clique em "Criar Grupo". Coloque seu nome e o nome da liga. Você será redirecionado. Como criador, você tem o botão de "Admin" para brincar com os resultados reais e ver o ranking e estatísticas calcularem automaticamente!
