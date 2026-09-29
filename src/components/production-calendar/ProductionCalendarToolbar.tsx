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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border bg-background">
      {/* Scope selector - segmented control inline */}
      <div className="flex w-full sm:w-auto" role="group" aria-label="Escopo">
        {(['all', 'mine'] as const).map((s) => (
          <Button
            key={s}
            variant={scope === s ? 'default' : 'outline'}
            className={cn(
              'flex-1 sm:flex-none',
              scope === s && 'bg-primary text-primary-foreground',
            )}
            onClick={() => onScopeChange(s)}
          >
            {s === 'all' ? 'Todos' : 'Somente eu'}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center gap-3">
        {/* View selector */}
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
