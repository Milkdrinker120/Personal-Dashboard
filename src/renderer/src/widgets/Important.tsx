import type { Notice } from '../../../main/notices'
import { Alert } from './Icons'
import { isOverdue, NoticeRow, sortNotices, today } from './Notices'

function Metric({
  label,
  value,
  target,
  onJump,
  bad
}: {
  label: string
  value: string | number
  target: string
  onJump: (id: string) => void
  bad?: boolean
}): React.JSX.Element {
  return (
    <button
      className={`metric ${bad ? 'bad' : ''}`}
      onClick={() => onJump(target)}
      aria-label={`${label}: ${value}. Go to ${target}`}
    >
      <div className="metric-value">
        {bad && <Alert size={18} />}
        {value}
      </div>
      <div className="meta">{label}</div>
    </button>
  )
}

export default function Important({
  notices,
  onPatch,
  onJump
}: {
  notices: Notice[]
  onPatch: (id: string, p: Partial<Notice>) => void
  onJump: (id: string) => void
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
        <h2 className="eyebrow">Important today</h2>
        <span className="meta">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </span>
      </div>
      <div className="metrics">
        <Metric
          label="Overdue"
          value={overdue.length}
          target="notices"
          onJump={onJump}
          bad={overdue.length > 0}
        />
        <Metric label="Due today" value={dueToday.length} target="notices" onJump={onJump} />
        <Metric label="Open notices" value={open.length} target="notices" onJump={onJump} />
        <Metric label="Events today" value="–" target="calendar" onJump={onJump} />
        <Metric label="Unread email" value="–" target="inbox" onJump={onJump} />
        <Metric label="Portfolio" value="–" target="stocks" onJump={onJump} />
      </div>
      <div className="notice-cols">
        {attention.length === 0 && <div className="placeholder">Nothing urgent today.</div>}
        {attention.slice(0, 6).map((n) => (
          <NoticeRow key={n.id} n={n} onPatch={onPatch} />
        ))}
      </div>
    </section>
  )
}
