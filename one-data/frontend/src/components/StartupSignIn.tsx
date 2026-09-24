import { ConfluenceState } from '../services/api'

interface Props {
  state: ConfluenceState | null
  error: string
  pending: boolean
  onSignIn: () => void
  onOffline: () => void
}
export default function StartupSignIn({ state, error, pending, onSignIn, onOffline }: Props) {
  const hasCopy = Boolean(state?.rows.length && state.lastSuccess)
  const refreshing = state?.status === 'refreshing'
  return <main id="startup-sign-in" className="startup-sign-in">
    <section id="startup-sign-in-card" className="startup-sign-in-card" aria-labelledby="startup-sign-in-title">
      <p id="startup-sign-in-kicker" className="eyebrow">ONE DATA · CONFLUENCE TEST</p>
      <h1 id="startup-sign-in-title">{refreshing ? 'Preparing your workspace' : 'Sign in to your workspace'}</h1>
      <p id="startup-sign-in-description">Use your Vodafone account in the Confluence sign-in window. Your workspace opens automatically when the latest data is ready.</p>
      <p id="startup-sign-in-status" role="status">{state?.loginOpen && !refreshing ? 'Complete sign-in in the separate window. If you closed it, choose Retry sign-in.' : state?.message || 'Connecting to the desktop service…'}</p>
      {error && <p id="startup-sign-in-error" className="dataset-upload-error" role="alert">{error}</p>}
      <div id="startup-sign-in-actions" className="dataset-source-actions">
        <button id="startup-retry-sign-in" className="primary-action" onClick={onSignIn} disabled={pending || refreshing || !state}>{state?.loginOpen ? 'Show sign-in window' : 'Retry sign-in'}</button>
        {hasCopy && <button id="startup-use-offline" onClick={onOffline} disabled={pending}>Use offline copy</button>}
      </div>
      {hasCopy && <p id="startup-offline-details" className="confluence-meta">Saved {new Date(state!.lastSuccess!).toLocaleString()} · {state!.rows.length} users. This copy may be out of date.</p>}
      {!hasCopy && <p id="startup-no-cache" className="confluence-meta">No offline copy yet. Connect to your organization network or VPN and complete sign-in.</p>}
    </section>
  </main>
}
