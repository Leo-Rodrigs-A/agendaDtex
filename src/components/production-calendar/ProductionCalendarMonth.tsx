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
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Container do calendário com borda e cantos arredondados */}
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
        {/* Cabeçalho dos dias da semana - com linha divisória inferior */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {DAYS_SHORT.map((day, i) => (
            <div
              key={day}
              className="flex h-10 shrink-0 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células do calendário - flex para preencher altura.
            min-h evita que as linhas colapsem em janelas muito baixas: aí o
            card estoura e quem rola é o wrapper (overflow-auto), não a página */}
        <div className="flex-1 grid min-h-[360px] grid-cols-7">
          {gridDays.map((day, index) => {
            const dayOrders = grouped.get(day.toISOString().split('T')[0]) ?? []
            const today = isToday(day)
            const sameMonth = isSameMonth(day, anchorDate)
            const weekend = isWeekend(day)
            const hasMore = dayOrders.length > 3
            const visibleOrders = dayOrders.slice(0, 3)

            const isLastCol = index % 7 === 6
            const isLastRow = index >= gridDays.length - 7

            return (
              <div
                key={index}
                className={cn(
                  'relative flex flex-col min-h-0 bg-card',
                  !sameMonth && 'bg-muted text-muted-foreground/50',
                  weekend && sameMonth && 'bg-muted',
                  !isLastCol && 'border-r border-border',
                  !isLastRow && 'border-b border-border',
                )}
              >
                {/* Data */}
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-between p-1.5',
                    !sameMonth && 'bg-muted',
                    weekend && sameMonth && 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium',
                      today &&
                        'bg-primary text-primary-foreground rounded px-1.5 py-0.5',
                      !sameMonth && 'text-muted-foreground/50',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {hasMore && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-accent cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              onExpandDay(day)
                            }}
                            aria-label={`Expandir ${dayOrders.length} pedidos`}
                          >
                            <CalendarClock className="h-3 w-3" />
                          </Button>
                        }
                      >
                        <CalendarClock className="h-3 w-3" />
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
    </div>
  )
}
