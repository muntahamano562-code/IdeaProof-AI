import { cn } from '../../lib/cn'

/**
 * Accessible circular score ring. Uses only design tokens; the value is also
 * conveyed via an aria-label so it is never communicated by color/shape alone.
 */
export function ScoreRing({
  value,
  max = 100,
  label = 'Score',
  size = 168,
  strokeWidth = 12,
  className,
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0))
  const pct = max > 0 ? clamped / max : 0
  const dashOffset = circumference * (1 - pct)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped} out of ${max}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--color-border))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--color-primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center px-2 text-center">
        <span className="font-mono text-4xl font-semibold text-text-primary">
          {clamped}
          <span className="text-lg text-text-secondary">/{max}</span>
        </span>
        <span className="mt-1 text-xs uppercase tracking-wide text-text-secondary">
          {label}
        </span>
      </div>
    </div>
  )
}
