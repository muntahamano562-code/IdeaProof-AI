import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'
import { IconAlertCircle, IconChevronDown } from './icons'

/**
 * Accessible native select. Styled but uses the platform control for
 * keyboard and screen-reader correctness (no custom dropdown).
 */
export const Select = forwardRef(function Select(
  { label, description, error, required = false, id, className, children, ...props },
  ref,
) {
  const reactId = useId()
  const selectId = id || reactId
  const descriptionId = description ? `${selectId}-description` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {description && (
        <p id={descriptionId} className="text-sm text-text-secondary">
          {description}
        </p>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none rounded-lg border bg-surface px-4 py-3 pr-10 text-base text-text-primary',
            'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            error
              ? 'border-danger'
              : 'border-border hover:border-text-secondary/50',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <IconChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-sm text-danger"
        >
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
})
