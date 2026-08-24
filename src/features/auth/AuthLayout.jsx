import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Container } from '../../components/layout/Container'

/**
 * Shared centered layout for authentication screens (login, signup, password
 * reset). Keeps the brand, card, and footer link consistent.
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-text-primary">
      <Container className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="font-display text-xl font-semibold tracking-tight text-text-primary"
          >
            IdeaProof<span className="text-primary"> AI</span>
          </Link>
        </div>
        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </Card>
        {footer && (
          <div className="mt-6 text-center text-sm text-text-secondary">
            {footer}
          </div>
        )}
      </Container>
    </main>
  )
}
