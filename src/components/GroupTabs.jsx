import { useRef, useEffect } from 'react'

export default function GroupTabs({ groups, selected, onSelect, predCounts, matchesPerGroup }) {
  const scrollRef = useRef(null)

  // Auto-scroll to selected tab
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector('[data-active="true"]')
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [selected])

  const groupStage = groups.filter(g => g.length === 1)
  const knockoutStage = groups.filter(g => g.length > 1)
  const isKnockoutPhase = selected.length > 1

  // Lock knockout until June 28, 2026
  const knockoutUnlocked = Date.now() > new Date('2026-06-28T00:00:00Z').getTime()

  const handlePhaseChange = (phase) => {
    if (phase === 'groups' && isKnockoutPhase) onSelect('A')
    if (phase === 'knockout' && !isKnockoutPhase) {
      if (knockoutUnlocked) onSelect('R32')
    }
  }

  const getKnockoutLabel = (g) => {
    switch(g) {
      case 'R32': return '16-avos'
      case 'R16': return 'Oitavas'
      case 'QF': return 'Quartas'
      case 'SF': return 'Semifinal'
      case '3RD': return '3º Lugar'
      case 'FINAL': return 'Final'
      default: return g
    }
  }

  const visibleGroups = isKnockoutPhase ? knockoutStage : groupStage

  return (
    <div className="flex flex-col gap-3">
      {/* Nível 1: Seletor Principal */}
      <div className="flex p-1 bg-bg-card rounded-xl border border-border">
        <button
          onClick={() => handlePhaseChange('groups')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            !isKnockoutPhase ? 'bg-accent-green text-white shadow-md' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Fase de Grupos
        </button>
        <button
          onClick={() => handlePhaseChange('knockout')}
          disabled={!knockoutUnlocked}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            isKnockoutPhase ? 'bg-accent-green text-white shadow-md' : 'text-text-muted hover:text-text-primary'
          } ${!knockoutUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={!knockoutUnlocked ? "Estará disponível após o fim da fase de grupos" : ""}
        >
          Mata-Mata {!knockoutUnlocked && '🔒'}
        </button>
      </div>

      {/* Nível 2: Sub-guias */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pt-3 pb-4 px-4 scrollbar-none -mx-4 md:mx-0 md:px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleGroups.map(group => {
          const isActive = group === selected
          const count = predCounts?.[group] || 0
          const total = matchesPerGroup || 0
          const isComplete = total > 0 ? count >= total : false

          return (
            <button
              key={group}
              data-active={isActive}
              onClick={() => onSelect(group)}
              className={`relative flex-shrink-0 ${
                isActive ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <span className="text-sm">{isKnockoutPhase ? getKnockoutLabel(group) : `Grupo ${group}`}</span>

              {/* Prediction count badge */}
              {predCounts && (
                <span
                  className={`absolute -top-2.5 -right-2.5 w-5 h-5 flex items-center justify-center text-[11px] font-bold rounded-full ${
                    isComplete
                      ? 'bg-accent-green text-white shadow-md'
                      : count > 0
                      ? 'bg-accent-gold text-white shadow-md'
                      : 'bg-bg-primary text-text-muted border border-border shadow-md'
                  }`}
                >
                  {isComplete ? '✓' : count > 0 ? '·' : '!'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
