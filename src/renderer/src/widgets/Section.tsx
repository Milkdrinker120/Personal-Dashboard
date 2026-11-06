import { useState } from 'react'

function readOpen(id: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(`section:${id}`)
    return v === null ? fallback : v === '1'
  } catch {
    return fallback
  }
}

export default function Section({
  id,
  title,
  summary,
  defaultOpen = true,
  children
}: {
  id: string
  title: string
  summary?: string
  defaultOpen?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(() => readOpen(id, defaultOpen))

  const toggle = (): void => {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(`section:${id}`, next ? '1' : '0')
    } catch {
      // storage unavailable: state just won't persist
    }
  }

  return (
    <section className="section" id={`section-${id}`}>
      <button className="section-head" onClick={toggle} aria-expanded={open}>
        <span className="chev">{open ? '▾' : '▸'}</span>
        <span className="section-title">{title}</span>
        {summary && <span className="meta">{summary}</span>}
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  )
}
