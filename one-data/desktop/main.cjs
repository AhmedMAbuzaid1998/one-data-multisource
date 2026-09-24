const { app, BrowserWindow, dialog, session } = require('electron')
const { spawn } = require('node:child_process')
const { randomBytes } = require('node:crypto')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { attachConfluence } = require('./confluence.cjs')

app.setName('One Data Confluence Test')
if (!app.commandLine.hasSwitch('user-data-dir')) app.setPath('userData', path.join(app.getPath('appData'), 'One Data Confluence Test'))

let backend
let quitting = false
let mainWindow

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(start).catch(error => {
    dialog.showErrorBox('One Data could not start', error.message)
    app.quit()
  })
}

async function start() {
  const resources = app.isPackaged ? process.resourcesPath : path.join(__dirname, 'build')
  const java = path.join(resources, 'runtime', 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  const jar = path.join(resources, 'one-data.jar')
  if (!fs.existsSync(java) || !fs.existsSync(jar)) {
    throw new Error('The bundled backend or Java runtime is missing. Reinstall One Data.')
  }

  const token = randomBytes(32).toString('hex')
  const port = await launchBackend(java, jar, token)
  const origin = `http://127.0.0.1:${port}`
  const appSession = session.fromPartition('persist:one-data')
  await appSession.setProxy({ mode: 'direct' })
  await waitForBackend(origin, token)

  appSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.startsWith(`${origin}/`)) {
      details.requestHeaders['X-One-Data-Desktop-Token'] = token
    }
    callback({ requestHeaders: details.requestHeaders })
  })
  appSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))

  mainWindow = new BrowserWindow({
    title: 'One Data · Confluence Test',
    width: 1400,
    height: 900,
    minWidth: 920,
    minHeight: 650,
    backgroundColor: '#111113',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      partition: 'persist:one-data',
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${origin}/`)) event.preventDefault()
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.on('closed', () => { if (!quitting) app.quit() })
  await attachConfluence(mainWindow, origin)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  let lastError
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await mainWindow.loadURL(origin, {
        extraHeaders: `X-One-Data-Desktop-Token: ${token}\n`
      })
      lastError = null
      break
    } catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)))
    }
  }
  if (lastError) throw lastError
  const loaded = await mainWindow.webContents.executeJavaScript(
    "Boolean(document.getElementById('splash-screen') || document.getElementById('startup-sign-in') || document.getElementById('app-shell'))"
  )
  if (!loaded) throw new Error('The desktop interface did not load from the local backend.')
}

function waitForBackend(origin, token) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    function check() {
      const request = http.get(`${origin}/`, {
        headers: { 'X-One-Data-Desktop-Token': token },
        timeout: 3000
      }, response => {
        response.resume()
        if (response.statusCode === 200) resolve()
        else retry(new Error(`The local service returned HTTP ${response.statusCode}.`))
      })
      request.on('error', retry)
      request.on('timeout', () => request.destroy(new Error('Local service timed out.')))
    }
    function retry(error) {
      if (++attempts >= 20) reject(error)
      else setTimeout(check, 500)
    }
    check()
  })
}

function launchBackend(java, jar, token) {
  return new Promise((resolve, reject) => {
    const child = spawn(java, ['-jar', jar, '--spring.profiles.active=desktop'], {
      env: { ...process.env, ONE_DATA_DESKTOP_TOKEN: token },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    backend = child
    let output = ''
    let settled = false
    const timeout = setTimeout(() => finish(new Error('The backend did not start within 90 seconds.')), 90000)

    function finish(error, port) {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (error) reject(new Error(`${error.message}\n${output.slice(-1500)}`))
      else resolve(port)
    }

    child.stdout.on('data', chunk => {
      output = (output + chunk.toString()).slice(-5000)
      const match = output.match(/ONE_DATA_DESKTOP_PORT=(\d+)/)
      if (match) finish(null, Number(match[1]))
    })
    child.stderr.on('data', chunk => { output = (output + chunk.toString()).slice(-5000) })
    child.on('error', error => finish(error))
    child.on('exit', code => {
      if (!settled) finish(new Error(`The backend exited with code ${code}.`))
      else if (!quitting) {
        dialog.showErrorBox('One Data stopped', 'The local backend stopped unexpectedly. Please restart the app.')
        app.quit()
      }
    })
  })
}

app.on('before-quit', () => {
  quitting = true
  if (backend && !backend.killed) backend.kill()
})
app.on('window-all-closed', () => app.quit())
