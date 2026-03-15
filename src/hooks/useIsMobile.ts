import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 639

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    mql.addEventListener('change', onChange)
    // Sync in case SSR hydration mismatched
    setIsMobile(mql.matches)

    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
