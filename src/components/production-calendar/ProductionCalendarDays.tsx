import { cn } from 'cn'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isToday, isWeekend } from '@/lib/production-calendar'
import type { Order } from '@/types'
import { ProductionCalendarOrder } from './ProductionCalendarOrder'

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
              'flex flex-col flex-1 min-w-0 bg-card rounded-xl border border-border overflow-hidden',
              today && 'bg-primary/10',
              weekend && 'bg-muted/30',
            )}
          >
            {/* Header do dia */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3 text-sm font-semibold border-b border-border',
                today && 'bg-primary/10 text-primary',
                today && 'border-primary',
              )}
            >
              <span className={cn('font-semibold', today && 'text-primary')}>
                {DAY_FORMATTER.format(day)}
              </span>
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
                  <ProductionCalendarOrder
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                    onFollowClick={onFollowClick}
                    variant="card"
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
