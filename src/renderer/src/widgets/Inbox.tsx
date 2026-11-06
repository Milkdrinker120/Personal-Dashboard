import { useState } from 'react'
import type { GmailApi } from '../useGmail'
import { Check, Pin } from './Icons'

function when(iso: string): string {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Setup({ g }: { g: GmailApi }): React.JSX.Element {
  const [id, setId] = useState(g.clientId)
  const [secret, setSecret] = useState('')
  return (
    <div className="setup">
      <p>
        Create a Google Cloud <b>OAuth client ID</b> of type <b>Desktop app</b>, enable the{' '}
        <b>Gmail API</b>, and add yourself as a test user. Then paste the client ID and secret here.
        They are stored encrypted on this PC.
      </p>
      <div className="row">
        <input
          className="grow"
          placeholder="Client ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          className="grow"
          type="password"
          placeholder={g.hasSecret ? 'Client secret (saved)' : 'Client secret'}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button
          className="btn primary"
          disabled={!id.trim() || !secret.trim() || g.busy}
          onClick={() => g.saveCredentials(id, secret).then(() => setSecret(''))}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default function Inbox({ g }: { g: GmailApi }): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const ready = !!g.clientId && g.hasSecret && !editing
  return (
    <>
      {g.error && (
        <div className="error" role="alert">
          {g.error}
        </div>
      )}
      {!ready && <Setup g={g} />}
      {ready && !g.connected && (
        <div className="row">
          <button className="btn primary" disabled={g.busy} onClick={g.connect}>
            {g.busy ? 'Waiting for Google…' : 'Connect Gmail'}
          </button>
          <button className="btn" onClick={() => setEditing(true)}>
            Change credentials
          </button>
        </div>
      )}
      {ready && g.connected && (
        <>
          <div className="row">
            <button className="btn" onClick={g.refresh}>
              Refresh
            </button>
            <button className="btn" onClick={g.disconnect}>
              Disconnect
            </button>
          </div>
          {g.inbox?.mails.length === 0 && <div className="placeholder">Inbox is empty.</div>}
          <div className="mail-list">
            {g.inbox?.mails.map((m) => (
              <div key={m.id} className={`mail ${m.unread ? 'unread' : ''}`}>
                <button
                  className={`icon ${m.starred ? 'on' : ''}`}
                  title={m.starred ? 'Unstar' : 'Star'}
                  aria-label={m.starred ? 'Unstar email' : 'Star email'}
                  aria-pressed={m.starred}
                  onClick={() => g.setStar(m.id, !m.starred)}
                >
                  <Pin filled={m.starred} />
                </button>
                <a
                  className="mail-body"
                  href={`https://mail.google.com/mail/u/0/#inbox/${m.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="mail-from">{m.from}</span>
                  <span className="mail-subject">
                    {m.subject} <span className="meta">– {m.snippet}</span>
                  </span>
                </a>
                <span className="meta mail-date">{when(m.date)}</span>
                {m.unread ? (
                  <button
                    className="icon"
                    title="Mark as read"
                    aria-label="Mark as read"
                    onClick={() => g.markRead(m.id)}
                  >
                    <Check />
                  </button>
                ) : (
                  <span className="icon-spacer" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
