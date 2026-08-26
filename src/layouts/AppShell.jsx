import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useAuth } from '../features/auth/AuthProvider'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button } from '../components/ui/Button'
import { IconMenu } from '../components/ui/icons'

function SidebarContent({ onNavigate }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/ideas/new', label: 'New Idea' },
    { to: '/history', label: 'History' },
  ]

  const linkClass = ({ isActive }) =>
    cn(
      'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
    )

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="font-display text-lg font-semibold tracking-tight text-text-primary"
        >
          IdeaProof<span className="text-primary"> AI</span>
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClass}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <p
          className="truncate px-2 pb-3 text-xs text-text-secondary"
          title={user?.email}
        >
          {user?.email}
        </p>
        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-text-secondary"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileNavRef = useRef(null)

  useEffect(() => {
    if (!mobileOpen) return

    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () =>
      mobileNavRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )

    const focusables = getFocusable()
    if (focusables && focusables.length > 0) {
      focusables[0].focus()
    } else {
      mobileNavRef.current?.focus()
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMobileOpen(false)
        return
      }
      if (e.key === 'Tab') {
        const items = getFocusable()
        if (!items || items.length === 0) {
          e.preventDefault()
          return
        }
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus()
      }
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <a
        href="#main-content"
        className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2 focus:text-text-primary"
      >
        Skip to content
      </a>

      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface md:block">
        <SidebarContent />
      </aside>

      <header className="no-print sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
        <Link
          to="/dashboard"
          className="font-display text-lg font-semibold tracking-tight text-text-primary"
        >
          IdeaProof<span className="text-primary"> AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
            className="px-2"
          >
            <IconMenu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-nav"
            ref={mobileNavRef}
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-64 border-r border-border bg-surface"
          >
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main id="main-content" className="md:pl-64">
        <div className="mx-auto max-w-container px-6 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
