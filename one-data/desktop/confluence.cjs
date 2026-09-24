const { BrowserWindow, session, ipcMain, safeStorage, app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { ConfluenceService, ORIGIN, PAGE_URL, REFRESH_MS } = require('./confluence-service.cjs')

async function attachConfluence(mainWindow, appOrigin) {
  // An in-memory session: each teammate signs in themselves; no login cookies are shipped or saved.
  const authSession = session.fromPartition('one-data-confluence-sign-in')
  authSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  authSession.on('will-download', event => event.preventDefault())
  let loginWindow
  const cachePath = path.join(app.getPath('userData'), 'confluence-cache.enc')
  const cache = {
    read() {
      if (!fs.existsSync(cachePath)) return null
      if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage unavailable')
      return JSON.parse(safeStorage.decryptString(fs.readFileSync(cachePath)))
    },
    write(data) {
      if (!safeStorage.isEncryptionAvailable() || (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) throw new Error('Secure storage unavailable')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(`${cachePath}.tmp`, safeStorage.encryptString(JSON.stringify(data)), { mode: 0o600 })
      fs.renameSync(`${cachePath}.tmp`, cachePath)
    },
    clear() { for (const file of [cachePath, `${cachePath}.tmp`]) if (fs.existsSync(file)) fs.unlinkSync(file) }
  }
  async function fetchJson(route) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    try {
      const response = await authSession.fetch(`${ORIGIN}${route}`, {
        method: 'GET', credentials: 'include', redirect: 'manual', cache: 'no-store',
        headers: { Accept: 'application/json' }, signal: controller.signal
      })
      if (response.status === 401 || (response.status >= 300 && response.status < 400)) throw Object.assign(new Error('Your Confluence session needs sign-in.'), { code: 'auth' })
      if (response.status === 403 || response.status === 404) throw Object.assign(new Error('Page access unavailable.'), { code: 'denied' })
      if (!response.ok) throw new Error(`Confluence returned HTTP ${response.status}. Try again later.`)
      if (!response.headers.get('content-type')?.includes('application/json')) throw Object.assign(new Error('Confluence returned a login page. Sign in again.'), { code: 'auth' })
      const reader = response.body.getReader()
      const chunks = []
      let size = 0
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 6 * 1024 * 1024) { await reader.cancel(); throw new Error('The Confluence response is too large.') }
        chunks.push(Buffer.from(value))
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch (error) {
      if (error.code || error.message.startsWith('Confluence') || error.message.startsWith('The Confluence') || error.message.startsWith('Your Confluence')) throw error
      throw new Error('Could not reach Confluence. Check your network or organization VPN.')
    } finally { clearTimeout(timeout) }
  }
  const service = new ConfluenceService({ fetchJson, cache, notify: state => {
    if (!mainWindow.isDestroyed()) mainWindow.webContents.send('confluence:changed', state)
  } })
  await service.initialize()
  function allowedSender(event) {
    return event.sender === mainWindow.webContents && event.senderFrame === mainWindow.webContents.mainFrame && new URL(event.senderFrame.url).origin === appOrigin
  }
  const handle = (name, action) => ipcMain.handle(`confluence:${name}`, (event, ...args) => {
    if (!allowedSender(event) || args.length) throw new Error('Unsupported desktop request.')
    return action()
  })
  handle('state', () => service.snapshot())
  handle('refresh', () => service.refresh())
  handle('sign-in', () => {
    if (loginWindow && !loginWindow.isDestroyed()) { loginWindow.focus(); return service.snapshot() }
    loginWindow = new BrowserWindow({
      title: 'Sign in to Vodafone Confluence', width: 1050, height: 780,
      parent: mainWindow, autoHideMenuBar: true,
      webPreferences: { session: authSession, nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
    })
    loginWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('https://')) event.preventDefault()
    })
    loginWindow.webContents.on('will-redirect', (event, url) => {
      if (!url.startsWith('https://')) event.preventDefault()
    })
    loginWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    loginWindow.webContents.on('did-finish-load', async () => {
      if (!loginWindow || loginWindow.isDestroyed()) return
      if (new URL(loginWindow.webContents.getURL()).origin !== ORIGIN) return
      const result = await service.refresh()
      if (result.status === 'live' && loginWindow && !loginWindow.isDestroyed()) loginWindow.close()
    })
    loginWindow.on('closed', () => { loginWindow = null })
    loginWindow.loadURL(PAGE_URL).catch(() => service.publish({ status: service.state.rows.length ? 'cached' : 'error', message: 'The sign-in page could not load. Check your network or organization VPN.' }))
    return service.snapshot()
  })
  handle('sign-out', async () => {
    if (loginWindow && !loginWindow.isDestroyed()) loginWindow.destroy()
    await service.signOut()
    await authSession.clearStorageData()
    await authSession.clearAuthCache()
    await authSession.closeAllConnections()
    return service.snapshot()
  })
  const timer = setInterval(() => { if (service.active) void service.refresh() }, REFRESH_MS)
  app.on('before-quit', () => { clearInterval(timer); if (loginWindow && !loginWindow.isDestroyed()) loginWindow.destroy() })
}
module.exports = { attachConfluence }
