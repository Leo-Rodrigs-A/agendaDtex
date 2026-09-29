import { AnimatePresence, motion } from 'framer-motion'
import { cn } from 'cn'
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
  // Identifica o período visível. Ao navegar com os chevrons a âncora
  // muda, a key muda e o AnimatePresence é remontado — a troca de período
  // é instantânea, sem animação. Concluir um pedido não mexe na âncora,
  // então o exit do card roda normalmente.
  const periodKey = days[0]?.getTime() ?? 0

  return (
    <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto">
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
                'flex shrink-0 items-center justify-between px-4 py-3 text-sm font-semibold',
                today && 'bg-primary/10 text-primary',
                today && 'border-primary',
                weekend && 'bg-muted/30',
                !today && !weekend && 'bg-card',
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

            {/* Lista de pedidos com scroll. O estado vazio mora dentro do
                AnimatePresence (com key própria) para que concluir o ÚLTIMO
                pedido do dia ainda rode a saída do card. */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
              <AnimatePresence initial={false} key={periodKey}>
                {dayOrders.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full items-center justify-center text-sm text-muted-foreground"
                  >
                    Nenhum pedido
                  </motion.div>
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
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}
