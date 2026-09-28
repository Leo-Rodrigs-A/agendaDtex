import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from '@tanstack/react-router'
import { useSidebar } from '@/components/ui/sidebar'
import { useCommandPalette } from '@/components/CommandPaletteProvider'
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import { shiftSelectableDay } from '@/lib/dates'
import { useAllowSaturday } from '@/hooks/use-allow-saturday'

/**
 * Atalhos globais de teclado (shell autenticado):
 *  - Ctrl/Cmd+K → paleta de comandos (estilo Notion/Linear)
 *  - N → novo pedido (staff)
 *  - S → retrair/expandir sidebar
 *  - H / P / F / D → Home / Pedidos / Feriados / Produção
 *  - Seta Esquerda / Seta Direita → dia útil anterior / próximo dia útil
 *    (em /producao o sábado é permitido, nos demais não)
 */
export function GlobalHotkeys() {
  const navigate = useNavigate()
  const { toggleSidebar } = useSidebar()
  const { togglePalette, openNewOrder } = useCommandPalette()
  const { day, setDay } = useFilters()
  const { holidays } = useData()
  const allowSaturday = useAllowSaturday()

  // Impede disparo com texto sendo digitado em inputs/textareas
  const opts = { enableOnFormTags: false, preventDefault: true }

  useHotkeys('mod+k', () => togglePalette(), opts)
  useHotkeys('n', () => openNewOrder(), opts)
  useHotkeys('s', () => toggleSidebar(), opts)
  useHotkeys('h', () => navigate({ to: '/' }), opts)
  useHotkeys('p', () => navigate({ to: '/pedidos', search: {} }), opts)
  useHotkeys('f', () => navigate({ to: '/feriados' }), opts)
  useHotkeys('d', () => navigate({ to: '/producao' }), opts)
  useHotkeys(
    'left',
    () => setDay(shiftSelectableDay(day, -1, holidays, allowSaturday)),
    opts,
  )
  useHotkeys(
    'right',
    () => setDay(shiftSelectableDay(day, 1, holidays, allowSaturday)),
    opts,
  )

  return null
}
