import { spawn } from 'node:child_process'
import { mkdtemp, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const exe = process.argv[2]
const startupLogin = process.argv.includes('--confluence-login')
const confluence = startupLogin || process.argv.includes('--confluence')
if (!exe) throw new Error('Pass the packaged executable path.')

const profile = await mkdtemp(path.join(tmpdir(), 'one-data-smoke-'))
const port = 19321 + Math.floor(Math.random() * 1000)
const child = spawn(exe, [`--user-data-dir=${profile}`, `--remote-debugging-port=${port}`], {
  windowsHide: true,
  stdio: 'ignore'
})

try {
  let result
  for (let i = 0; i < 180; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const page = targets.find(target => target.type === 'page' && target.url.startsWith('http://127.0.0.1:'))
      if (!page) continue
      result = await new Promise((resolve, reject) => {
        const ws = new WebSocket(page.webSocketDebuggerUrl)
        const timeout = setTimeout(() => { ws.close(); reject(new Error('DevTools timed out.')) }, 3000)
        ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
          expression: startupLogin
            ? '(async()=>{const state=await window.confluenceDesktop?.getState(); return JSON.stringify({root:!!document.getElementById("startup-sign-in"),confluence:!!document.getElementById("startup-retry-sign-in"),workspace:!!document.getElementById("app-shell"),loginOpen:state?.loginOpen,status:state?.status,rows:state?.rows.length,refreshMinutes:state?.refreshMinutes,startupMode:window.confluenceDesktop?.startupMode})})()'
            : confluence
            ? '(async()=>{const state=await window.confluenceDesktop?.getState(); return JSON.stringify({root:!!document.getElementById("app-shell"),confluence:!!document.getElementById("confluence-sign-in"),loginOpen:state?.loginOpen,filtersBeforeSearch:!!(document.getElementById("filter-panel")?.compareDocumentPosition(document.getElementById("smart-search-section")) & 4),status:state?.status,rows:state?.rows.length,refreshMinutes:state?.refreshMinutes,startupMode:window.confluenceDesktop?.startupMode})})()'
            : 'JSON.stringify({url:location.href,title:document.title,root:!!document.getElementById("root"),text:document.body.innerText.slice(0,150)})',
          returnByValue: true, awaitPromise: true
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
      if (result.root && (!confluence || result.confluence) && (!startupLogin || result.loginOpen)) break
    } catch { /* Wait for Electron and the backend to start. */ }
  }
  if (!result?.root) throw new Error(`The packaged interface did not load: ${JSON.stringify(result)}`)
  if (confluence && (!result.confluence || result.rows !== 0 || result.refreshMinutes !== 5)) throw new Error(`Confluence initial state failed: ${JSON.stringify(result)}`)
  if (startupLogin && (!result.loginOpen || result.workspace)) throw new Error(`Automatic sign-in gate failed: ${JSON.stringify(result)}`)
  if (confluence && !startupLogin && (result.loginOpen || !result.filtersBeforeSearch || result.startupMode !== 'manual')) throw new Error(`Manual startup failed: ${JSON.stringify(result)}`)
  console.log(JSON.stringify(result))
  if (process.argv.includes('--multisource')) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    const target = targets.find(item => item.type === 'page' && item.url.startsWith('http://127.0.0.1:'))
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise(resolve => { ws.onopen = resolve })
    let sequence = 10
    const pending = new Map()
    ws.onmessage = event => { const message = JSON.parse(event.data); const callback = pending.get(message.id); if(callback) {pending.delete(message.id); message.error ? callback.reject(new Error(JSON.stringify(message.error))) : callback.resolve(message.result)} }
    const call = (method, params = {}) => new Promise((resolve,reject)=>{const id=sequence++;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})
    const evaluate = async expression => {const response=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(response.exceptionDetails)throw new Error(JSON.stringify(response.exceptionDetails));return response.result.value}
    const waitFor = async expression => {for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,200))}throw new Error(`Timed out: ${expression}`)}
    try {
      await call('Page.bringToFront'); const root=await call('DOM.getDocument')
      const input=await call('DOM.querySelector',{nodeId:root.root.nodeId,selector:'#dataset-file-input'})
      const fixtures=path.join(repositoryRoot,'samples')
      await call('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[path.join(fixtures,'multisource-test.xlsx'),path.join(fixtures,'multisource-test.json')]})
      await waitFor('document.querySelectorAll("tbody tr").length===8 || !!document.getElementById("source-error")')
      const imported=await evaluate('JSON.stringify({rows:document.querySelectorAll("tbody tr").length,headers:[...document.querySelectorAll("thead th")].map(x=>x.innerText.replace(/[↕↑↓]/g,"")),text:document.querySelector("tbody")?.innerText,error:document.getElementById("source-error")?.innerText})')
      const data=JSON.parse(imported)
      if(data.error||data.rows!==8||data.headers.length!==13||!data.text.includes('00070001')||!data.text.includes('false')||!data.text.includes('null'))throw new Error(`Import failed: ${imported}`)
      await evaluate('document.getElementById("filter-chooser").open=true;[...document.querySelectorAll("#filter-chooser-options label")].find(x=>x.textContent==="Offer").querySelector("input").click()')
      await waitFor('[...document.querySelectorAll("fieldset")].some(x=>x.querySelector("legend")?.textContent==="Offer")')
      await evaluate('[...document.querySelectorAll("fieldset")].find(x=>x.querySelector("legend")?.textContent==="Offer").querySelector("button[id^=filter-null]").click()')
      await waitFor('document.querySelectorAll("tbody tr").length===6')
      await evaluate('document.getElementById("filter-clear-all").click()')
      await waitFor('document.querySelectorAll("tbody tr").length===8')
      await evaluate('document.querySelector("tbody button[aria-label^=Copy]").click()')
      await waitFor('document.getElementById("copy-feedback").textContent.length>0'); const feedback=await evaluate('document.getElementById("copy-feedback").textContent'); if(feedback!=='Copied')throw new Error(feedback)
      await evaluate('document.getElementById("filter-panel").scrollIntoView()'); const capture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
      const output=path.join(repositoryRoot,'outputs/multisource-tests');await mkdir(output,{recursive:true})
      const {writeFile}=await import('node:fs/promises');await writeFile(path.join(output,'desktop-check.png'),Buffer.from(capture.data,'base64'))
      await evaluate('[...document.querySelectorAll("#source-list li")].find(x=>x.textContent.includes("multisource-test.json")).querySelector("button").click()')
      await waitFor('document.querySelectorAll("tbody tr").length===5')
      const headers=await evaluate('[...document.querySelectorAll("thead th")].map(x=>x.innerText.replace(/[↕↑↓]/g,""))')
      if(headers.includes('Offer')||headers.includes('Balance'))throw new Error('Removed source columns remain')
      console.log('Multi-source integration passed: both Excel sheets + JSON, 8 rows/13 columns, leading zeroes, false, null, dynamic Offer filter, Copied feedback, source removal.')
    } finally { ws.close() }
  }
} finally {
  // Close the window normally so Electron stops its Java child before exiting.
  try {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    const target = targets.find(item => item.type === 'page' && item.url.startsWith('http://127.0.0.1:'))
    if (target) await new Promise(resolve => {
      const ws = new WebSocket(target.webSocketDebuggerUrl)
      const timer = setTimeout(() => { ws.close(); resolve() }, 2500)
      ws.onopen = () => ws.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: 'window.close()' } }))
      ws.onclose = () => { clearTimeout(timer); resolve() }
      ws.onerror = () => { clearTimeout(timer); resolve() }
    })
  } catch { /* The window may already have closed. */ }
  if (child.exitCode === null) child.kill()
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
}
