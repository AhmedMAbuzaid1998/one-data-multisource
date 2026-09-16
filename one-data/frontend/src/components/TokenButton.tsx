import { useState } from 'react'
import { generateToken } from '../services/api'

interface Props {
  userId: number
  username: string
}

type State = 'idle' | 'loading' | 'done' | 'error'

export default function TokenButton({ userId, username }: Props) {
  const [state, setState] = useState<State>('idle')
  const [token, setToken]   = useState('')

  async function handleClick() {
    setState('loading')
    try {
      const res = await generateToken(userId)
      setToken(res.token)
      setState('done')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  if (state === 'done') {
    return (
      <div id={`token-result-${userId}`} style={styles.tokenResult} title={`Token for ${username}`}>
        <span id={`token-check-${userId}`} style={styles.checkIcon}>✓</span>
        <span id={`token-value-${userId}`} style={styles.tokenText}>{token}</span>
        <button id={`token-copy-${userId}`} style={styles.copyBtn} onClick={() => navigator.clipboard.writeText(token)} title="Copy token">
          ⎘
        </button>
      </div>
    )
  }

  return (
    <button
      id={`token-generate-${userId}`}
      style={{
        ...styles.btn,
        ...(state === 'loading' ? styles.btnLoading : {}),
        ...(state === 'error' ? styles.btnError : {}),
      }}
      onClick={handleClick}
      disabled={state === 'loading'}
    >
      {state === 'loading' && <span id={`token-spinner-${userId}`} style={styles.spinner}>⟳</span>}
      {state === 'idle'    && '⚡ Generate'}
      {state === 'loading' && 'Running…'}
      {state === 'error'   && '✕ Failed'}
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    fontSize: 12, padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 4,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  btnLoading: {
    background: 'var(--soft)', color: 'var(--muted)',
    borderColor: 'var(--border)',
  },
  btnError: {
    background: '#fef2f2', color: '#dc2626',
    borderColor: '#fca5a5',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  tokenResult: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11,
  },
  checkIcon: {
    color: '#059669', fontWeight: 700, fontSize: 13,
  },
  tokenText: {
    fontFamily: 'monospace', color: 'var(--success)',
    fontSize: 11, maxWidth: 140,
    overflow: 'hidden', textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyBtn: {
    background: 'none', border: 'none',
    color: 'var(--muted)', cursor: 'pointer',
    fontSize: 14, padding: '0 2px',
  },
}
