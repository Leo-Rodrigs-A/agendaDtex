import { cn } from 'cn'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  isToday,
  isSameMonth,
  isWeekend,
  truncateOrderName,
  getMonthGridDays,
} from '@/lib/production-calendar'
import type { Order } from '@/types'

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type ProductionCalendarMonthProps = {
  grouped: Map<string, Order[]>
  anchorDate: Date
  onExpandDay: (day: Date) => void
  onOrderClick: (order: Order) => void
  onFollowClick: (order: Order, e: React.MouseEvent) => void
}

export function ProductionCalendarMonth({
  grouped,
  anchorDate,
  onExpandDay,
  onOrderClick,
  onFollowClick,
}: ProductionCalendarMonthProps) {
  const gridDays = getMonthGridDays(anchorDate)
  const weeks = Math.ceil(gridDays.length / 7)

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="grid grid-cols-7 gap-px bg-border p-px">
        {/* Cabeçalho dos dias da semana */}
        {DAYS_SHORT.map((day, i) => (
          <div
            key={day}
            className="h-10 bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Células do calendário */}
        {gridDays.map((day, index) => {
          const dayOrders = grouped.get(day.toISOString().split('T')[0]) ?? []
          const today = isToday(day)
          const sameMonth = isSameMonth(day, anchorDate)
          const weekend = isWeekend(day)
          const hasMore = dayOrders.length > 3
          const visibleOrders = dayOrders.slice(0, 3)

          return (
            <div
              key={index}
              className={cn(
                'relative min-h-[100px] bg-card flex flex-col',
                !sameMonth && 'bg-muted/30 text-muted-foreground/50',
                today && 'ring-2 ring-primary',
                weekend && sameMonth && 'bg-muted/30',
              )}
            >
              {/* Data */}
              <div className="flex items-center justify-between p-1.5">
                <span
                  className={cn(
                    'text-xs font-medium',
                    today && 'text-primary',
                    !sameMonth && 'text-muted-foreground/50',
                  )}
                >
                  {day.getDate()}
                </span>
                {hasMore && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onExpandDay(day)
                        }}
                        aria-label={`Expandir ${dayOrders.length} pedidos`}
                      >
                        <CalendarClock className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      Ver todos os {dayOrders.length} pedidos
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Pedidos */}
              <div className="flex-1 min-h-0 overflow-hidden p-1.5 space-y-1">
                {visibleOrders.map((order) => (
                  <ProductionCalendarOrderCell
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                    onFollowClick={onFollowClick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductionCalendarOrderCell({
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
      className="group relative flex items-center gap-1.5 rounded px-1.5 py-1 text-xs bg-accent hover:bg-accent/80 cursor-pointer transition-colors"
      onClick={() => onClick(order)}
      title={order.order_name}
    >
      {hasImage && <span className="text-muted-foreground">📎</span>}
      <span className="truncate flex-1">{shortName}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-primary transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onFollowClick(order, e)
            }}
            aria-label="Ir para o pedido"
          >
            <svg
              className="h-3 w-3"
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
