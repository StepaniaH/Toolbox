import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

type DropdownOption = {
  value: string
  label: string
}

type DropdownProps = {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  ariaLabel?: string
  renderTrigger?: (selected: DropdownOption | undefined) => ReactNode
}

export function Dropdown({ value, options, onChange, ariaLabel, renderTrigger }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setOpen(true)
      setFocusIndex(options.findIndex((o) => o.value === value))
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusIndex >= 0) {
        onChange(options[focusIndex].value)
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
  }

  return (
    <div className="cl-dropdown" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className="cl-dropdown-trigger"
        data-open={open}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          setOpen((v) => !v)
          setFocusIndex(options.findIndex((o) => o.value === value))
        }}
        onKeyDown={onKeyDown}
      >
        {renderTrigger ? renderTrigger(selected) : (
          <>
            <span>{selected?.label ?? value}</span>
            <ChevronDown className="h-3.5 w-3.5 text-faint" />
          </>
        )}
      </button>
      {open && (
        <ul role="listbox" className="cl-dropdown-menu">
          {options.map((opt, i) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className="cl-dropdown-item"
                data-selected={opt.value === value}
                data-focused={i === focusIndex}
                onMouseEnter={() => setFocusIndex(i)}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
