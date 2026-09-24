const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const Module = require('node:module')
const root = path.resolve(__dirname, '../../frontend')
const frontendRequire = Module.createRequire(path.join(root, 'package.json'))
const ts = frontendRequire('typescript')
const React = frontendRequire('react')
const { renderToStaticMarkup } = frontendRequire('react-dom/server')
function component(name) {
  const file = path.join(root, 'src/components', `${name}.tsx`)
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  }).outputText
  const mod = new Module(file)
  mod.paths = Module._nodeModulePaths(path.dirname(file))
  const localRequire = Module.createRequire(file)
  mod.require = name => name === './TokenButton' ? () => null : localRequire(name)
  // Classic JSX requires React; production uses the Vite automatic JSX transform.
  mod._compile(`const React = require('react');\n${compiled}`, file)
  return mod.exports.default
}
test('Confluence table prioritizes sample columns and never initially renders a test password', () => {
  const UserTable = component('UserTable')
  const html = renderToStaticMarkup(React.createElement(UserTable, { users: [{ id: 1, username: '00001', password: 'fake-secret-never-rendered', userType: 'Hybrid', serviceType: 'Mobile', journey: '<script>synthetic</script>', market: '', environment: '', role: '', paymentType: '', accountId: '', serviceId: '' }], loading: false, error: '', tokenEnabled: false }))
  assert.ok(!html.includes('fake-secret-never-rendered'))
  assert.ok(html.includes('••••••••'))
  assert.ok(html.includes('&lt;script&gt;synthetic&lt;/script&gt;'))
  assert.ok(html.indexOf('user-table-header-journey') < html.indexOf('user-table-header-market'))
  assert.ok(!html.includes('user-table-header-accountId'))
})
test('source card distinguishes stale cached data and personal-file override', () => {
  const Source = component('ConfluenceSource')
  const html = renderToStaticMarkup(React.createElement(Source, { personal: true, state: { rows: [], status: 'cached', message: 'Last successful copy', title: 'Synthetic page', lastSuccess: '2026-01-01T00:00:00Z', version: 2 } }))
  assert.ok(html.includes('Cached copy'))
  assert.ok(html.includes('Your personal file is active'))
  assert.ok(html.includes('Page version 2'))
  assert.ok(html.includes('Sign out &amp; clear local copy'))
})
