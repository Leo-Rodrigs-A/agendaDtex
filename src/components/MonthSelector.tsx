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

export function MonthSelector() {
  const { month, year, setMonthYear } = useFilters()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year)

  const rawLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1))
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setViewYear(year)
      }}
    >
      <PopoverTrigger
        render={<Button variant="outline" className="gap-2 font-normal" />}
      >
        <CalendarRange className="h-4 w-4" />
        {label}
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
            const isSelected = i === month && viewYear === year
            return (
              <Button
                key={monthLabel}
                variant={isSelected ? 'default' : 'ghost'}
                className="w-full"
                onClick={() => {
                  setMonthYear(i, viewYear)
                  setOpen(false)
                }}
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
