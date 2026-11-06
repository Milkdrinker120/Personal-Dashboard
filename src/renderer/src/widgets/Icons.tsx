type P = { size?: number }

function Svg({ size = 16, children }: P & { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const ChevronDown = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)
export const ChevronRight = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
)
export const Pin = ({ filled, ...p }: P & { filled?: boolean }): React.JSX.Element => (
  <Svg {...p}>
    <path
      d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Svg>
)
export const Trash = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
  </Svg>
)
export const Sun = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
)
export const Moon = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
)
export const Alert = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M12 3 2 20h20zM12 10v5M12 18v.01" />
  </Svg>
)
export const Menu = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
)
export const Home = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10" />
  </Svg>
)
export const Bell = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" />
  </Svg>
)
export const Calendar = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
)
export const Mail = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
)
export const Chart = (p: P): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />
  </Svg>
)
