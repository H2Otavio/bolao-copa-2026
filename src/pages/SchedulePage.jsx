import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { translateTeam } from '../lib/countries'
import { parseMatchDate } from '../lib/dateUtils'

export default function SchedulePage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('2026-06-11') // Jogo de Abertura
  const [currentMonth, setCurrentMonth] = useState(5) // 5 = Junho
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchMatches() {
      const { data } = await supabase.from('matches').select('*').order('match_date')
      setMatches(data || [])
      setLoading(false)
    }
    fetchMatches()
  }, [])

  // Agrupar jogos por data (forçando o fuso de São Paulo UTC-3)
  const matchesByDate = {}
  matches.forEach(m => {
    const d = parseMatchDate(m.match_date)
    if (!d) return
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
    const dateStr = formatter.format(d) // 'YYYY-MM-DD' in SP time
    if (!matchesByDate[dateStr]) matchesByDate[dateStr] = []
    matchesByDate[dateStr].push(m)
  })

  // Lógica do Calendário Mensal
  const year = 2026
  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate()
  const firstDay = new Date(year, currentMonth, 1).getDay()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const handleDayClick = (day) => {
    if (!day) return
    const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const selectedMatches = matchesByDate[selectedDate] || []

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

  const formatTime = (dateStr) => {
    const d = parseMatchDate(dateStr)
    if (!d) return ''
    return d.toLocaleTimeString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit', minute: '2-digit' 
    })
  }

  const formatSelectedDate = () => {
    const [y, m, d] = selectedDate.split('-')
    return `${d} de ${monthNames[parseInt(m) - 1]}`
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Cronograma de Jogos</h1>
        <p className="text-text-secondary">Selecione uma data no calendário para ver as partidas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Calendário */}
          <div className="glass-card p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setCurrentMonth(5)} 
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${currentMonth === 5 ? 'bg-accent-green text-white' : 'bg-bg-primary text-text-muted hover:text-text-primary'}`}
              >
                Junho
              </button>
              <h2 className="text-lg font-bold gradient-text">{monthNames[currentMonth]} 2026</h2>
              <button 
                onClick={() => setCurrentMonth(6)} 
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${currentMonth === 6 ? 'bg-accent-green text-white' : 'bg-bg-primary text-text-muted hover:text-text-primary'}`}
              >
                Julho
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {weekDays.map(wd => (
                <div key={wd} className="text-xs font-bold text-text-muted py-1">{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((day, idx) => {
                const dateStr = day ? `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
                const isSelected = dateStr === selectedDate
                const hasMatch = day && matchesByDate[dateStr] && matchesByDate[dateStr].length > 0
                
                return (
                  <div key={idx} className="aspect-square p-0.5">
                    {day ? (
                      <button
                        onClick={() => handleDayClick(day)}
                        disabled={!hasMatch}
                        className={`w-full h-full flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all
                          ${isSelected ? 'bg-gradient-to-r from-accent-green to-emerald-600 text-white shadow-lg scale-105' 
                            : hasMatch 
                              ? 'bg-bg-primary text-text-primary hover:border hover:border-accent-green/50 cursor-pointer' 
                              : 'text-text-muted opacity-30 cursor-not-allowed'}
                        `}
                      >
                        <span>{day}</span>
                        {hasMatch && !isSelected && <span className="w-1 h-1 bg-accent-gold rounded-full mt-0.5"></span>}
                      </button>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lista de Jogos */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold mb-2 pb-2 border-b border-border">
              Jogos do dia {formatSelectedDate()}
            </h3>

            {selectedMatches.length === 0 ? (
              <div className="text-center py-10 text-text-muted bg-bg-card rounded-2xl border border-border border-dashed">
                Nenhum jogo programado para este dia.
              </div>
            ) : (
              selectedMatches.map(match => (
                <div 
                  key={match.id}
                  onClick={() => navigate(`/palpites?group=${match.cup_group}&matchId=${match.id}`)}
                  className="glass-card-hover p-4 cursor-pointer relative group flex flex-col gap-3"
                  title="Clique para palpitar"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-muted">Grupo {match.cup_group}</span>
                    <span className="text-xs font-bold bg-bg-primary px-2 py-1 rounded-md text-accent-green-light">
                      {formatTime(match.match_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col items-center w-1/3">
                      {getFlagUrl(match.flag_home) ? (
                        <img src={getFlagUrl(match.flag_home)} className="w-10 h-7 object-cover rounded shadow-md mb-1" />
                      ) : (
                        <span className="text-3xl">{match.flag_home}</span>
                      )}
                      <span className="text-sm font-bold text-center leading-tight truncate w-full">{translateTeam(match.team_home)}</span>
                    </div>

                    <div className="font-bold text-text-muted">X</div>

                    <div className="flex flex-col items-center w-1/3">
                      {getFlagUrl(match.flag_away) ? (
                        <img src={getFlagUrl(match.flag_away)} className="w-10 h-7 object-cover rounded shadow-md mb-1" />
                      ) : (
                        <span className="text-3xl">{match.flag_away}</span>
                      )}
                      <span className="text-sm font-bold text-center leading-tight truncate w-full">{translateTeam(match.team_away)}</span>
                    </div>
                  </div>

                  {/* Indicador visual para clicar */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent-gold/50 rounded-2xl transition-all pointer-events-none"></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
