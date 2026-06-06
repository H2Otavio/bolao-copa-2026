import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import GroupTabs from '../components/GroupTabs'
import { useLiveScores } from '../lib/api'

const CUP_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']

export default function StatsPage() {
  const { league } = useAuth()
  const { liveMatches } = useLiveScores()
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalVoters, setTotalVoters] = useState(0)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      // Get matches for this group
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('cup_group', selectedGroup)
        .order('match_number')

      // Get all users in this league
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('league_id', league.id)

      const userIds = (users || []).map(u => u.id)
      setTotalVoters(userIds.length)

      if (!matches || matches.length === 0 || userIds.length === 0) {
        setStats([])
        setLoading(false)
        return
      }

      // Get predictions from league users for these matches
      const matchIds = matches.map(m => m.id)
      const { data: predictions } = await supabase
        .from('predictions')
        .select('*')
        .in('user_id', userIds)
        .in('match_id', matchIds)

      // Aggregate stats per match
      const matchStats = matches.map(match => {
        // Merge Live Scores
        const live = liveMatches[match.match_number]
        let sh = match.score_home
        let sa = match.score_away
        if (live && (live.finished || live.score_home > 0 || live.score_away > 0)) {
          sh = live.score_home
          sa = live.score_away
        }
        
        const matchPreds = (predictions || []).filter(p => p.match_id === match.id)
        const total = matchPreds.length

        let homeWins = 0
        let draws = 0
        let awayWins = 0
        let avgHome = 0
        let avgAway = 0

        matchPreds.forEach(p => {
          if (p.score_home > p.score_away) homeWins++
          else if (p.score_home === p.score_away) draws++
          else awayWins++
          avgHome += p.score_home
          avgAway += p.score_away
        })

        return {
          ...match,
          score_home: sh,
          score_away: sa,
          liveData: live,
          totalPredictions: total,
          homeWinPct: total > 0 ? Math.round((homeWins / total) * 100) : 0,
          drawPct: total > 0 ? Math.round((draws / total) * 100) : 0,
          awayWinPct: total > 0 ? Math.round((awayWins / total) * 100) : 0,
          avgHome: total > 0 ? (avgHome / total).toFixed(1) : '–',
          avgAway: total > 0 ? (avgAway / total).toFixed(1) : '–',
        }
      })

      setStats(matchStats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, league.id, liveMatches])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Odds da Galera</h1>
        <p className="text-text-secondary">{league.name} · {totalVoters} participantes</p>
      </div>

      <GroupTabs
        groups={CUP_GROUPS}
        selected={selectedGroup}
        onSelect={setSelectedGroup}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 mt-6 animate-slide-up">
          {stats.map(match => (
            <div key={match.id} className="glass-card p-5 md:p-6">
              {/* Match Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {match.flag_home?.startsWith('http') ? (
                    <img src={match.flag_home} alt={match.team_home} className="w-8 h-5 md:w-10 md:h-7 object-cover rounded shadow-sm flex-shrink-0" />
                  ) : (
                    <span className="text-2xl">{match.flag_home}</span>
                  )}
                  <span className="font-semibold text-text-primary truncate">{match.team_home}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center mx-2">
                  <span className="px-3 py-1 text-xs font-bold text-text-muted bg-bg-primary rounded-lg mb-1">VS</span>
                  {match.score_home !== null && match.score_away !== null && (
                    <span className={`text-xs font-bold whitespace-nowrap ${match.liveData && !match.liveData.finished ? 'text-red-500 animate-pulse' : 'text-accent-green-light'}`}>
                      {match.score_home} - {match.score_away} {match.liveData && !match.liveData.finished ? "(Ao Vivo)" : ""}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                  <span className="font-semibold text-text-primary truncate">{match.team_away}</span>
                  {match.flag_away?.startsWith('http') ? (
                    <img src={match.flag_away} alt={match.team_away} className="w-8 h-5 md:w-10 md:h-7 object-cover rounded shadow-sm flex-shrink-0" />
                  ) : (
                    <span className="text-2xl">{match.flag_away}</span>
                  )}
                </div>
              </div>

              {match.totalPredictions === 0 ? (
                <p className="text-center text-text-muted text-sm py-2">Nenhum palpite registrado ainda</p>
              ) : (
                <>
                  {/* Odds Bar */}
                  <div className="flex rounded-xl overflow-hidden h-10 mb-3 mt-4">
                    {match.homeWinPct > 0 && (
                      <div
                        className="bg-gradient-to-r from-accent-green to-emerald-600 flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
                        style={{ width: `${match.homeWinPct}%` }}
                      >
                        {match.homeWinPct}%
                      </div>
                    )}
                    {match.drawPct > 0 && (
                      <div
                        className="bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
                        style={{ width: `${match.drawPct}%` }}
                      >
                        {match.drawPct}%
                      </div>
                    )}
                    {match.awayWinPct > 0 && (
                      <div
                        className="bg-gradient-to-r from-accent-gold to-amber-600 flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
                        style={{ width: `${match.awayWinPct}%` }}
                      >
                        {match.awayWinPct}%
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                      {match.team_home}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                      Empate
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
                      {match.team_away}
                    </div>
                  </div>

                  {/* Average Score */}
                  <div className="mt-3 pt-3 border-t border-border flex justify-center gap-6 text-sm">
                    <span className="text-text-muted">Placar médio:</span>
                    <span className="font-bold text-text-primary">{match.avgHome} × {match.avgAway}</span>
                    <span className="text-text-muted">({match.totalPredictions} palpites)</span>
                  </div>
                </>
              )}
            </div>
          ))}

          {stats.length === 0 && (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">📈</div>
              <p className="text-text-muted text-lg">Nenhum jogo neste grupo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
