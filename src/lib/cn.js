import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Used consistently across the design system for class composition.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
