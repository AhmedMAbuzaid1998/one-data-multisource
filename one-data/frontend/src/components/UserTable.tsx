import { TestUser } from '../services/api'
import TokenButton from './TokenButton'

interface Props {
  users: TestUser[]
  loading: boolean
  error: string
}

const marketColors: Record<string, { bg: string; color: string }> = {
  IE: { bg: '#dbeafe', color: '#1d4ed8' },
  AL: { bg: '#dcfce7', color: '#166534' },
  PT: { bg: '#ede9fe', color: '#6d28d9' },
}
const envColors: Record<string, { bg: string; color: string }> = {
  QA:    { bg: '#d1fae5', color: '#065f46' },
  STAGE: { bg: '#fef3c7', color: '#92400e' },
  PROD:  { bg: '#fee2e2', color: '#991b1b' },
}
const typeColors: Record<string, { bg: string; color: string }> = {
  Consumer: { bg: '#fce7f3', color: '#9d174d' },
  Business: { bg: '#f1f5f9', color: '#475569' },
}
const payColors: Record<string, { bg: string; color: string }> = {
  'Post Paid':  { bg: '#d1fae5', color: '#065f46' },
  'Pre Paid':   { bg: '#dbeafe', color: '#1e3a8a' },
  'Converged':  { bg: '#ede9fe', color: '#6b21a8' },
}

function Badge({ text, colorMap }: { text: string; colorMap: Record<string, { bg: string; color: string }> }) {
  const c = colorMap[text] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  )
}

export default function UserTable({ users, loading, error }: Props) {
  if (error) {
    return (
      <div style={styles.stateBox}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>Cannot reach backend</p>
        <p style={styles.errorSub}>Make sure Spring Boot is running on port 8080</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.stateBox}>
        <div style={styles.loadingSpinner}>⟳</div>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading users…</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div style={styles.stateBox}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
        <p style={{ color: '#374151', fontWeight: 500 }}>No users found</p>
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div style={styles.tableWrap}>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Market</th>
              <th style={styles.th}>Environment</th>
              <th style={styles.th}>User Type</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Account ID</th>
              <th style={styles.th}>Service ID</th>
              <th style={styles.th}>Token</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{user.username}</td>
                <td style={styles.td}><Badge text={user.market} colorMap={marketColors} /></td>
                <td style={styles.td}><Badge text={user.environment} colorMap={envColors} /></td>
                <td style={styles.td}><Badge text={user.userType} colorMap={typeColors} /></td>
                <td style={{ ...styles.td, color: user.role === 'N/A' ? '#d1d5db' : '#374151', fontSize: 12 }}>
                  {user.role}
                </td>
                <td style={styles.td}><Badge text={user.paymentType} colorMap={payColors} /></td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{user.accountId}</td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{user.serviceId}</td>
                <td style={styles.td}>
                  <TokenButton userId={user.id} username={user.username} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tableWrap: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:     { background: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 },
  th: {
    padding: '10px 14px', textAlign: 'left',
    fontSize: 11, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  td: { padding: '11px 14px', verticalAlign: 'middle' },
  stateBox: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 60, color: '#6b7280',
  },
  errorIcon:    { fontSize: 36, marginBottom: 12 },
  errorText:    { fontSize: 15, fontWeight: 500, color: '#dc2626', marginBottom: 4 },
  errorSub:     { fontSize: 12, color: '#9ca3af' },
  loadingSpinner: {
    fontSize: 32, color: '#E60000', marginBottom: 12,
    animation: 'spin 1s linear infinite',
  },
}
