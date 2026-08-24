import { cn } from '../../lib/cn'

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
}

/**
 * Accessible loading spinner. Uses currentColor so it inherits token colors.
 * Reduced motion is handled globally (animations are neutralized).
 */
export function Spinner({ size = 'md', className }) {
  return (
    <svg
      className={cn('animate-spin text-current', sizeMap[size] || sizeMap.md, className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  )
}
