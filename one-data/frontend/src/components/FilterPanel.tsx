import { Filters } from '../services/api'

export interface FilterOptions {
  market?: string[]
  environment?: string[]
  userType?: string[]
  role?: string[]
  paymentType?: string[]
}

interface Props { filters: Filters; onChange: (filters: Filters) => void; onReset: () => void; options?: FilterOptions }

const GROUPS: Array<{ key: keyof Filters; label: string; options: string[] }> = [
  { key: 'market', label: 'Market', options: ['IE', 'AL', 'PT'] },
  { key: 'environment', label: 'Environment', options: ['QA', 'STAGE', 'PROD'] },
  { key: 'userType', label: 'User type', options: ['Consumer', 'Business'] },
  { key: 'paymentType', label: 'Payment type', options: ['Post Paid', 'Pre Paid', 'Converged'] },
]

export default function FilterPanel({ filters, onChange, onReset, options }: Props) {
  const activeCount = Object.values(filters).filter(Boolean).length
  function toggle(key: keyof Filters, value: string) {
    const nextValue = filters[key] === value ? '' : value
    const next = { ...filters, [key]: nextValue }
    if (key === 'userType' && nextValue !== 'Business') next.role = ''
    onChange(next)
  }

  return <aside id="filter-panel" className="filter-panel" aria-label="Filter test users">
    <div id="filter-header" className="filter-header"><div id="filter-heading"><span id="filter-kicker" className="filter-kicker">FILTERS</span><h3 id="filter-title">Refine results</h3></div>{activeCount > 0 && <span id="filter-active-count" className="active-count">{activeCount}</span>}</div>
    <p id="filter-help" className="filter-help">Select one option in each category.</p>
    {GROUPS.map(group => <fieldset id={`filter-group-${group.key}`} className="filter-group" key={group.key}>
      <legend id={`filter-legend-${group.key}`}>{group.label}</legend><div id={`filter-options-${group.key}`} className="filter-options">{(options?.[group.key as keyof FilterOptions] || group.options).map(option => {
        const selected = filters[group.key] === option
        const optionId = option.toLowerCase().replace(/ /g, '-')
        return <button id={`filter-${group.key}-${optionId}`} type="button" className={`filter-chip${selected ? ' selected' : ''}`} aria-pressed={selected} key={option} onClick={() => toggle(group.key, option)}><span id={`filter-${group.key}-${optionId}-label`}>{option}</span>{selected && <span id={`filter-${group.key}-${optionId}-check`} aria-hidden="true">✓</span>}</button>
      })}</div>
    </fieldset>)}
    {filters.userType === 'Business' && <fieldset id="filter-group-role" className="filter-group nested-filter"><legend id="filter-legend-role">Business role</legend><div id="filter-options-role" className="filter-options">{(options?.role || ['Chooser', 'User']).map(role => {
      const selected = filters.role === role
      const roleId = role.toLowerCase()
      return <button id={`filter-role-${roleId}`} type="button" className={`filter-chip${selected ? ' selected' : ''}`} aria-pressed={selected} key={role} onClick={() => toggle('role', role)}><span id={`filter-role-${roleId}-label`}>{role}</span>{selected && <span id={`filter-role-${roleId}-check`} aria-hidden="true">✓</span>}</button>
    })}</div></fieldset>}
    <div id="id-filters" className="id-filters">
      <label id="filter-account-label" htmlFor="filter-account-input">Account ID<input id="filter-account-input" type="search" placeholder="e.g. ACC-01000" value={filters.accountId || ''} onChange={e => onChange({ ...filters, accountId: e.target.value })} /></label>
      <label id="filter-service-label" htmlFor="filter-service-input">Service ID<input id="filter-service-input" type="search" placeholder="e.g. SVC-05000" value={filters.serviceId || ''} onChange={e => onChange({ ...filters, serviceId: e.target.value })} /></label>
    </div>
    <button id="filter-clear-all" className="clear-filters" type="button" onClick={onReset} disabled={activeCount === 0}>Clear all filters</button>
  </aside>
}
