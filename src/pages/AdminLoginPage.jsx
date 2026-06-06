import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { adminLogin, adminUser } = useAuth()

  // If already logged in, redirect
  if (adminUser) {
    navigate('/admin', { replace: true })
    return null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Preencha usuário e senha.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await adminLogin(username.trim(), password.trim())
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-bg-primary">
      {/* Subtle decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-2xl font-black gradient-text-gold mb-1">Admin Global</h1>
          <p className="text-text-secondary text-sm">Acesso restrito ao administrador</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6 md:p-8 border border-accent-gold/20">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="input-field"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : 'Acessar Painel'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm text-center animate-scale-in">
              {error}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')}
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            &larr; Voltar para o Bolão
          </button>
        </div>
      </div>
    </div>
  )
}
