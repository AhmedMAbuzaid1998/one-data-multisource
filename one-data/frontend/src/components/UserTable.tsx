import { useEffect, useMemo, useState } from 'react'
import { TestUser, DataColumn } from '../services/api'
import TokenButton from './TokenButton'
import { copyText } from './CopyFeedback'

interface Props { users: TestUser[]; loading: boolean; error: string; tokenEnabled?: boolean; columns?: DataColumn[] }
type SortKey = string
type Column = { key: SortKey | 'password'; label: string }
const PAGE_SIZES = [10, 25, 50]
// Keep the token UI available in code for a later release.
const SHOW_TOKEN_GENERATION = false
const COLUMNS: Column[] = [
  { key: 'username', label: 'Username' }, { key: 'market', label: 'Market' },
  { key: 'environment', label: 'Environment' }, { key: 'userType', label: 'User type' },
  { key: 'role', label: 'Role' }, { key: 'paymentType', label: 'Payment' },
  { key: 'accountId', label: 'Account ID' }, { key: 'serviceId', label: 'Service ID' },
]
const CONFLUENCE_COLUMNS: Column[] = [
  { key: 'username', label: 'Username / MSISDN' }, { key: 'password', label: 'Password' },
  { key: 'userType', label: 'User type' }, { key: 'serviceType', label: 'Service type' },
  { key: 'journey', label: 'Used in which journey' }, { key: 'market', label: 'Market' },
  { key: 'environment', label: 'Environment' },
]
function Badge({ id, text, kind }: { id: string; text: string; kind: string }) {
  return <span id={id} className={`data-badge ${kind}-${text.toLowerCase().replace(/ /g, '-')}`}>{text || '—'}</span>
}

export default function UserTable({ users, loading, error, tokenEnabled = true, columns: suppliedColumns }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('username')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const confluenceColumns = users.some(user => 'journey' in user)
  const columns: DataColumn[] = suppliedColumns ?? (confluenceColumns ? [...CONFLUENCE_COLUMNS, ...COLUMNS.filter(column =>
    !CONFLUENCE_COLUMNS.some(item => item.key === column.key) && users.some(user => user[column.key]))] : COLUMNS)
  const sorted = useMemo(() => [...users].sort((a, b) => {
    const result = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true })
    return direction === 'asc' ? result : -result
  }), [users, sortKey, direction])
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [users, pageSize])

  function sortBy(key: SortKey) {
    if (sortKey === key) setDirection(current => current === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setDirection('asc') }
    setPage(1)
  }
  function value(user: TestUser, key: string, sensitive?: boolean) {
    const id = `user-${user.id}-${key}`
    if (user[key] == null) return <span id={id} className="null-cell">null</span>
    if (key === 'username') return <div id={id} className="primary-cell"><span id={`${id}-avatar`} className="user-avatar">{String(user.username || '').slice(0, 2).toUpperCase()}</span><span id={`${id}-value`}>{user.username}</span></div>
    if (key === 'password' || /^pass(word)?$/i.test(columns.find(column => column.key === key)?.label.trim() || '')) return <span id={`${id}-value`} className="mono-cell password-text">{String(user[key] ?? '—')}</span>
    if (sensitive) return <span id={`${id}-value`} className="mono-cell">{user[key] ? '••••••••' : '—'}</span>
    if (['market', 'environment', 'userType', 'paymentType'].includes(key)) return <Badge id={id} text={String(user[key] || '')} kind={key} />
    return <span id={id}>{String(user[key] ?? '—')}</span>
  }

  if (error) return <div id="table-error" className="table-state"><span id="table-error-icon" className="state-icon">!</span><h3 id="table-error-title">We couldn't load the data</h3><p id="table-error-description">{error}</p></div>
  if (loading) return <div id="table-loading" className="table-state"><span id="table-loading-spinner" className="table-spinner" /><h3 id="table-loading-title">Loading test users</h3><p id="table-loading-description">This should only take a moment.</p></div>
  if (!users.length) return <div id="table-empty" className="table-state"><span id="table-empty-icon" className="state-icon">⌕</span><h3 id="table-empty-title">No matching users</h3><p id="table-empty-description">Check your data source, remove a filter or try a different search.</p></div>

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, sorted.length)
  return <>
    <div id="table-scroll" className="table-scroll"><table id="user-table" className="user-table">
      <thead id="user-table-head"><tr id="user-table-header-row">{columns.map(column => <th id={`user-table-header-${column.key}`} key={column.key} aria-sort={(column.key === 'password' || column.sensitive) ? undefined : sortKey === column.key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>{(column.key === 'password' || column.sensitive) ? column.label : <button id={`user-table-sort-${column.key}`} type="button" onClick={() => sortBy(column.key as SortKey)}>{column.label}<span id={`user-table-sort-icon-${column.key}`} className="sort-icon" aria-hidden="true">{sortKey === column.key ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span></button>}</th>)}{SHOW_TOKEN_GENERATION && <th id="user-table-header-token"><span id="user-table-token-label" className="token-heading">Token</span></th>}</tr></thead>
      <tbody id="user-table-body">{visible.map(user => <tr id={`user-row-${user.id}`} key={user.id}>
        {columns.map(column => <td id={`user-${user.id}-${column.key}-cell`} key={column.key} className={['journey', 'serviceType'].includes(column.key) ? 'confluence-long-cell' : ['accountId', 'serviceId'].includes(column.key) ? 'mono-cell' : ''}><div id={`user-${user.id}-${column.key}-content`} className="copyable-cell">{value(user, column.key, column.sensitive)}{(!column.sensitive || column.key==='password')&&<button id={`copy-${user.id}-${column.key}`} className="cell-copy" title={`Copy ${column.label}`} aria-label={`Copy ${column.label} from row ${user.id}`} onClick={()=>void copyText(user[column.key]==null?'null':String(user[column.key]))}>⧉</button>}</div></td>)}
        {SHOW_TOKEN_GENERATION && <td id={`user-${user.id}-token-cell`}>{tokenEnabled ? <TokenButton userId={user.id} username={user.username} /> : <span id={`token-personal-${user.id}`} className="personal-token-note">Main data only</span>}</td>}
      </tr>)}</tbody>
    </table></div>
    <div id="table-footer" className="table-footer"><span id="table-range">Showing <strong id="table-range-visible">{start}–{end}</strong> of <strong id="table-range-total">{sorted.length}</strong></span><div id="page-controls" className="page-controls"><label id="page-size-label" htmlFor="page-size">Rows <select id="page-size" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{PAGE_SIZES.map(size => <option id={`page-size-${size}`} key={size}>{size}</option>)}</select></label><button id="page-previous" type="button" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Previous page">←</button><span id="page-indicator">{page} / {pageCount}</span><button id="page-next" type="button" onClick={() => setPage(p => p + 1)} disabled={page === pageCount} aria-label="Next page">→</button></div></div>
  </>
}
