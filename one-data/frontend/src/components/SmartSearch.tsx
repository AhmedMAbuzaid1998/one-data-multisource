import { FormEvent, useState, useEffect } from 'react'
import { DataColumn, TestUser } from '../services/api'
import { interpretSearch } from '../services/tableData'
export default function SmartSearch({ query, onQuery, rows, columns }: { query: string; onQuery: (query: string) => void; rows: TestUser[]; columns: DataColumn[] }) {
  const [interpretation, setInterpretation] = useState<{query:string;note:string}|null>(null)
  const [draft, setDraft] = useState(query)
  useEffect(() => setDraft(query), [query])
  function submit(event: FormEvent) { event.preventDefault(); const result=interpretSearch(draft,rows,columns); setInterpretation(result); if(result.query && !result.note.startsWith('Negation')) onQuery(result.query) }
  return <section id="smart-search-section" className="smart-search-card" aria-labelledby="smart-search-title">
    <div id="smart-search-icon" className="smart-search-icon" aria-hidden="true">✦</div>
    <div id="smart-search-content" className="smart-search-content">
      <div id="smart-search-heading-row" className="smart-search-heading-row"><div id="smart-search-heading-copy"><span id="smart-search-label">SMART SEARCH</span><h3 id="smart-search-title">Describe the user you need</h3></div><span id="smart-search-local-badge" className="local-badge">Runs locally</span></div>
      <form id="smart-search-form" className="smart-search-form" onSubmit={submit}>
        <label id="smart-search-input-label" htmlFor="smart-search-input" className="sr-only">Search table values</label>
        <input id="smart-search-input" type="search" autoComplete="off" value={draft} onChange={event => setDraft(event.target.value)} placeholder='Try: Find me a hybrid mobile user in Albania with a Pega offer' />
        {draft && <button id="smart-search-clear" type="button" onClick={() => { setDraft(''); setInterpretation(null); onQuery('') }} aria-label="Clear smart search">×</button>}
        <button id="smart-search-submit" type="submit">Find data <span id="smart-search-submit-arrow" aria-hidden="true">→</span></button>
      </form>
      <p id="smart-search-feedback" className="smart-search-feedback">{interpretation ? <><strong id="smart-search-interpreted">{interpretation.note.startsWith('Negation') ? 'Please rephrase your search. ' : `Searching for: ${interpretation.query || '—'}. `}</strong>{interpretation.note}</> : 'Understands common request wording, country names, post/pre-paid spelling and clear typos using your table values. Runs locally; no LLM service is connected.'}</p>
    </div>
  </section>
}
