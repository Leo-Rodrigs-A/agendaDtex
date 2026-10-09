import { useState } from 'react'
import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ImageOff,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from 'cn'
import { toast } from 'sonner'
import type { Order, User } from '@/types'
import type { OrderSortDir, OrderSortKey } from '@/lib/orders'
import { formatBRL, productionDateOf, sortOrders } from '@/lib/orders'
import { parseDateKey } from '@/lib/dates'
import { deleteOrder } from '@/services/orders'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import { NewOrderDialog } from '@/components/NewOrderDialog'
import { OrderDoneCheckbox } from '@/components/OrderDoneCheckbox'
import { OrderImageViewer } from '@/components/OrderImageViewer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

/**
 * Linha da tabela com animação de layout. Só entra no `variant="day"`,
 * onde marcar um pedido o move da seção de pendentes para a de
 * concluídos — o `layout="position"` costura a transição de posição
 * (só posição: a altura da linha não muda, e sem `scale` na distorção).
 *
 * Replica as classes do `TableRow` do registry porque o `TableRow` emite
 * um `<tr>` fixo, que não aceita virar `motion.tr`. O `transform` que o
 * Framer aplica durante a animação desfaz o `sticky` das células de
 * checkbox e ações; o efeito volta quando ela termina e o transform é
 * zerado.
 */
function AnimatedTableRow({ className, ...props }: HTMLMotionProps<'tr'>) {
  return (
    <motion.tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      layout="position"
      {...props}
    />
  )
}

