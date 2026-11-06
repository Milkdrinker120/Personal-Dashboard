import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Notice, NoticeInput } from '../main/notices'
import type { InboxData } from '../main/gmail'

const api = {
  notices: {
    list: (): Promise<Notice[]> => ipcRenderer.invoke('notices:list'),
    add: (input: NoticeInput): Promise<Notice> => ipcRenderer.invoke('notices:add', input),
    update: (id: string, patch: Partial<Notice>): Promise<Notice | null> =>
      ipcRenderer.invoke('notices:update', id, patch),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('notices:delete', id)
  },
  gmail: {
    saveCredentials: (id: string, secret: string): Promise<void> =>
      ipcRenderer.invoke('gmail:saveCredentials', id, secret),
    connect: (): Promise<void> => ipcRenderer.invoke('gmail:connect'),
    disconnect: (): Promise<void> => ipcRenderer.invoke('gmail:disconnect'),
    inbox: (): Promise<InboxData> => ipcRenderer.invoke('gmail:inbox'),
    setStar: (id: string, on: boolean): Promise<void> =>
      ipcRenderer.invoke('gmail:setStar', id, on),
    markRead: (id: string): Promise<void> => ipcRenderer.invoke('gmail:markRead', id)
  },
  settings: {
    get: (): Promise<PublicSettings> => ipcRenderer.invoke('settings:get'),
    setTheme: (theme: 'light' | 'dark'): Promise<void> =>
      ipcRenderer.invoke('settings:setTheme', theme)
  }
}

export interface PublicSettings {
  xlsxPath: string
  googleClientId: string
  googleHasSecret: boolean
  googleConnected: boolean
  icloudUser: string
  icloudConnected: boolean
  theme: 'light' | 'dark'
}

export type Api = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
