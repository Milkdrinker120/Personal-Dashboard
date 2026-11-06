import { useCallback, useEffect, useState } from 'react'
import type { Notice, Priority } from '../../main/notices'
import { Moon, Sun } from './widgets/Icons'
import Important from './widgets/Important'
import NavMenu, { type NavItem } from './widgets/NavMenu'
import Notices, { isOverdue } from './widgets/Notices'
import Metric from './widgets/Metric'
import Page from './widgets/Page'

const PAGES: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'notices', label: 'Notices' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'stocks', label: 'Stocks' }
]

const SECTIONS = PAGES.filter((p) => p.id !== 'home')

function readPage(): string {
  try {
    const v = localStorage.getItem('page')
    return PAGES.some((p) => p.id === v) ? (v as string) : 'home'
  } catch {
    return 'home'
  }
}

export default function App(): React.JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [notices, setNotices] = useState<Notice[]>([])
  const [page, setPage] = useState(readPage)

  const refresh = useCallback(async () => setNotices(await window.api.notices.list()), [])

  useEffect(() => {
    window.api.settings.get().then((s) => setTheme(s.theme))
    refresh()
  }, [refresh])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const go = (id: string): void => {
    setPage(id)
    window.scrollTo({ top: 0 })
    try {
      localStorage.setItem('page', id)
    } catch {
      // storage unavailable: page just won't be remembered
    }
  }

  const toggleTheme = (): void => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    window.api.settings.setTheme(next)
  }

  const add = async (title: string, priority: Priority, due: string | null): Promise<void> => {
    await window.api.notices.add({ title, priority, due })
    refresh()
  }
  const patch = async (id: string, p: Partial<Notice>): Promise<void> => {
    await window.api.notices.update(id, p)
    refresh()
  }
  const remove = async (id: string): Promise<void> => {
    await window.api.notices.remove(id)
    refresh()
  }

  const openCount = notices.filter((n) => !n.done).length
  const summaries: Record<string, string> = {
    notices: `${openCount} open`,
    calendar: 'iCloud not connected',
    inbox: 'Gmail not connected',
    stocks: 'No Excel file chosen'
  }
  const placeholders: Record<string, string> = {
    calendar: 'Calendar events will appear here.',
    inbox: 'Connect Gmail to see recent mail.',
    stocks: 'Choose your Excel stock file to see holdings.'
  }
  const openNotices = notices.filter((n) => !n.done)
  const m = (
    label: string,
    value: string | number,
    id: string,
    bad?: boolean
  ): React.JSX.Element => (
    <Metric key={label} label={label} value={value} target={id} onJump={go} bad={bad} />
  )
  const metricsFor = (id: string): React.ReactNode[] => {
    if (id === 'notices') {
      const overdue = openNotices.filter(isOverdue).length
      return [
        m('Open', openNotices.length, id),
        m('Overdue', overdue, id, overdue > 0),
        m('High priority', openNotices.filter((n) => n.priority === 'high').length, id),
        m('Pinned', openNotices.filter((n) => n.pinned).length, id)
      ]
    }
    if (id === 'calendar')
      return [m('Today', '–', id), m('Tomorrow', '–', id), m('This week', '–', id)]
    if (id === 'inbox')
      return [m('Unread', '–', id), m('Starred', '–', id), m('Important', '–', id)]
    return [m('Portfolio value', '–', id), m('Day change', '–', id), m('Holdings', '–', id)]
  }
  const title = PAGES.find((p) => p.id === page)?.label ?? 'Home'

  return (
    <div className="page">
      <header className="topbar">
        <NavMenu items={PAGES} current={page} onSelect={go} />
        <h1>{page === 'home' ? 'Personal Dashboard' : title}</h1>
        <div className="spacer" />
        <button className="btn" onClick={toggleTheme}>
          {theme === 'light' ? <Moon /> : <Sun />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      {page === 'home' && <Important notices={notices} onPatch={patch} onJump={go} />}
      {SECTIONS.filter((s) => page === 'home' || page === s.id).map((s) => (
        <Page
          key={s.id}
          title={s.label}
          summary={summaries[s.id]}
          glow={s.id}
          metrics={metricsFor(s.id)}
          onOpen={page === 'home' ? () => go(s.id) : undefined}
        >
          {s.id === 'notices' ? (
            <Notices notices={notices} onAdd={add} onPatch={patch} onDelete={remove} />
          ) : (
            <div className="placeholder">{placeholders[s.id]}</div>
          )}
        </Page>
      ))}
    </div>
  )
}
