import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { calcScore } from '../lib/scoring'
import { useLiveScores } from '../lib/api'
import { getGroupPlacements } from '../lib/simulator'

export default function RankingPage() {
  const { league, user } = useAuth()
  const { liveMatches } = useLiveScores()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState(league.id)

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true)
      try {

        if (selectedLeague === 'all') {
          // Busca o ranking global pré-calculado no backend
          const { data: cacheRow } = await supabase
            .from('app_cache')
            .select('value')
            .eq('key', 'global_ranking')
            .maybeSingle()

          if (cacheRow && cacheRow.value) {
            setRanking(cacheRow.value)
          } else {
            setRanking([])
          }
          setLoading(false)
          return
        }

        let users, matches, predictions
        const cacheKey = `ranking_data_${selectedLeague}`
        const cachedData = sessionStorage.getItem(cacheKey)
        let useCache = false

        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            users = parsed.users
            matches = parsed.matches
            predictions = parsed.predictions
            useCache = true
          }
        }

        if (!useCache) {
          const { data: fetchedUsers } = await supabase.from('users').select('id, name, league_id').eq('league_id', selectedLeague)
          users = fetchedUsers

          const { data: fetchedMatches } = await supabase
            .from('matches')
            .select('*')
          matches = fetchedMatches

          const userIds = (users || []).map(u => u.id)
          
          if (userIds.length > 0) {
            const { data: fetchedPredictions } = await supabase
              .from('predictions')
              .select('id, user_id, match_id, score_home, score_away, is_simulated, simulated_team_home, simulated_team_away, updated_at')
              .in('user_id', userIds)
            predictions = fetchedPredictions
          } else {
            predictions = []
          }

          sessionStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            users,
            matches,
            predictions
          }))
        }

        // Calcula o Order Rank de cada palpite
        const matchPredictions = {}
        ;(predictions || []).forEach(p => {
          if (!matchPredictions[p.match_id]) matchPredictions[p.match_id] = []
          matchPredictions[p.match_id].push(p)
        })

        Object.values(matchPredictions).forEach(matchPreds => {
          // Ordena pela data de última atualização (mais antigos primeiro)
          matchPreds.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
          matchPreds.forEach((p, index) => {
            p.orderRank = index + 1 // 1 para o primeiro a votar, 2 para o segundo...
          })
        })

        // Build match map and merge LIVE SCORES
        const matchMap = {}
        const realPredictions = []
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
          if (sh !== null && sa !== null) {
            realPredictions.push({ match_id: m.id, score_home: sh, score_away: sa })
          }
        })

        // Real group placements
        const realPlacements = getGroupPlacements(matches || [], realPredictions)
        const getPositionMap = (placements) => {
          const map = {}
          Object.keys(placements.firsts).forEach(g => { if (placements.firsts[g]) map[placements.firsts[g].id] = `1${g}` })
          Object.keys(placements.seconds).forEach(g => { if (placements.seconds[g]) map[placements.seconds[g].id] = `2${g}` })
          placements.bestThirds.forEach(t => { if (t) map[t.id] = '3' })
          return map
        }
        const realPosMap = getPositionMap(realPlacements)

        // Calculate scores for each user
        const userScores = (users || []).map(u => {
          const userPreds = (predictions || []).filter(p => p.user_id === u.id)
          let totalPoints = 0
          let exactScores = 0
          let correctResults = 0
          let totalPredictions = userPreds.length
          let sumOrderRank = 0

          userPreds.forEach(pred => {
            if (pred.orderRank) {
              sumOrderRank += pred.orderRank
            }
            const match = matchMap[pred.match_id]
            if (!match || match.score_home === null || match.score_away === null) return

            const score = calcScore(pred, match)
            totalPoints += score.total
            if (score.exactBothPoints > 0) exactScores++
            if (score.winnerPoints > 0) correctResults++
          })
          
          const avgOrder = totalPredictions > 0 ? sumOrderRank / totalPredictions : 999999

          return {
            ...u,
            totalPoints,
            exactScores,
            correctResults,
            totalPredictions,
            avgOrder
          }
        })

        // Sort by points (desc), then exact scores (desc)
        userScores.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
          if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores
          if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults
          // 4º Critério: Menor Média de Ordem vence o desempate
          return a.avgOrder - b.avgOrder
        })

        setRanking(userScores)
      } catch (err) {
        console.error('Error fetching ranking:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [selectedLeague, liveMatches])

  const getMedalEmoji = (pos) => {
    if (pos === 0) return '🥇'
    if (pos === 1) return '🥈'
    if (pos === 2) return '🥉'
    return `${pos + 1}º`
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Ranking</h1>
          <p className="text-text-secondary">Acompanhe a pontuação</p>
        </div>
        <select
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="input-field w-full md:w-auto md:min-w-[200px] py-2 px-3 text-sm cursor-pointer"
        >
          <option value={league.id}>{league.name}</option>
          {league.can_view_global_ranking && (
            <option value="all">🏆 Ranking Global</option>
          )}
        </select>
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
