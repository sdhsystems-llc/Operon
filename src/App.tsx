import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { InvestigationDetailPage } from './pages/InvestigationDetailPage';
import { NewInvestigationPage } from './pages/NewInvestigationPage';
import { ChatPage } from './pages/ChatPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamIntegrationsPage } from './pages/TeamIntegrationsPage';
import { AgentsPage } from './pages/AgentsPage';
import { FoundationsPage } from './pages/FoundationsPage';
import { AuditLogPage } from './pages/AuditLogPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignUpPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/investigations" element={<InvestigationsPage />} />
                <Route path="/investigations/new" element={<NewInvestigationPage />} />
                <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:sessionId" element={<ChatPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/team-integrations" element={<TeamIntegrationsPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/foundations" element={<FoundationsPage />} />
                <Route path="/audit" element={<AuditLogPage />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
