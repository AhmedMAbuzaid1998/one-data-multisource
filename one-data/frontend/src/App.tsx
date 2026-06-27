import { useState, useEffect, useCallback } from 'react'
import SplashScreen from './components/SplashScreen'
import FilterPanel from './components/FilterPanel'
import UserTable from './components/UserTable'
import { fetchUsers, fetchStats, Filters, TestUser } from './services/api'

const EMPTY_FILTERS: Filters = {
  market: '', environment: '', userType: '',
  role: '', paymentType: '', accountId: '', serviceId: '',
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [filters, setFilters]       = useState<Filters>(EMPTY_FILTERS)
  const [users, setUsers]           = useState<TestUser[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [total, setTotal]           = useState<number>(0)
  const [backendOk, setBackendOk]   = useState(true)

  const loadUsers = useCallback(async (f: Filters) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers(f)
      setUsers(data)
      setBackendOk(true)
    } catch {
      setError('Backend offline')
      setBackendOk(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load stats once on mount
  useEffect(() => {
    fetchStats().then(s => setTotal(s.total)).catch(() => {})
  }, [])

  // Reload users when filters change
  useEffect(() => {
    if (!showSplash) loadUsers(filters)
  }, [filters, showSplash, loadUsers])

  function handleFiltersChange(f: Filters) {
    setFilters(f)
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {!showSplash && (
        <div style={styles.app}>

          {/* Top navbar */}
          <header style={styles.navbar}>
            <div style={styles.navLeft}>
              {/* One Data logo inline */}
              <div style={styles.navLogo}>
                <svg width="28" height="28" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="60" fill="#E60000"/>
                  <path d="M60 20C38 20 20 38 20 60C20 75 28 88 40 95L55 65C50 62 47 57 47 51C47 42 53 35 62 35C71 35 77 42 77 51C77 62 69 71 58 73L45 103C50 104 55 105 60 105C82 105 100 87 100 60C100 38 82 20 60 20Z" fill="white"/>
                </svg>
                <span style={styles.navBrand}>ne Data</span>
              </div>
              <span style={styles.navDivider}>|</span>
              <span style={styles.navSub}>Test Data Portal</span>
            </div>

            <div style={styles.navRight}>
              <div style={{ ...styles.statusDot, background: backendOk ? '#10b981' : '#ef4444' }} />
              <span style={styles.statusText}>{backendOk ? 'Backend connected' : 'Backend offline'}</span>
              <span style={styles.totalBadge}>{total} total users</span>
            </div>
          </header>

          <div style={styles.body}>
            {/* Sidebar filters */}
            <FilterPanel
              filters={filters}
              onChange={handleFiltersChange}
              onReset={handleReset}
            />

            {/* Main content */}
            <div style={styles.main}>

              {/* Results bar */}
              <div style={styles.resultsBar}>
                <div style={styles.resultsLeft}>
                  <span style={styles.resultsCount}>
                    {loading ? 'Loading…' : `${users.length} result${users.length !== 1 ? 's' : ''}`}
                  </span>
                  {activeFilterCount > 0 && (
                    <span style={styles.filterBadge}>
                      {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button style={styles.clearBtn} onClick={handleReset}>
                    ✕ Clear filters
                  </button>
                )}
              </div>

              {/* Table */}
              <div style={styles.tableContainer}>
                <UserTable users={users} loading={loading} error={error} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
    background: '#f5f5f5',
  },
  navbar: {
    height: 52, background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px', flexShrink: 0,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 2 },
  navBrand: { fontSize: 20, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' },
  navDivider: { color: '#e5e7eb', fontSize: 18, margin: '0 4px' },
  navSub: { fontSize: 12, color: '#9ca3af', fontWeight: 400 },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  statusText: { fontSize: 12, color: '#6b7280' },
  totalBadge: {
    fontSize: 11, background: '#f3f4f6',
    color: '#6b7280', padding: '3px 10px',
    borderRadius: 20, fontWeight: 500,
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  main: {
    flex: 1, display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
  },
  resultsBar: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  resultsLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  resultsCount: { fontSize: 13, fontWeight: 500, color: '#374151' },
  filterBadge: {
    fontSize: 11, background: '#fef3c7',
    color: '#92400e', padding: '2px 8px',
    borderRadius: 20,
  },
  clearBtn: {
    fontSize: 12, color: '#E60000',
    background: 'none', border: 'none',
    cursor: 'pointer',
  },
  tableContainer: {
    flex: 1, overflow: 'auto',
    background: '#fff',
  },
}
