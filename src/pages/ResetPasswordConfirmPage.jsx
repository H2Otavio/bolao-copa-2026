import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase automatically parses the hash in the URL and logs the user in
    // However, if there's no hash or the session is missing, we shouldn't be here
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Link de recuperação inválido ou expirado.')
      }
    })
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      setError('Preencha os dois campos.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      
      // Senha atualizada com sucesso
      navigate('/palpites', { replace: true })
    } catch (err) {
      setError('Erro ao atualizar senha: ' + err.message)
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
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-3xl font-black gradient-text mb-2">Criar Nova Senha</h1>
          <p className="text-text-secondary">Digite sua nova senha abaixo para acessar sua conta.</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleUpdatePassword} className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm text-center animate-scale-in">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
