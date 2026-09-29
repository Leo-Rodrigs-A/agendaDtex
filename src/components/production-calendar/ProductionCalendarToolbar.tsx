import { useState } from 'react'
import {
  CalendarArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MonthSelector } from '@/components/MonthSelector'
import { isSameMonth, isToday } from '@/lib/production-calendar'
import type { CalendarView } from '@/lib/production-calendar'
import { cn } from 'cn'

const VIEW_LABELS = {
  month: 'Mês',
  '7-days': '7 dias',
  '3-days': '3 dias',
} as const

/** Seletor de visão — usado no mobile e no desktop */
function ViewDropdown({
  view,
  onViewChange,
}: {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="gap-2 w-full sm:w-auto" />}
      >
        {VIEW_LABELS[view]}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
          <DropdownMenuItem
            key={v}
            className={cn(
              'flex cursor-pointer items-center',
              view === v && 'bg-accent text-accent-foreground',
            )}
            onClick={() => onViewChange(v)}
          >
            {VIEW_LABELS[v]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type ProductionCalendarToolbarProps = {
  scope: 'all' | 'mine'
  onScopeChange: (scope: 'all' | 'mine') => void
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  periodLabel: string
  anchorDate: Date
  onMonthChange: (month: number, year: number) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function ProductionCalendarToolbar({
  scope,
  onScopeChange,
  view,
  onViewChange,
  periodLabel,
  anchorDate,
  onMonthChange,
  onPrev,
  onNext,
  onToday,
}: ProductionCalendarToolbarProps) {
  // "Hoje" já selecionado: no mês é o mês atual, nas visões por dia é o próprio dia
  const atToday =
    view === 'month' ? isSameMonth(anchorDate, new Date()) : isToday(anchorDate)

  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Linha 1: Segmented (Todos/Somente eu) + View Dropdown (mobile) */}
      <div className="flex items-center justify-between gap-2 lg:contents">
        {/* Segmented control - Todos / Somente eu (estilo idêntico ao da home) */}
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['all', 'mine'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onScopeChange(s)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                scope === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s === 'all' ? 'Todos' : 'Somente eu'}
            </button>
          ))}
        </div>

        {/* View dropdown (mobile) - lg:hidden */}
        <div className="lg:hidden">
          <ViewDropdown view={view} onViewChange={onViewChange} />
        </div>
      </div>

      {/* Linha 2 no mobile / Linha única no desktop: View dropdown + período */}
      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
        {/* View dropdown (desktop) - hidden lg:block */}
        <div className="hidden lg:block">
          <ViewDropdown view={view} onViewChange={onViewChange} />
        </div>

        {/* Navegação do período: [hoje] ‹ [período] › */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  disabled={atToday}
                  onClick={onToday}
                  aria-label="Voltar para hoje"
                />
              }
            >
              <CalendarArrowDown className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Voltar para hoje</TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            size="icon"
            title="Período anterior"
            aria-label="Período anterior"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <MonthSelector
            month={anchorDate.getMonth()}
            year={anchorDate.getFullYear()}
            onChange={onMonthChange}
            label={periodLabel}
          />

          <Button
            variant="outline"
            size="icon"
            title="Próximo período"
            aria-label="Próximo período"
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
