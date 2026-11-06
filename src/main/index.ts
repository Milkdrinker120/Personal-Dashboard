import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getSettings } from './store'
import {
  addNotice,
  deleteNotice,
  listNotices,
  updateNotice,
  type Notice,
  type NoticeInput
} from './notices'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: 'Personal Dashboard',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('notices:list', () => listNotices())
  ipcMain.handle('notices:add', (_, input: NoticeInput) => addNotice(input))
  ipcMain.handle('notices:update', (_, id: string, patch: Partial<Notice>) =>
    updateNotice(id, patch)
  )
  ipcMain.handle('notices:delete', (_, id: string) => deleteNotice(id))
  ipcMain.handle('settings:get', () => {
    const s = getSettings()
    // never expose secrets to the renderer, only whether they are set
    return {
      xlsxPath: s.get('xlsxPath'),
      googleClientId: s.get('googleClientId'),
      googleConnected: !!s.get('googleTokensEnc'),
      icloudUser: s.get('icloudUser'),
      icloudConnected: !!s.get('icloudPasswordEnc'),
      theme: s.get('theme')
    }
  })
  ipcMain.handle('settings:setTheme', (_, theme: 'light' | 'dark') =>
    getSettings().set('theme', theme)
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
