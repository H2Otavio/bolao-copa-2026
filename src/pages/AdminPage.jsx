import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import GroupTabs from '../components/GroupTabs'

const CUP_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', '16avos', 'Oitavas', 'Quartas', 'Semi-final', '3 Lugar', 'Final']

export default function AdminPage() {
  const { adminUser, adminLogout } = useAuth()
  const navigate = useNavigate()

  // Leagues state
  const [leagues, setLeagues] = useState([])
  const [newLeagueName, setNewLeagueName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)

  // Details state
  const [selectedLeagueForDetails, setSelectedLeagueForDetails] = useState(null)
  const [leagueUsersDetails, setLeagueUsersDetails] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [allMatchesData, setAllMatchesData] = useState([])

  // Matches state
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [saving, setSaving] = useState({})
  const [results, setResults] = useState({})

  useEffect(() => {
    async function fetchLeagues() {
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: usersData } = await supabase
        .from('users')
        .select('id, league_id')

      const leaguesWithCounts = (leaguesData || []).map(l => ({
        ...l,
        userCount: (usersData || []).filter(u => u.league_id === l.id).length
      }))

      setLeagues(leaguesWithCounts)
    }
    fetchLeagues()
  }, [])

  useEffect(() => {
    async function fetchMatches() {
      setLoadingMatches(true)
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('cup_group', selectedGroup)
        .order('match_number')

      setMatches(data || [])

      // Initialize results
      const resultMap = {}
        ; (data || []).forEach(m => {
          if (m.score_home !== null && m.score_away !== null) {
            resultMap[m.id] = { 
              home: m.score_home, 
              away: m.score_away,
              advance_on_penalties: m.advance_on_penalties || ''
            }
          }
        })
      setResults(resultMap)
      setLoadingMatches(false)
    }
    fetchMatches()
  }, [selectedGroup])

  const handleCreateLeague = async (e) => {
    e.preventDefault()
    if (!newLeagueName.trim()) return

    const code = newLeagueName.toUpperCase().replace(/\s/g, '').slice(0, 8) +
      Math.random().toString(36).slice(2, 6).toUpperCase()

    setCreating(true)
    const { data, error } = await supabase
      .from('leagues')
      .insert({ name: newLeagueName, code, admin_name: adminUser.username })
      .select()
      .single()

    if (error) {
      alert('Erro ao criar liga: ' + error.message)
    } else {
      setLeagues([{ ...data, userCount: 0 }, ...leagues])
      setNewLeagueName('')
    }
    setCreating(false)
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleViewDetails = async (league) => {
    setSelectedLeagueForDetails(league)
    setLoadingDetails(true)
    
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .eq('league_id', league.id)
      
    if (!users || users.length === 0) {
      setLeagueUsersDetails([])
      setLoadingDetails(false)
      return
    }
    
    const userIds = users.map(u => u.id)
    const { data: predictions } = await supabase
      .from('predictions')
      .select('user_id, match_id')
      .in('user_id', userIds)
      
    let matchesData = allMatchesData
    if (matchesData.length === 0) {
      const { data: mData } = await supabase.from('matches').select('id, cup_group, match_number, team_home, team_away')
      matchesData = mData || []
      setAllMatchesData(matchesData)
    }
    
    const groupMatchesIds = matchesData.filter(m => m.cup_group.length === 1).map(m => m.id)
    const knockoutMatchesIds = matchesData.filter(m => m.cup_group.length > 1).map(m => m.id)
    
    const usersWithStats = users.map(user => {
      const userPreds = (predictions || []).filter(p => p.user_id === user.id)
      const userPredMatchIds = userPreds.map(p => p.match_id)
      
      const groupPredsCount = userPredMatchIds.filter(id => groupMatchesIds.includes(id)).length
      const knockoutPredsCount = userPredMatchIds.filter(id => knockoutMatchesIds.includes(id)).length
      
      const missingGroupMatches = matchesData.filter(m => m.cup_group.length === 1 && !userPredMatchIds.includes(m.id))
      const missingKnockoutMatches = matchesData.filter(m => m.cup_group.length > 1 && !userPredMatchIds.includes(m.id))
      
      return {
        ...user,
        groupPredsCount,
        knockoutPredsCount,
        missingGroupMatches,
        missingKnockoutMatches,
        showMissing: false
      }
    })
    
    usersWithStats.sort((a, b) => (b.groupPredsCount + b.knockoutPredsCount) - (a.groupPredsCount + a.knockoutPredsCount))
    
    setLeagueUsersDetails(usersWithStats)
    setLoadingDetails(false)
  }

  const toggleShowMissing = (userId) => {
    setLeagueUsersDetails(prev => prev.map(u => u.id === userId ? { ...u, showMissing: !u.showMissing } : u))
  }

  const handleSaveResult = async (matchId) => {
    const r = results[matchId]
    if (!r || r.home === '' || r.away === '' || r.home === undefined || r.away === undefined) return

    setSaving(prev => ({ ...prev, [matchId]: true }))
    try {
      await supabase
        .from('matches')
        .update({
          score_home: parseInt(r.home),
          score_away: parseInt(r.away),
          advance_on_penalties: r.advance_on_penalties || null
        })
        .eq('id', matchId)

      setMatches(prev =>
        prev.map(m =>
          m.id === matchId
            ? { ...m, score_home: parseInt(r.home), score_away: parseInt(r.away), advance_on_penalties: r.advance_on_penalties }
            : m
        )
      )
    } catch (err) {
      console.error('Error saving result:', err)
    } finally {
      setSaving(prev => ({ ...prev, [matchId]: false }))
    }
  }

  const handleLogout = () => {
    adminLogout()
    navigate('/admin-login')
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-24">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-accent-gold/20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-bold text-lg gradient-text-gold hidden sm:block">Painel Admin Global</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-muted">Logado como <strong className="text-accent-gold-light">{adminUser.username}</strong></span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

        {/* Ligas / Grupos Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>👥</span> Gerenciar Grupos / Ligas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create form */}
            <div className="glass-card p-6 border-t-4 border-t-accent-gold h-fit">
              <h3 className="font-semibold mb-4">Criar Novo Grupo</h3>
              <form onSubmit={handleCreateLeague} className="space-y-4">
                <input
                  type="text"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="Nome do Grupo (ex: Empresa X)"
                  className="input-field"
                  maxLength={50}
                />
                <button type="submit" disabled={creating} className="btn-gold w-full text-sm">
                  {creating ? 'Criando...' : '+ Criar Grupo'}
                </button>
              </form>
            </div>

            {/* List Leagues */}
            <div className="md:col-span-2 glass-card p-6 overflow-x-auto">
              <h3 className="font-semibold mb-4">Grupos Existentes ({leagues.length})</h3>
              {leagues.length === 0 ? (
                <p className="text-text-muted text-sm">Nenhum grupo criado ainda.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="pb-2 font-medium">Nome</th>
                      <th className="pb-2 font-medium text-center">Usuários</th>
                      <th className="pb-2 font-medium">Código</th>
                      <th className="pb-2 font-medium text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagues.map(league => (
                      <tr key={league.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                        <td className="py-3 font-medium">{league.name}</td>
                        <td className="py-3 text-center">
                          <span className="bg-bg-primary px-2 py-1 rounded text-xs font-bold">{league.userCount}</span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => copyCode(league.code)}
                            className="flex items-center gap-2 text-accent-gold hover:text-accent-gold-light transition-colors"
                          >
                            <span className="font-mono tracking-wider">{league.code}</span>
                            <span>{copiedCode === league.code ? '✅' : '📋'}</span>
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleViewDetails(league)}
                            className="text-xs btn-secondary py-1 px-3"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* League Details Section (Drill-down) */}
        {selectedLeagueForDetails && (
          <section className="mb-12 animate-slide-up">
            <div className="glass-card p-6 border-l-4 border-l-accent-green">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  Auditoria de Usuários: <span className="text-accent-green">{selectedLeagueForDetails.name}</span>
                </h3>
                <button 
                  onClick={() => setSelectedLeagueForDetails(null)}
                  className="text-text-muted hover:text-white"
                >
                  ✖ Fechar
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
                </div>
              ) : leagueUsersDetails.length === 0 ? (
                <p className="text-text-muted">Nenhum usuário neste grupo ainda.</p>
              ) : (
                <div className="space-y-4">
                  {leagueUsersDetails.map(user => {
                    const groupComplete = user.groupPredsCount >= 72
                    const koComplete = user.knockoutPredsCount >= 32
                    
                    return (
                      <div key={user.id} className="bg-bg-primary rounded-lg p-4 border border-border">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="font-medium text-lg">{user.username}</div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex flex-col items-center">
                              <span className="text-text-muted text-xs mb-1">Fase de Grupos</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${groupComplete ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-gold/20 text-accent-gold'}`}>
                                {user.groupPredsCount} / 72
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-text-muted text-xs mb-1">Mata-Mata</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${koComplete ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-gold/20 text-accent-gold'}`}>
                                {user.knockoutPredsCount} / 32
                              </span>
                            </div>
                            
                            <button
                              onClick={() => toggleShowMissing(user.id)}
                              className="ml-2 btn-secondary py-1 px-3 text-xs"
                            >
                              {user.showMissing ? 'Esconder Faltantes' : 'Ver Faltantes'}
                            </button>
                          </div>
                        </div>

                        {/* Missing Predictions Details */}
                        {user.showMissing && (
                          <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                            {(!groupComplete || !koComplete) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-bold text-accent-gold text-sm mb-2">Faltam na Fase de Grupos ({user.missingGroupMatches.length}):</h4>
                                  <ul className="text-xs text-text-muted space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                                    {user.missingGroupMatches.map(m => (
                                      <li key={m.id}>Grupo {m.cup_group} - {m.team_home} x {m.team_away}</li>
                                    ))}
                                    {user.missingGroupMatches.length === 0 && <li>✅ Completo!</li>}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-bold text-accent-gold text-sm mb-2">Faltam no Mata-Mata ({user.missingKnockoutMatches.length}):</h4>
                                  <ul className="text-xs text-text-muted space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                                    {user.missingKnockoutMatches.map(m => (
                                      <li key={m.id}>{m.cup_group} - {m.team_home || '?'} x {m.team_away || '?'}</li>
                                    ))}
                                    {user.missingKnockoutMatches.length === 0 && <li>✅ Completo!</li>}
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <p className="text-accent-green text-sm font-bold text-center">🎉 Este usuário já preencheu 100% dos palpites!</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Results Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🏆</span> Resultados Oficiais (Global)
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Os resultados inseridos aqui afetarão todas as ligas e usuários da plataforma instantaneamente.
              <br />(A API de tempo real preencherá automaticamente, use isso como ferramenta de correção/contingência)
            </p>
          </div>

          <GroupTabs
            groups={CUP_GROUPS}
            selected={selectedGroup}
            onSelect={setSelectedGroup}
          />

          {loadingMatches ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 mt-6 animate-slide-up">
              {matches.map(match => {
                const isKnockout = match.cup_group.length > 1
                const currentResult = results[match.id] || {}
                const isDraw = currentResult.home !== '' && currentResult.away !== '' && 
                               currentResult.home === currentResult.away && 
                               currentResult.home !== undefined

                return (
                  <div key={match.id} className="glass-card p-5 border border-border/50 hover:border-accent-gold/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-medium text-text-primary truncate hidden sm:block">{match.team_home}</span>
                        {match.flag_home?.startsWith('http') ? (
                          <img src={match.flag_home} alt={match.team_home} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                        ) : (
                          <span className="text-xl">{match.flag_home}</span>
                        )}
                      </div>

                      {/* Score Inputs */}
                      <div className="flex items-center gap-2 flex-col">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={currentResult.home ?? ''}
                            onChange={(e) =>
                              setResults(prev => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], home: e.target.value },
                              }))
                            }
                            className="w-12 h-10 text-center bg-bg-primary border border-border rounded font-black text-lg focus:outline-none focus:border-accent-gold"
                          />
                          <span className="text-text-muted font-bold text-lg">×</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={currentResult.away ?? ''}
                            onChange={(e) =>
                              setResults(prev => ({
                                ...prev,
                                [match.id]: { ...prev[match.id], away: e.target.value },
                              }))
                            }
                            className="w-12 h-10 text-center bg-bg-primary border border-border rounded font-black text-lg focus:outline-none focus:border-accent-gold"
                          />
                        </div>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.flag_away?.startsWith('http') ? (
                          <img src={match.flag_away} alt={match.team_away} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                        ) : (
                          <span className="text-xl">{match.flag_away}</span>
                        )}
                        <span className="font-medium text-text-primary truncate hidden sm:block">{match.team_away}</span>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={() => handleSaveResult(match.id)}
                        disabled={saving[match.id]}
                        className="btn-gold !px-4 !py-2 text-sm whitespace-nowrap"
                      >
                        {saving[match.id] ? '...' : match.score_home !== null ? 'Atualizar' : 'Salvar'}
                      </button>
                    </div>

                    {/* Penalty Selector for Knockout Draws */}
                    {isKnockout && isDraw && (
                      <div className="mt-4 pt-3 border-t border-border flex justify-center items-center gap-3">
                        <span className="text-xs font-bold text-accent-gold uppercase">Vencedor nos Pênaltis:</span>
                        <select
                          value={currentResult.advance_on_penalties ?? ''}
                          onChange={(e) => setResults(prev => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], advance_on_penalties: e.target.value }
                          }))}
                          className="bg-bg-primary border border-accent-gold/30 rounded px-3 py-1 text-sm focus:outline-none focus:border-accent-gold"
                        >
                          <option value="">-- Selecione --</option>
                          <option value={match.team_home}>{match.team_home}</option>
                          <option value={match.team_away}>{match.team_away}</option>
                        </select>
                      </div>
                    )}

                    {/* Mobile team names */}
                    <div className="flex justify-between mt-2 sm:hidden text-xs text-text-muted">
                      <span>{match.team_home}</span>
                      <span>{match.team_away}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
