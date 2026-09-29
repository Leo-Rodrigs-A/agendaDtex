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
  getMonthGridDays,
} from '@/lib/production-calendar'
import type { Order } from '@/types'
import { ProductionCalendarOrder } from './ProductionCalendarOrder'

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
      <div className="grid grid-cols-7 gap-px bg-border p-px rounded-xl bg-card">
        {/* Cabeçalho dos dias da semana */}
        {DAYS_SHORT.map((day, i) => (
          <div
            key={day}
            className={cn(
              'h-10 bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground',
              i === 0 && 'rounded-tl-xl',
              i === 6 && 'rounded-tr-xl',
            )}
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

          const isFirstCol = index % 7 === 0
          const isLastCol = index % 7 === 6
          const isFirstRow = index < 7
          const isLastRow = index >= gridDays.length - 7

          return (
            <div
              key={index}
              className={cn(
                'relative min-h-[100px] bg-card flex flex-col',
                !sameMonth && 'bg-muted/30 text-muted-foreground/50',
                weekend && sameMonth && 'bg-muted/30',
                isFirstCol && 'rounded-l-xl',
                isLastCol && 'rounded-r-xl',
                isFirstRow && 'rounded-t-xl',
                isLastRow && 'rounded-b-xl',
              )}
            >
              {/* Data */}
              <div className="flex items-center justify-between p-1.5">
                <span
                  className={cn(
                    'text-xs font-medium',
                    today && 'bg-primary text-primary-foreground rounded px-1.5 py-0.5',
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
                  <ProductionCalendarOrder
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                    onFollowClick={onFollowClick}
                    variant="cell"
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
