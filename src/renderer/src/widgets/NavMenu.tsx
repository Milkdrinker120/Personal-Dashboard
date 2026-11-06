import { useEffect, useRef, useState } from 'react'
import { Menu } from './Icons'

export type NavItem = { id: string; label: string }

export default function NavMenu({
  items,
  current,
  onSelect
}: {
  items: NavItem[]
  current: string
  onSelect: (id: string) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="nav" ref={ref}>
      <button
        className="icon"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Menu size={20} />
      </button>
      {open && (
        <div className="nav-menu" role="menu">
          {items.map((i) => (
            <button
              key={i.id}
              role="menuitem"
              className={`nav-item ${i.id === current ? 'current' : ''}`}
              aria-current={i.id === current ? 'page' : undefined}
              onClick={() => {
                onSelect(i.id)
                setOpen(false)
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
