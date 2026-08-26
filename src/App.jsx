import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './features/auth/AuthProvider'
import { Spinner } from './components/ui/Spinner'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './layouts/AppShell'

// Route-level code splitting keeps the initial bundle small. Heavy,
// route-specific dependencies (e.g. recharts via IdeaDetailPage's analysis
// dashboard) are only fetched when their route is visited.
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NewIdeaPage = lazy(() => import('./pages/NewIdeaPage'))
const IdeaDetailPage = lazy(() => import('./pages/IdeaDetailPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const Playground = lazy(() => import('./pages/Playground'))

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
      <Spinner size="lg" className="text-primary" />
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
            <Route path="/ideas/:id/report" element={<ReportPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
