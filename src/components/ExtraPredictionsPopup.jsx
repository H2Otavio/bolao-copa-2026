import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function ExtraPredictionsPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Verifica se já viu o popup
    const hasSeen = localStorage.getItem('hasSeenExtraPredictionsPopup')
    
    // Mostra o popup com um pequeno atraso, mas não se já estiver na página de palpites com a aba selecionada
    if (!hasSeen && location.pathname !== '/palpites') {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenExtraPredictionsPopup', 'true')
  }

  const handleGo = () => {
    setIsOpen(false)
    localStorage.setItem('hasSeenExtraPredictionsPopup', 'true')
    navigate('/palpites?tab=final_awards')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card border border-accent-gold w-full max-w-md p-6 overflow-hidden animate-slide-up shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-accent-gold/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center space-y-4">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold gradient-text">Novo Palpite Liberado!</h2>
          
          <p className="text-text-secondary">
            Agora você pode palpitar quem será o <strong className="text-text-primary">Campeão</strong>, <strong className="text-text-primary">Vice</strong>, <strong className="text-text-primary">3º Lugar</strong> e o <strong className="text-text-primary">Artilheiro</strong> da Copa do Mundo!
          </p>
          
          <div className="bg-bg-primary/50 rounded-lg p-3 text-sm text-text-muted mt-4">
            Acesse a nova aba "Torneio" na tela de palpites e não fique para trás no ranking!
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={handleGo}
              className="w-full py-3 bg-accent-gold text-black font-bold rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(255,215,0,0.3)]"
            >
              Fazer Meus Palpites Agora!
            </button>
            <button 
              onClick={handleClose}
              className="w-full py-2 text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
            >
              Agora não, lembre-me depois
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
