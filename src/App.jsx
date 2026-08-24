import { useState } from 'react'

export default function App() {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-container items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">
            IdeaProof<span className="text-primary"> AI</span>
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-container px-6 py-18">
        <section className="max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            Foundation stage
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Challenge your idea before you build it.
          </h1>
          <p className="mt-4 text-text-secondary">
            IdeaProof AI is an AI-powered startup and product idea validation
            platform. The product framework, design system, and project
            architecture are being established. Features will be built in later
            phases — see{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">
              roadmap.md
            </code>{' '}
            and{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">
              UI-UX-GUIDELINES.md
            </code>
            .
          </p>
        </section>
      </main>
    </div>
  )
}
