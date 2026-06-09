import { useState, useEffect, useRef } from 'react'
import { calcScore } from '../lib/scoring'
import { translateTeam } from '../lib/countries'

export default function MatchCard({ match, prediction, onSave, saving, saved, liveData }) {
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const debounceRef = useRef(null)

  // Bloqueia 5 minutos antes do início (adiciona 5min ao tempo atual para comparação)
  const lockTime = new Date(Date.now() + 5 * 60 * 1000)
  const hasStarted = (match.match_date && new Date(match.match_date) < lockTime) || !!liveData
  const hasResult = match.score_home !== null && match.score_away !== null

  // Initialize from prediction
  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.score_home?.toString() ?? '')
      setAwayScore(prediction.score_away?.toString() ?? '')
    }
  }, [prediction])

  // Auto-save with debounce
  const triggerSave = (home, away) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (home !== '' && away !== '') {
        onSave(match.id, parseInt(home), parseInt(away))
      }
    }, 800)
  }

  const handleHomeChange = (e) => {
    const val = e.target.value
    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 20)) {
      setHomeScore(val)
      triggerSave(val, awayScore)
    }
  }

  const handleAwayChange = (e) => {
    const val = e.target.value
    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 20)) {
      setAwayScore(val)
      triggerSave(homeScore, val)
    }
  }

  // Calculate points if there's a result
  const scoreResult = hasResult && prediction
    ? calcScore(
        { score_home: prediction.score_home, score_away: prediction.score_away },
        { score_home: match.score_home, score_away: match.score_away }
      )
    : null

  // Helper to convert emoji or 2-letter codes to FlagCDN URLs
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

  // Format match date
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    })
  }

  return (
    <div id={`match-${match.id}`} className={`glass-card p-4 md:p-5 transition-all duration-300 ${
      hasResult ? 'border-accent-green/20' : ''
    } ${saved ? 'ring-2 ring-accent-green/40' : ''}`}>
      {/* Date row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">{formatDate(match.match_date)}</span>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-accent-gold">
              <span className="w-3 h-3 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
              Salvando...
            </span>
          )}
          {saved && (
            <span className="text-xs text-accent-green animate-scale-in">✅ Salvo!</span>
          )}
          {hasStarted && !hasResult && !liveData && (
            <span className="text-xs text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full">🔒 Bloqueado</span>
          )}
        </div>
      </div>

      {/* Main match row */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-0">
          {getFlagUrl(match.flag_home) ? (
            <img src={getFlagUrl(match.flag_home)} alt={translateTeam(match.team_home)} className="w-8 h-5 md:w-10 md:h-7 mb-1 object-cover rounded shadow-sm flex-shrink-0" />
          ) : (
            <span className="text-2xl md:text-3xl flex-shrink-0 mb-1">{match.flag_home}</span>
          )}
          <span className="font-semibold text-xs md:text-sm text-text-primary text-center break-words leading-tight w-full">
            {translateTeam(match.team_home)}
          </span>
        </div>

        {/* Score Inputs */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="number"
            min="0"
            max="20"
            value={homeScore}
            onChange={handleHomeChange}
            disabled={hasStarted}
            className={hasStarted ? 'score-input-locked' : 'score-input'}
            placeholder="–"
          />
          <span className="text-text-muted font-bold text-lg">×</span>
          <input
            type="number"
            min="0"
            max="20"
            value={awayScore}
            onChange={handleAwayChange}
            disabled={hasStarted}
            className={hasStarted ? 'score-input-locked' : 'score-input'}
            placeholder="–"
          />
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-0">
          {getFlagUrl(match.flag_away) ? (
            <img src={getFlagUrl(match.flag_away)} alt={translateTeam(match.team_away)} className="w-8 h-5 md:w-10 md:h-7 mb-1 object-cover rounded shadow-sm flex-shrink-0" />
          ) : (
            <span className="text-2xl md:text-3xl flex-shrink-0 mb-1">{match.flag_away}</span>
          )}
          <span className="font-semibold text-xs md:text-sm text-text-primary text-center break-words leading-tight w-full">
            {translateTeam(match.team_away)}
          </span>
        </div>
      </div>

      {/* Result + Points row (shown when match has real result) */}
      {hasResult && (
        <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Resultado:</span>
            <span className="text-sm font-bold text-accent-green-light">
              {match.score_home} × {match.score_away}
            </span>
            {liveData && !liveData.finished && (
              <span className="text-xs font-bold text-red-500 animate-pulse ml-2">
                🔴 Ao Vivo {liveData.time_elapsed ? `(${liveData.time_elapsed}')` : ''}
              </span>
            )}
            {liveData && liveData.finished && (
              <span className="text-xs font-bold text-text-muted ml-2">
                (Finalizado)
              </span>
            )}
          </div>
          {scoreResult && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">{scoreResult.details}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                scoreResult.total === 5
                  ? 'bg-gradient-to-r from-accent-gold to-amber-600 text-white'
                  : scoreResult.total >= 3
                  ? 'bg-accent-green/20 text-accent-green-light'
                  : scoreResult.total > 0
                  ? 'bg-accent-gold/20 text-accent-gold-light'
                  : 'bg-bg-primary text-text-muted'
              }`}>
                +{scoreResult.total} pts
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
