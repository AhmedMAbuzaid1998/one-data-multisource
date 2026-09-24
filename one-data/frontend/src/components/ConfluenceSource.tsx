import { useState } from 'react'
import { ConfluenceState } from '../services/api'

export default function ConfluenceSource({ state, personal }: { state: ConfluenceState | null; personal: boolean }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function action(name: 'signIn' | 'refresh' | 'signOut') {
    setPending(true)
    setError('')
    try { await window.confluenceDesktop?.[name]() }
    catch { setError('The desktop request could not complete. Please try again.') }
    finally { setPending(false) }
  }
  const busy = pending || state?.status === 'refreshing'
  return <section id="confluence-source" className="confluence-source" aria-labelledby="confluence-title">
    <div id="confluence-heading" className="confluence-heading">
      <div id="confluence-heading-copy"><p id="confluence-kicker" className="eyebrow">CONFLUENCE · TEST VERSION</p><h3 id="confluence-title">{state?.title || 'Shared Confluence table'}</h3></div>
      <span id="confluence-status" className={`confluence-status ${state?.status || ''}`}>{state?.status === 'live' ? 'Live' : state?.status === 'cached' ? 'Cached copy' : state?.status === 'refreshing' ? 'Refreshing…' : state?.status === 'sign-in-required' ? 'Sign-in expired' : 'Not connected'}</span>
    </div>
    <p id="confluence-message" role="status">{state?.message || 'Checking your desktop connection…'}</p>
    {state?.lastSuccess && <p id="confluence-last-success" className="confluence-meta">Last successful refresh: {new Date(state.lastSuccess).toLocaleString()} · {state.rows.length} rows{state.version !== null ? ` · Page version ${state.version}` : ''}</p>}
    <p id="confluence-policy" className="confluence-meta">Refreshes every 5 minutes after sign-in. Missing fields stay blank until added to the source table.</p>
    {personal && <p id="confluence-personal-note" className="confluence-meta">Your personal file is active. Confluence updates will be ready when you switch back.</p>}
    {error && <p id="confluence-action-error" role="alert">{error}</p>}
    <div id="confluence-actions" className="dataset-source-actions">
      <button id="confluence-sign-in" className="primary-action" onClick={() => action('signIn')} disabled={busy}>Sign in to Confluence</button>
      <button id="confluence-refresh" onClick={() => action('refresh')} disabled={busy}>Refresh now</button>
      <button id="confluence-sign-out" onClick={() => action('signOut')} disabled={pending}>Sign out & clear local copy</button>
    </div>
  </section>
}
