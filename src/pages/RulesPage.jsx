import React from 'react'

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-text-primary">Regras de Pontuação</h1>
        <p className="text-text-secondary text-lg">Entenda como funciona a distribuição de pontos do nosso bolão.</p>
      </div>

      <div className="space-y-8">
        {/* Fase de Grupos */}
        <section className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm hover:border-accent-green/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green text-xl font-bold">
              1
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Fase de Grupos</h2>
          </div>
          
          <p className="text-text-secondary mb-6 leading-relaxed">
            Na fase de grupos, o que importa é acertar o desenrolar da partida. A pontuação máxima que você pode conseguir em um único jogo é <strong className="text-accent-green">5 pontos</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <div className="text-accent-green font-bold text-xl mb-1">+3 pontos</div>
              <h3 className="font-bold text-text-primary mb-2">Acertou o Vencedor</h3>
              <p className="text-sm text-text-muted">Você previu corretamente qual time ganharia (ou acertou que daria empate), independente do número de gols.</p>
            </div>
            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <div className="text-accent-green font-bold text-xl mb-1">+1 ponto</div>
              <h3 className="font-bold text-text-primary mb-2">Gols de 1 Time</h3>
              <p className="text-sm text-text-muted">Você acertou a quantidade exata de gols que apenas UMA das duas seleções marcou no jogo.</p>
            </div>
            <div className="bg-bg-tertiary p-4 rounded-lg border border-border border-accent-gold/30 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-accent-gold/10 rounded-full blur-xl"></div>
              <div className="text-accent-gold font-bold text-xl mb-1">+2 pontos</div>
              <h3 className="font-bold text-text-primary mb-2">Placar Exato (Bônus)</h3>
              <p className="text-sm text-text-muted">Se você acertar os gols das duas seleções (Placar Exato), você leva +2 pontos ao invés de +1, totalizando os 5 pontos máximos!</p>
            </div>
          </div>
        </section>

        {/* Mata-Mata */}
        <section className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm hover:border-accent-blue/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue text-xl font-bold">
              2
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Fase de Mata-Mata</h2>
          </div>
          
          <p className="text-text-secondary mb-6 leading-relaxed">
            No Mata-Mata o jogo fica mais tenso! Além do placar, prever as seleções que vão avançar é fundamental. A pontuação máxima por jogo pula para <strong className="text-accent-blue">9 pontos</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <div className="text-accent-blue font-bold text-xl mb-1">+2 pontos por Seleção</div>
              <h3 className="font-bold text-text-primary mb-2">Previsão da Chave</h3>
              <p className="text-sm text-text-muted">
                Para cada seleção que você colocar no seu simulador e que <strong>realmente</strong> chegue naquele exato jogo da chave na vida real, você ganha 2 pontos (Máximo de 4 pts por jogo).
              </p>
            </div>
            <div className="bg-bg-tertiary p-4 rounded-lg border border-border border-red-500/20">
              <div className="text-red-400 font-bold text-xl mb-1">Atenção ao Placar!</div>
              <h3 className="font-bold text-text-primary mb-2">Condição para Pontuar Gols</h3>
              <p className="text-sm text-text-muted">
                Os pontos de placar do seu simulador <strong>SÓ</strong> são validados se você tiver acertado as DUAS seleções do jogo. Se você errou quem ia jogar, seu placar simulado não vale nada.
              </p>
            </div>
          </div>

          <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-5">
            <h3 className="font-bold text-accent-blue mb-3">A Segunda Chance</h3>
            <p className="text-sm text-text-secondary">
              Seu simulador deu errado e as seleções reais são outras? Não se preocupe! 
              Assim que os times reais forem definidos na vida real, a tela de palpites vai se atualizar. 
              Você poderá palpitar no placar do jogo <strong>real</strong> e, caso acerte o vencedor ou os gols, ganhará os até 5 pontos de placar normalmente (mesmo tendo perdido os 4 pontos de bônus por errar as seleções).
            </p>
          </div>
        </section>

        {/* Casos Extremos */}
        <section className="bg-bg-secondary border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-text-muted/10 flex items-center justify-center text-text-muted text-xl font-bold">
              3
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Regras de Preenchimento</h2>
          </div>
          
          <ul className="space-y-4 text-text-secondary">
            <li className="flex gap-3">
              <span className="text-accent-red font-bold">⏰</span>
              <div>
                <strong className="text-text-primary block">Trava de Tempo</strong>
                <p className="text-sm">Os palpites são bloqueados exatos 5 minutos antes da bola rolar. Uma vez bloqueado, não é possível alterar.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-gold font-bold">🤷‍♂️</span>
              <div>
                <strong className="text-text-primary block">Esqueci de Palpitar!</strong>
                <p className="text-sm">Jogos não palpitados não geram pontos (0 pontos). Porém, para não quebrar a sua chave do Mata-Mata, o simulador usará os resultados reais da vida real para os jogos que você esqueceu, permitindo que a árvore do torneio continue funcionando para os seus próximos palpites.</p>
              </div>
            </li>
          </ul>
        </section>

      </div>
    </div>
  )
}
