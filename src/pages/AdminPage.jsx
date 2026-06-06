import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import GroupTabs from '../components/GroupTabs'

const CUP_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']

export default function AdminPage() {
  const { adminUser, adminLogout } = useAuth()
  const navigate = useNavigate()
  
  // Leagues state
  const [leagues, setLeagues] = useState([])
  const [newLeagueName, setNewLeagueName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)

  // Matches state
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [saving, setSaving] = useState({})
  const [results, setResults] = useState({})

  useEffect(() => {
    async function fetchLeagues() {
      const { data } = await supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false })
      setLeagues(data || [])
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
      ;(data || []).forEach(m => {
        if (m.score_home !== null && m.score_away !== null) {
          resultMap[m.id] = { home: m.score_home, away: m.score_away }
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
      setLeagues([data, ...leagues])
      setNewLeagueName('')
    }
    setCreating(false)
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
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
        })
        .eq('id', matchId)

      setMatches(prev =>
        prev.map(m =>
          m.id === matchId
            ? { ...m, score_home: parseInt(r.home), score_away: parseInt(r.away) }
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
                      <th className="pb-2 font-medium">Código de Convite</th>
                      <th className="pb-2 font-medium text-right">Data Criação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagues.map(league => (
                      <tr key={league.id} className="border-b border-border/50 hover:bg-white/5">
                        <td className="py-3 font-medium">{league.name}</td>
                        <td className="py-3">
                          <button
                            onClick={() => copyCode(league.code)}
                            className="flex items-center gap-2 px-3 py-1 bg-bg-primary rounded border border-border hover:border-accent-gold transition-colors"
                          >
                            <span className="font-mono text-accent-gold-light tracking-wider">{league.code}</span>
                            <span>{copiedCode === league.code ? '✅' : '📋'}</span>
                          </button>
                        </td>
                        <td className="py-3 text-right text-text-muted">
                          {new Date(league.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🏆</span> Resultados Oficiais (Global)
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Os resultados inseridos aqui afetarão todas as ligas e usuários da plataforma instantaneamente.
              <br/>(A API de tempo real preencherá automaticamente, use isso como ferramenta de correção/contingência)
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
              {matches.map(match => (
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
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={results[match.id]?.home ?? ''}
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
                        value={results[match.id]?.away ?? ''}
                        onChange={(e) =>
                          setResults(prev => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], away: e.target.value },
                          }))
                        }
                        className="w-12 h-10 text-center bg-bg-primary border border-border rounded font-black text-lg focus:outline-none focus:border-accent-gold"
                      />
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

                  {/* Mobile team names */}
                  <div className="flex justify-between mt-2 sm:hidden text-xs text-text-muted">
                    <span>{match.team_home}</span>
                    <span>{match.team_away}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
