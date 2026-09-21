import type { Order, User } from '@/types'
import { formatBRL } from '@/lib/orders'
import { parseDateKey } from '@/lib/dates'
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

type OrdersTableProps = {
  orders: Array<Order>
  users: Array<User>
  /** /pedidos mostra vendedor e data de entrega; a home mostra só o essencial. */
  showSeller?: boolean
  showDeliveryDate?: boolean
  emptyMessage?: string
}

export function OrdersTable({
  orders,
  users,
  showSeller = false,
  showDeliveryDate = false,
  emptyMessage = 'Nenhum pedido encontrado.',
}: OrdersTableProps) {
  const sellerName = (userId: string) =>
    users.find((u) => u.id === userId)?.name ?? '—'

  const formatCreatedAt = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome do pedido</TableHead>
          {showSeller && <TableHead>Vendedor</TableHead>}
          <TableHead className="text-right">Camisetas</TableHead>
          <TableHead className="text-right">Shorts/Outros</TableHead>
          <TableHead>Encomendado em</TableHead>
          {showDeliveryDate && <TableHead>Entrega</TableHead>}
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5 + (showSeller ? 1 : 0) + (showDeliveryDate ? 1 : 0)}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_name}</TableCell>
              {showSeller && <TableCell>{sellerName(order.user_id)}</TableCell>}
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
  )
}