/** Ações da linha: editar e excluir (dono ou admin — RPC garante no banco). */
function OrderActions({
  order,
  onEdit,
  onDeleted,
}: {
  order: Order
  onEdit: () => void
  onDeleted: () => Promise<void>
}) {
  const { profile } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  const canModify =
    profile?.role === 'admin' ||
    (profile?.role === 'vendedor' && order.user_id === profile.id)

  if (!canModify) return null

  const handleDelete = async () => {
    setPending(true)
    try {
      await deleteOrder(order.id)
      toast.success('Pedido excluído!')
      setConfirming(false)
      await onDeleted()
    } catch (err) {
      console.error('[Pedido] Falha ao excluir', err)
      toast.error('Falha ao excluir o pedido.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-pointer text-muted-foreground hover:bg-primary/10 hover:text-primary"
        title="Editar pedido"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Excluir pedido"
        onClick={(e) => {
          e.stopPropagation()
          setConfirming(true)
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir pedido?</DialogTitle>
            <DialogDescription>
              "{order.order_name}" será removido permanentemente. Essa ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type SortableHeadProps = {
  label: string
  column: OrderSortKey
  sortKey: OrderSortKey
  sortDir: OrderSortDir
  onSort: (column: OrderSortKey) => void
  alignRight?: boolean
  className?: string
}

/** Cabeçalho clicável com seta de direção (asc/desc) ou neutro. */
function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  alignRight,
  className,
}: SortableHeadProps) {
  const active = sortKey === column
  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none',
        alignRight && 'text-right',
        active && 'text-foreground',
        className,
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
  const { profile } = useAuth()
  const { holidays, refreshOrders } = useData()
  // Viewer de imagem no nível da linha (linha inteira clicável)
  const [imageOrder, setImageOrder] = useState<Order | null>(null)
  // Modal de edição (NewOrderDialog em modo edição)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

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

  const openImage = (order: Order) => {
    if (!order.imgurl?.trim()) return
    setImageOrder(order)
  }

  const pendingOrders = sortOrders(
    orders.filter((o) => o.is_done !== true),
    sortKey,
    sortDir,
    sellerName,
  )
  const doneOrders = sortOrders(
    orders.filter((o) => o.is_done === true),
    sortKey,
    sortDir,
    sellerName,
  )
  const sortedOrders =
    variant === 'day'
      ? [...pendingOrders, ...doneOrders]
      : sortOrders(orders, sortKey, sortDir, sellerName)
  const showDeliveryDate = variant === 'full'
  const canWrite = profile?.role !== 'designer'
  // `layout` só no "day": no "full" a lista tem uma ordenação só, então a
  // posição de uma linha nunca muda e a animação não teria o que animar.
  const Row = variant === 'day' ? AnimatedTableRow : TableRow
  // +1 = coluna "Produção" (calculada no front: 2 dias úteis antes da entrega)
  const columnCount = 8 + (showDeliveryDate ? 1 : 0) + (canWrite ? 1 : 0)

  const formatCreatedAt = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  const headProps = { sortKey, sortDir, onSort: handleSort }

  return (
    <div className="overflow-x-auto print:overflow-x-visible">
      {/* text-xs na impressão: cabe as 8 colunas na largura do A4 */}
      <Table className="print:text-xs">
        <TableHeader>
          <TableRow>
            {/* Checkbox não vai pro papel (Slice 22) */}
            <TableHead className="w-10 sticky left-0 z-30 bg-card print:hidden" />
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
            {/* Datas de Produção e Entrega não vão pro papel — restam 6 colunas
              (Nome, Vendedor, Camisetas, Shorts/Outros, Encomendado em, Valor) */}
            <TableHead
              title="2 dias úteis antes da entrega"
              className="print:hidden"
            >
              Produção
            </TableHead>
            {showDeliveryDate && (
              <SortableHead
                label="Entrega"
                column="delivery_date"
                className="print:hidden"
                {...headProps}
              />
            )}
            <SortableHead
              label="Valor"
              column="total_amount"
              alignRight
              {...headProps}
            />
            {canWrite && (
              <TableHead className="w-20 sticky right-0 z-30 bg-card print:hidden" />
            )}
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
            sortedOrders.map((order) => {
              const hasImage = Boolean(order.imgurl?.trim())
              return (
                <Row
                  key={order.id}
                  data-order-id={order.id}
                  onClick={() => openImage(order)}
                  title={hasImage ? 'Ver imagem do pedido' : undefined}
                  className={cn(
                    order.is_done === true && 'opacity-60',
                    hasImage && 'cursor-pointer',
                  )}
                >
                  <TableCell className="w-10 sticky left-0 bg-card print:hidden">
                    <OrderDoneCheckbox order={order} />
                  </TableCell>
                  {/* Nome: teto de 30ch — truncate + "..."; hover mostra o nome completo */}
                  <TableCell className="max-w-[30ch] pr-6 font-medium print:max-w-[18ch] print:pr-2">
                    <div className="flex items-center gap-1">
                      {hasImage ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-primary print:hidden" />
                      ) : (
                        <ImageOff className="h-4 w-4 shrink-0 text-muted-foreground/40 print:hidden" />
                      )}
                      <span
                        title={order.order_name}
                        className={cn(
                          'truncate',
                          order.is_done === true && 'line-through',
                        )}
                      >
                        {order.order_name}
                      </span>
                    </div>
                  </TableCell>
                  {/* Vendedor: teto de 14ch, mesmo padrão de truncate + hint */}
                  <TableCell
                    className="max-w-[14ch] truncate print:max-w-[9ch]"
                    title={sellerName(order.user_id)}
                  >
                    {sellerName(order.user_id)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {order.shirt_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {order.others_items_count}
                  </TableCell>
                  <TableCell>{formatCreatedAt(order.created_at)}</TableCell>
                  <TableCell
                    className="print:hidden"
                    title="2 dias úteis antes da entrega"
                  >
                    {dateFormatter.format(productionDateOf(order, holidays))}
                  </TableCell>
                  {showDeliveryDate && (
                    <TableCell className="print:hidden">
                      {dateFormatter.format(parseDateKey(order.delivery_date))}
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(order.total_amount) || 0)}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="w-20 sticky right-0 bg-card print:hidden">
                      <OrderActions
                        order={order}
                        onEdit={() => setEditingOrder(order)}
                        onDeleted={refreshOrders}
                      />
                    </TableCell>
                  )}
                </Row>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Viewer de imagem em tela cheia (clique fora / Esc fecha, Ctrl+scroll = zoom) */}
      <OrderImageViewer
        order={imageOrder}
        onClose={() => setImageOrder(null)}
      />

      {/* Modal de edição */}
      <NewOrderDialog
        open={editingOrder !== null}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        order={editingOrder}
      />
    </div>
  )
}
