import { cn } from '../../lib/cn'

const styles = {
  neutral: { wrap: 'border-border bg-surface text-text-secondary', dot: null },
  info: { wrap: 'border-info/30 bg-info/10', dot: 'bg-info' },
  success: { wrap: 'border-success/30 bg-success/10', dot: 'bg-success' },
  warning: { wrap: 'border-warning/30 bg-warning/10', dot: 'bg-warning' },
  danger: { wrap: 'border-danger/30 bg-danger/10', dot: 'bg-danger' },
  low: { wrap: 'border-risk-low/30 bg-risk-low/10', dot: 'bg-risk-low' },
  medium: { wrap: 'border-risk-medium/30 bg-risk-medium/10', dot: 'bg-risk-medium' },
  high: { wrap: 'border-risk-high/30 bg-risk-high/10', dot: 'bg-risk-high' },
  critical: {
    wrap: 'border-risk-critical/30 bg-risk-critical/10',
    dot: 'bg-risk-critical',
  },
}

/**
 * Small status/severity badge.
 * Color is NEVER the only signal: a colored dot (decorative) plus a text
 * label carry meaning. Text uses text-primary for guaranteed contrast.
 */
export function Badge({ variant = 'neutral', className, children }) {
  const style = styles[variant] || styles.neutral

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-text-primary',
        style.wrap,
        className,
      )}
    >
      {style.dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', style.dot)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
