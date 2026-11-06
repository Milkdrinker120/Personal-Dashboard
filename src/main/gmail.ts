import { createServer } from 'http'
import { createHash, randomBytes } from 'crypto'
import { shell } from 'electron'
import { decryptSecret, encryptSecret, getSettings } from './store'

const SCOPE = 'https://www.googleapis.com/auth/gmail.modify'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://gmail.googleapis.com/gmail/v1/users/me'

interface Tokens {
  access_token: string
  refresh_token: string
  expiry: number // epoch ms
}

export interface Mail {
  id: string
  from: string
  subject: string
  date: string // ISO
  snippet: string
  unread: boolean
  starred: boolean
  important: boolean
}

export interface InboxData {
  mails: Mail[]
  counts: { unread: number; starred: number; important: number }
}

const b64url = (b: Buffer): string => b.toString('base64url')

export function saveCredentials(clientId: string, clientSecret: string): void {
  const s = getSettings()
  s.set('googleClientId', clientId.trim())
  s.set('googleClientSecretEnc', encryptSecret(clientSecret.trim()))
  // new credentials invalidate any previous sign-in
  s.set('googleTokensEnc', '')
}

export function disconnect(): void {
  getSettings().set('googleTokensEnc', '')
}

function readTokens(): Tokens | null {
  const enc = getSettings().get('googleTokensEnc')
  if (!enc) return null
  try {
    return JSON.parse(decryptSecret(enc)) as Tokens
  } catch {
    return null
  }
}

function writeTokens(t: Tokens): void {
  getSettings().set('googleTokensEnc', encryptSecret(JSON.stringify(t)))
}

function credentials(): { id: string; secret: string } {
  const s = getSettings()
  const id = s.get('googleClientId')
  const enc = s.get('googleClientSecretEnc')
  if (!id || !enc) throw new Error('Add your Google client ID and secret first')
  return { id, secret: decryptSecret(enc) }
}

async function tokenRequest(params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  })
  const json = (await res.json()) as Record<string, unknown>
  if (!res.ok) throw new Error(String(json.error_description ?? json.error ?? res.status))
  return json
}

// Opens the browser for Google sign-in and waits for the loopback redirect (PKCE flow).
export function connect(): Promise<void> {
  const { id, secret } = credentials()
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  const state = b64url(randomBytes(16))

  return new Promise((resolve, reject) => {
    let redirect = ''
    let done = false
    const finish = (err?: Error): void => {
      if (done) return
      done = true
      clearTimeout(timer)
      server.close()
      if (err) reject(err)
      else resolve()
    }

    const server = createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== '/') {
        res.writeHead(404).end()
        return
      }
      const code = url.searchParams.get('code')
      const ok = !!code && url.searchParams.get('state') === state
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        `<body style="font-family:system-ui;padding:3rem"><h2>${
          ok ? 'Gmail connected' : 'Sign-in failed'
        }</h2><p>You can close this tab and return to the dashboard.</p></body>`
      )
      if (!ok) return finish(new Error(url.searchParams.get('error') ?? 'Sign-in was cancelled'))
      try {
        const t = await tokenRequest({
          code: code!,
          client_id: id,
          client_secret: secret,
          redirect_uri: redirect,
          grant_type: 'authorization_code',
          code_verifier: verifier
        })
        if (!t.refresh_token) throw new Error('Google returned no refresh token, try again')
        writeTokens({
          access_token: String(t.access_token),
          refresh_token: String(t.refresh_token),
          expiry: Date.now() + Number(t.expires_in) * 1000
        })
        finish()
      } catch (e) {
        finish(e as Error)
      }
    })

    const timer = setTimeout(() => finish(new Error('Sign-in timed out')), 3 * 60 * 1000)

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port
      redirect = `http://127.0.0.1:${port}`
      const q = new URLSearchParams({
        client_id: id,
        redirect_uri: redirect,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
      })
      shell.openExternal(`${AUTH_URL}?${q}`)
    })
  })
}

async function accessToken(): Promise<string> {
  const t = readTokens()
  if (!t) throw new Error('Gmail is not connected')
  if (t.expiry - 60_000 > Date.now()) return t.access_token
  const { id, secret } = credentials()
  const r = await tokenRequest({
    client_id: id,
    client_secret: secret,
    refresh_token: t.refresh_token,
    grant_type: 'refresh_token'
  })
  const next = {
    ...t,
    access_token: String(r.access_token),
    expiry: Date.now() + Number(r.expires_in) * 1000
  }
  writeTokens(next)
  return next.access_token
}

async function gmail<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()) as T
}

interface RawMessage {
  id: string
  snippet: string
  labelIds?: string[]
  internalDate: string
  payload: { headers: { name: string; value: string }[] }
}

export async function listInbox(): Promise<InboxData> {
  const list = await gmail<{ messages?: { id: string }[] }>(
    '/messages?labelIds=INBOX&maxResults=30'
  )
  const [mails, inbox, starred, important] = await Promise.all([
    Promise.all(
      (list.messages ?? []).map((m) =>
        gmail<RawMessage>(
          `/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`
        )
      )
    ),
    gmail<{ messagesUnread: number }>('/labels/INBOX'),
    gmail<{ messagesTotal: number }>('/labels/STARRED'),
    gmail<{ messagesUnread: number }>('/labels/IMPORTANT')
  ])
  const header = (m: RawMessage, name: string): string =>
    m.payload.headers.find((h) => h.name.toLowerCase() === name)?.value ?? ''
  return {
    mails: mails.map((m) => ({
      id: m.id,
      from: header(m, 'from').replace(/<.*>/, '').replace(/"/g, '').trim() || header(m, 'from'),
      subject: header(m, 'subject') || '(no subject)',
      date: new Date(Number(m.internalDate)).toISOString(),
      snippet: m.snippet,
      unread: !!m.labelIds?.includes('UNREAD'),
      starred: !!m.labelIds?.includes('STARRED'),
      important: !!m.labelIds?.includes('IMPORTANT')
    })),
    counts: {
      unread: inbox.messagesUnread,
      starred: starred.messagesTotal,
      important: important.messagesUnread
    }
  }
}

export async function modifyLabels(id: string, add: string[], remove: string[]): Promise<void> {
  await gmail(`/messages/${id}/modify`, {
    method: 'POST',
    body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove })
  })
}
