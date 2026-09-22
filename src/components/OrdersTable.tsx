import { useState } from 'react'
import { ImageOff, Image as ImageIcon } from 'lucide-react'
import type { Order, User } from '@/types'
import { formatBRL } from '@/lib/orders'
import { parseDateKey } from '@/lib/dates'
import { driveImageSrc } from '@/lib/drive'
import { Button } from '@/components/ui/button'
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
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  <OrderImageButton order={order} />
                  <span className="truncate">{order.order_name}</span>
                </div>
              </TableCell>
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
