import { useState, useRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * Accessible tabs.
 * - role=tablist / tab / tabpanel with aria-selected and aria-controls.
 * - Arrow Left/Right (and Home/End) move between tabs and manage roving
 *   tabindex for keyboard users.
 */
export function Tabs({ items, defaultIndex = 0, onChange, className }) {
  const [active, setActive] = useState(defaultIndex)
  const refs = useRef([])

  const select = (index) => {
    setActive(index)
    onChange?.(index)
    refs.current[index]?.focus()
  }

  const handleKeyDown = (event, index) => {
    const last = items.length - 1
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      select(index === last ? 0 : index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      select(index === 0 ? last : index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      select(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      select(last)
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 border-b border-border"
      >
        {items.map((item, index) => {
          const selected = active === index
          return (
            <button
              key={item.key || index}
              ref={(el) => (refs.current[index] = el)}
              role="tab"
              id={`tab-${item.key || index}`}
              aria-selected={selected}
              aria-controls={`panel-${item.key || index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                selected
                  ? 'border-primary text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={item.key || index}
          role="tabpanel"
          id={`panel-${item.key || index}`}
          aria-labelledby={`tab-${item.key || index}`}
          hidden={active !== index}
          className="pt-4"
        >
          {active === index && item.content}
        </div>
      ))}
    </div>
  )
}
