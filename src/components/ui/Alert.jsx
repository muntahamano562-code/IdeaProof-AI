import { cn } from '../../lib/cn'
import {
  IconInfo,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
} from './icons'

const variantStyles = {
  info: { wrap: 'border-info/30 bg-info/10', Icon: IconInfo, icon: 'text-info' },
  success: {
    wrap: 'border-success/30 bg-success/10',
    Icon: IconCheck,
    icon: 'text-success',
  },
  warning: {
    wrap: 'border-warning/30 bg-warning/10',
    Icon: IconAlertTriangle,
    icon: 'text-warning',
  },
  danger: {
    wrap: 'border-danger/30 bg-danger/10',
    Icon: IconAlertCircle,
    icon: 'text-danger',
  },
}

/**
 * Inline alert. Uses a semantic icon + title + description. Never visually
 * aggressive — soft tinted backgrounds with token-colored accents.
 */
export function Alert({
  variant = 'info',
  title,
  icon = true,
  className,
  children,
}) {
  const style = variantStyles[variant] || variantStyles.info
  const Icon = style.Icon

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border p-4',
        style.wrap,
        className,
      )}
    >
      {icon && (
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.icon)} aria-hidden="true" />
      )}
      <div className="flex flex-col gap-1">
        {title && (
          <p className="font-semibold text-text-primary">{title}</p>
        )}
        {children && <div className="text-sm text-text-secondary">{children}</div>}
      </div>
    </div>
  )
}
