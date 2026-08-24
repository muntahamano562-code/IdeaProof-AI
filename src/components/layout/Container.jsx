import { cn } from '../../lib/cn'

/**
 * Centered content container using the design-system max width and responsive
 * horizontal padding.
 */
export function Container({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cn('mx-auto w-full max-w-container px-6', className)} {...props}>
      {children}
    </Tag>
  )
}
