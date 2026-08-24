import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { Spinner } from '../ui/Spinner'

/**
 * Guards authenticated application routes.
 * - While auth state is resolving: shows an accessible loading state.
 * - If unauthenticated: redirects to /login, preserving the intended
 *   destination via router state.
 * - If authenticated: renders the nested route (AppShell + page).
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" className="text-primary" />
        <span className="sr-only">Loading your account…</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
