import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { calcScore } from '../lib/scoring'
import { useLiveScores } from '../lib/api'

export default function RankingPage() {
  const { league, user } = useAuth()
  const { liveMatches } = useLiveScores()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true)
      try {
        // Get all users in this league
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('league_id', league.id)

        // Get all matches (we need all because live data might exist for matches with null scores in DB)
        const { data: matches } = await supabase
          .from('matches')
          .select('*')

        // Get all predictions for users in this league
        const userIds = (users || []).map(u => u.id)
        const { data: predictions } = await supabase
          .from('predictions')
          .select('*')
          .in('user_id', userIds)

        // Build match map and merge LIVE SCORES
        const matchMap = {}
        ;(matches || []).forEach(m => { 
          const live = liveMatches[m.match_number]
          // Apply live score if the game is finished OR has goals
          let sh = m.score_home
          let sa = m.score_away
          if (live && (live.finished || live.score_home > 0 || live.score_away > 0)) {
            sh = live.score_home
            sa = live.score_away
          }
          matchMap[m.id] = { ...m, score_home: sh, score_away: sa }
        })

        // Calculate scores for each user
        const userScores = (users || []).map(u => {
          const userPreds = (predictions || []).filter(p => p.user_id === u.id)
          let totalPoints = 0
          let exactScores = 0
          let correctResults = 0
          let totalPredictions = userPreds.length

          userPreds.forEach(pred => {
            const match = matchMap[pred.match_id]
            if (!match || match.score_home === null || match.score_away === null) return

            const score = calcScore(pred, match)
            totalPoints += score.total
            if (score.exactBothPoints > 0) exactScores++
            if (score.winnerPoints > 0) correctResults++
          })

          return {
            ...u,
            totalPoints,
            exactScores,
            correctResults,
            totalPredictions,
          }
        })

        // Sort by points (desc), then exact scores (desc)
        userScores.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
          if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores
          return b.correctResults - a.correctResults
        })

        setRanking(userScores)
      } catch (err) {
        console.error('Error fetching ranking:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [league.id, liveMatches])

  const getMedalEmoji = (pos) => {
    if (pos === 0) return '🥇'
    if (pos === 1) return '🥈'
    if (pos === 2) return '🥉'
    return `${pos + 1}º`
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Ranking</h1>
        <p className="text-text-secondary">{league.name}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ranking.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-text-muted text-lg">Nenhum resultado cadastrado ainda.</p>
          <p className="text-text-muted text-sm mt-2">O ranking aparecerá quando o admin inserir os resultados dos jogos.</p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {ranking.map((player, index) => (
            <div
              key={player.id}
              className={`glass-card p-4 md:p-5 flex items-center gap-4 transition-all duration-300 ${
                player.id === user.id ? 'ring-2 ring-accent-green/50 bg-accent-green/5' : ''
              } ${index < 3 ? 'border-accent-gold/20' : ''}`}
            >
              {/* Position */}
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-lg ${
                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-amber-500/20' :
                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                'bg-bg-primary text-text-secondary'
              }`}>
                {getMedalEmoji(index)}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${
                  player.id === user.id ? 'text-accent-green-light' : 'text-text-primary'
                }`}>
                  {player.name}
                  {player.id === user.id && <span className="text-xs ml-2 text-text-muted">(você)</span>}
                </p>
                <p className="text-xs text-text-muted">
                  {player.correctResults} acertos · {player.exactScores} exatos
                </p>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className={`text-2xl font-black ${
                  index === 0 ? 'gradient-text' : 'text-text-primary'
                }`}>
                  {player.totalPoints}
                </p>
                <p className="text-xs text-text-muted">pontos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
