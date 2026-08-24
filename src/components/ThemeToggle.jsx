import { cn } from '../lib/cn'
import { useTheme } from './ThemeProvider'
import { IconSun, IconMoon } from './ui/icons'

/**
 * Accessible theme toggle. Persists via ThemeProvider (localStorage) and
 * reflects the current state with aria-pressed.
 */
export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:text-text-primary',
        className,
      )}
    >
      {isDark ? (
        <IconSun className="h-5 w-5" />
      ) : (
        <IconMoon className="h-5 w-5" />
      )}
    </button>
  )
}
