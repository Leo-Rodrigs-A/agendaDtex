import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  FileText,
  Home,
  Plus,
  Search,
  SquareMenu,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import { formatBRL } from '@/lib/orders'
import { driveImageSrc } from '@/lib/drive'
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
 */
export function CommandPalette({
  open,
  onOpenChange,
  onNewOrder,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const { orders } = useData()
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [imageOrder, setImageOrder] = useState<Order | null>(null)
  const [imageFailed, setImageFailed] = useState(false)

  const canWrite = profile?.role !== 'designer'
  const q = query.trim().toLowerCase()

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
        id: 'nav-pedidos',
        label: 'Ir para Pedidos',
        hint: 'P',
        icon: SquareMenu,
        run: () => navigate({ to: '/pedidos' }),
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
            return (
              <button
                key={order.id}
                type="button"
                disabled={!hasImage}
                title={hasImage ? 'Ver imagem do pedido' : 'Pedido sem imagem'}
                onClick={() => {
                  if (!hasImage) return
                  setImageFailed(false)
                  setImageOrder(order)
                }}
                className={
                  hasImage
                    ? 'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent cursor-pointer'
                    : 'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm opacity-50 cursor-not-allowed'
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{order.order_name}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatBRL(Number(order.total_amount) || 0)}
                </span>
              </button>
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

      {/* Imagem do pedido (aberta ao clicar num pedido com imgurl) */}
      <Dialog
        open={imageOrder !== null}
        onOpenChange={(isOpen) => !isOpen && setImageOrder(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{imageOrder?.order_name}</DialogTitle>
          </DialogHeader>
          {imageOrder &&
            (imageFailed ? (
              <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                Não foi possível carregar a imagem. Verifique se o link está
                público.
              </div>
            ) : (
              <img
                src={driveImageSrc(imageOrder.imgurl!)}
                alt={`Imagem do pedido ${imageOrder.order_name}`}
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ))}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
