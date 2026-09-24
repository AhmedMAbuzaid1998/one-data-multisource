const { parseConfluenceTable } = require('./confluence-parser.cjs')
const ORIGIN = 'https://cps.confluence.agile.vodafone.com'
const PAGE_ID = '346517143'
const PAGE_URL = `${ORIGIN}/pages/viewpage.action?pageId=${PAGE_ID}`
const REFRESH_MS = 5 * 60 * 1000

class ConfluenceService {
  constructor({ fetchJson, cache, notify, now = () => new Date().toISOString() }) {
    Object.assign(this, { fetchJson, cache, notify, now })
    this.epoch = 0
    this.busy = false
    this.active = false
    this.state = { rows: [], status: 'signed-out', loginOpen: false, message: 'Sign in to Confluence to download your team data.', owner: '', lastSuccess: null, version: null, title: '', pageUrl: PAGE_URL, refreshMinutes: 5 }
  }
  publish(update) { this.state = { ...this.state, ...update }; this.notify(this.snapshot()); return this.snapshot() }
  snapshot() { return structuredClone(this.state) }
  async initialize() {
    try {
      const saved = await this.cache.read()
      if (saved && saved.pageId === PAGE_ID && saved.owner && Array.isArray(saved.rows) && saved.rows.length) {
        this.publish({ rows: saved.rows, owner: saved.owner, lastSuccess: saved.lastSuccess, version: saved.version, title: saved.title,
          status: 'cached', message: 'Showing your last encrypted copy. Sign in for live updates; this copy may be out of date.' })
      }
    } catch { this.publish({ message: 'The saved copy could not be opened. Sign in to download a fresh copy.' }) }
  }
  async refresh() {
    if (this.busy) return this.snapshot()
    this.busy = true
    this.active = true
    const epoch = this.epoch
    this.publish({ status: 'refreshing', message: 'Checking Confluence for the latest table…' })
    try {
      const user = await this.fetchJson('/rest/api/user/current')
      const owner = user.userKey || user.username || user.accountId
      if (!owner || user.type === 'anonymous') throw Object.assign(new Error('Please sign in to Confluence.'), { code: 'auth' })
      if (epoch !== this.epoch) return this.snapshot()
      if (this.state.owner && this.state.owner !== owner) {
        this.publish({ rows: [], lastSuccess: null, version: null, title: '', owner })
        await this.cache.clear()
      }
      const page = await this.fetchJson(`/rest/api/content/${PAGE_ID}?expand=body.view,version`)
      if (epoch !== this.epoch) return this.snapshot()
      if (String(page.id) !== PAGE_ID) throw new Error('Confluence returned a different page. The previous copy was kept.')
      const rows = parseConfluenceTable(page.body?.view?.value)
      const update = { rows, owner, title: page.title || 'Confluence test data', version: page.version?.number ?? null, lastSuccess: this.now() }
      let message = 'Up to date. Automatic refresh every 5 minutes.'
      try { await this.cache.write({ pageId: PAGE_ID, ...update }) }
      catch { message = 'Live data loaded. Encrypted offline storage is unavailable; this copy is available only until the app closes.' }
      if (epoch !== this.epoch) { await this.cache.clear(); return this.snapshot() }
      return this.publish({ ...update, status: 'live', message })
    } catch (error) {
      if (epoch !== this.epoch) return this.snapshot()
      if (error.code === 'denied') {
        this.publish({ rows: [], owner: '', lastSuccess: null, version: null, title: '', status: 'denied', message: 'Confluence denied access to this page. Contact the page owner.' })
        try { await this.cache.clear() }
        catch { this.publish({ message: 'Confluence denied access. Data is hidden, but the encrypted local copy could not be deleted. Check local file permissions.' }) }
        return this.snapshot()
      }
      const hasCopy = this.state.rows.length > 0
      return this.publish({ status: error.code === 'auth' ? 'sign-in-required' : hasCopy ? 'cached' : 'error',
        message: `${error.message}${hasCopy ? ' Showing the last successful copy; it may be out of date.' : ''}` })
    } finally { this.busy = false }
  }
  async signOut() {
    this.epoch++
    this.active = false
    this.publish({ rows: [], owner: '', lastSuccess: null, version: null, title: '', status: 'signed-out', message: 'Signed out. Your local data copy has been removed.' })
    try { await this.cache.clear() }
    catch { this.publish({ message: 'Signed out. Data is hidden, but the encrypted local copy could not be deleted. Check local file permissions.' }) }
    return this.snapshot()
  }
  useOffline() {
    if (!this.state.rows.length || !this.state.lastSuccess) throw new Error('No saved data is available. Please sign in.')
    this.epoch++
    this.active = false
    return this.publish({ status: 'cached', message: 'Using your last successful copy offline. Sign in to resume automatic updates.' })
  }
}
module.exports = { ConfluenceService, ORIGIN, PAGE_URL, REFRESH_MS }
