import { cn } from '../../lib/cn'

const gapMap = {
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

/**
 * Flexible stack — vertical or horizontal with token-based spacing.
 */
export function Stack({
  as: Tag = 'div',
  direction = 'vertical',
  gap = 4,
  align,
  justify,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        gapMap[gap] || 'gap-4',
        align && alignMap[align],
        justify && justifyMap[justify],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
