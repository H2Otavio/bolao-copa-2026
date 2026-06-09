import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
    setSuccess(false)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      
      // Redirect back to palpites after a short delay
      setTimeout(() => {
        navigate('/palpites', { replace: true })
      }, 3000)
    } catch (err) {
      setError('Erro ao atualizar senha: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold gradient-text mb-2">Alterar Senha</h1>
        <p className="text-text-secondary text-sm">Crie uma nova senha para acessar sua conta.</p>
      </div>

      <div className="glass-card p-6">
        {success ? (
          <div className="text-center animate-scale-in py-4">
            <div className="w-14 h-14 bg-accent-green/20 text-accent-green-light rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold mb-2">Senha Alterada!</h3>
            <p className="text-text-secondary text-sm mb-4">
              Sua senha foi atualizada com sucesso. Redirecionando...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Nova Senha</label>
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
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirmar Nova Senha</label>
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
        )}

        {error && !success && (
          <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm text-center animate-scale-in">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
