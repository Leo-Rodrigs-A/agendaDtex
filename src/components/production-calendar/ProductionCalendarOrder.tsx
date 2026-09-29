import { cn } from 'cn'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FileText } from 'lucide-react'
import { OrderDoneCheckbox } from '@/components/OrderDoneCheckbox'
import { truncateOrderName } from '@/lib/production-calendar'
import type { Order } from '@/types'

type ProductionCalendarOrderProps = {
  order: Order
  onClick: (order: Order) => void
  onFollowClick: (order: Order, e: React.MouseEvent) => void
  /** Variante visual: 'cell' (compacta p/ grid mensal) ou 'card' (completa p/ visão dias) */
  variant?: 'cell' | 'card'
}

export function ProductionCalendarOrder({
  order,
  onClick,
  onFollowClick,
  variant = 'card',
}: ProductionCalendarOrderProps) {
  const hasImage = Boolean(order.imgurl?.trim())
  const shortName = truncateOrderName(order.order_name)

  const isCell = variant === 'cell'

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded px-1.5 py-1 bg-accent hover:bg-accent/80 cursor-pointer transition-colors',
        isCell && 'px-1.5 py-1 text-xs',
        !isCell && 'px-3 py-2 text-sm rounded-lg',
      )}
      onClick={() => onClick(order)}
      title={order.order_name}
    >
      {/* Conclusão: só nas visões por dia. O clique no checkbox não
          chega ao card (stopPropagation) — o pedido não é concluído e
          a imagem não abre ao mesmo tempo. `after:hidden` remove a área
          de clique ampliada do checkbox, que aqui invadiria o ícone e o
          nome do pedido. */}
      {!isCell && <OrderDoneCheckbox order={order} className="after:hidden" />}
      {hasImage && <FileText className="h-3.5 w-3.5 text-primary" />}
      <span className="truncate flex-1">{shortName}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-primary transition-opacity transition-colors',
                isCell && 'p-0.5',
              )}
              onClick={(e) => {
                e.stopPropagation()
                onFollowClick(order, e)
              }}
              aria-label="Ir para o pedido"
            >
              <svg
                className={cn('h-4 w-4', isCell && 'h-3 w-3')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          }
        >
          <svg
            className={cn('h-4 w-4', isCell && 'h-3 w-3')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </TooltipTrigger>
        <TooltipContent side="right">Ir para o pedido</TooltipContent>
      </Tooltip>
    </div>
  )
}
