import { cn } from '../../lib/cn'
import { Container } from './Container'

/**
 * Vertical section with consistent spacing. Optionally renders a title and
 * description inside the container.
 */
export function Section({ title, description, className, children, ...props }) {
  return (
    <section className={cn('py-16', className)} {...props}>
      <Container>
        {title && (
          <h2 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-2 max-w-2xl text-text-secondary">{description}</p>
        )}
        <div className={title || description ? 'mt-8' : ''}>{children}</div>
      </Container>
    </section>
  )
}
