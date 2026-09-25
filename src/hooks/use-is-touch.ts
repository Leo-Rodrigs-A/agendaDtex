import * as React from 'react'

/**
 * Detecta dispositivo de toque primário (pointer: coarse) — celulares e
 * tablets. Usado para desligar interações de teclado (ex.: input de data
 * mascarado vira readOnly e a seleção vira 100% por toque no calendário).
 */
export function useIsTouch() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)')
    const onChange = () => setIsTouch(mql.matches)
    mql.addEventListener('change', onChange)
    setIsTouch(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isTouch
}
