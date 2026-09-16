import { FormEvent, useMemo, useState } from 'react'

const initial = { summary: '', market: 'IE', environment: 'QA', userType: 'Consumer', role: 'N/A', paymentType: 'Post Paid', quantity: '1', neededBy: '', scenario: '', notes: '' }

export function improveScenario(input: string) {
  let result = input.trim().replace(/\s+/g, ' ')
  if (!result) return 'Not specified'
  result = result
    .replace(/^we\s+(?:want|need|require)\s+/i, 'Provide ')
    .replace(/\buser\s+who\s+eligible\b/gi, 'user who is eligible')
    .replace(/\beligible\s+to\s+upgrade(?:\s+the)?\s+plan\b/gi, 'eligible for a plan upgrade')
    .replace(/\band\s+have\s+(?:an?\s+)?pega\s+offer\b/gi, 'and has an active Pega offer')
    .replace(/\band\s+have\b/gi, 'and has')
    .replace(/\bpega\b/gi, 'Pega')
    .replace(/\bpost\s*paid\b/gi, 'postpaid')
    .replace(/\bpre\s*paid\b/gi, 'prepaid')
  result = result.charAt(0).toUpperCase() + result.slice(1)
  if (!/[.!?]$/.test(result)) result += '.'
  return result
}

export default function TestDataRequest() {
  const [form, setForm] = useState(initial)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))
  const polishedScenario = useMemo(() => improveScenario(form.scenario), [form.scenario])
  const jiraText = useMemo(() => `[Test Data] ${form.summary || `${form.market} ${form.environment} test data request`}

REQUEST DETAILS
- Market: ${form.market}
- Environment: ${form.environment}
- User type: ${form.userType}
- Business role: ${form.userType === 'Business' ? form.role : 'N/A'}
- Payment type: ${form.paymentType}
- Quantity: ${form.quantity}
- Needed by: ${form.neededBy || 'Not specified'}

TEST SCENARIO
${polishedScenario}

ADDITIONAL NOTES
${form.notes || 'None'}

ACCEPTANCE CRITERIA
- Requested test data is available in ${form.environment}.
- Data matches the attributes listed above.
- Credentials or access instructions are shared through an approved secure channel.`, [form, polishedScenario])

  function submit(event: FormEvent) { event.preventDefault(); setGenerated(true); setCopied(false) }
  async function copy() { await navigator.clipboard.writeText(jiraText); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }

  return <section id="request-builder-section" className="request-builder" aria-labelledby="request-builder-title">
    <div id="request-builder-heading" className="request-builder-heading"><div id="request-builder-heading-copy"><p id="request-builder-kicker" className="eyebrow">JIRA-READY REQUEST</p><h2 id="request-builder-title">Create a test data request</h2><p id="request-builder-description">Complete the details and generate a consistent request that you can paste into Jira.</p></div></div>
    <div id="request-builder-layout" className="request-builder-layout">
      <form id="request-form" className="request-form-card" onSubmit={submit}>
        <div id="request-form-grid" className="request-form-grid">
          <label id="request-summary-label" className="full-field" htmlFor="request-summary">Request summary <input id="request-summary" required value={form.summary} onChange={e => update('summary', e.target.value)} placeholder="e.g. Users for prepaid top-up regression" /></label>
          <label id="request-market-label" htmlFor="request-market">Market <select id="request-market" value={form.market} onChange={e => update('market', e.target.value)}><option id="request-market-ie">IE</option><option id="request-market-al">AL</option><option id="request-market-pt">PT</option></select></label>
          <label id="request-environment-label" htmlFor="request-environment">Environment <select id="request-environment" value={form.environment} onChange={e => update('environment', e.target.value)}><option id="request-environment-qa">QA</option><option id="request-environment-stage">STAGE</option><option id="request-environment-prod">PROD</option></select></label>
          <label id="request-user-type-label" htmlFor="request-user-type">User type <select id="request-user-type" value={form.userType} onChange={e => setForm(current => ({ ...current, userType: e.target.value, role: e.target.value === 'Business' ? current.role : 'N/A' }))}><option id="request-type-consumer">Consumer</option><option id="request-type-business">Business</option></select></label>
          <label id="request-role-label" htmlFor="request-role">Business role <select id="request-role" value={form.role} disabled={form.userType !== 'Business'} onChange={e => update('role', e.target.value)}><option id="request-role-na">N/A</option><option id="request-role-chooser">Chooser</option><option id="request-role-user">User</option></select></label>
          <label id="request-payment-label" htmlFor="request-payment">Payment type <select id="request-payment" value={form.paymentType} onChange={e => update('paymentType', e.target.value)}><option id="request-payment-postpaid">Post Paid</option><option id="request-payment-prepaid">Pre Paid</option><option id="request-payment-converged">Converged</option></select></label>
          <label id="request-quantity-label" htmlFor="request-quantity">Quantity <input id="request-quantity" type="number" min="1" max="100" required value={form.quantity} onChange={e => update('quantity', e.target.value)} /></label>
          <label id="request-needed-by-label" htmlFor="request-needed-by">Needed by <input id="request-needed-by" type="date" value={form.neededBy} onChange={e => update('neededBy', e.target.value)} /></label>
          <div id="request-scenario-field" className="full-field scenario-field">
            <div id="request-scenario-heading" className="scenario-heading"><label id="request-scenario-label" htmlFor="request-scenario">Test scenario</label><button id="request-improve-scenario" type="button" disabled={!form.scenario.trim()} onClick={() => update('scenario', polishedScenario)}>✦ Improve wording</button></div>
            <textarea id="request-scenario" required rows={4} value={form.scenario} onChange={e => update('scenario', e.target.value)} placeholder="Describe what the data will be used to test…" />
            {form.scenario.trim() && polishedScenario !== form.scenario.trim() && <p id="request-scenario-suggestion"><span id="request-scenario-suggestion-label">Suggested wording:</span> {polishedScenario}</p>}
          </div>
          <label id="request-notes-label" className="full-field" htmlFor="request-notes">Additional notes <textarea id="request-notes" rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any setup, balance, product, or access requirements…" /></label>
        </div>
        <div id="request-form-actions" className="request-form-actions"><button id="request-reset" type="button" onClick={() => { setForm(initial); setGenerated(false) }}>Reset</button><button id="request-generate" className="primary-action" type="submit">Generate Jira request →</button></div>
      </form>
      <aside id="request-preview-card" className={`request-preview-card${generated ? ' generated' : ''}`} aria-live="polite">
        <div id="request-preview-header" className="request-preview-header"><div id="request-preview-heading"><span id="request-preview-kicker">PREVIEW</span><h3 id="request-preview-title">Jira request</h3></div>{generated && <button id="request-copy" type="button" onClick={copy}>{copied ? '✓ Copied' : 'Copy for Jira'}</button>}</div>
        {generated ? <pre id="request-preview-content">{jiraText}</pre> : <div id="request-preview-empty" className="request-preview-empty"><span id="request-preview-empty-icon" aria-hidden="true">◇</span><p id="request-preview-empty-title">Your generated request will appear here.</p><small id="request-preview-empty-help">Complete the required fields, then select Generate.</small></div>}
      </aside>
    </div>
  </section>
}
