import { useEffect } from 'react'
import BrandMark from './BrandMark'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(onDone, reduced ? 300 : 3400)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div id="splash-screen" className="splash" role="status" aria-label="Welcome to One Data">
      <div id="splash-lockup" className="splash-lockup" aria-hidden="true">
        <div id="splash-mark" className="splash-mark"><BrandMark id="splash-brand-mark" /><span id="splash-loading-orbit" className="loading-orbit" /></div>
        <span id="splash-name" className="splash-name">ne Data<span id="splash-name-period" className="brand-period">.</span></span>
      </div>
      <p id="splash-caption" className="splash-caption">Your testing starts here.</p>
      <button id="splash-skip" className="splash-skip" onClick={onDone}>Skip intro ↗</button>
    </div>
  )
}
