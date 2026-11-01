const { ConfluenceService, ORIGIN, PAGE_URL } = require('./confluence-service.cjs')
function pageIdFromUrl(input) {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Enter a Confluence page link.')
  const url = new URL(input)
  if (url.origin !== ORIGIN || url.username || url.password) throw new Error(`Use a page on ${ORIGIN}.`)
  const id = url.searchParams.get('pageId') || url.pathname.match(/\/pages\/(\d+)(?:\/|$)/)?.[1]
  if (!/^\d{1,20}$/.test(id || '')) throw new Error('Use a full page link containing pageId or /pages/123456/.')
  return id
}
class ConfluenceHub {
  constructor({ fetchJson, cache, notify }) {
    Object.assign(this, { fetchJson, cache, notify })
    this.pages = new Map(); this.saved = {}; this.active = false; this.busy = false; this.loginOpen = false
    this.owner = ''; this.epoch = 0
    this.addService('346517143')
  }
  addService(id) {
    const service = new ConfluenceService({ pageId: id, fetchJson: this.fetchJson,
      cache: { read: () => this.saved[id], write: async data => { this.saved[id] = data; await this.persist() }, clear: async () => { delete this.saved[id]; await this.persist() } },
      notify: () => { if (!this.busy) this.notify(this.snapshot()) }
    })
    service.state.pageUrl = `${ORIGIN}/pages/viewpage.action?pageId=${id}`
    this.pages.set(id, service)
    return service
  }
  async persist() { await this.cache.write({ format: 2, pageIds: [...this.pages.keys()], saved: this.saved }) }
  async initialize() {
    try {
      const data = await this.cache.read()
      if (data?.format === 2 && Array.isArray(data.pageIds)) {
        this.pages.clear(); this.saved = data.saved || {}
        for (const id of data.pageIds.slice(0,20)) if (/^\d{1,20}$/.test(id)) this.addService(id)
      } else if (data?.pageId) this.saved[data.pageId] = data
      this.busy = true
      for (const service of this.pages.values()) await service.initialize()
      this.owner = [...this.pages.values()].find(service => service.state.owner)?.state.owner || ''
    } catch { this.message = 'Saved sources could not be restored. Add your pages and sign in again.' } finally { this.busy = false; this.notify(this.snapshot()) }
  }
  snapshot() {
    const sources = [...this.pages].map(([id, service]) => ({ id, ...service.snapshot() }))
    const rows = sources.flatMap(source => source.rows)
    const status = this.busy ? 'refreshing' : sources.some(s=>s.status==='sign-in-required') ? 'sign-in-required' : sources.length && sources.every(s=>s.status==='live') ? 'live' : rows.length ? 'cached' : sources.some(s=>s.status==='error'||s.status==='denied') ? 'error' : 'signed-out'
    return { rows, sources, status, loginOpen: this.loginOpen, owner: this.owner, lastSuccess: sources.map(s=>s.lastSuccess).filter(Boolean).sort()[0] || null,
      title: 'Confluence pages', pageUrl: PAGE_URL, version: null, refreshMinutes: 5,
      message: this.message || `${sources.length} page(s). Each source keeps its own refresh status and saved copy.` }
  }
  get state() { return this.snapshot() }
  publish(update) { if ('loginOpen' in update) this.loginOpen = update.loginOpen; this.message = update.message || ''; const state=this.snapshot(); this.notify(state); return state }
  async addPage(url) {
    if (this.busy) throw new Error('Wait for the current refresh to finish.')
    const id=pageIdFromUrl(url)
    if (this.pages.has(id)) throw new Error('This page is already added.')
    if (this.pages.size>=20) throw new Error('Maximum 20 Confluence pages.')
    this.addService(id); try { await this.persist() } catch(error) { this.pages.delete(id); throw error }; this.notify(this.snapshot())
    return this.refresh()
  }
  async removePage(id) {
    if (this.busy) throw new Error('Wait for the current refresh to finish.')
    if (typeof id!=='string' || !this.pages.has(id)) throw new Error('Unknown page.')
    const service=this.pages.get(id), saved=this.saved[id]
    this.pages.delete(id); delete this.saved[id]
    try { await this.persist() } catch(error) { this.pages.set(id,service); if(saved)this.saved[id]=saved; throw error }
    this.notify(this.snapshot()); return this.snapshot()
  }
  async refresh() {
    if (this.busy) return this.snapshot()
    this.busy=true; this.active=true; this.message=''; const epoch=this.epoch; this.notify(this.snapshot())
    try {
      const user=await this.fetchJson('/rest/api/user/current'); const owner=user.userKey||user.username||user.accountId
      if (!owner || user.type==='anonymous') throw Object.assign(new Error('Sign in to Confluence.'),{code:'auth'})
      if(epoch!==this.epoch)return this.snapshot()
      if(this.owner && this.owner!==owner){this.saved={};for(const s of this.pages.values())await s.signOut()}
      this.owner=owner
      for(const service of this.pages.values()){if(epoch!==this.epoch)break;await service.refresh()}
    } catch(error) {
      if(epoch!==this.epoch)return this.snapshot()
      for(const service of this.pages.values()) {
        if(error.code==='denied')await service.signOut()
        service.publish({status:error.code==='auth'?'sign-in-required':service.state.rows.length?'cached':'error',message:error.message})
      }
    } finally { this.busy=false;this.notify(this.snapshot()) }
    return this.snapshot()
  }
  async signOut() {
    this.epoch++;this.active=false
    for(const service of this.pages.values())await service.signOut()
    this.saved={};this.owner='';await this.persist();return this.publish({message:'Signed out. Downloaded copies cleared; page links retained.'})
  }
  useOffline(){this.epoch++;this.active=false;for(const s of this.pages.values())if(s.state.rows.length)s.useOffline();return this.snapshot()}
}
module.exports={ConfluenceHub,pageIdFromUrl}
