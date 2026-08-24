import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './features/auth/AuthProvider'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import NewIdeaPage from './pages/NewIdeaPage'
import IdeaDetailPage from './pages/IdeaDetailPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './layouts/AppShell'
import Playground from './pages/Playground'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ideas/new" element={<NewIdeaPage />} />
          <Route path="/ideas/:id" element={<IdeaDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [devPlayground, setDevPlayground] = useState(false)
  const showPlayground = import.meta.env.DEV && devPlayground

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {showPlayground ? (
            <Playground />
          ) : (
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          )}

          {import.meta.env.DEV && !showPlayground && (
            <a
              href="#dev-playground"
              onClick={(e) => {
                e.preventDefault()
                setDevPlayground(true)
              }}
              className="fixed bottom-4 left-4 z-[70] rounded-md border border-border bg-elevated px-3 py-1.5 font-mono text-xs text-text-secondary shadow-sm transition-colors hover:text-text-primary"
            >
              dev · open component playground
            </a>
          )}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
