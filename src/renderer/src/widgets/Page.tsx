import { ChevronRight } from './Icons'

export default function Page({
  title,
  summary,
  glow,
  metrics,
  onOpen,
  children
}: {
  title: string
  summary?: string
  glow: string
  metrics?: React.ReactNode
  onOpen?: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="panel" style={{ '--glow': `var(--glow-${glow})` } as React.CSSProperties}>
      <div className="panel-head">
        <h2 className="eyebrow">{title}</h2>
        {summary && <span className="meta">{summary}</span>}
        {onOpen && (
          <button className="btn panel-open" onClick={onOpen} aria-label={`Open ${title} page`}>
            Open <ChevronRight size={14} />
          </button>
        )}
      </div>
      {metrics && <div className="metrics">{metrics}</div>}
      {children}
    </section>
  )
}
