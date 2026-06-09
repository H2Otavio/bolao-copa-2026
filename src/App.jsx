import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLoginPage from './pages/AdminLoginPage'
import PredictionsPage from './pages/PredictionsPage'
import SchedulePage from './pages/SchedulePage'
import RankingPage from './pages/RankingPage'
import StatsPage from './pages/StatsPage'
import RulesPage from './pages/RulesPage'
import AdminPage from './pages/AdminPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { adminUser, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!adminUser) return <Navigate to="/admin-login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/cadastrar" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      
      {/* Rotas de Usuário Comum */}
      <Route
        path="/palpites"
        element={
          <ProtectedRoute>
            <Layout>
              <PredictionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cronograma"
        element={
          <ProtectedRoute>
            <Layout>
              <SchedulePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ranking"
        element={
          <ProtectedRoute>
            <Layout>
              <RankingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/estatisticas"
        element={
          <ProtectedRoute>
            <Layout>
              <StatsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/regras"
        element={
          <ProtectedRoute>
            <Layout>
              <RulesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Rota do Admin Global */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
