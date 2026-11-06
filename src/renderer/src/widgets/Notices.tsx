import { useState } from 'react'
import type { Notice, Priority } from '../../../main/notices'
import { Pin, Trash } from './Icons'

const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export const today = (): string => new Date().toISOString().slice(0, 10)

export const isOverdue = (n: Notice): boolean => !!n.due && !n.done && n.due < today()

export function sortNotices(list: Notice[]): Notice[] {
  return [...list].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      Number(b.pinned) - Number(a.pinned) ||
      rank[a.priority] - rank[b.priority] ||
      (a.due ?? '9999').localeCompare(b.due ?? '9999')
  )
}

export function NoticeRow({
  n,
  onPatch,
  onDelete
}: {
  n: Notice
  onPatch: (id: string, p: Partial<Notice>) => void
  onDelete?: (id: string) => void
}): React.JSX.Element {
  return (
    <div className={`notice ${n.priority} ${n.done ? 'done' : ''}`}>
      <input
        type="checkbox"
        checked={n.done}
        aria-label={`Mark "${n.title}" done`}
        onChange={() => onPatch(n.id, { done: !n.done })}
      />
      <div className="body">
        <div className="title">{n.title}</div>
        <div className="meta">
          <span className={`tag ${n.priority}`}>{n.priority}</span>
          {n.due && (
            <span className={isOverdue(n) ? 'overdue' : ''}>
              {' · '}Due {n.due}
              {isOverdue(n) && ' (overdue)'}
            </span>
          )}
        </div>
      </div>
      <button
        className={`icon ${n.pinned ? 'on' : ''}`}
        title={n.pinned ? 'Unpin' : 'Pin'}
        aria-label={n.pinned ? 'Unpin notice' : 'Pin notice'}
        aria-pressed={n.pinned}
        onClick={() => onPatch(n.id, { pinned: !n.pinned })}
      >
        <Pin filled={n.pinned} />
      </button>
      {onDelete && (
        <button
          className="icon"
          title="Delete"
          aria-label="Delete notice"
          onClick={() => onDelete(n.id)}
        >
          <Trash />
        </button>
      )}
    </div>
  )
}

export default function Notices({
  notices,
  onAdd,
  onPatch,
  onDelete
}: {
  notices: Notice[]
  onAdd: (title: string, priority: Priority, due: string | null) => void
  onPatch: (id: string, p: Partial<Notice>) => void
  onDelete: (id: string) => void
}): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [due, setDue] = useState('')

  const add = (): void => {
    if (!title.trim()) return
    onAdd(title.trim(), priority, due || null)
    setTitle('')
    setDue('')
  }

  return (
    <>
      <div className="row">
        <input
          className="grow"
          placeholder="Add a notice…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn primary" onClick={add}>
          Add
        </button>
      </div>
      {notices.length === 0 && <div className="placeholder">No notices.</div>}
      <div className="notice-cols">
        {sortNotices(notices).map((n) => (
          <NoticeRow key={n.id} n={n} onPatch={onPatch} onDelete={onDelete} />
        ))}
      </div>
    </>
  )
}
