import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/95',
  secondary:
    'border border-border bg-surface text-text-primary hover:bg-elevated active:bg-elevated',
  ghost:
    'text-text-secondary hover:bg-elevated hover:text-text-primary active:bg-elevated',
}

/**
 * Reusable button. Variants: primary | secondary | ghost.
 * Loading state disables interaction and prevents duplicate submits while
 * keeping layout stable (no content jump).
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    type = 'button',
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 text-button transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
})
