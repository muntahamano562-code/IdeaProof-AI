import { useState } from 'react'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/ui/Toast'
import LandingPage from './pages/LandingPage'
import Playground from './pages/Playground'

export default function App() {
  const [devPlayground, setDevPlayground] = useState(false)
  const showPlayground = import.meta.env.DEV && devPlayground

  return (
    <ThemeProvider>
      <ToastProvider>
        {showPlayground ? <Playground /> : <LandingPage />}

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
    </ThemeProvider>
  )
}
