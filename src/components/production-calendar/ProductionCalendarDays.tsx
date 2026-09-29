import { cn } from 'cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  isToday,
  isWeekend,
  truncateOrderName,
} from '@/lib/production-calendar'
import type { Order } from '@/types'

const DAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

type ProductionCalendarDaysProps = {
  grouped: Map<string, Order[]>
  days: Date[]
  onOrderClick: (order: Order) => void
  onFollowClick: (order: Order, e: React.MouseEvent) => void
}

export function ProductionCalendarDays({
  grouped,
  days,
  onOrderClick,
  onFollowClick,
}: ProductionCalendarDaysProps) {
  return (
    <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto p-4 pb-8">
      {days.map((day) => {
        const dayOrders = grouped.get(day.toISOString().split('T')[0]) ?? []
        const today = isToday(day)
        const weekend = isWeekend(day)

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'flex flex-col min-w-[280px] max-w-[320px] flex-1 bg-card rounded-xl border border-border overflow-hidden',
              today && 'ring-2 ring-primary',
              weekend && 'bg-muted/30',
            )}
          >
            {/* Header do dia */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3 text-sm font-semibold border-b border-border',
                today && 'bg-primary text-primary-foreground',
                today && 'border-primary',
              )}
            >
              <span>{DAY_FORMATTER.format(day)}</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  dayOrders.length > 0
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {dayOrders.length} pedido{dayOrders.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Lista de pedidos com scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
              {dayOrders.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhum pedido
                </div>
              ) : (
                dayOrders.map((order) => (
                  <ProductionCalendarOrderCard
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                    onFollowClick={onFollowClick}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProductionCalendarOrderCard({
  order,
  onClick,
  onFollowClick,
}: {
  order: Order
  onClick: (order: Order) => void
  onFollowClick: (order: Order, e: React.MouseEvent) => void
}) {
  const hasImage = Boolean(order.imgurl?.trim())
  const shortName = truncateOrderName(order.order_name)

  return (
    <div
      className="group relative flex items-center gap-2 rounded-lg px-3 py-2 bg-accent hover:bg-accent/80 cursor-pointer transition-colors"
      onClick={() => onClick(order)}
      title={order.order_name}
    >
      {hasImage && <span className="text-muted-foreground">📎</span>}
      <span className="truncate flex-1 text-sm">{shortName}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-primary transition-opacity"
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
        </TooltipTrigger>
        <TooltipContent side="right">Ir para o pedido</TooltipContent>
      </Tooltip>
    </div>
  )
}
