import { cn } from '../../lib/cn'

/**
 * Skeleton placeholder. Token-based (border tint) with a gentle pulse.
 * Reduced motion is handled globally. Configure with className for shape.
 */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-border/70', className)}
      aria-hidden="true"
    />
  )
}
