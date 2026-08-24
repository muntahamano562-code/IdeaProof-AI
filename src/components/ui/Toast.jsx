import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { IconCheck, IconInfo, IconAlertTriangle, IconAlertCircle, IconX } from './icons'

const ToastContext = createContext(null)

const typeStyles = {
  success: { Icon: IconCheck, icon: 'text-success', live: 'polite' },
  info: { Icon: IconInfo, icon: 'text-info', live: 'polite' },
  warning: { Icon: IconAlertTriangle, icon: 'text-warning', live: 'polite' },
  danger: { Icon: IconAlertCircle, icon: 'text-danger', live: 'assertive' },
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const style = typeStyles[toast.type] || typeStyles.info
        const Icon = style.Icon
        return (
          <div
            key={toast.id}
            role="status"
            aria-live={style.live}
            className="flex items-start gap-3 rounded-lg border border-border bg-elevated p-4 shadow-lg animate-fade"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.icon)} aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-1">
              {toast.title && (
                <p className="font-semibold text-text-primary">{toast.title}</p>
              )}
              {toast.description && (
                <p className="text-sm text-text-secondary">{toast.description}</p>
              )}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action.onClick?.()
                    onDismiss(toast.id)
                  }}
                  className="mt-1 self-start text-sm font-medium text-primary hover:underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const toast = useCallback(
    (options) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      const next = {
        id,
        type: 'info',
        duration: 4000,
        ...options,
      }
      setToasts((prev) => [...prev, next])
      if (next.duration) {
        timers.current[id] = setTimeout(() => dismiss(id), next.duration)
      }
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
