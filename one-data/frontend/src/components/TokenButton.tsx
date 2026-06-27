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
      <div style={styles.tokenResult} title={`Token for ${username}`}>
        <span style={styles.checkIcon}>✓</span>
        <span style={styles.tokenText}>{token}</span>
        <button style={styles.copyBtn} onClick={() => navigator.clipboard.writeText(token)} title="Copy token">
          ⎘
        </button>
      </div>
    )
  }

  return (
    <button
      style={{
        ...styles.btn,
        ...(state === 'loading' ? styles.btnLoading : {}),
        ...(state === 'error' ? styles.btnError : {}),
      }}
      onClick={handleClick}
      disabled={state === 'loading'}
    >
      {state === 'loading' && <span style={styles.spinner}>⟳</span>}
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
    border: '1px solid #d1d5db',
    background: '#fff', color: '#374151',
    display: 'flex', alignItems: 'center', gap: 4,
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  btnLoading: {
    background: '#f9fafb', color: '#9ca3af',
    borderColor: '#e5e7eb',
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
    fontFamily: 'monospace', color: '#065f46',
    fontSize: 11, maxWidth: 140,
    overflow: 'hidden', textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyBtn: {
    background: 'none', border: 'none',
    color: '#9ca3af', cursor: 'pointer',
    fontSize: 14, padding: '0 2px',
  },
}
