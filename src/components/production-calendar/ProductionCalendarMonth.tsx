import { cn } from 'cn'
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
  getOrdersForDay,
} from '@/lib/production-calendar'
import type { Order } from '@/types'

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type ProductionCalendarMonthProps = {
  grouped: Map<string, Order[]>
  anchorDate: Date
  onExpandDay: (day: Date) => void
}

/**
 * Contador de pedidos do dia — abre a visão de 3 dias a partir dele.
 * Todos os pedidos no mapa estão pendentes por construção: quem monta o
 * `grouped` (`groupOrdersByProductionDate`) já descarta `is_done`.
 */
function DayCountButton({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  const label = `${count} ${count === 1 ? 'pedido pendente' : 'pedidos pendentes'}`
  const actionLabel =
    count === 1
      ? 'Ver o pedido pendente'
      : `Ver todos os ${count} pedidos pendentes`

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
            onClick={onClick}
            aria-label={actionLabel}
          >
            {label}
          </button>
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        {actionLabel}
      </TooltipContent>
    </Tooltip>
  )
}

export function ProductionCalendarMonth({
  grouped,
  anchorDate,
  onExpandDay,
}: ProductionCalendarMonthProps) {
  const gridDays = getMonthGridDays(anchorDate)

  return (
    <div className="flex-1 min-h-[360px] flex flex-col">
      {/* Container do calendário com borda e cantos arredondados */}
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
        {/* Cabeçalho dos dias da semana - com linha divisória inferior */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {DAYS_SHORT.map((day) => (
            <div
              key={day}
              className="flex h-10 shrink-0 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células do calendário - o grid cresce junto com o card.
            O piso de altura fica no wrapper de fora para o card inteiro
            estourar (e rolar) em vez de a última semana ser cortada */}
        <div className="flex-1 grid grid-cols-7">
          {gridDays.map((day, index) => {
            const dayOrders = getOrdersForDay(grouped, day)
            const today = isToday(day)
            const sameMonth = isSameMonth(day, anchorDate)
            const weekend = isWeekend(day)

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
                </div>

                {/* Contador de pedidos: a célula não lista mais os pedidos
                    (nome, imagem, conclusão) — só quantos são e um atalho
                    para a visão de 3 dias, onde o card completo aparece. */}
                <div className="flex-1 min-h-0 overflow-hidden p-1.5">
                  {dayOrders.length > 0 && (
                    <DayCountButton
                      count={dayOrders.length}
                      onClick={() => onExpandDay(day)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
