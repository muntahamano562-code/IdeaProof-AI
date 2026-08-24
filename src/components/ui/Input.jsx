import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'
import { IconAlertCircle } from './icons'

/**
 * Accessible text input with label, description, and error support.
 * - Label is always associated via htmlFor/id.
 * - aria-invalid and aria-describedby are set when relevant.
 */
export const Input = forwardRef(function Input(
  { label, description, error, required = false, id, className, ...props },
  ref,
) {
  const reactId = useId()
  const inputId = id || reactId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
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
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-lg border bg-surface px-4 py-3 text-base text-text-primary',
          'placeholder:text-text-secondary/70 transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger' : 'border-border hover:border-text-secondary/50',
          className,
        )}
        {...props}
      />
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
