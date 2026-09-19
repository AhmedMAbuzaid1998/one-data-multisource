const { app, BrowserWindow, dialog, session } = require('electron')
const { spawn } = require('node:child_process')
const { randomBytes } = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

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

  appSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.startsWith(`${origin}/`)) {
      details.requestHeaders['X-One-Data-Desktop-Token'] = token
    }
    callback({ requestHeaders: details.requestHeaders })
  })
  appSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))

  mainWindow = new BrowserWindow({
    title: 'One Data',
    width: 1400,
    height: 900,
    minWidth: 920,
    minHeight: 650,
    backgroundColor: '#111113',
    show: false,
    webPreferences: {
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
  mainWindow.once('ready-to-show', () => mainWindow.show())
  await mainWindow.loadURL(origin)
  const loaded = await mainWindow.webContents.executeJavaScript(
    "Boolean(document.getElementById('splash-screen') || document.getElementById('app-shell'))"
  )
  if (!loaded) throw new Error('The desktop interface did not load from the local backend.')
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
