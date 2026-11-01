const { parseFragment } = require('parse5')

const aliases = {
  username: ['username', 'usernamemsisdn', 'msisdn', 'user'],
  password: ['pass', 'password'],
  userType: ['usertype'],
  serviceType: ['servicetype', 'servicetypes'],
  journey: ['usedinwhichjourney', 'journey', 'journeys', 'testscenario'],
  market: ['market', 'country'], environment: ['environment', 'env'],
  role: ['role', 'businessrole'], paymentType: ['paymenttype', 'payment'],
  accountId: ['accountid'], serviceId: ['serviceid']
}
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '')
function text(node) {
  if (node.nodeName === '#text') return node.value
  if (['script', 'style', 'iframe'].includes(node.tagName)) return ''
  if (node.tagName === 'br') return '\n'
  const result = (node.childNodes || []).map(text).join('')
  return result + (['p', 'div', 'li'].includes(node.tagName) ? '\n' : '')
}
function descendants(node, tag, stopAtTable = false) {
  return (node.childNodes || []).flatMap(child => child.tagName === tag ? [child] :
    stopAtTable && child.tagName === 'table' ? [] : descendants(child, tag, stopAtTable))
}
function span(cell, name) {
  return Math.min(100, Math.max(1, Number(cell.attrs?.find(attr => attr.name === name)?.value) || 1))
}
function grid(table) {
  const rows = []
  const carried = []
  for (const tr of descendants(table, 'tr', true)) {
    const row = []
    carried.forEach((entry, column) => {
      if (entry?.remaining > 0) { row[column] = entry.value; entry.remaining-- }
    })
    let column = 0
    for (const cell of tr.childNodes.filter(node => ['td', 'th'].includes(node.tagName))) {
      while (row[column] !== undefined) column++
      const value = text(cell).replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()
      for (let count = 0; count < span(cell, 'colspan'); count++) {
        row[column] = value
        carried[column] = { value, remaining: span(cell, 'rowspan') - 1 }
        column++
      }
    }
    rows.push(row)
    if (rows.length > 10000) throw new Error('The page contains too many table rows (maximum 10,000).')
  }
  return rows
}

function parseConfluenceTable(html) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 5 * 1024 * 1024) throw new Error('The page content is missing or too large.')
  const records = []
  for (const table of descendants(parseFragment(html), 'table')) {
    let mapping, originalHeaders
    for (const cells of grid(table)) {
      const candidate = cells.map(value => Object.keys(aliases).find(key => aliases[key].includes(normalize(value || ''))))
      // The first nonempty header row defines each table, including unknown columns.
      if ((!mapping && cells.filter(value => value?.trim()).length >= 2) || (mapping && cells.length === originalHeaders.length && cells.every((value, index) => normalize(value || '') === normalize(originalHeaders[index] || '')))) {
        originalHeaders = cells
        const used = new Set()
        const labels = new Map()
        mapping = cells.map((label, index) => {
          let key = candidate[index] || `extra_${Buffer.from(label || `Column ${index + 1}`).toString('hex')}`
          if (used.has(key)) key = `${key}_${index}`
          used.add(key)
          const count = (labels.get(label) || 0) + 1; labels.set(label, count)
          return { key, label: count > 1 ? `${label} (${count})` : label || `Column ${index + 1}`, sensitive: candidate[index] === 'password' || /password|secret|token|credential/i.test(label) }
        })
        continue
      }
      if (!mapping || cells.every(cell => !cell)) continue
      const record = Object.fromEntries(Object.keys(aliases).map(key => [key, '']))
      mapping.forEach(({ key }, index) => { record[key] = (cells[index] || '').trim() })
      records.push({ id: records.length + 1, ...record, columns: mapping })
      if (records.length > 10000) throw new Error('The page contains too many users (maximum 10,000).')
    }
  }
  if (!records.length) throw new Error('No usable table found. Use a header row with at least two named columns and a data row. The previous copy was kept.')
  return records
}
module.exports = { parseConfluenceTable }
