import { randomUUID } from 'crypto'
import { JsonStore } from './store'

export type Priority = 'low' | 'medium' | 'high'

export interface Notice {
  id: string
  title: string
  body: string
  priority: Priority
  due: string | null // ISO date
  pinned: boolean
  done: boolean
  createdAt: string
}

export type NoticeInput = Partial<Omit<Notice, 'id' | 'createdAt'>> & { title: string }

let store: JsonStore<{ notices: Notice[] }>
const db = (): JsonStore<{ notices: Notice[] }> => (store ??= new JsonStore('notices', { notices: [] }))

export function listNotices(): Notice[] {
  return db().get('notices')
}

export function addNotice(input: NoticeInput): Notice {
  const notice: Notice = {
    id: randomUUID(),
    title: input.title,
    body: input.body ?? '',
    priority: input.priority ?? 'medium',
    due: input.due ?? null,
    pinned: input.pinned ?? false,
    done: false,
    createdAt: new Date().toISOString()
  }
  db().set('notices', [notice, ...listNotices()])
  return notice
}

export function updateNotice(id: string, patch: Partial<Notice>): Notice | null {
  let updated: Notice | null = null
  db().set(
    'notices',
    listNotices().map((n) => (n.id === id ? (updated = { ...n, ...patch, id: n.id }) : n))
  )
  return updated
}

export function deleteNotice(id: string): void {
  db().set(
    'notices',
    listNotices().filter((n) => n.id !== id)
  )
}
