import { useEffect, useState } from 'react'
import { ptBR } from 'react-day-picker/locale'
import {
  CalendarDays,
  CalendarClock,
  CalendarArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { DateMaskInput } from '@/components/DateMaskInput'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import { productionDateOf } from '@/lib/orders'
import {
  WEEKEND_MATCHER,
  holidayDates,
  shiftBusinessDay,
  toDateKey,
} from '@/lib/dates'

export function DaySelector({
  showLatestJump = true,
}: {
  /** Botão "dia de agendamento mais distante" — só faz sentido na home. */
  showLatestJump?: boolean
} = {}) {
  const { day, setDay } = useFilters()
  const { holidays, orders } = useData()
  const [open, setOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(day)

  // Se a data selecionada mudou (ex.: outro mês), o calendário abre nela
  useEffect(() => {
    if (open) setCalendarMonth(day)
  }, [open, day])

  const label = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(day)

  /** "Dia de agendamento": pula para a data de produção mais distante com
   *  pedido registrado. Não altera o mês dos KPIs (MonthSelector segue
   *  independente). */
  const jumpToLatestScheduledDay = () => {
    if (orders.length === 0) {
      toast.info('Nenhum pedido agendado ainda.')
      return
    }
    let latest = productionDateOf(orders[0], holidays)
    for (const order of orders) {
      const prod = productionDateOf(order, holidays)
      if (prod.getTime() > latest.getTime()) latest = prod
    }
    setDay(latest)
  }

  return (
    <div className="flex items-center gap-1">
      {(() => {
        const isToday = toDateKey(day) === toDateKey(new Date())
        return (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isToday}
                  onClick={() => setDay(new Date())}
                />
              }
            >
              <CalendarArrowDown className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Voltar para hoje</TooltipContent>
          </Tooltip>
        )
      })()}
      <Button
        variant="outline"
        size="icon"
        title="Dia útil anterior"
        onClick={() => setDay(shiftBusinessDay(day, -1, holidays))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" className="gap-2 font-normal" />}
        >
          <CalendarDays className="h-4 w-4" />
          {label}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="border-b border-border p-3">
            <DateMaskInput
              date={day}
              holidays={holidays}
              onSelect={(nextDay) => {
                setDay(nextDay)
                setCalendarMonth(nextDay)
              }}
            />
          </div>
          <Calendar
            mode="single"
            selected={day}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            onSelect={(nextDay) => {
              if (nextDay) {
                setDay(nextDay)
                setOpen(false)
              }
            }}
            locale={ptBR}
            // Fins de semana e feriados bloqueados (igual ao form de pedido)
            disabled={[WEEKEND_MATCHER, ...holidayDates(holidays)]}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        title="Próximo dia útil"
        onClick={() => setDay(shiftBusinessDay(day, 1, holidays))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {showLatestJump && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                onClick={jumpToLatestScheduledDay}
              />
            }
          >
            <CalendarClock className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Dia de agendamento mais distante</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
