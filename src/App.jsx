import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/ui/Toast'
import { Container } from './components/layout/Container'
import Playground from './pages/Playground'

function ProductionPlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-text-primary">
      <Container className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          IdeaProof AI
        </p>
        <h1 className="mt-2 font-display text-h1 font-semibold tracking-tight">
          Design system ready.
        </h1>
        <p className="mt-3 text-text-secondary">
          The product experience is built in later phases.
        </p>
      </Container>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        {import.meta.env.DEV ? <Playground /> : <ProductionPlaceholder />}
      </ToastProvider>
    </ThemeProvider>
  )
}
