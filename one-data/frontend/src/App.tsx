import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SplashScreen from './components/SplashScreen'
import BrandMark from './components/BrandMark'
import FilterPanel, { FilterOptions } from './components/FilterPanel'
import UserTable from './components/UserTable'
import SmartSearch from './components/SmartSearch'
import TestDataRequest from './components/TestDataRequest'
import DatasetUpload from './components/DatasetUpload'
import { fetchUsers, fetchStats, Filters, TestUser } from './services/api'

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
  const [personalUsers, setPersonalUsers] = useState<TestUser[] | null>(null)
  const [personalFileName, setPersonalFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState<number | null>(null)
  const [connection, setConnection] = useState<'checking' | 'online' | 'offline'>('checking')
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
  useEffect(() => { fetchStats().then(s => setTotal(s.total)).catch(() => {}) }, [])
  useEffect(() => {
    if (personalUsers === null) loadUsers(filters)
    else { setLoading(false); setError('') }
    return () => { requestId.current++ }
  }, [filters, loadUsers, personalUsers])
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const sourceUsers = useMemo(() => {
    if (personalUsers === null) return users
    const same = (actual: string, expected?: string) => !expected || actual.toLowerCase() === expected.toLowerCase()
    const includes = (actual: string, expected?: string) => !expected || actual.toLowerCase().includes(expected.toLowerCase())
    return personalUsers.filter(user =>
      same(user.market, filters.market) && same(user.environment, filters.environment) &&
      same(user.userType, filters.userType) && same(user.role, filters.role) &&
      same(user.paymentType, filters.paymentType) && includes(user.accountId, filters.accountId) &&
      includes(user.serviceId, filters.serviceId)
    )
  }, [users, personalUsers, filters])
  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sourceUsers
    return sourceUsers.filter(user => Object.entries(user).some(([key, value]) => key !== 'id' && String(value).toLowerCase().includes(query)))
  }, [sourceUsers, search])
  const personalFilterOptions = useMemo<FilterOptions | undefined>(() => {
    if (personalUsers === null) return undefined
    const unique = (key: keyof TestUser) => Array.from(new Set(personalUsers.map(user => String(user[key]).trim()).filter(Boolean)))
    return {
      market: unique('market'), environment: unique('environment'), userType: unique('userType'),
      role: unique('role').filter(role => role.toUpperCase() !== 'N/A'), paymentType: unique('paymentType'),
    }
  }, [personalUsers])

  function removeFilter(key: keyof Filters) {
    const next = { ...filters, [key]: '' }
    if (key === 'userType') next.role = ''
    setFilters(next)
  }

  function applySmartSearch(parsed: Filters) {
    setFilters({ ...EMPTY_FILTERS, ...parsed })
    setSearch('')
  }

  function usePersonalData(importedUsers: TestUser[], fileName: string) {
    requestId.current++
    setPersonalUsers(importedUsers)
    setPersonalFileName(fileName)
    setFilters(EMPTY_FILTERS)
    setSearch('')
    setLoading(false)
    setError('')
  }

  function useMainData() {
    setPersonalUsers(null)
    setPersonalFileName(null)
    setFilters(EMPTY_FILTERS)
    setSearch('')
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={finishIntro} />}
      {!showSplash && <div id="app-shell" className="app-shell">
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
            <div id="hero-stat" className="hero-stat"><span id="hero-total" className="stat-number">{personalUsers?.length ?? total ?? '—'}<span id="hero-total-arrow">↗</span></span><span id="hero-total-label">{personalUsers ? 'users in your personal file' : 'test users in your workspace'}</span><div id="hero-stat-rule" className="stat-rule" /><span id="hero-stat-note" className="stat-note">{personalUsers ? 'Personal dataset active' : 'Ready for your next scenario'}</span></div>
            <span id="hero-ring" className="hero-ring" aria-hidden="true" />
          </section>
          {view === 'directory' ? <section id="directory-view">
            <div id="directory-heading" className="section-heading"><div id="directory-heading-copy"><p id="directory-kicker" className="eyebrow">EXPLORE YOUR DATA</p><h2 id="directory-title">Test user directory</h2></div><button id="replay-intro" className="text-button" onClick={() => setShowSplash(true)}>Replay intro ↗</button></div>
            <SmartSearch onApply={applySmartSearch} />
            <DatasetUpload personalFileName={personalFileName} personalRowCount={personalUsers?.length || 0} onLoaded={usePersonalData} onUseMain={useMainData} />
            <div id="directory-layout" className="directory-layout">
              <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} options={personalFilterOptions} />
              <section id="results-card" className="results-card" aria-label="Test user results" aria-busy={loading}>
                <div id="results-toolbar" className="results-toolbar">
                  <div id="results-summary"><h3 id="results-title">Available users <span id="results-count" className="count-pill">{loading ? '…' : visibleUsers.length}</span></h3><p id="results-description">{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'} · ${personalUsers ? 'Personal file' : 'Main data'}` : `Browsing ${personalUsers ? 'your personal file' : 'the main team data'}.`}</p></div>
                  <div id="results-actions" className="results-actions"><label id="quick-search-label" className="quick-search"><span id="quick-search-icon" aria-hidden="true">⌕</span><input id="quick-search-input" type="search" placeholder="Search users, IDs, roles…" aria-label="Search current results" value={search} onChange={e => setSearch(e.target.value)} />{search && <button id="quick-search-clear" type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label><button id="results-refresh" className="refresh-button" onClick={() => loadUsers(filters)} disabled={loading}>↻ Refresh</button></div>
                </div>
                {activeFilterCount > 0 && <div id="active-filters" className="active-filters" aria-label="Active filters"><span id="active-filters-label">Filtered by</span>{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <button id={`active-filter-${key}`} type="button" key={key} onClick={() => removeFilter(key as keyof Filters)}>{value}<span id={`active-filter-${key}-remove`} aria-hidden="true">×</span></button>)}<button id="active-filters-clear" className="clear-inline" type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Clear all</button></div>}
                <UserTable users={visibleUsers} loading={loading} error={error} tokenEnabled={personalUsers === null} />
              </section>
            </div>
          </section> : <TestDataRequest />}
          <footer id="app-footer"><span id="footer-message">One Data <span id="footer-divider" className="footer-dot">/</span> Built for better testing.</span><span id="footer-product">Test Data Portal</span></footer>
        </main>
      </div>}
    </>
  )
}
