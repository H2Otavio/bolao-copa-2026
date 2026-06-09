import { useState, useEffect, useRef } from 'react'
import { calcScore } from '../lib/scoring'
import { translateTeam } from '../lib/countries'

export default function MatchCard({ match, prediction, onSave, saving, saved, liveData, simulatedMatch }) {
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [penaltyWinner, setPenaltyWinner] = useState('')
  const debounceRef = useRef(null)

  // Bloqueia 5 minutos antes do início (adiciona 5min ao tempo atual para comparação)
  const lockTime = new Date(Date.now() + 5 * 60 * 1000)
  const hasStarted = (match.match_date && new Date(match.match_date) < lockTime) || !!liveData
  const hasResult = match.score_home !== null && match.score_away !== null

  // Determine if it's knockout
  const isKnockout = match.cup_group && match.cup_group.length > 1

  const placeholderRegex = /1[A-L]|2[A-L]|3rd|Vencedor|Winner|Perdedor|Loser|Runner-up/
  const isRealMatchReady = !placeholderRegex.test(match.team_home || '') && !placeholderRegex.test(match.team_away || '')
  
  let displayTeamHome = match.team_home
  let displayTeamAway = match.team_away
  let displayFlagHome = match.flag_home
  let displayFlagAway = match.flag_away
  
  let isSimulatedView = false
  let mismatchWarning = false

  if (simulatedMatch) {
    if (!isRealMatchReady) {
      displayTeamHome = simulatedMatch.team_home
      displayFlagHome = simulatedMatch.flag_home
      displayTeamAway = simulatedMatch.team_away
      displayFlagAway = simulatedMatch.flag_away
      isSimulatedView = true
    } else {
      if (match.team_home !== simulatedMatch.team_home || match.team_away !== simulatedMatch.team_away) {
        if (prediction?.is_simulated) {
          mismatchWarning = true
        }
      }
    }
  }

  // Initialize from prediction
  useEffect(() => {
    if (prediction && !mismatchWarning) {
      setHomeScore(prediction.score_home?.toString() ?? '')
      setAwayScore(prediction.score_away?.toString() ?? '')
      setPenaltyWinner(prediction.advance_on_penalties ?? '')
    } else if (mismatchWarning) {
      setHomeScore('')
      setAwayScore('')
      setPenaltyWinner('')
    }
  }, [prediction, mismatchWarning])

  // Auto-save with debounce
  const triggerSave = (home, away, penWinner = penaltyWinner) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (home === '' && away === '') {
        // Delete prediction if both are empty
        onSave(match.id, { delete: true })
      } else {
        const h = home === '' ? null : parseInt(home)
        const a = away === '' ? null : parseInt(away)
        // Require penalty winner if it's a draw in knockout
        if (isKnockout && h !== null && a !== null && h === a && !penWinner) return

        onSave(match.id, {
          scoreHome: h,
          scoreAway: a,
          isSimulated: isSimulatedView,
          simulatedTeamHome: isSimulatedView ? displayTeamHome : null,
          simulatedTeamAway: isSimulatedView ? displayTeamAway : null,
          advanceOnPenalties: (isKnockout && h !== null && a !== null && h === a) ? penWinner : null
        })
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

  const handlePenaltyChange = (winnerId) => {
    setPenaltyWinner(winnerId)
    triggerSave(homeScore, awayScore, winnerId)
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
      
      {/* Segunda Chance Warning */}
      {mismatchWarning && (
        <div className="mb-4 bg-accent-gold/10 border border-accent-gold/30 rounded-lg p-3 text-center animate-fade-in">
          <p className="text-xs md:text-sm text-accent-gold font-medium">
            ⚠️ Os times do seu simulador não chegaram até aqui.<br/>
            <span className="text-text-muted">Digite um novo palpite para a partida oficial!</span>
          </p>
        </div>
      )}

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
          {getFlagUrl(displayFlagHome) ? (
            <img src={getFlagUrl(displayFlagHome)} alt={translateTeam(displayTeamHome)} className="w-8 h-5 md:w-10 md:h-7 mb-1 object-cover rounded shadow-sm flex-shrink-0" />
          ) : (
            <span className="text-2xl md:text-3xl flex-shrink-0 mb-1">{displayFlagHome}</span>
          )}
          <span className="font-semibold text-xs md:text-sm text-text-primary text-center break-words leading-tight w-full">
            {translateTeam(displayTeamHome)}
          </span>
        </div>

        {/* Score Inputs */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-2">
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
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-0">
          {getFlagUrl(displayFlagAway) ? (
            <img src={getFlagUrl(displayFlagAway)} alt={translateTeam(displayTeamAway)} className="w-8 h-5 md:w-10 md:h-7 mb-1 object-cover rounded shadow-sm flex-shrink-0" />
          ) : (
            <span className="text-2xl md:text-3xl flex-shrink-0 mb-1">{displayFlagAway}</span>
          )}
          <span className="font-semibold text-xs md:text-sm text-text-primary text-center break-words leading-tight w-full">
            {translateTeam(displayTeamAway)}
          </span>
        </div>
      </div>

      {/* Penalties Tie-breaker (Mata-mata) */}
      {isKnockout && homeScore !== '' && awayScore !== '' && parseInt(homeScore) === parseInt(awayScore) && (
        <div className="mt-3 pt-3 border-t border-border flex flex-col items-center gap-2 animate-fade-in">
          <span className="text-xs font-bold text-accent-gold">Empate no mata-mata! Quem avança nos pênaltis?</span>
          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => handlePenaltyChange(displayTeamHome)}
              disabled={hasStarted}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all border ${
                penaltyWinner === displayTeamHome 
                  ? 'bg-accent-green/20 border-accent-green text-accent-green-light' 
                  : 'bg-bg-primary border-border text-text-muted hover:border-text-muted'
              }`}
            >
              {translateTeam(displayTeamHome)}
            </button>
            <button
              onClick={() => handlePenaltyChange(displayTeamAway)}
              disabled={hasStarted}
              className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all border ${
                penaltyWinner === displayTeamAway 
                  ? 'bg-accent-green/20 border-accent-green text-accent-green-light' 
                  : 'bg-bg-primary border-border text-text-muted hover:border-text-muted'
              }`}
            >
              {translateTeam(displayTeamAway)}
            </button>
          </div>
        </div>
      )}

      {/* Mismatch Warning */}
      {mismatchWarning && (
        <div className="mt-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-center animate-fade-in">
          <p className="text-xs text-danger mb-1 font-bold">Errou o cruzamento!</p>
          <p className="text-[11px] text-danger/80">Seu simulador previa: {translateTeam(prediction.simulated_team_home)} x {translateTeam(prediction.simulated_team_away)}</p>
          <p className="text-[11px] text-text-muted mt-1">Preencha um novo placar acima para o confronto real.</p>
        </div>
      )}

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
