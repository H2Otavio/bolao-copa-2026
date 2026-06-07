import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

// Função nativa do navegador para criar Hash (SHA-256) segura sem depender de bibliotecas externas
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [league, setLeague] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carrega sessão comum
    const stored = localStorage.getItem('bolao_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        setUser(session.user)
        setLeague(session.league)
      } catch (e) {
        localStorage.removeItem('bolao_session')
      }
    }

    // Carrega sessão de admin
    const storedAdmin = localStorage.getItem('bolao_admin_session')
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin))
      } catch (e) {
        localStorage.removeItem('bolao_admin_session')
      }
    }

    setLoading(false)
  }, [])

  const register = async (name, password, code) => {
    // Verifica se nome de usuário já existe globalmente
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle()

    if (existingUser) {
      throw new Error('Este nome de usuário já está em uso.')
    }

    // Procura o grupo pelo código
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (leagueError || !leagueData) {
      throw new Error('Código do grupo não encontrado.')
    }

    // Cria a Hash da senha usando a API nativa
    const hash = await hashPassword(password)

    // Insere o usuário
    let { data: userData, error: createError } = await supabase
      .from('users')
      .insert({ name: name.trim(), password: hash, league_id: leagueData.id })
      .select()
      .single()

    if (createError) throw new Error('Erro ao criar usuário: ' + createError.message)

    // Remove a hash da memória do cliente
    delete userData.password

    const session = { user: userData, league: leagueData }
    localStorage.setItem('bolao_session', JSON.stringify(session))
    setUser(userData)
    setLeague(leagueData)
    return session
  }

  const login = async (name, password) => {
    // Encontra usuário pelo nome e traz os dados da liga junto
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, leagues(*)')
      .eq('name', name.trim())
      .maybeSingle()

    if (userError || !userData) {
      throw new Error('Usuário não encontrado.')
    }

    // Verifica a senha
    const hash = await hashPassword(password)
    if (hash !== userData.password) {
      throw new Error('Senha incorreta.')
    }

    const leagueData = userData.leagues

    // Limpa a senha da memória do cliente
    delete userData.password
    delete userData.leagues

    const session = { user: userData, league: leagueData }
    localStorage.setItem('bolao_session', JSON.stringify(session))
    setUser(userData)
    setLeague(leagueData)
    return session
  }

  const logout = () => {
    localStorage.removeItem('bolao_session')
    setUser(null)
    setLeague(null)
  }

  const adminLogin = async (username, password) => {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()

    if (error || !admin) {
      throw new Error('Usuário ou senha inválidos.')
    }

    localStorage.setItem('bolao_admin_session', JSON.stringify(admin))
    setAdminUser(admin)
    return admin
  }

  const adminLogout = () => {
    localStorage.removeItem('bolao_admin_session')
    setAdminUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, league, loading, login, logout, 
      adminUser, adminLogin, adminLogout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
