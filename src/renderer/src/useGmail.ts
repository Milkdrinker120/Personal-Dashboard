import { useCallback, useEffect, useState } from 'react'
import type { InboxData } from '../../main/gmail'

export interface GmailState {
  clientId: string
  hasSecret: boolean
  connected: boolean
  inbox: InboxData | null
  error: string
  busy: boolean
}

export interface GmailApi extends GmailState {
  refresh: () => Promise<void>
  saveCredentials: (id: string, secret: string) => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  setStar: (id: string, on: boolean) => Promise<void>
  markRead: (id: string) => Promise<void>
}

const clean = (e: unknown): string =>
  (e instanceof Error ? e.message : String(e)).replace(
    /^Error invoking remote method '[^']+': (Error: )?/,
    ''
  )

export function useGmail(): GmailApi {
  const [state, setState] = useState<GmailState>({
    clientId: '',
    hasSecret: false,
    connected: false,
    inbox: null,
    error: '',
    busy: false
  })
  const patch = useCallback((p: Partial<GmailState>): void => setState((s) => ({ ...s, ...p })), [])

  const refresh = useCallback(async () => {
    const s = await window.api.settings.get()
    const base = {
      clientId: s.googleClientId,
      hasSecret: s.googleHasSecret,
      connected: s.googleConnected
    }
    if (!s.googleConnected) {
      setState((x) => ({ ...x, ...base, inbox: null }))
      return
    }
    try {
      const inbox = await window.api.gmail.inbox()
      setState((x) => ({ ...x, ...base, inbox, error: '' }))
    } catch (e) {
      setState((x) => ({ ...x, ...base, error: clean(e) }))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const run = async (fn: () => Promise<void>): Promise<void> => {
    patch({ busy: true, error: '' })
    try {
      await fn()
    } catch (e) {
      patch({ error: clean(e) })
    }
    await refresh()
    patch({ busy: false })
  }

  return {
    ...state,
    refresh,
    saveCredentials: (id, secret) => run(() => window.api.gmail.saveCredentials(id, secret)),
    connect: () => run(() => window.api.gmail.connect()),
    disconnect: () => run(() => window.api.gmail.disconnect()),
    setStar: async (id, on) => {
      await window.api.gmail.setStar(id, on)
      await refresh()
    },
    markRead: async (id) => {
      await window.api.gmail.markRead(id)
      await refresh()
    }
  }
}
