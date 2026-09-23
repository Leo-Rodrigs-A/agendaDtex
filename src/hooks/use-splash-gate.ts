import { useEffect, useState } from 'react'

/**
 * Garante uma duração mínima de exibição da splash screen.
 *
 * A animação do logo dura 2s por loop; a tela deve durar pelo menos
 * 1 execução (2s), mesmo que os dados já estejam prontos.
 *
 * O timer começa na montagem do componente que usa o hook e não reinicia.
 */
export function useSplashGate(isLoading: boolean, minMs = 2000): boolean {
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), minMs)
    return () => clearTimeout(timer)
  }, [minMs])

  return isLoading || !minElapsed
}
