import { app, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

// Small JSON-file store in userData. Used instead of electron-store, which is ESM-only.
export class JsonStore<T extends object> {
  private path: string
  private data: T

  constructor(name: string, defaults: T) {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    this.path = join(dir, `${name}.json`)
    this.data = { ...defaults }
    try {
      this.data = { ...defaults, ...JSON.parse(readFileSync(this.path, 'utf8')) }
    } catch {
      // first run or unreadable file: keep defaults
    }
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
    writeFileSync(this.path, JSON.stringify(this.data, null, 2))
  }
}

// Secrets are encrypted with the OS (DPAPI on Windows) before being written.
export function encryptSecret(plain: string): string {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS encryption unavailable')
  return safeStorage.encryptString(plain).toString('base64')
}

export function decryptSecret(enc: string): string {
  return safeStorage.decryptString(Buffer.from(enc, 'base64'))
}

export interface Settings {
  xlsxPath: string
  googleClientId: string
  googleClientSecretEnc: string
  googleTokensEnc: string
  icloudUser: string
  icloudPasswordEnc: string
  theme: 'light' | 'dark'
}

let settings: JsonStore<Settings>
export function getSettings(): JsonStore<Settings> {
  settings ??= new JsonStore<Settings>('settings', {
    xlsxPath: '',
    googleClientId: '',
    googleClientSecretEnc: '',
    googleTokensEnc: '',
    icloudUser: '',
    icloudPasswordEnc: '',
    theme: 'dark'
  })
  return settings
}
