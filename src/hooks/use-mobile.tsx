import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Hook para detectar dispositivos móveis com baixa performance
export function useIsLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Detectar dispositivos com baixa performance
    const checkPerformance = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT
      const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
      const isSlowConnection = (navigator as any).connection && (navigator as any).connection.effectiveType === 'slow-2g'
      const isOldDevice = /Android [1-4]|iPhone OS [1-9]|Windows Phone/.test(navigator.userAgent)
      
      setIsLowEnd(isMobile && (isLowMemory || isSlowConnection || isOldDevice))
    }

    checkPerformance()
    
    // Re-verificar quando a conexão muda
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', checkPerformance)
      return () => (navigator as any).connection.removeEventListener('change', checkPerformance)
    }
    
    return undefined;
  }, [])

  return isLowEnd
}