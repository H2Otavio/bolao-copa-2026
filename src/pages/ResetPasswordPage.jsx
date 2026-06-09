import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-black gradient-text mb-2">Recuperar Senha</h1>
          <p className="text-text-secondary">Enviaremos um link de acesso para o seu e-mail.</p>
        </div>

        <div className="glass-card p-8">
          {success ? (
            <div className="text-center animate-scale-in">
              <div className="w-16 h-16 bg-accent-green/20 text-accent-green-light rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✓
              </div>
              <h3 className="text-xl font-bold mb-2">E-mail Enviado!</h3>
              <p className="text-text-secondary mb-6">
                Verifique sua caixa de entrada (e a pasta de spam) e clique no link para redefinir sua senha.
              </p>
              <Link to="/" className="btn-primary w-full inline-block">
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Seu E-mail Cadastrado</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="input-field"
                  autoComplete="email"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          )}

          {error && !success && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm text-center animate-scale-in">
              {error}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-text-muted hover:text-white transition-colors flex items-center justify-center gap-2">
            <span>←</span> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
