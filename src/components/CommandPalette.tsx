import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import {
  ArrowUpRight,
  CalendarDays,
  Factory,
  FileText,
  Home,
  Plus,
  Search,
  SquareMenu,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import { OrderImageViewer } from '@/components/OrderImageViewer'
import { formatBRL } from '@/lib/orders'
import type { Order } from '@/types'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewOrder: () => void
}

type Command = {
  id: string
  label: string
  hint?: string
  icon: typeof Home
  run: () => void
}

/**
 * Paleta de comandos (Ctrl+K): busca pedidos por nome e ações rápidas,
 * estilo Notion/Linear. Cmd+K (macOS) também funciona.
 * Pedidos: checkbox is_done, vendedor antes do valor e botão "follow"
 * (vai para /pedidos com o pedido destacado no topo).
 */
export function CommandPalette({
  open,
  onOpenChange,
  onNewOrder,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const { orders, users, toggleOrderDone } = useData()
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [imageOrder, setImageOrder] = useState<Order | null>(null)

  const canWrite = profile?.role !== 'designer'
  const q = query.trim().toLowerCase()

  const sellerName = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name]))
    return (userId: string) => map.get(userId) ?? '—'
  }, [users])

  const actions = useMemo<Array<Command>>(() => {
    const list: Array<Command> = [
      {
        id: 'nav-home',
        label: 'Ir para Home',
        hint: 'H',
        icon: Home,
        run: () => navigate({ to: '/' }),
      },
      {
        id: 'nav-producao',
        label: 'Ir para Produção',
        hint: 'D',
        icon: Factory,
        run: () => navigate({ to: '/producao' }),
      },
      {
        id: 'nav-pedidos',
        label: 'Ir para Pedidos',
        hint: 'P',
        icon: SquareMenu,
        run: () => navigate({ to: '/pedidos', search: { focus: undefined } }),
      },
      {
        id: 'nav-feriados',
        label: 'Ir para Feriados',
        hint: 'F',
        icon: CalendarDays,
        run: () => navigate({ to: '/feriados' }),
      },
    ]
    if (canWrite) {
      list.unshift({
        id: 'new-order',
        label: 'Novo pedido',
        hint: 'N',
        icon: Plus,
        run: () => onNewOrder(),
      })
    }
    return list
  }, [canWrite, navigate, onNewOrder])

  const orderResults = useMemo(() => {
    if (!q) return []
    return orders
      .filter((o) => o.order_name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [orders, q])

  const filteredActions = useMemo(
    () =>
      q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions,
    [actions, q],
  )

  const close = () => {
    setQuery('')
    onOpenChange(false)
  }

  const pick = (fn: () => void) => {
    fn()
    close()
  }

  /** Follow: abre /pedidos com o pedido focado (scroll ao topo + highlight). */
  const followOrder = (order: Order) => {
    navigate({ to: '/pedidos', search: { focus: order.id } })
    close()
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pedidos ou ações…"
            className="h-12 border-0 bg-transparent! px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {orderResults.length > 0 && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Pedidos
            </p>
          )}
          {orderResults.map((order) => {
            const hasImage = Boolean(order.imgurl?.trim())
            const done = order.is_done === true
            return (
              <div
                key={order.id}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={done}
                  disabled={!canWrite}
                  title={
                    canWrite
                      ? done
                        ? 'Marcar como pendente'
                        : 'Marcar como concluído'
                      : 'Designers apenas visualizam'
                  }
                  className="cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={(checked) => {
                    void toggleOrderDone(order.id, checked === true)
                  }}
                />
                <button
                  type="button"
                  disabled={!hasImage}
                  title={
                    hasImage ? 'Ver imagem do pedido' : 'Pedido sem imagem'
                  }
                  onClick={() => {
                    if (!hasImage) return
                    setImageOrder(order)
                  }}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 text-left',
                    hasImage ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span
                    className={cn(
                      'truncate',
                      done && 'line-through opacity-60',
                    )}
                  >
                    {order.order_name}
                  </span>
                </button>
                <span
                  className={cn(
                    'shrink-0 text-xs text-muted-foreground',
                    done && 'opacity-60',
                  )}
                >
                  {sellerName(order.user_id)}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-xs text-muted-foreground tabular-nums',
                    done && 'opacity-60',
                  )}
                >
                  {formatBRL(Number(order.total_amount) || 0)}
                </span>
                <button
                  type="button"
                  title="Ir para o pedido em /pedidos"
                  onClick={() => followOrder(order)}
                  className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            )
          })}

          {filteredActions.length > 0 && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Ações
            </p>
          )}
          {filteredActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => pick(action.run)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <action.icon className="h-4 w-4 text-muted-foreground" />
                {action.label}
              </span>
              {action.hint && (
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {action.hint}
                </kbd>
              )}
            </button>
          ))}

          {q && orderResults.length === 0 && filteredActions.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nada encontrado para "{query}".
            </p>
          )}
        </div>
      </DialogContent>

      {/* Viewer de imagem em tela cheia (clique fora / Esc fecha; clique na imagem = zoom) */}
      <OrderImageViewer
        order={imageOrder}
        onClose={() => setImageOrder(null)}
      />
    </Dialog>
  )
}
