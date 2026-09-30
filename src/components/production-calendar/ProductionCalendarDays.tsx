import { AnimatePresence, motion } from 'framer-motion'
import { cn } from 'cn'
import { toDateKey, isToday, isWeekend } from '@/lib/dates'
import { getOrdersForDay } from '@/lib/production-calendar'
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
    // Um único scrollport: arrastar o contêiner leva os cards juntos.
    // `flex gap-3` sem wrap — os cards fluem na horizontal, não quebram linha.
    <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto">
      {days.map((day) => {
        const dayOrders = getOrdersForDay(grouped, day)
        const today = isToday(day)
        const weekend = isWeekend(day)

        return (
          <div
            key={toDateKey(day)}
            className={cn(
              // `min-w-[300px]` impede o card de encolher abaixo de 300px:
              // somados ao gap, os 7 dias da semana não cabem num celular,
              // e o contêiner passa a rolar. `flex-1` (basis 0) deixa o
              // card crescer para preencher a sobra em telas largas — no
              // desktop os 3/7 dias continuam dividindo a largura toda.
              'flex flex-col flex-1 min-w-[300px] bg-card rounded-xl border border-border overflow-hidden',
              weekend && 'bg-muted/30',
            )}
          >
            {/* Header do dia */}
            <div
              className={cn(
                'flex shrink-0 items-center justify-between px-4 py-3 text-sm font-semibold',
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
