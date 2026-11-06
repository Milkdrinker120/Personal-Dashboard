import type { Notice } from '../../../main/notices'
import { isOverdue, NoticeRow, sortNotices, today } from './Notices'

function Metric({
  label,
  value,
  tone
}: {
  label: string
  value: string | number
  tone?: 'bad'
}): React.JSX.Element {
  return (
    <div className="metric">
      <div className={`metric-value ${tone ?? ''}`}>{value}</div>
      <div className="meta">{label}</div>
    </div>
  )
}

export default function Important({
  notices,
  onPatch
}: {
  notices: Notice[]
  onPatch: (id: string, p: Partial<Notice>) => void
}): React.JSX.Element {
  const open = notices.filter((n) => !n.done)
  const overdue = open.filter(isOverdue)
  const dueToday = open.filter((n) => n.due === today())
  // what needs attention today: overdue, due today, high priority or pinned
  const attention = sortNotices(
    open.filter((n) => isOverdue(n) || n.due === today() || n.priority === 'high' || n.pinned)
  )

  return (
    <section className="important">
      <div className="important-head">
        <h2>Important today</h2>
        <span className="meta">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </span>
      </div>
      <div className="metrics">
        <Metric label="Overdue" value={overdue.length} tone={overdue.length ? 'bad' : undefined} />
        <Metric label="Due today" value={dueToday.length} />
        <Metric label="Open notices" value={open.length} />
        <Metric label="Events today" value="–" />
        <Metric label="Unread email" value="–" />
        <Metric label="Portfolio" value="–" />
      </div>
      <div className="notice-cols">
        {attention.length === 0 && <div className="placeholder">Nothing urgent. 🎉</div>}
        {attention.slice(0, 6).map((n) => (
          <NoticeRow key={n.id} n={n} onPatch={onPatch} />
        ))}
      </div>
    </section>
  )
}
