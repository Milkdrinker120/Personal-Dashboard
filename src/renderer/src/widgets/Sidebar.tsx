import { Bell, Calendar, Chart, Home, Mail, Moon, Sun } from './Icons'

export type NavItem = { id: string; label: string }

const ICONS: Record<string, (p: { size?: number }) => React.JSX.Element> = {
  home: Home,
  notices: Bell,
  calendar: Calendar,
  inbox: Mail,
  stocks: Chart
}

export default function Sidebar({
  items,
  current,
  onSelect,
  badges,
  theme,
  onToggleTheme
}: {
  items: NavItem[]
  current: string
  onSelect: (id: string) => void
  badges: Record<string, number>
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}): React.JSX.Element {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Dashboard</span>
      </div>
      <nav className="side-nav" aria-label="Pages">
        {items.map((i) => {
          const Icon = ICONS[i.id] ?? Home
          const badge = badges[i.id]
          return (
            <button
              key={i.id}
              className={`nav-item ${i.id === current ? 'current' : ''}`}
              style={{ '--glow': `var(--glow-${i.id})` } as React.CSSProperties}
              aria-current={i.id === current ? 'page' : undefined}
              onClick={() => onSelect(i.id)}
              title={i.label}
            >
              <Icon size={18} />
              <span className="nav-label">{i.label}</span>
              {badge ? <span className="badge">{badge}</span> : null}
            </button>
          )
        })}
      </nav>
      <button className="nav-item theme-toggle" onClick={onToggleTheme}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        <span className="nav-label">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
      </button>
    </aside>
  )
}
