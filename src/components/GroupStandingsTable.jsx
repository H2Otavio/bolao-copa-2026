import { useMemo } from 'react'
import { calculateGroupStandings } from '../lib/simulator'

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

export default function GroupStandingsTable({ groupMatches, allPredictionsMap }) {
  // Compute standings in real-time
  const standings = useMemo(() => {
    const predictionsArray = Object.values(allPredictionsMap)
    return calculateGroupStandings(groupMatches, predictionsArray, true)
  }, [groupMatches, allPredictionsMap])

  if (!standings || standings.length === 0) return null

  return (
    <div className="glass-card overflow-hidden mb-6 animate-fade-in border border-border/50 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-bg-secondary text-text-muted border-b border-border">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-center w-8">#</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Seleção</th>
              <th scope="col" className="px-3 py-2.5 text-center" title="Pontos">Pts</th>
              <th scope="col" className="px-3 py-2.5 text-center" title="Jogos Realizados">J</th>
              <th scope="col" className="px-3 py-2.5 text-center hidden sm:table-cell" title="Saldo de Gols">SG</th>
              <th scope="col" className="px-3 py-2.5 text-center hidden sm:table-cell" title="Gols Pró">GP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {standings.map((team, index) => {
              // Highlight styles
              let rowClass = 'hover:bg-white/5 transition-colors'
              let badgeClass = 'text-text-secondary'

              if (index === 0 || index === 1) {
                // Top 2: Qualifiers
                rowClass = 'bg-accent-green/5 hover:bg-accent-green/10 transition-colors'
                badgeClass = 'bg-accent-green/20 text-accent-green-light font-bold rounded-full'
              } else if (index === 2) {
                // 3rd place: Potential qualifiers
                rowClass = 'bg-accent-gold/5 hover:bg-accent-gold/10 transition-colors'
                badgeClass = 'bg-accent-gold/20 text-accent-gold font-bold rounded-full'
              }

              const flagUrl = getFlagUrl(team.flag)

              return (
                <tr key={team.id} className={rowClass}>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs ${badgeClass}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {flagUrl ? (
                        <img src={flagUrl} alt={team.id} className="w-5 h-5 rounded-sm object-cover shadow-sm" />
                      ) : (
                        <span className="text-lg">{team.flag}</span>
                      )}
                      <span className="font-semibold text-text-primary">{team.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-text-primary">
                    {team.points}
                  </td>
                  <td className="px-3 py-2.5 text-center text-text-secondary">
                    {team.matchesPlayed}
                  </td>
                  <td className="px-3 py-2.5 text-center text-text-secondary hidden sm:table-cell">
                    {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                  </td>
                  <td className="px-3 py-2.5 text-center text-text-secondary hidden sm:table-cell">
                    {team.goalsFor}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
