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

        const cacheKey = selectedLeague === 'all' ? 'global_ranking' : `ranking_data_${selectedLeague}`
        
        const { data: cacheRow } = await supabase
          .from('app_cache')
          .select('value')
          .eq('key', cacheKey)
          .maybeSingle()

        if (cacheRow && cacheRow.value) {
          setRanking(cacheRow.value)
        } else {
          setRanking([])
        }
      } catch (err) {
        console.error('Error fetching ranking from cache:', err)
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
                  {player.correctResults} acertos · {player.exactBothPoints} exatos
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
