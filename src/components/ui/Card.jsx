import { cn } from '../../lib/cn'

/**
 * Card and its composable parts. Surfaces use `surface`, a 1px border, and a
 * subtle border-emphasis on hover (no heavy lift). Keep content analytical.
 */
export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface transition-colors hover:border-text-secondary/40',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'font-display text-h3 font-semibold tracking-tight text-text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-text-secondary', className)} {...props} />
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />
  )
}
