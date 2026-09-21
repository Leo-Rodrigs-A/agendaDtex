import { useState } from 'react'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import { WEEKEND_MATCHER, holidayDates } from '@/lib/dates'

function shiftDay(day: Date, delta: number): Date {
  const next = new Date(day)
  next.setDate(next.getDate() + delta)
  return next
}

export function DaySelector() {
  const { day, setDay } = useFilters()
  const { holidays } = useData()
  const [open, setOpen] = useState(false)

  const label = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(day)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        title="Dia anterior"
        onClick={() => setDay(shiftDay(day, -1))}
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
            onSelect={(nextDay) => {
              if (nextDay) {
                setDay(nextDay)
                setOpen(false)
              }
            }}
            locale={ptBR}
            modifiers={{
              weekend: WEEKEND_MATCHER,
              holiday: holidayDates(holidays),
            }}
            modifiersClassNames={{
              weekend: 'text-muted-foreground/50',
              holiday: 'text-muted-foreground/50',
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        title="Próximo dia"
        onClick={() => setDay(shiftDay(day, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
