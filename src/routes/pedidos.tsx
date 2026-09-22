import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'cn'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrdersTable } from '@/components/OrdersTable'
import { NewOrderDialog } from '@/components/NewOrderDialog'
import { useData } from '@/components/DataProvider'
import type { OrderSortDir, OrderSortKey } from '@/lib/orders'
import { countPieces, formatBRL, sortOrders } from '@/lib/orders'
import { parseDateKey } from '@/lib/dates'
import type { Order } from '@/types'

export const Route = createFileRoute('/pedidos')({
  component: PedidosPage,
})

type ViewMode = 'list' | 'grid'

const VIEW_KEY = 'dtex-orders-view'
const PAGE_SIZE = 50
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function PedidosPage() {
  const { orders, users, isLoading, error } = useData()

  const [search, setSearch] = useState('')
  // Default: pedido vendido mais recentemente no topo
  const [sortKey, setSortKey] = useState<OrderSortKey>('created_at')
  const [sortDir, setSortDir] = useState<OrderSortDir>('desc')
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list',
  )
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  const sellerName = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name]))
    return (userId: string) => map.get(userId) ?? ''
  }, [users])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? orders.filter(
          (o) =>
            o.order_name.toLowerCase().includes(term) ||
            sellerName(o.user_id).toLowerCase().includes(term),
        )
      : orders
    return sortOrders(filtered, sortKey, sortDir, sellerName)
  }, [orders, search, sortKey, sortDir, sellerName])

  // Carregamento incremental: 50 pedidos por rodada
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, sortKey, sortDir])
  const visibleOrders = filteredOrders.slice(0, visibleCount)
  const hasMore = visibleCount < filteredOrders.length

  const changeView = (next: ViewMode) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Toolbar: título à esquerda, busca no centro, ações à direita */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="shrink-0">
          <h2 className="text-lg font-semibold">Pedidos</h2>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} de {orders.length} pedidos
          </p>
        </div>

        <div className="relative w-full lg:mx-auto lg:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por vendedor ou nome do pedido..."
            className="pl-9"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              title="Visualizar em lista"
              onClick={() => changeView('list')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Visualizar em grade"
              onClick={() => changeView('grid')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button className="gap-2" onClick={() => setNewOrderOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Pedido
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Carregando pedidos…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum pedido encontrado.
          </div>
        ) : view === 'list' ? (
          <OrdersTable
            orders={visibleOrders}
            users={users}
            variant="full"
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={(key, dir) => {
              setSortKey(key)
              setSortDir(dir)
            }}
          />
        ) : (
          <OrderGrid orders={visibleOrders} sellerName={sellerName} />
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex flex-col items-center gap-2 border-t border-border p-4">
            <p className="text-xs text-muted-foreground tabular-nums">
              Exibindo {Math.min(visibleCount, filteredOrders.length)} de{' '}
              {filteredOrders.length} pedidos
            </p>
            {hasMore && (
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Carregar mais{' '}
                {Math.min(PAGE_SIZE, filteredOrders.length - visibleCount)}
              </Button>
            )}
          </div>
        )}
      </div>

      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </div>
  )
}

function OrderGrid({
  orders,
  sellerName,
}: {
  orders: Array<Order>
  sellerName: (userId: string) => string
}) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className={cn(
            'rounded-lg border border-border bg-background p-4 shadow-sm',
            order.is_done === true && 'opacity-60',
          )}
        >
          <p
            className={cn(
              'truncate font-medium',
              order.is_done === true && 'line-through',
            )}
          >
            {order.order_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {sellerName(order.user_id) || '—'}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="tabular-nums text-muted-foreground">
              {countPieces(order)} peças
            </span>
            <span className="font-medium tabular-nums">
              {formatBRL(Number(order.total_amount) || 0)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Entrega {dateFormatter.format(parseDateKey(order.delivery_date))}
          </p>
        </div>
      ))}
    </div>
  )
}
