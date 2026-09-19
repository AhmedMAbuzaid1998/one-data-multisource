import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const exe = process.argv[2]
if (!exe) throw new Error('Pass the packaged executable path.')

const profile = await mkdtemp(path.join(tmpdir(), 'one-data-smoke-'))
const port = 19321 + Math.floor(Math.random() * 1000)
const child = spawn(exe, [`--user-data-dir=${profile}`, `--remote-debugging-port=${port}`], {
  windowsHide: true,
  stdio: 'ignore'
})

try {
  let result
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const page = targets.find(target => target.type === 'page' && target.url.startsWith('http://127.0.0.1:'))
      if (!page) continue
      result = await new Promise((resolve, reject) => {
        const ws = new WebSocket(page.webSocketDebuggerUrl)
        const timeout = setTimeout(() => { ws.close(); reject(new Error('DevTools timed out.')) }, 3000)
        ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
          expression: 'JSON.stringify({url:location.href,title:document.title,root:!!document.getElementById("root"),text:document.body.innerText.slice(0,150)})',
          returnByValue: true
        } }))
        ws.onmessage = message => {
          const data = JSON.parse(message.data)
          if (data.id !== 1) return
          clearTimeout(timeout)
          ws.close()
          resolve(JSON.parse(data.result.result.value))
        }
        ws.onerror = reject
      })
      if (result.root) break
    } catch { /* Wait for Electron and the backend to start. */ }
  }
  if (!result?.root) throw new Error(`The packaged interface did not load: ${JSON.stringify(result)}`)
  console.log(JSON.stringify(result))
} finally {
  child.kill()
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
}
