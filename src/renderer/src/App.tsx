import { useCallback, useEffect, useState } from 'react'
import type { Notice, Priority } from '../../main/notices'
import Important from './widgets/Important'
import Notices from './widgets/Notices'
import Section from './widgets/Section'

const SECTIONS = [
  { id: 'notices', label: 'Notices' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'stocks', label: 'Stocks' }
]

export default function App(): React.JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notices, setNotices] = useState<Notice[]>([])

  const refresh = useCallback(async () => setNotices(await window.api.notices.list()), [])

  useEffect(() => {
    window.api.settings.get().then((s) => setTheme(s.theme))
    refresh()
  }, [refresh])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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

  const jump = (id: string): void => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  const openCount = notices.filter((n) => !n.done).length

  return (
    <div className="page">
      <header className="topbar">
        <h1>Personal Dashboard</h1>
        <div className="spacer" />
        <select
          value=""
          onChange={(e) => e.target.value && jump(e.target.value)}
          aria-label="Jump to section"
        >
          <option value="">Jump to…</option>
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="btn" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <Important notices={notices} onPatch={patch} />

      <Section id="notices" title="Notices" summary={`${openCount} open`}>
        <Notices notices={notices} onAdd={add} onPatch={patch} onDelete={remove} />
      </Section>
      <Section id="calendar" title="Calendar" summary="iCloud not connected">
        <div className="placeholder">Calendar events will appear here.</div>
      </Section>
      <Section id="inbox" title="Inbox" summary="Gmail not connected">
        <div className="placeholder">Connect Gmail to see recent mail.</div>
      </Section>
      <Section id="stocks" title="Stocks" summary="No Excel file chosen">
        <div className="placeholder">Choose your Excel stock file to see holdings.</div>
      </Section>
    </div>
  )
}
