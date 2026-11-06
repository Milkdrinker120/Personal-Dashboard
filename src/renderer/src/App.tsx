import { useCallback, useEffect, useState } from 'react'
import type { Notice, Priority } from '../../main/notices'
import Important from './widgets/Important'
import Sidebar, { type NavItem } from './widgets/Sidebar'
import Notices, { isOverdue } from './widgets/Notices'
import Inbox from './widgets/Inbox'
import Metric from './widgets/Metric'
import { useGmail } from './useGmail'
import Page from './widgets/Page'

const PAGES: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'notices', label: 'Notices' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'stocks', label: 'Reselling revenue' }
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
  const gmail = useGmail()
  const counts = gmail.inbox?.counts

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
    inbox: counts ? `${counts.unread} unread` : 'Gmail not connected',
    stocks: 'No Excel file chosen'
  }
  const placeholders: Record<string, string> = {
    calendar: 'Calendar events will appear here.',
    inbox: 'Connect Gmail to see recent mail.',
    stocks: 'Choose your Excel sales file to see your reselling revenue.'
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
      return [
        m('Unread', counts?.unread ?? '–', id),
        m('Starred', counts?.starred ?? '–', id),
        m('Important', counts?.important ?? '–', id)
      ]
    return [m('Total revenue', '–', id), m('This month', '–', id), m('Items sold', '–', id)]
  }
  const title = PAGES.find((p) => p.id === page)?.label ?? 'Home'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="shell">
      <Sidebar
        items={PAGES}
        current={page}
        onSelect={go}
        badges={{ notices: openCount }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="main">
        <header className="pagehead">
          <h1>{page === 'home' ? greeting : title}</h1>
          {page === 'home' && <p className="meta">{dateLabel}</p>}
        </header>

        {page === 'home' && (
          <Important notices={notices} onPatch={patch} onJump={go} unread={counts?.unread} />
        )}
        <div className={page === 'home' ? 'grid' : undefined}>
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
              ) : s.id === 'inbox' ? (
                <Inbox g={gmail} />
              ) : (
                <div className="placeholder">{placeholders[s.id]}</div>
              )}
            </Page>
          ))}
        </div>
      </main>
    </div>
  )
}
