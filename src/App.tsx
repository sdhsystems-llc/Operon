import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import { OverviewPage } from './pages/OverviewPage'
import ProjectsPage from './pages/ProjectsPage'
import InvestigationsPage from './pages/InvestigationsPage'
import { InvestigationDetailPage } from './pages/InvestigationDetailPage'
import { NewInvestigationPage } from './pages/NewInvestigationPage'
import AgentsPage from './pages/AgentsPage'
import IntegrationsPage from './pages/IntegrationsPage'
import KnowledgePage from './pages/KnowledgePage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { FoundationsPage } from './pages/FoundationsPage'

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Connecting to Operon...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/investigations/new" element={<NewInvestigationPage />} />
        <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:sessionId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:sessionId" element={<ChatPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/foundations" element={<FoundationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
