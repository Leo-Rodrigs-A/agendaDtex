import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ImageOff,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from 'cn'
import type { Order, User } from '@/types'
import type { OrderSortDir, OrderSortKey } from '@/lib/orders'
import { formatBRL, sortOrders } from '@/lib/orders'
import { parseDateKey } from '@/lib/dates'
import { driveImageSrc } from '@/lib/drive'
import { useData } from '@/components/DataProvider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** Ícone à esquerda do nome do pedido: abre modal com a imagem (Drive).
 * Sem imagem: botão desabilitado para não enganar o usuário. */
function OrderImageButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const hasImage = Boolean(order.imgurl?.trim())

  if (!hasImage) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        className="h-7 w-7 text-muted-foreground/40"
      >
        <ImageOff className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-primary"
        onClick={() => {
          setLoadFailed(false)
          setOpen(true)
        }}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{order.order_name}</DialogTitle>
          </DialogHeader>
          {loadFailed ? (
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              Não foi possível carregar a imagem. Verifique se o link está
              público.
            </div>
          ) : (
            <img
              src={driveImageSrc(order.imgurl!)}
              alt={`Imagem do pedido ${order.order_name}`}
              loading="lazy"
              onError={() => setLoadFailed(true)}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Checkbox de conclusão: update otimista via DataProvider (a linha reage na
 * hora; o POST vai em background e desfaz em caso de erro — feedback via toast). */
function OrderDoneCheckbox({ order }: { order: Order }) {
  const { toggleOrderDone } = useData()
  const [pending, setPending] = useState(false)

  return (
    <Checkbox
      checked={order.is_done === true}
      disabled={pending}
      title={order.is_done ? 'Marcar como pendente' : 'Marcar como concluído'}
      className="cursor-pointer"
      onCheckedChange={async (checked) => {
        setPending(true)
        try {
          await toggleOrderDone(order.id, checked === true)
        } finally {
          setPending(false)
        }
      }}
    />
  )
}

type SortableHeadProps = {
  label: string
  column: OrderSortKey
  sortKey: OrderSortKey
  sortDir: OrderSortDir
  onSort: (column: OrderSortKey) => void
  alignRight?: boolean
}

/** Cabeçalho clicável com seta de direção (asc/desc) ou neutro. */
function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  alignRight,
}: SortableHeadProps) {
  const active = sortKey === column
  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none',
        alignRight && 'text-right',
        active && 'text-foreground',
      )}
      onClick={() => onSort(column)}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1',
          alignRight && 'flex-row-reverse',
        )}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </span>
    </TableHead>
  )
}

type OrdersTableProps = {
  orders: Array<Order>
  users: Array<User>
  /**
   * 'day'  → home: pedidos concluídos não aparecem.
   * 'full' → /pedidos: concluídos ficam riscados/esmaecidos, com coluna Entrega.
   */
  variant?: 'day' | 'full'
  emptyMessage?: string
  /** Ordenação controlada (opcional): /pedidos usa para reiniciar a
   * paginação de 50 em 50 ao trocar coluna/direção. */
  sortKey?: OrderSortKey
  sortDir?: OrderSortDir
  onSortChange?: (key: OrderSortKey, dir: OrderSortDir) => void
}

export function OrdersTable({
  orders,
  users,
  variant = 'day',
  emptyMessage = 'Nenhum pedido encontrado.',
  sortKey: controlledKey,
  sortDir: controlledDir,
  onSortChange,
}: OrdersTableProps) {
  // Padrão: pedido vendido mais recentemente no topo (created_at desc)
  const [internalKey, setInternalKey] = useState<OrderSortKey>('created_at')
  const [internalDir, setInternalDir] = useState<OrderSortDir>('desc')
  const sortKey = controlledKey ?? internalKey
  const sortDir = controlledDir ?? internalDir

  const sellerName = (userId: string) =>
    users.find((u) => u.id === userId)?.name ?? '—'

  const handleSort = (column: OrderSortKey) => {
    const nextDir: OrderSortDir =
      column === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'
    if (controlledKey === undefined) {
      setInternalKey(column)
      setInternalDir(nextDir)
    }
    onSortChange?.(column, nextDir)
  }

  const visibleOrders =
    variant === 'day' ? orders.filter((o) => o.is_done !== true) : orders
  const sortedOrders = sortOrders(visibleOrders, sortKey, sortDir, sellerName)
  const showDeliveryDate = variant === 'full'
  const columnCount = 7 + (showDeliveryDate ? 1 : 0)

  const formatCreatedAt = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  const headProps = { sortKey, sortDir, onSort: handleSort }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <SortableHead
              label="Nome do pedido"
              column="order_name"
              {...headProps}
            />
            <SortableHead label="Vendedor" column="seller" {...headProps} />
            <SortableHead
              label="Camisetas"
              column="shirt_count"
              alignRight
              {...headProps}
            />
            <SortableHead
              label="Shorts/Outros"
              column="others_items_count"
              alignRight
              {...headProps}
            />
            <SortableHead
              label="Encomendado em"
              column="created_at"
              {...headProps}
            />
            {showDeliveryDate && (
              <SortableHead
                label="Entrega"
                column="delivery_date"
                {...headProps}
              />
            )}
            <SortableHead
              label="Valor"
              column="total_amount"
              alignRight
              {...headProps}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedOrders.map((order) => (
              <TableRow
                key={order.id}
                className={cn(
                  variant === 'full' && order.is_done === true && 'opacity-60',
                )}
              >
                <TableCell className="w-10">
                  <OrderDoneCheckbox order={order} />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1">
                    <OrderImageButton order={order} />
                    <span
                      className={cn(
                        'truncate',
                        variant === 'full' &&
                          order.is_done === true &&
                          'line-through',
                      )}
                    >
                      {order.order_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{sellerName(order.user_id)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {order.shirt_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {order.others_items_count}
                </TableCell>
                <TableCell>{formatCreatedAt(order.created_at)}</TableCell>
                {showDeliveryDate && (
                  <TableCell>
                    {dateFormatter.format(parseDateKey(order.delivery_date))}
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">
                  {formatBRL(Number(order.total_amount) || 0)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
