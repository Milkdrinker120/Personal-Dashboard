import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Notice, NoticeInput } from '../main/notices'

const api = {
  notices: {
    list: (): Promise<Notice[]> => ipcRenderer.invoke('notices:list'),
    add: (input: NoticeInput): Promise<Notice> => ipcRenderer.invoke('notices:add', input),
    update: (id: string, patch: Partial<Notice>): Promise<Notice | null> =>
      ipcRenderer.invoke('notices:update', id, patch),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('notices:delete', id)
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
