import { useState, useId } from 'react'
import { cn } from '../../lib/cn'

const sideClasses = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

/**
 * Accessible tooltip. Appears on hover and keyboard focus, hides on Escape.
 * Content is supplementary only — never the sole source of critical info.
 */
export function Tooltip({ content, side = 'top', className, children }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-50 max-w-xs rounded-md border border-border bg-elevated px-3 py-1.5 text-sm text-text-primary shadow-sm',
            sideClasses[side] || sideClasses.top,
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
