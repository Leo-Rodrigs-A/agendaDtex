import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MonthSelector } from '@/components/MonthSelector'
import { cn } from 'cn'

type ProductionCalendarToolbarProps = {
  scope: 'all' | 'mine'
  onScopeChange: (scope: 'all' | 'mine') => void
  view: 'month' | '7-days' | '3-days'
  onViewChange: (view: 'month' | '7-days' | '3-days') => void
  periodLabel: string
  anchorDate: Date
  onMonthChange: (month: number, year: number) => void
}

export function ProductionCalendarToolbar({
  scope,
  onScopeChange,
  view,
  onViewChange,
  periodLabel,
  anchorDate,
  onMonthChange,
}: ProductionCalendarToolbarProps) {
  const viewLabels = {
    month: 'Mês',
    '7-days': '7 dias',
    '3-days': '3 dias',
  } as const

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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={({ open, ref, ...props }) => (
                <Button
                  ref={ref}
                  {...props}
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                >
                  {viewLabels[view]}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      open && 'rotate-180',
                    )}
                  />
                </Button>
              )}
            />
            <DropdownMenuContent align="end" className="w-40">
              {(['month', '7-days', '3-days'] as const).map((v) => (
                <DropdownMenuItem
                  key={v}
                  className={`flex cursor-pointer items-center ${
                    view === v ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => onViewChange(v)}
                >
                  {viewLabels[v]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Linha 2 no mobile / Linha única no desktop: MonthSelector + View dropdown (desktop) */}
      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
        {/* View dropdown (desktop) - hidden lg:block */}
        <div className="hidden lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={({ open, ref, ...props }) => (
                <Button
                  ref={ref}
                  {...props}
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                >
                  {viewLabels[view]}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      open && 'rotate-180',
                    )}
                  />
                </Button>
              )}
            />
            <DropdownMenuContent align="end" className="w-40">
              {(['month', '7-days', '3-days'] as const).map((v) => (
                <DropdownMenuItem
                  key={v}
                  className={`flex cursor-pointer items-center ${
                    view === v ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => onViewChange(v)}
                >
                  {viewLabels[v]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Month selector */}
        <MonthSelector
          month={anchorDate.getMonth()}
          year={anchorDate.getFullYear()}
          onChange={onMonthChange}
        />
      </div>
    </div>
  )
}

const viewLabels = {
  month: 'Mês',
  '7-days': '7 dias',
  '3-days': '3 dias',
} as const
