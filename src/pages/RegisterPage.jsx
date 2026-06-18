import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register, user } = useAuth()

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate('/palpites', { replace: true })
    }
  }, [user, navigate])

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim() || !code.trim() || !confirmPassword.trim()) {
      setError('Preencha todos os campos.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(name, email, password, code)
      navigate('/palpites')
    } catch (err) {
      if (err.message === 'Check_Email') {
        setError('Conta criada! Verifique seu e-mail para confirmar.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-500/3 rounded-full blur-2xl" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-4xl font-black gradient-text mb-2">Bolão Copa 2026</h1>
          <p className="text-text-secondary">Faça seus palpites e desafie seus amigos!</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-center mb-6 text-text-primary">Criar Conta</h2>
          
          <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="input-field"
                maxLength={50}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Seu E-mail (Para recuperação)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Crie uma Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Código de Convite do Grupo</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: TRABALHO123"
                className="input-field uppercase tracking-wider"
                maxLength={20}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cadastrando...
                </span>
              ) : 'Criar Conta'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm text-center animate-scale-in">
              {error}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-text-secondary text-sm">
            Já tem uma conta?{' '}
            <Link to="/" className="text-accent-green hover:text-accent-green-light font-bold transition-colors">
              Fazer Login
            </Link>
          </p>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Copa do Mundo 2026 • EUA, México & Canadá 🏟️
        </p>
      </div>
    </div>
  )
}
