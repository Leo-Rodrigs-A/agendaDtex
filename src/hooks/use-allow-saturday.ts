import { useLocation } from '@tanstack/react-router'

/**
 * Retorna true quando a rota atual é /producao.
 * Em /producao o dia selecionado representa `created_at` (encomenda), e a
 * loja cria pedidos no sábado. Em nenhuma outra tela o sábado pode ser
 * selecionado (entrega/produção nunca caem no sábado).
 */
export function useAllowSaturday(): boolean {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  return pathname === '/producao'
}
