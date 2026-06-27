import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'vodafone' | 'fading' | 'onedata' | 'done'>('vodafone')

  useEffect(() => {
    // Vodafone logo visible 1.5s
    const t1 = setTimeout(() => setPhase('fading'), 1500)
    // Fade out 0.5s
    const t2 = setTimeout(() => setPhase('onedata'), 2000)
    // One Data logo visible 1.5s
    const t3 = setTimeout(() => setPhase('done'), 3500)
    // Enter app
    const t4 = setTimeout(() => onDone(), 3700)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div style={styles.splash}>

      {/* Vodafone phase */}
      {(phase === 'vodafone' || phase === 'fading') && (
        <div style={{ ...styles.logoWrap, opacity: phase === 'fading' ? 0 : 1, transition: 'opacity 0.5s ease' }}>
          {/* Vodafone logo SVG */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="60" fill="#E60000"/>
            <path d="M60 20C38 20 20 38 20 60C20 75 28 88 40 95L55 65C50 62 47 57 47 51C47 42 53 35 62 35C71 35 77 42 77 51C77 62 69 71 58 73L45 103C50 104 55 105 60 105C82 105 100 87 100 60C100 38 82 20 60 20Z" fill="white"/>
          </svg>
          <p style={styles.vodafoneText}>Vodafone</p>
        </div>
      )}

      {/* One Data phase */}
      {(phase === 'onedata' || phase === 'done') && (
        <div style={{ ...styles.logoWrap, opacity: phase === 'done' ? 0 : 1, transition: 'opacity 0.5s ease' }}>
          {/* One Data logo */}
          <div style={styles.oneDataLogo}>
            <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="60" fill="#E60000"/>
              <path d="M60 20C38 20 20 38 20 60C20 75 28 88 40 95L55 65C50 62 47 57 47 51C47 42 53 35 62 35C71 35 77 42 77 51C77 62 69 71 58 73L45 103C50 104 55 105 60 105C82 105 100 87 100 60C100 38 82 20 60 20Z" fill="white"/>
            </svg>
            <span style={styles.oneDataText}>ne Data</span>
          </div>
          <p style={styles.tagline}>Test Data Portal</p>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  splash: {
    position: 'fixed', inset: 0,
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  },
  logoWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
    position: 'absolute',
  },
  vodafoneText: {
    fontSize: 28, fontWeight: 700,
    color: '#E60000', letterSpacing: '-0.5px',
  },
  oneDataLogo: {
    display: 'flex', alignItems: 'center', gap: 4,
  },
  oneDataText: {
    fontSize: 56, fontWeight: 700,
    color: '#1a1a1a', letterSpacing: '-1px',
    lineHeight: 1,
  },
  tagline: {
    fontSize: 14, color: '#888',
    fontWeight: 400, letterSpacing: '0.5px',
  }
}
