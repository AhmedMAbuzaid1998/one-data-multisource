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
  mod.require = name => name === './TokenButton' ? () => null : name === './CopyFeedback' ? { copyText: () => {} } : localRequire(name)
  // Classic JSX requires React; production uses the Vite automatic JSX transform.
  mod._compile(`const React = require('react');\n${compiled}`, file)
  return mod.exports.default
}
test('Confluence table prioritizes sample columns and displays passwords without a toggle', () => {
  const UserTable = component('UserTable')
  const html = renderToStaticMarkup(React.createElement(UserTable, { users: [{ id: 1, username: '00001', password: 'fake-secret-never-rendered', userType: 'Hybrid', serviceType: 'Mobile', journey: '<script>synthetic</script>', market: '', environment: '', role: '', paymentType: '', accountId: '', serviceId: '' }], loading: false, error: '', tokenEnabled: false }))
  assert.ok(html.includes('fake-secret-never-rendered'))
  assert.ok(!html.includes('password-toggle'))
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
test('startup gate offers retry without a cache, and offers dated offline entry only with a saved copy', () => {
  const Gate = component('StartupSignIn')
  const props = { error: '', pending: false, onSignIn: () => {}, onOffline: () => {} }
  const empty = renderToStaticMarkup(React.createElement(Gate, { ...props, state: { rows: [], status: 'signed-out' } }))
  assert.ok(empty.includes('startup-retry-sign-in'))
  assert.ok(!empty.includes('startup-use-offline'))
  assert.ok(!empty.includes('app-shell'))
  const cached = renderToStaticMarkup(React.createElement(Gate, { ...props, state: { rows: [{}], lastSuccess: '2026-01-01T00:00:00Z', status: 'cached' } }))
  assert.ok(cached.includes('startup-use-offline'))
  assert.ok(cached.includes('This copy may be out of date'))
})

function tableData() {
  const file = path.join(root, 'src/services/tableData.ts')
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const mod = new Module(file)
  mod._compile(compiled, file)
  return mod.exports
}
test('search matches all table columns, terms across cells, quoted phrases, and scoped headers', () => {
  const { matchesSearch, tableColumns, matchesFilters } = tableData()
  const row = { id: 1, username: '00012', password: 'Synthetic-Secret!', userType: 'Hybrid', custom: 'Plan upgrade in new market', columns: [{key:'username',label:'User name/MSISDN'}, {key:'password',label:'Pass',sensitive:true}, {key:'userType',label:'User type'}, {key:'custom',label:'New journey'}] }
  const columns = tableColumns([row])
  for (const query of ['00012', 'Synthetic-Secret!', 'Hybrid upgrade', '"plan upgrade"', '"New journey":"new market"', 'msisdn:00012']) assert.equal(matchesSearch(row, query, columns), true, query)
  for (const query of ['synthetic-secret!', 'Hybrid billing', 'missing:value', '"wrong phrase"']) assert.equal(matchesSearch(row, query, columns), false, query)
  assert.equal(matchesFilters(row, {custom:'upgrade',userType:'hybrid'},columns),true)
  assert.equal(matchesFilters(row, {custom:'billing'},columns),false)
  assert.deepEqual(tableColumns([row]).map(column => column.label), ['User name/MSISDN','Pass','User type','New journey'])
})
test('dynamic table renders new headers safely and masks arbitrary sensitive columns', () => {
  const UserTable = component('UserTable')
  const html = renderToStaticMarkup(React.createElement(UserTable, { users: [{ id:1, username:'001', custom:'<new value>', secret:'synthetic-private' }], columns:[{key:'custom',label:'New header'},{key:'secret',label:'Credential',sensitive:true}], loading:false, error:'' }))
  assert.ok(html.includes('New header'))
  assert.ok(html.includes('&lt;new value&gt;'))
  assert.ok(!html.includes('synthetic-private'))
})

test('natural search removes request wording, maps countries, normalizes payment spelling and fixes unique typos',()=>{
 const {interpretSearch,matchesSearch,tableColumns}=tableData()
 const rows=[{id:1,username:'001',market:'AL',userType:'Post Paid',serviceType:'Mobile',journey:'Pega offer upgrade'}]
 const columns=tableColumns(rows)
 const interpreted=interpretSearch('Please find me a postpaid user in Albania with moblie and Pega',rows,columns)
 assert.equal(interpreted.query,'postpaid al mobile Pega')
 const corrected=interpretSearch('Find me a post paid user in Albania with mobil and Pega',rows,columns)
 assert.equal(corrected.query,'postpaid al mobile Pega')
 assert.equal(matchesSearch(rows[0],corrected.query,columns),true)
 assert.match(interpretSearch('users without Pega',rows,columns).note,/not supported/)
 assert.equal(interpretSearch('Find me a unicorn',rows,columns).query,'unicorn')
})
test('only requested filter groups are exposed and multi-service chips match whole values',()=>{
 const {filterGroups,filterColumn,filterValues,matchesFilters}=tableData()
 assert.deepEqual(filterGroups.map(group=>group.key),['market','userType','serviceType','environment','role','accountId','serviceId'])
 const columns=[{key:'extraMarket',label:'Used in which market'},{key:'serviceType',label:'Service Type'}]
 assert.equal(filterColumn(columns,filterGroups[0]).key,'extraMarket')
 const rows=[{serviceType:'Mobile\nTV',extraMarket:'AL'}]
 assert.deepEqual(filterValues(rows,'serviceType'),['Mobile','TV'])
 assert.equal(matchesFilters(rows[0],{serviceType:'TV'},columns),true)
 assert.equal(matchesFilters(rows[0],{serviceType:'Mob'},columns),false)
})

function datasets() {
 const file=path.join(root,'src/services/datasets.ts');const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod=new Module(file);mod._compile(compiled,file);return mod.exports
}
test('union preserves arbitrary headers and values, fills absent values with real null, and keeps distinct row IDs',()=>{
 const {recordsToRows,harmonize,parseJsonRows}=datasets()
 const sources=[{id:'a',name:'Excel',rows:recordsToRows([{'MSISDN':'0001','Service':'Mobile','Credits':0}])},{id:'b',name:'JSON',rows:parseJsonRows('[{"Username":"0002","Market":"IE","Eligible":false}]')}]
 const rows=harmonize(sources)
 assert.equal(rows.length,2);assert.equal(rows[0].market,null);assert.equal(rows[1].serviceType,null);assert.equal(rows[0].field_credits,0);assert.equal(rows[1].field_eligible,false);assert.equal(rows[0].username,'0001');assert.notEqual(rows[0].id,rows[1].id)
 assert.equal(rows[0].columns.length,6);assert.equal(rows[1]._source,'JSON')
 assert.equal(harmonize(sources.slice(1))[0].columns.some(column=>column.key==='serviceType'),false)
 assert.throws(()=>recordsToRows([{'MSISDN':'001','Username':'002'}]),/same column/)
 assert.throws(()=>parseJsonRows('[1,2]'),/object/)
})
test('dynamic exact and null filters distinguish missing values and zero',()=>{
 const {matchesFilters}=tableData();const columns=[{key:'custom',label:'Custom'}]
 assert.equal(matchesFilters({custom:null},{custom:'__NULL__'},columns),true)
 assert.equal(matchesFilters({custom:0},{custom:'__NULL__'},columns),false)
 assert.equal(matchesFilters({custom:'A'},{custom:'=A'},columns),true)
 assert.equal(matchesFilters({custom:'AB'},{custom:'=A'},columns),false)
})
