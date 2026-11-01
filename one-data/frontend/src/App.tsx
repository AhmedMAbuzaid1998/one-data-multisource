import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SplashScreen from './components/SplashScreen'
import BrandMark from './components/BrandMark'
import DynamicFilters from './components/DynamicFilters'
import { tableColumns, matchesSearch, matchesFilters } from './services/tableData'
import UserTable from './components/UserTable'
import SmartSearch from './components/SmartSearch'
import TestDataRequest from './components/TestDataRequest'
import SourceManager from './components/SourceManager'
import { Dataset, harmonize } from './services/datasets'
import CopyFeedback from './components/CopyFeedback'
import StartupSignIn from './components/StartupSignIn'
import { fetchUsers, fetchStats, Filters, TestUser, ConfluenceState } from './services/api'

const EMPTY_ROWS: TestUser[] = []
const EMPTY_FILTERS: Filters = { market: '', environment: '', userType: '', role: '', paymentType: '', accountId: '', serviceId: '' }
function initialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('one-data-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage may be disabled by browser policy. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [theme, setTheme] = useState(initialTheme)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'directory' | 'request'>('directory')
  const [users, setUsers] = useState<TestUser[]>([])
  const [files, setFiles] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState<number | null>(null)
  const [connection, setConnection] = useState<'checking' | 'online' | 'offline'>('checking')
  const [confluence, setConfluence] = useState<ConfluenceState | null>(null)
  const desktop = Boolean(window.confluenceDesktop)
  const startupLogin = desktop && window.confluenceDesktop?.startupMode !== 'manual'
  const [workspaceOpen, setWorkspaceOpen] = useState(!startupLogin)
  const [signInPending, setSignInPending] = useState(false)
  const [signInError, setSignInError] = useState('')
  const automaticSignInStarted = useRef(false)
  const pageSources = useMemo<Dataset[]>(() => desktop ? confluence?.sources?.map(source => ({id:source.id,name:source.title || `Confluence ${source.id}`,rows:source.rows})) ?? [{id:'confluence',name:'Confluence',rows:confluence?.rows ?? EMPTY_ROWS}] : [{id:'main',name:'Main dataset',rows:users}], [desktop,confluence,users])
  const combined = useMemo(() => {try{return {rows:harmonize([...pageSources,...files]),error:''}}catch(error){return {rows:EMPTY_ROWS,error:error instanceof Error?error.message:'Sources could not be combined.'}}},[pageSources,files])
  const localUsers = combined.rows
  const requestId = useRef(0)
  const finishIntro = useCallback(() => setShowSplash(false), [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('one-data-theme', theme) } catch { /* Keep session theme. */ }
  }, [theme])

  const loadUsers = useCallback(async (f: Filters) => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers(f)
      if (id !== requestId.current) return
      setUsers(data)
      setConnection('online')
    } catch {
      if (id !== requestId.current) return
      setError('Unable to load test data')
      setConnection('offline')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const bridge = window.confluenceDesktop
    if (!bridge) { fetchStats().then(s => setTotal(s.total)).catch(() => {}); return }
    let disposed = false
    const receive = (state: ConfluenceState) => {
      if (disposed) return
      setConfluence(state)
      if (state.status === 'live') setWorkspaceOpen(true)
      if (state.status === 'signed-out' || state.status === 'denied') {
        setWorkspaceOpen(!startupLogin)
      }
      setConnection(state.status === 'live' ? 'online' : state.status === 'refreshing' ? 'checking' : 'offline')
    }
    const unsubscribe = bridge.onChange(receive)
    bridge.getState().then(receive).catch(() => setSignInError('Desktop connection unavailable. Restart the app.'))
    return () => { disposed = true; unsubscribe() }
  }, [])
  const requestSignIn = useCallback(async () => {
    setSignInPending(true)
    setSignInError('')
    try { await window.confluenceDesktop?.signIn() }
    catch { setSignInError('The sign-in window could not open. Try again.') }
    finally { setSignInPending(false) }
  }, [])
  useEffect(() => {
    if (startupLogin && !showSplash && confluence && !workspaceOpen && !automaticSignInStarted.current) {
      automaticSignInStarted.current = true
      void requestSignIn()
    }
  }, [startupLogin, showSplash, confluence, workspaceOpen, requestSignIn])
  async function openOfflineCopy() {
    setSignInPending(true)
    setSignInError('')
    try {
      const state = await window.confluenceDesktop?.useOffline()
      if (state?.rows.length && state.lastSuccess && state.status === 'cached') setWorkspaceOpen(true)
      else setSignInError('No saved copy is available. Please sign in.')
    } catch { setSignInError('The offline copy could not be opened. Please sign in.') }
    finally { setSignInPending(false) }
  }
  useEffect(() => {
    if (!desktop) loadUsers({})
    else { setLoading(false); setError('') }
    return () => { requestId.current++ }
  }, [loadUsers, desktop])
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const allRows = localUsers ?? users
  const columns = useMemo(() => tableColumns(allRows), [allRows])
  const sourceUsers = useMemo(() => allRows.filter(row => matchesFilters(row, filters, columns)), [allRows, filters, columns])
  const visibleUsers = useMemo(() => sourceUsers.filter(row => matchesSearch(row, search, columns)), [sourceUsers, search, columns])
  useEffect(() => {
    setFilters(current => Object.fromEntries(Object.entries(current).filter(([key]) => columns.some(column => column.key === key))))
  }, [columns])

  function removeFilter(key: keyof Filters) {
    const next = { ...filters, [key]: '' }
    setFilters(next)
  }

  return (
    <>
      <CopyFeedback />
      {showSplash && <SplashScreen onDone={finishIntro} />}
      {!showSplash && !workspaceOpen && <StartupSignIn state={confluence} error={signInError} pending={signInPending} onSignIn={requestSignIn} onOffline={openOfflineCopy} />}
      {!showSplash && workspaceOpen && <div id="app-shell" className="app-shell">
        <header id="topbar" className="topbar">
          <a id="brand-home" className="brand" href="#main" aria-label="One Data home"><BrandMark id="header-brand-mark" /><span id="brand-name">ne Data<span id="brand-period" className="brand-period">.</span></span></a>
          <span id="workspace-label" className="workspace-label">TEST DATA WORKSPACE</span>
          <nav id="primary-nav" className="primary-nav" aria-label="Main navigation">
            <button id="nav-directory" className={view === 'directory' ? 'active' : ''} aria-current={view === 'directory' ? 'page' : undefined} onClick={() => setView('directory')}>Data directory</button>
            <button id="nav-request" className={view === 'request' ? 'active' : ''} aria-current={view === 'request' ? 'page' : undefined} onClick={() => setView('request')}>Request builder</button>
          </nav>
          <div id="header-actions" className="header-actions">
            <span id="connection-status" className={`connection ${connection}`}><i id="connection-indicator" />{connection === 'online' ? 'Connected' : connection === 'offline' ? 'Offline' : 'Connecting'}</span>
            <button id="theme-toggle" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}><span id="theme-icon" aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span><span id="theme-label">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span></button>
          </div>
        </header>
        <main id="main">
          <section id="hero-banner" className="hero">
            <div id="hero-copy" className="hero-copy"><p id="hero-kicker" className="eyebrow">ONE PLATFORM. YOUR TEST DATA.</p><h1 id="hero-title">Less searching.<br id="hero-title-break" /><strong id="hero-title-emphasis">More testing.</strong></h1><p id="hero-description">Find the right users for your next test.<br id="hero-description-break" />All your markets and environments, in one place.</p></div>
            <div id="hero-stat" className="hero-stat"><span id="hero-total" className="stat-number">{localUsers?.length ?? total ?? '—'}<span id="hero-total-arrow">↗</span></span><span id="hero-total-label">users across your sources</span><div id="hero-stat-rule" className="stat-rule" /><span id="hero-stat-note" className="stat-note">{files.length + pageSources.filter(source=>source.rows.length).length} active sources</span></div>
            <span id="hero-ring" className="hero-ring" aria-hidden="true" />
          </section>
          {view === 'directory' ? <section id="directory-view">
            <div id="directory-heading" className="section-heading"><div id="directory-heading-copy"><p id="directory-kicker" className="eyebrow">EXPLORE YOUR DATA</p><h2 id="directory-title">Test user directory</h2></div><button id="replay-intro" className="text-button" onClick={() => setShowSplash(true)}>Replay intro ↗</button></div>
            <SourceManager state={confluence} files={files} onAdd={sources=>setFiles(current=>[...current,...sources])} onRemove={id=>setFiles(current=>current.filter(source=>source.id!==id))} />
            <div id="directory-layout" className="directory-layout">
              <DynamicFilters rows={allRows} columns={columns} filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />
              <section id="results-card" className="results-card" aria-label="Test user results" aria-busy={loading}>
                <div id="results-toolbar" className="results-toolbar">
                  <div id="results-summary"><h3 id="results-title">Available users <span id="results-count" className="count-pill">{loading ? '…' : visibleUsers.length}</span></h3><p id="results-description">{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'} · Combined sources` : `Browsing the combined table.`}</p></div>
                  <div id="results-actions" className="results-actions"><label id="quick-search-label" className="quick-search"><span id="quick-search-icon" aria-hidden="true">⌕</span><input id="quick-search-input" type="search" placeholder="Search any table value…" aria-label="Search current results" value={search} onChange={e => setSearch(e.target.value)} />{search && <button id="quick-search-clear" type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label><button id="results-refresh" className="refresh-button" onClick={() => { if (desktop) window.confluenceDesktop?.refresh().catch(() => setError('Refresh failed')); else loadUsers({}) }} disabled={loading || confluence?.status === 'refreshing'}>↻ Refresh</button></div>
                </div>
                <SmartSearch query={search} onQuery={setSearch} rows={allRows} columns={columns} />
                {activeFilterCount > 0 && <div id="active-filters" className="active-filters" aria-label="Active filters"><span id="active-filters-label">Filtered by</span>{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <button id={`active-filter-${key}`} type="button" key={key} onClick={() => removeFilter(key as keyof Filters)}>{columns.find(column => column.key === key)?.sensitive ? '••••••••' : value === '__NULL__' ? 'null' : value?.replace(/^=/,'')}<span id={`active-filter-${key}-remove`} aria-hidden="true">×</span></button>)}<button id="active-filters-clear" className="clear-inline" type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Clear all</button></div>}
                <UserTable columns={columns} users={visibleUsers} loading={loading} error={combined.error || error} tokenEnabled={false} />
              </section>
            </div>
          </section> : <TestDataRequest />}
          <footer id="app-footer"><span id="footer-message">One Data <span id="footer-divider" className="footer-dot">/</span> Built for better testing.</span><span id="footer-product">Test Data Portal</span></footer>
        </main>
      </div>}
    </>
  )
}
