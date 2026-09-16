import { FormEvent, useState } from 'react'
import { Filters } from '../services/api'

interface Props { onApply: (filters: Filters) => void }

const rules: Array<{ key: keyof Filters; value: string; patterns: RegExp[] }> = [
  { key: 'market', value: 'IE', patterns: [/\b(ie|ireland|irish)\b/i] },
  { key: 'market', value: 'AL', patterns: [/\b(al|albania|albanian)\b/i] },
  { key: 'market', value: 'PT', patterns: [/\b(pt|portugal|portuguese)\b/i] },
  { key: 'environment', value: 'QA', patterns: [/\b(qa|quality assurance)\b/i] },
  { key: 'environment', value: 'STAGE', patterns: [/\b(stage|staging)\b/i] },
  { key: 'environment', value: 'PROD', patterns: [/\b(prod|production)\b/i] },
  { key: 'userType', value: 'Consumer', patterns: [/\b(consumer|personal|individual)\b/i] },
  { key: 'userType', value: 'Business', patterns: [/\b(business|corporate|company|biz)\b/i] },
  { key: 'role', value: 'Chooser', patterns: [/\bchooser\b/i] },
  { key: 'role', value: 'User', patterns: [/\b(role\s+user|business\s+user)\b/i] },
  { key: 'paymentType', value: 'Post Paid', patterns: [/\b(post[ -]?paid|postpaid)\b/i] },
  { key: 'paymentType', value: 'Pre Paid', patterns: [/\b(pre[ -]?paid|prepaid)\b/i] },
  { key: 'paymentType', value: 'Converged', patterns: [/\b(converged|convergence)\b/i] },
]

export function parseSmartSearch(input: string): Filters {
  const result: Filters = {}
  rules.forEach(rule => { if (rule.patterns.some(pattern => pattern.test(input))) result[rule.key] = rule.value })
  const account = input.match(/\bACC[- ]?\d+\b/i)?.[0]
  const service = input.match(/\bSVC[- ]?\d+\b/i)?.[0]
  if (account) result.accountId = account.replace(' ', '-').toUpperCase()
  if (service) result.serviceId = service.replace(' ', '-').toUpperCase()
  if (result.role && !result.userType) result.userType = 'Business'
  return result
}

export default function SmartSearch({ onApply }: Props) {
  const [query, setQuery] = useState('')
  const [recognized, setRecognized] = useState<Filters | null>(null)
  const criteria = recognized ? Object.values(recognized).filter(Boolean) : []

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = parseSmartSearch(query)
    setRecognized(parsed)
    if (Object.keys(parsed).length) onApply(parsed)
  }

  return <section id="smart-search-section" className="smart-search-card" aria-labelledby="smart-search-title">
    <div id="smart-search-icon" className="smart-search-icon" aria-hidden="true">✦</div>
    <div id="smart-search-content" className="smart-search-content">
      <div id="smart-search-heading-row" className="smart-search-heading-row">
        <div id="smart-search-heading-copy"><span id="smart-search-label">SMART SEARCH</span><h3 id="smart-search-title">Describe the test data you need</h3></div>
        <span id="smart-search-local-badge" className="local-badge">Runs locally</span>
      </div>
      <form id="smart-search-form" className="smart-search-form" onSubmit={submit}>
        <label id="smart-search-input-label" htmlFor="smart-search-input" className="sr-only">Describe the test data you need</label>
        <input id="smart-search-input" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try: QA prepaid business chooser in Ireland" />
        {query && <button id="smart-search-clear" type="button" onClick={() => { setQuery(''); setRecognized(null) }} aria-label="Clear smart search">×</button>}
        <button id="smart-search-submit" type="submit" disabled={!query.trim()}>Find data <span id="smart-search-submit-arrow" aria-hidden="true">→</span></button>
      </form>
      {recognized && <div id="smart-search-feedback" className={`smart-search-feedback${criteria.length ? '' : ' no-match'}`}>
        {criteria.length ? <><span id="smart-search-recognized-label">Recognized:</span><div id="smart-search-recognized-values">{criteria.map((value, index) => <span id={`smart-search-value-${index}`} key={`${value}-${index}`}>{value}</span>)}</div></> : <span id="smart-search-no-match">No known criteria found. Try adding a market, environment, user type, role, or payment type.</span>}
      </div>}
    </div>
  </section>
}
