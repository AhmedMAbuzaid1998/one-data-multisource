import { Filters } from '../services/api'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
}

const MARKETS      = ['IE', 'AL', 'PT']
const ENVIRONMENTS = ['QA', 'STAGE', 'PROD']
const USER_TYPES   = ['Consumer', 'Business']
const ROLES        = ['Chooser', 'User']
const PAYMENT_TYPES = ['Post Paid', 'Pre Paid', 'Converged']

export default function FilterPanel({ filters, onChange, onReset }: Props) {

  function toggleChip(key: keyof Filters, value: string) {
    const current = filters[key]
    const next = current === value ? '' : value

    // If switching away from Business, clear role
    if (key === 'userType' && next !== 'Business') {
      onChange({ ...filters, [key]: next, role: '' })
    } else {
      onChange({ ...filters, [key]: next })
    }
  }

  function handleText(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const hasFilters = Object.values(filters).some(v => v && v !== '')

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>Filters</span>
        {hasFilters && (
          <button style={styles.resetBtn} onClick={onReset}>
            Clear all
          </button>
        )}
      </div>

      {/* Market */}
      <FilterGroup label="Market">
        <ChipRow
          options={MARKETS}
          selected={filters.market || ''}
          onToggle={v => toggleChip('market', v)}
          colorMap={{ IE: '#1a6fb5', AL: '#2d8c4e', PT: '#7b3fa0' }}
        />
      </FilterGroup>

      {/* Environment */}
      <FilterGroup label="Environment">
        <ChipRow
          options={ENVIRONMENTS}
          selected={filters.environment || ''}
          onToggle={v => toggleChip('environment', v)}
          colorMap={{ QA: '#0f6e56', STAGE: '#92400e', PROD: '#a32d2d' }}
        />
      </FilterGroup>

      {/* User Type */}
      <FilterGroup label="User Type">
        <ChipRow
          options={USER_TYPES}
          selected={filters.userType || ''}
          onToggle={v => toggleChip('userType', v)}
          colorMap={{ Consumer: '#9d174d', Business: '#374151' }}
        />
      </FilterGroup>

      {/* Role — only shown when Business is selected */}
      {filters.userType === 'Business' && (
        <FilterGroup label="Role" isSubFilter>
          <ChipRow
            options={ROLES}
            selected={filters.role || ''}
            onToggle={v => toggleChip('role', v)}
            colorMap={{ Chooser: '#1a6fb5', User: '#374151' }}
          />
        </FilterGroup>
      )}

      {/* Payment Type */}
      <FilterGroup label="Payment Type">
        <ChipRow
          options={PAYMENT_TYPES}
          selected={filters.paymentType || ''}
          onToggle={v => toggleChip('paymentType', v)}
          colorMap={{ 'Post Paid': '#065f46', 'Pre Paid': '#1e3a8a', 'Converged': '#6b21a8' }}
        />
      </FilterGroup>

      {/* Account ID */}
      <FilterGroup label="Account ID">
        <input
          style={styles.textInput}
          type="text"
          placeholder="e.g. ACC-01000"
          value={filters.accountId || ''}
          onChange={e => handleText('accountId', e.target.value)}
        />
      </FilterGroup>

      {/* Service ID */}
      <FilterGroup label="Service ID">
        <input
          style={styles.textInput}
          type="text"
          placeholder="e.g. SVC-05000"
          value={filters.serviceId || ''}
          onChange={e => handleText('serviceId', e.target.value)}
        />
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ label, children, isSubFilter }: {
  label: string; children: React.ReactNode; isSubFilter?: boolean
}) {
  return (
    <div style={{ ...styles.group, marginLeft: isSubFilter ? 12 : 0 }}>
      {isSubFilter && <div style={styles.subArrow}>↳</div>}
      <div style={styles.groupLabel}>{label}</div>
      {children}
    </div>
  )
}

function ChipRow({ options, selected, onToggle, colorMap }: {
  options: string[]
  selected: string
  onToggle: (v: string) => void
  colorMap: Record<string, string>
}) {
  return (
    <div style={styles.chipRow}>
      {options.map(opt => {
        const isActive = selected === opt
        const color = colorMap[opt] || '#374151'
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              ...styles.chip,
              background: isActive ? color : 'transparent',
              color: isActive ? '#fff' : '#555',
              borderColor: isActive ? color : '#d1d5db',
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 220, minWidth: 220,
    background: '#fff',
    borderRight: '1px solid #e5e7eb',
    padding: '20px 16px',
    display: 'flex', flexDirection: 'column', gap: 0,
    overflowY: 'auto',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.8px',
    color: '#9ca3af',
  },
  resetBtn: {
    fontSize: 11, color: '#E60000',
    background: 'none', border: 'none',
    cursor: 'pointer', padding: 0,
  },
  group: {
    marginBottom: 18,
  },
  groupLabel: {
    fontSize: 12, fontWeight: 500,
    color: '#374151', marginBottom: 8,
  },
  subArrow: {
    fontSize: 12, color: '#9ca3af', marginBottom: 2,
  },
  chipRow: {
    display: 'flex', flexWrap: 'wrap', gap: 6,
  },
  chip: {
    fontSize: 12, padding: '4px 11px',
    borderRadius: 20, border: '1px solid',
    cursor: 'pointer', transition: 'all 0.15s',
    lineHeight: 1.4,
  },
  textInput: {
    width: '100%', padding: '7px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 6, fontSize: 12,
    background: '#fafafa', outline: 'none',
    color: '#1a1a1a',
  },
}
