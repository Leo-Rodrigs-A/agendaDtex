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
import {
  WEEKEND_MATCHER,
  holidayDates,
  parseDateKey,
  shiftBusinessDay,
  toDateKey,
} from '@/lib/dates'

export function DaySelector() {
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

  /** "Dia de agendamento": pula para a data mais alta com pedido registrado.
   *  Não altera o mês dos KPIs (MonthSelector segue independente). */
  const jumpToLatestScheduledDay = () => {
    const dates = orders.map((o) => o.delivery_date).filter(Boolean)
    if (dates.length === 0) {
      toast.info('Nenhum pedido agendado ainda.')
      return
    }
    const latest = dates.reduce((a, b) => (a > b ? a : b))
    setDay(parseDateKey(latest))
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
    </div>
  )
}
