import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type SplashGateState = {
  /** true enquanto o mínimo de 2s (1 loop da animação) não passou */
  showSplash: boolean
}

const SplashGateContext = createContext<SplashGateState | null>(null)

export function SplashGateProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Iniciado UMA VEZ no boot da aba. Não reinicia em navegação.
    const timer = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <SplashGateContext.Provider value={{ showSplash }}>
      {children}
    </SplashGateContext.Provider>
  )
}

export function useSplashGate() {
  const ctx = useContext(SplashGateContext)
  if (!ctx)
    throw new Error(
      'useSplashGate deve ser usado dentro de <SplashGateProvider>',
    )
  return ctx.showSplash
}
