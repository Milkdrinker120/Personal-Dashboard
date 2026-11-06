import { Alert } from './Icons'

export default function Metric({
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
        {bad && <Alert size={20} />}
        {value}
      </div>
      <div className="meta">{label}</div>
    </button>
  )
}
