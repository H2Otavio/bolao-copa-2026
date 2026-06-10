import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import GroupTabs from '../components/GroupTabs'
import { useLiveScores } from '../lib/api'
import { translateTeam } from '../lib/countries'

const CUP_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Mata-Mata']

export default function StatsPage() {
  const { league } = useAuth()
  const { liveMatches } = useLiveScores()
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [stats, setStats] = useState([])
  const [knockoutStats, setKnockoutStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalVoters, setTotalVoters] = useState(0)

  const getFlagUrl = (flag) => {
    if (!flag) return null
    if (flag.startsWith('http')) return flag
    let code = ''
    const codePoints = Array.from(flag).map(c => c.codePointAt(0))
    if (codePoints.length === 2 && codePoints[0] >= 0x1F1E6 && codePoints[0] <= 0x1F1FF) {
      code = String.fromCharCode(codePoints[0] - 0x1F1E6 + 97) + String.fromCharCode(codePoints[1] - 0x1F1E6 + 97)
    } else if (flag.length === 2 && /^[A-Za-z]{2}$/.test(flag)) {
      code = flag.toLowerCase()
    }
    if (code) {
      if (code === 'en') code = 'gb-eng'
      if (code === 'sc') code = 'gb-sct'
      if (code === 'wa') code = 'gb-wls'
      return `https://flagcdn.com/w40/${code}.png`
    }
    return null
  }

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setStats([])
    setKnockoutStats(null)

    try {
      // Get total users in the entire app
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      setTotalVoters(count || 0)

      if (count === 0) {
        setLoading(false)
        return
      }

      // Fetch all matches to build flagMap and resolve stats
      const { data: allMatches } = await supabase.from('matches').select('*').order('match_number')
      const flagMap = {}
      allMatches.forEach(m => {
        if (m.team_home && m.flag_home) flagMap[m.team_home] = m.flag_home
        if (m.team_away && m.flag_away) flagMap[m.team_away] = m.flag_away
      })

      if (selectedGroup === 'Mata-Mata') {
        const knockoutGroups = ['R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']
        const matches = allMatches.filter(m => knockoutGroups.includes(m.cup_group))
        const matchIds = matches.map(m => m.id)

        const { data: predictions } = await supabase
          .from('predictions')
          .select('*')
          .in('match_id', matchIds)

        const championVotes = {}
        const runnerUpVotes = {}
        const thirdPlaceVotes = {}
        const advancedVotes = {}

        const incrementVote = (map, teamId) => {
          if (!teamId || teamId.length > 3) return // Ignore placeholders
          if (!map[teamId]) map[teamId] = { id: teamId, votes: 0, flag: flagMap[teamId] }
          map[teamId].votes++
        }

        const resolvePrediction = (p, match) => {
          let hTeam = p.is_simulated ? p.simulated_team_home : match.team_home
          let aTeam = p.is_simulated ? p.simulated_team_away : match.team_away

          if (p.score_home !== null && p.score_away !== null) {
            if (p.score_home > p.score_away) return { winner: hTeam, loser: aTeam }
            if (p.score_away > p.score_home) return { winner: aTeam, loser: hTeam }
            if (p.advance_on_penalties === hTeam) return { winner: hTeam, loser: aTeam }
            if (p.advance_on_penalties === aTeam) return { winner: aTeam, loser: hTeam }
          }
          return { winner: null, loser: null }
        }

        (predictions || []).forEach(p => {
          const m = matches.find(match => match.id === p.match_id)
          if (!m) return

          // R32 (Advanced from Groups)
          if (m.cup_group === 'R32') {
            let hTeam = p.is_simulated ? p.simulated_team_home : m.team_home
            let aTeam = p.is_simulated ? p.simulated_team_away : m.team_away
            if (p.score_home !== null && p.score_away !== null) { // Only count if actually filled
              incrementVote(advancedVotes, hTeam)
              incrementVote(advancedVotes, aTeam)
            }
          }

          // 3RD Place
          if (m.cup_group === '3RD') {
            const { winner } = resolvePrediction(p, m)
            incrementVote(thirdPlaceVotes, winner)
          }

          // FINAL
          if (m.cup_group === 'FINAL') {
            const { winner, loser } = resolvePrediction(p, m)
            incrementVote(championVotes, winner)
            incrementVote(runnerUpVotes, loser)
          }
        })

        const groupAndSort = (voteMap) => {
          const arr = Object.values(voteMap).sort((a, b) => b.votes - a.votes)
          const grouped = []
          arr.forEach(item => {
            const last = grouped[grouped.length - 1]
            if (last && last.votes === item.votes) {
              last.teams.push(item)
            } else {
              grouped.push({ votes: item.votes, teams: [item] })
            }
          })
          grouped.forEach(g => g.teams.sort((a, b) => translateTeam(a.id).localeCompare(translateTeam(b.id))))
          return grouped
        }

        const advancedRankings = groupAndSort(advancedVotes)
        let currentRank = 1
        const advancedList = advancedRankings.map(group => {
          const item = { rank: currentRank, ...group }
          currentRank += group.teams.length
          return item
        })

        setKnockoutStats({
          champion: groupAndSort(championVotes)[0] || null,
          runnerUp: groupAndSort(runnerUpVotes)[0] || null,
          thirdPlace: groupAndSort(thirdPlaceVotes)[0] || null,
          advanced: advancedList,
          maxAdvancedVotes: advancedList.length > 0 ? advancedList[0].votes : 0
        })

      } else {
        // Group Stage Stats
        const matches = allMatches.filter(m => m.cup_group === selectedGroup)
        if (!matches || matches.length === 0) return

        const matchIds = matches.map(m => m.id)
        const { data: predictions } = await supabase
          .from('predictions')
          .select('*')
          .in('match_id', matchIds)

        const matchStats = matches.map(match => {
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
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, league.id, liveMatches])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const renderPodiumPosition = (title, data, colorClass, borderColor) => {
    return (
      <div className={`glass-card p-4 flex-1 flex flex-col items-center justify-start border-t-4 ${borderColor}`}>
        <span className={`text-sm font-bold uppercase tracking-wider mb-3 ${colorClass}`}>{title}</span>
        {!data ? (
          <span className="text-xs text-text-muted">Sem palpites</span>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {data.teams.map((t) => (
              <div key={t.id} className="flex flex-col items-center animate-fade-in text-center">
                {getFlagUrl(t.flag) ? (
                  <img src={getFlagUrl(t.flag)} alt={t.id} className="w-12 h-8 md:w-16 md:h-10 object-cover rounded shadow-md mb-2" />
                ) : (
                  <span className="text-4xl mb-2">{t.flag}</span>
                )}
                <span className="font-bold text-text-primary text-sm md:text-base leading-tight break-words w-full">{translateTeam(t.id)}</span>
              </div>
            ))}
            <div className="mt-2 text-xs font-bold text-text-secondary bg-black/20 rounded-full px-3 py-1 self-center">
              {data.votes} votos
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Odds da Galera</h1>
        <p className="text-text-secondary">Estatísticas Globais · {totalVoters} participantes</p>
      </div>

      <GroupTabs
        groups={CUP_GROUPS}
        selected={selectedGroup}
        onSelect={setSelectedGroup}
        knockoutUnlocked={true}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="mt-6 animate-slide-up">
          {selectedGroup === 'Mata-Mata' ? (
            <div className="space-y-8">
              
              {/* Podium */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-center gradient-text">Mais Votados (Pódio)</h2>
                <div className="flex flex-col md:flex-row gap-4 items-stretch justify-center">
                  {renderPodiumPosition('2º Lugar', knockoutStats.runnerUp, 'text-gray-400', 'border-gray-400')}
                  {renderPodiumPosition('Campeão', knockoutStats.champion, 'text-accent-gold-light', 'border-accent-gold')}
                  {renderPodiumPosition('3º Lugar', knockoutStats.thirdPlace, 'text-amber-600', 'border-amber-600')}
                </div>
              </div>

              {/* Advanced Teams List */}
              <div>
                <h2 className="text-xl font-bold mb-4 mt-8">Favoritos para as Oitavas (Passar de Fase)</h2>
                {knockoutStats.advanced.length === 0 ? (
                  <div className="glass-card p-8 text-center text-text-muted">Nenhum palpite registrado para a próxima fase ainda.</div>
                ) : (
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-bg-secondary text-text-muted border-b border-border">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-center w-12">#</th>
                            <th scope="col" className="px-4 py-3 font-medium">Seleção</th>
                            <th scope="col" className="px-4 py-3 text-center w-24">Votos</th>
                            <th scope="col" className="px-4 py-3 w-1/3 min-w-[100px] hidden sm:table-cell">Popularidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {knockoutStats.advanced.flatMap(group => 
                            group.teams.map(t => {
                              const pct = knockoutStats.maxAdvancedVotes > 0 
                                ? Math.round((group.votes / knockoutStats.maxAdvancedVotes) * 100) 
                                : 0

                              return (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-3 text-center font-bold text-text-secondary">
                                    {group.rank}º
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {getFlagUrl(t.flag) ? (
                                        <img src={getFlagUrl(t.flag)} alt={t.id} className="w-6 h-4 rounded-sm object-cover shadow-sm" />
                                      ) : (
                                        <span className="text-lg leading-none">{t.flag}</span>
                                      )}
                                      <span className="font-semibold text-text-primary">{translateTeam(t.id)}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-accent-green-light">
                                    {group.votes}
                                  </td>
                                  <td className="px-4 py-3 hidden sm:table-cell">
                                    <div className="w-full bg-bg-secondary rounded-full h-2">
                                      <div 
                                        className="bg-gradient-to-r from-accent-green to-emerald-500 h-2 rounded-full transition-all duration-1000"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.map(match => (
                <div key={match.id} className="glass-card p-5 md:p-6">
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFlagUrl(match.flag_home) ? (
                        <img src={getFlagUrl(match.flag_home)} alt={translateTeam(match.team_home)} className="w-8 h-5 md:w-10 md:h-7 object-cover rounded shadow-sm flex-shrink-0" />
                      ) : (
                        <span className="text-2xl">{match.flag_home}</span>
                      )}
                      <span className="font-semibold text-text-primary truncate">{translateTeam(match.team_home)}</span>
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
                      <span className="font-semibold text-text-primary truncate">{translateTeam(match.team_away)}</span>
                      {getFlagUrl(match.flag_away) ? (
                        <img src={getFlagUrl(match.flag_away)} alt={translateTeam(match.team_away)} className="w-8 h-5 md:w-10 md:h-7 object-cover rounded shadow-sm flex-shrink-0" />
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
                          {translateTeam(match.team_home)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                          Empate
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
                          {translateTeam(match.team_away)}
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
      )}
    </div>
  )
}
