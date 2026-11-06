import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from './Icons'

function readOpen(id: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(`section:${id}`)
    return v === null ? fallback : v === '1'
  } catch {
    return fallback
  }
}

function saveOpen(id: string, open: boolean): void {
  try {
    localStorage.setItem(`section:${id}`, open ? '1' : '0')
  } catch {
    // storage unavailable: state just won't persist
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

  // lets other parts of the app (metric tiles, Jump to) expand this section
  useEffect(() => {
    const onOpen = (e: Event): void => {
      if ((e as CustomEvent<string>).detail === id) {
        setOpen(true)
        saveOpen(id, true)
      }
    }
    window.addEventListener('section:open', onOpen)
    return () => window.removeEventListener('section:open', onOpen)
  }, [id])

  const toggle = (): void => {
    const next = !open
    setOpen(next)
    saveOpen(id, next)
  }

  return (
    <section className="section" id={`section-${id}`}>
      <button className="section-head" onClick={toggle} aria-expanded={open}>
        <span className="chev">{open ? <ChevronDown /> : <ChevronRight />}</span>
        <span className="section-title">{title}</span>
        {summary && <span className="meta section-summary">{summary}</span>}
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  )
}
