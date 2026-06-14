import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [league, setLeague] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carrega sessão comum nativa do Supabase
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Busca os dados complementares do usuário na nossa tabela pública
        const { data: userData } = await supabase
          .from('users')
          .select('*, leagues(*)')
          .eq('auth_id', session.user.id)
          .maybeSingle()
        
        if (userData) {
          const leagueData = userData.leagues
          delete userData.leagues
          setUser(userData)
          setLeague(leagueData)
        }
      }
      
      // Carrega sessão de admin (continua customizada pois é local/separada)
      try {
        const storedAdmin = localStorage.getItem('bolao_admin_session')
        if (storedAdmin) {
          setAdminUser(JSON.parse(storedAdmin))
        }
      } catch (e) {
        try { localStorage.removeItem('bolao_admin_session') } catch(err) {}
      }
      
      setLoading(false)
    }
    
    checkUser()

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLeague(null)
      } else if (session && !user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*, leagues(*)')
          .eq('auth_id', session.user.id)
          .maybeSingle()
          
        if (userData) {
          const leagueData = userData.leagues
          delete userData.leagues
          setUser(userData)
          setLeague(leagueData)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const register = async (name, email, password, code) => {
    // 1. Verifica se nome de usuário já existe globalmente
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle()

    if (existingUser) {
      throw new Error('Este nome de usuário já está em uso.')
    }

    // 2. Procura o grupo pelo código
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (leagueError || !leagueData) {
      throw new Error('Código do grupo não encontrado.')
    }

    // 3. Cadastra na Autenticação Oficial do Supabase
    let authData = null
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password
    })

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered') || authError.status === 400) {
        // Tentativa de recuperação: a pessoa pode ter travado no erro antigo e a conta Auth foi criada sem o Perfil.
        // Vamos tentar logar com a senha que ela acabou de digitar.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })
        
        if (signInError) {
          throw new Error('Este e-mail já está em uso. Se for o seu, tente fazer login ou recuperar a senha.')
        } else {
          // Logou com sucesso, significa que a conta existe. Vamos checar se já tem perfil.
          const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', signInData.user.id)
            .maybeSingle()
            
          if (existingProfile) {
            throw new Error('Este e-mail já possui uma conta ativa. Por favor, faça login.')
          }
          // Se não tem perfil, vamos usar o signInData para continuar e criar o perfil abaixo!
          authData = signInData
        }
      } else {
        throw new Error('Erro ao registrar e-mail: ' + authError.message)
      }
    } else {
      authData = signUpData
    }

    // Se tiver confirmação de e-mail ativada, authData.user existirá mas session será nula
    if (!authData || !authData.user) throw new Error('Erro inesperado ao criar conta.')

    // 4. Salva na nossa tabela de usuários
    const { data: userData, error: createError } = await supabase
      .from('users')
      .insert({ 
        auth_id: authData.user.id, 
        email: email.trim(),
        name: name.trim(), 
        league_id: leagueData.id,
        password: 'USE_SUPABASE_AUTH' // Preenche a restrição antiga do banco de dados de forma segura
      })
      .select()
      .single()

    if (createError) throw new Error('Erro ao criar perfil: ' + createError.message)

    // A sessão será gerida pelo evento onAuthStateChange
    // Mas para o signup imediato (se e-mail automático confirmado estiver on):
    if (authData.session) {
      setUser(userData)
      setLeague(leagueData)
    } else {
      // Caso precise confirmar o e-mail, lançamos a info
      throw new Error('Check_Email')
    }
  }

  const login = async (email, password) => {
    // 1. Loga com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (authError) throw new Error('E-mail ou senha incorretos.')

    // 2. Busca perfil
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, leagues(*)')
      .eq('auth_id', authData.user.id)
      .maybeSingle()

    if (userError || !userData) {
      // Usuário logou mas não tem perfil? Erro estranho, possivelmente os antigos sem elo
      throw new Error('Perfil não encontrado para este e-mail. Peça ao Admin para migrar sua conta.')
    }

    const leagueData = userData.leagues
    delete userData.leagues

    setUser(userData)
    setLeague(leagueData)
    return { user: userData, league: leagueData }
  }
  
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/reset-password-confirm',
    })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    await supabase.auth.signOut()
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

    try {
      localStorage.setItem('bolao_admin_session', JSON.stringify(admin))
    } catch(e) {}
    setAdminUser(admin)
    return admin
  }

  const adminLogout = () => {
    try {
      localStorage.removeItem('bolao_admin_session')
    } catch(e) {}
    setAdminUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, league, loading, login, register, resetPassword, logout, 
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
