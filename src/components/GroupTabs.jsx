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

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {groups.map(group => {
        const isActive = group === selected
        const count = predCounts?.[group] || 0
        const total = matchesPerGroup || 6
        const isComplete = count >= total

        return (
          <button
            key={group}
            data-active={isActive}
            onClick={() => onSelect(group)}
            className={`relative flex-shrink-0 ${
              isActive ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <span className="text-sm">Grupo {group}</span>

            {/* Prediction count badge */}
            {predCounts && (
              <span
                className={`absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full ${
                  isComplete
                    ? 'bg-accent-green text-white'
                    : count > 0
                    ? 'bg-accent-gold text-white'
                    : 'bg-bg-primary text-text-muted border border-border'
                }`}
              >
                {isComplete ? '✓' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
