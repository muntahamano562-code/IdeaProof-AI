import { cn } from '../../lib/cn'

const colMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
}

const gapMap = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
  12: 'gap-12',
}

/**
 * Responsive grid with token-based gaps. Provide base `cols` and optionally
 * `smCols` / `mdCols` / `lgCols` for breakpoints.
 */
export function Grid({
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  gap = 6,
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        'grid',
        colMap[cols],
        smCols && `sm:${colMap[smCols]}`,
        mdCols && `md:${colMap[mdCols]}`,
        lgCols && `lg:${colMap[lgCols]}`,
        gapMap[gap] || 'gap-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
