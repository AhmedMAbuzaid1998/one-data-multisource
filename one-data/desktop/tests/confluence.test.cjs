const { test } = require('node:test')
const assert = require('node:assert/strict')
const { parseConfluenceTable } = require('../confluence-parser.cjs')
const { ConfluenceService } = require('../confluence-service.cjs')

const table = '<table><tr><td>User name/MSISDN</td><td>Pass</td><td>User type</td><td>Service Type</td><td>Used in Which Journey</td></tr><tr><td>00001234</td><td>synthetic&amp;only</td><td>Hybrid</td><td>Mobile<br>TV</td><td>Homepage || Billing<script>ignore()</script></td></tr></table>'
const page = { id: '346517143', title: 'Synthetic fixture', version: { number: 3 }, body: { view: { value: table } } }
function fixture() {
  const source = { user: { username: 'tester-a' }, page, failure: null, saved: null, cleared: 0, requests: [] }
  const service = new ConfluenceService({
    fetchJson: async url => { source.requests.push(url); if (source.failure) throw source.failure; return url.endsWith('/current') ? source.user : source.page },
    cache: { read: async () => source.saved, write: async value => { source.saved = value }, clear: async () => { source.saved = null; source.cleared++ } },
    notify: () => {}, now: () => '2026-01-01T00:00:00.000Z'
  })
  return { service, source }
}
test('sample-shaped table preserves leading zeroes, entities, service types and journeys without executing markup', () => {
  const rows = parseConfluenceTable(table)
  assert.equal(rows[0].username, '00001234')
  assert.equal(rows[0].password, 'synthetic&only')
  assert.equal(rows[0].serviceType, 'Mobile\nTV')
  assert.equal(rows[0].journey, 'Homepage || Billing')
  assert.equal(rows[0].market, '')
  assert.equal(rows[0].environment, '')
})
test('supports reordered future columns, repeated headers and rowspans', () => {
  const rows = parseConfluenceTable('<table><tr><th>Market</th><th>Environment</th><th>MSISDN</th></tr><tr><td rowspan="2">AL</td><td>QA</td><td>001</td></tr><tr><td>Stage</td><td>002</td></tr><tr><th>Market</th><th>Environment</th><th>MSISDN</th></tr><tr><td>IE</td><td>QA</td><td>003</td></tr></table>')
  assert.equal(rows.length, 3)
  assert.equal(rows[1].market, 'AL')
  assert.equal(rows[1].username, '002')
  assert.equal(rows[2].market, 'IE')
})
test('unrelated, empty and oversized tables are rejected', () => {
  assert.throws(() => parseConfluenceTable('<table><tr><td>Random</td><td>Other</td></tr></table>'), /No usable/)
  assert.throws(() => parseConfluenceTable('x'.repeat(6 * 1024 * 1024)), /large/)
})
test('refresh requires an identified user before fetching page data', async () => {
  const { service, source } = fixture()
  source.user = { type: 'anonymous' }
  await service.refresh()
  assert.equal(service.state.status, 'sign-in-required')
  assert.equal(source.requests.length, 1)
  assert.equal(source.saved, null)
})
test('successful refresh stores versioned data; outages and invalid tables preserve the last copy', async () => {
  const { service, source } = fixture()
  await service.refresh()
  assert.equal(service.state.status, 'live')
  assert.equal(source.saved.version, 3)
  source.failure = new Error('Network unavailable')
  await service.refresh()
  assert.equal(service.state.status, 'cached')
  assert.equal(service.state.rows.length, 1)
  source.failure = null
  source.page = { ...page, body: { view: { value: '<p>Missing table</p>' } } }
  await service.refresh()
  assert.equal(service.state.lastSuccess, '2026-01-01T00:00:00.000Z')
  assert.equal(source.saved.version, 3)
})
test('relaunch restores cached copy but does not claim a current authenticated session', async () => {
  const { service, source } = fixture()
  await service.refresh()
  service.active = false
  await service.initialize()
  assert.equal(service.state.status, 'cached')
  assert.equal(service.active, false)
})
test('permission denial clears saved and visible data', async () => {
  const { service, source } = fixture()
  await service.refresh()
  source.failure = Object.assign(new Error('Forbidden'), { code: 'denied' })
  await service.refresh()
  assert.equal(service.state.rows.length, 0)
  assert.equal(source.saved, null)
})
test('switching accounts cannot retain the previous users copy after a failed download', async () => {
  const { service, source } = fixture()
  await service.refresh()
  source.user = { username: 'tester-b' }
  source.page = { ...page, body: {} }
  await service.refresh()
  assert.equal(service.state.rows.length, 0)
  assert.equal(source.saved, null)
})
test('sign-out prevents an in-flight refresh from repopulating data', async () => {
  const { service, source } = fixture()
  let complete
  service.fetchJson = () => new Promise(resolve => { complete = resolve })
  const refresh = service.refresh()
  await service.signOut()
  complete({ username: 'tester-a' })
  await refresh
  assert.equal(service.state.status, 'signed-out')
  assert.equal(service.state.rows.length, 0)
  assert.equal(source.saved, null)
  assert.equal(service.active, false)
})
test('offline entry requires a saved successful dataset', () => {
  const { service } = fixture()
  assert.throws(() => service.useOffline(), /No saved data/)
})
test('offline entry keeps the copy and prevents pending login refresh from changing it', async () => {
  const { service, source } = fixture()
  await service.refresh()
  let complete
  service.fetchJson = () => new Promise(resolve => { complete = resolve })
  const refresh = service.refresh()
  const offline = service.useOffline()
  complete({ username: 'different-user' })
  await refresh
  assert.equal(offline.status, 'cached')
  assert.equal(service.state.owner, 'tester-a')
  assert.equal(service.state.rows.length, 1)
  assert.equal(service.active, false)
  assert.equal(source.saved.owner, 'tester-a')
})
