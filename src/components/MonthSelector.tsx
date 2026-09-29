import { useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFilters } from '@/components/FilterProvider'

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const short = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(
    new Date(2000, i, 1),
  )
  // "set." -> "Set", "jan." -> "Jan"
  const clean = short.replace('.', '')
  return clean.charAt(0).toUpperCase() + clean.slice(1)
})

type MonthSelectorProps = {
  /** Mês controlado (0-11). Se omitido, usa FilterProvider */
  month?: number
  /** Ano controlado. Se omitido, usa FilterProvider */
  year?: number
  /** Callback ao alterar mês/ano. Se omitido, usa FilterProvider.setMonthYear */
  onChange?: (month: number, year: number) => void
  /** Texto do gatilho. Se omitido, mostra apenas "Mês Ano" */
  label?: string
}

export function MonthSelector({
  month,
  year,
  onChange,
  label,
}: MonthSelectorProps = {}) {
  const { month: globalMonth, year: globalYear, setMonthYear } = useFilters()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year ?? globalYear)

  const effectiveMonth = month ?? globalMonth
  const effectiveYear = year ?? globalYear

  const handleMonthChange = (nextMonth: number, nextYear: number) => {
    if (onChange) {
      onChange(nextMonth, nextYear)
    } else {
      setMonthYear(nextMonth, nextYear)
    }
    setOpen(false)
  }

  const rawLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(effectiveYear, effectiveMonth, 1))
  const monthAndYear = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setViewYear(effectiveYear)
      }}
    >
      <PopoverTrigger
        render={<Button variant="outline" className="gap-2 font-normal" />}
      >
        <CalendarRange className="h-4 w-4" />
        {label ?? monthAndYear}
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewYear((y) => y - 1)}
            aria-label="Ano anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewYear((y) => y + 1)}
            aria-label="Próximo ano"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((monthLabel, i) => {
            const isSelected =
              i === effectiveMonth && viewYear === effectiveYear
            return (
              <Button
                key={monthLabel}
                variant={isSelected ? 'default' : 'ghost'}
                className="w-full"
                onClick={() => handleMonthChange(i, viewYear)}
              >
                {monthLabel}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
