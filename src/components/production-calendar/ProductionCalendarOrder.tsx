import { motion } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FileText } from 'lucide-react'
import { OrderDoneCheckbox } from '@/components/OrderDoneCheckbox'
import type { Order } from '@/types'

type ProductionCalendarOrderProps = {
  order: Order
  onClick: (order: Order) => void
  onFollowClick: (order: Order, e: React.MouseEvent) => void
}

export function ProductionCalendarOrder({
  order,
  onClick,
  onFollowClick,
}: ProductionCalendarOrderProps) {
  const hasImage = Boolean(order.imgurl?.trim())
  const orderName = order.order_name

  return (
    // A altura anima num wrapper sem padding, para colapsar até 0 no exit;
    // o `AnimatePresence` do `ProductionCalendarDays` roda esta saída
    // quando o `DataProvider` remove o pedido concluído.
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, x: -20 }}
    >
      <div
        className="group relative flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm transition-colors hover:bg-accent/80 cursor-pointer"
        onClick={() => onClick(order)}
        title={order.order_name}
      >
        {/* O clique no checkbox não chega ao card (stopPropagation) — o
            pedido não é concluído e a imagem não abre ao mesmo tempo.
            `after:hidden` remove a área de clique ampliada do checkbox,
            que aqui invadiria o ícone e o nome do pedido. */}
        <OrderDoneCheckbox order={order} className="after:hidden" />
        {hasImage && <FileText className="h-3.5 w-3.5 text-primary" />}
        <span className="truncate flex-1">{orderName}</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity transition-colors group-hover:opacity-100 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  onFollowClick(order, e)
                }}
                aria-label="Ir para o pedido"
              >
                <svg
                  className="h-4 w-4"
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
              className="h-4 w-4"
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
    </motion.div>
  )
}
