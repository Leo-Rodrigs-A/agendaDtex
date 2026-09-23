import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from '@tanstack/react-router'
import { useSidebar } from '@/components/ui/sidebar'
import { useCommandPalette } from '@/components/CommandPaletteProvider'

/**
 * Atalhos globais de teclado (shell autenticado):
 *  - Ctrl/Cmd+K → paleta de comandos (estilo Notion/Linear)
 *  - N → novo pedido (staff)
 *  - S → retrair/expandir sidebar
 *  - H / P / F → Home / Pedidos / Feriados
 */
export function GlobalHotkeys() {
  const navigate = useNavigate()
  const { toggleSidebar } = useSidebar()
  const { togglePalette, openNewOrder } = useCommandPalette()

  // Impede disparo com texto sendo digitado em inputs/textareas
  const opts = { enableOnFormTags: false, preventDefault: true }

  useHotkeys('mod+k', () => togglePalette(), opts)
  useHotkeys('n', () => openNewOrder(), opts)
  useHotkeys('s', () => toggleSidebar(), opts)
  useHotkeys('h', () => navigate({ to: '/' }), opts)
  useHotkeys('p', () => navigate({ to: '/pedidos' }), opts)
  useHotkeys('f', () => navigate({ to: '/feriados' }), opts)

  return null
}
