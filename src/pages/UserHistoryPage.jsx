import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcScore } from '../lib/scoring'
import { translateTeam } from '../lib/countries'
import { generateKnockoutBracket } from '../lib/simulator'

export default function UserHistoryPage() {
  const { userId } = useParams()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      try {
        // Fetch user name
        const { data: user } = await supabase.from('users').select('name').eq('id', userId).single()
        if (user) setUserName(user.name)

        // Fetch all matches
        const { data: matches } = await supabase.from('matches').select('*').order('match_date', { ascending: false })
        
        // Fetch user's predictions
        const { data: pData } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId)

        const allPredictions = pData || []
        const bracket = generateKnockoutBracket(matches || [], allPredictions)

        const historyItems = []

        for (const match of (matches || [])) {
          // Only show finished matches
          if (match.score_home === null || match.score_away === null) continue

          let pred = allPredictions.find(p => p.match_id === match.id)
          const isKnockout = match.cup_group && match.cup_group.length > 1

          if (!pred) {
            if (!isKnockout) {
              // No prediction for group stage
              historyItems.push({
                match,
                pred: null,
                score: { total: 0, winnerPoints: 0, exactBothPoints: 0, exactOnePoints: 0, teamPoints: 0, penaltyPoints: 0 },
                date: match.match_date ? new Date(match.match_date) : new Date(0)
              })
              continue
            }
            // For knockout, they might still get team points even if no prediction
            pred = { match_id: match.id, is_simulated: true, score_home: null, score_away: null }
          } else {
            // Clone pred to avoid mutating state
            pred = { ...pred }
          }

          if (isKnockout && bracket && bracket[match.match_number]) {
            pred.simulated_team_home = bracket[match.match_number].team_home
            pred.simulated_team_away = bracket[match.match_number].team_away
          }

          const score = calcScore(pred, match)
          
          historyItems.push({
            match,
            pred,
            score,
            date: match.match_date ? new Date(match.match_date) : new Date(0)
          })
        }

        // Sort by date descending (most recent first)
        historyItems.sort((a, b) => b.date - a.date)
        
        setHistory(historyItems)
      } catch (err) {
        console.error('Error fetching user history:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchHistory()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-muted">Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-6">
        <Link to="/ranking" className="inline-flex items-center text-accent-green-light hover:text-white transition-colors mb-4 text-sm font-semibold">
          <span>&larr; Voltar para o Ranking</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Histórico de Palpites</h1>
        <p className="text-text-secondary">Extrato de pontos de <span className="text-white font-bold">{userName}</span></p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-text-muted text-lg">Nenhum resultado finalizado ainda para exibir no histórico.</p>
          </div>
        ) : (
          history.map((item, idx) => {
            const m = item.match
            const p = item.pred
            const s = item.score

            const isKnockout = m.cup_group && m.cup_group.length > 1
            const predictedTeamsMatch = !isKnockout || (!p.is_simulated || (p.simulated_team_home === m.team_home && p.simulated_team_away === m.team_away))

            return (
              <div key={m.id} className={`glass-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 border border-transparent hover:border-border`}>
                
                <div className="flex-1">
                  <p className="text-xs text-text-muted mb-2 font-semibold">
                    {item.date.getTime() > 0 ? item.date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data Indefinida'} 
                    {' • '} 
                    {isKnockout ? `Fase ${m.cup_group}` : `Grupo ${m.cup_group}`}
                  </p>
                  
                  {/* Real Match */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg md:text-xl">{translateTeam(m.team_home)}</span>
                    <span className="text-accent-gold font-black text-xl mx-1">{m.score_home}</span>
                    <span className="text-text-muted text-sm font-bold">X</span>
                    <span className="text-accent-gold font-black text-xl mx-1">{m.score_away}</span>
                    <span className="font-bold text-lg md:text-xl">{translateTeam(m.team_away)}</span>
                    {m.advance_on_penalties && (
                      <span className="ml-2 text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                        ({translateTeam(m.advance_on_penalties)} nos pênaltis)
                      </span>
                    )}
                  </div>

                  {/* Prediction Info */}
                  <div className="text-sm bg-black/20 p-2 rounded-lg inline-block border border-white/5">
                    {p ? (
                      <div>
                        {isKnockout && p.is_simulated && !predictedTeamsMatch ? (
                          <div className="text-text-secondary">
                            Seu simulador previa: <span className="font-semibold text-white">{translateTeam(p.simulated_team_home)} {p.score_home} x {p.score_away} {translateTeam(p.simulated_team_away)}</span>
                          </div>
                        ) : p.score_home !== null && p.score_away !== null ? (
                          <div className="text-text-secondary">
                            Palpite: <span className="font-semibold text-white">{p.score_home} x {p.score_away}</span>
                            {p.advance_on_penalties && (
                              <span className="ml-1 text-xs text-text-muted">
                                ({translateTeam(p.advance_on_penalties)} nos pênaltis)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-text-muted italic">Palpite não preenchido.</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-text-muted italic">Não apostou neste jogo.</div>
                    )}
                  </div>
                </div>
                
                {/* Score & Tooltip */}
                <div className="relative group flex items-center md:justify-end shrink-0 cursor-help">
                  <div className={`px-4 py-2 md:px-5 md:py-3 rounded-xl font-black text-xl md:text-2xl shadow-lg transition-transform group-hover:scale-105 ${
                    s.total === 0 ? 'bg-red-500/10 text-red-500/80 border border-red-500/20' :
                    s.total >= 5 ? 'bg-gradient-to-br from-accent-gold to-amber-600 text-white shadow-amber-500/20' :
                    s.total >= 3 ? 'bg-accent-green/20 text-accent-green-light border border-accent-green/30' :
                    'bg-accent-gold/20 text-accent-gold-light border border-accent-gold/30'
                  }`}>
                    {s.total > 0 ? '+' : ''}{s.total} pts
                  </div>

                  {/* Tooltip Popup */}
                  <div className="absolute right-0 bottom-full mb-3 hidden group-hover:block w-56 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-20">
                    <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider border-b border-gray-800 pb-1">Detalhes da Pontuação</p>
                    <ul className="space-y-1.5 text-sm">
                      {s.winnerPoints > 0 && <li><span className="inline-block w-6 text-accent-green-light font-bold text-right mr-2">+{s.winnerPoints}</span> Acertou o resultado</li>}
                      {s.exactBothPoints > 0 && <li><span className="inline-block w-6 text-accent-gold font-bold text-right mr-2">+{s.exactBothPoints}</span> Placar exato</li>}
                      {s.exactOnePoints > 0 && <li><span className="inline-block w-6 text-accent-gold font-bold text-right mr-2">+{s.exactOnePoints}</span> Gols de 1 time</li>}
                      {s.teamPoints > 0 && <li><span className="inline-block w-6 text-blue-400 font-bold text-right mr-2">+{s.teamPoints}</span> Acertou chaveamento</li>}
                      {s.penaltyPoints > 0 && <li><span className="inline-block w-6 text-accent-gold font-bold text-right mr-2">+{s.penaltyPoints}</span> Ganhador nos pênaltis</li>}
                      {s.total === 0 && <li className="text-red-400 font-semibold text-center">Nenhum ponto recebido</li>}
                    </ul>
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 transform rotate-45"></div>
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
