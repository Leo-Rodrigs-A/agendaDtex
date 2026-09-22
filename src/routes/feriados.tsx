import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'cn'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddHolidayDialog } from '@/components/AddHolidayDialog'
import { useData } from '@/components/DataProvider'
import { parseDateKey, toDateKey } from '@/lib/dates'
import type { Holiday } from '@/types'

export const Route = createFileRoute('/feriados')({
  component: FeriadosPage,
})

type ViewMode = 'list' | 'grid'

const VIEW_KEY = 'dtex-holidays-view'
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

function FeriadosPage() {
  const { holidays, isLoading, error } = useData()

  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list',
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredHolidays = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? holidays.filter((h) =>
          h.holiday_description.toLowerCase().includes(term),
        )
      : [...holidays]
    return filtered.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
  }, [holidays, search])

  const todayKey = toDateKey(new Date())

  const changeView = (next: ViewMode) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Toolbar: título à esquerda, busca no centro, ações à direita */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="shrink-0">
          <h2 className="text-lg font-semibold">Feriados</h2>
          <p className="text-sm text-muted-foreground">
            {filteredHolidays.length} de {holidays.length} cadastrados
          </p>
        </div>

        <div className="relative w-full lg:mx-auto lg:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar feriado..."
            className="pl-9"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              title="Visualizar em lista"
              onClick={() => changeView('list')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Visualizar em grade"
              onClick={() => changeView('grid')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar Feriado
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Carregando feriados…
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search
              ? 'Nenhum feriado encontrado para essa busca.'
              : 'Nenhum feriado registrado no sistema por enquanto.'}
          </div>
        ) : view === 'list' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Feriado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.holiday_date}>
                  <TableCell className="w-48 tabular-nums">
                    {dateFormatter.format(parseDateKey(holiday.holiday_date))}
                  </TableCell>
                  <TableCell className="font-medium">
                    {holiday.holiday_description}
                    {holiday.holiday_date === todayKey && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        hoje
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <HolidayGrid holidays={filteredHolidays} todayKey={todayKey} />
        )}
      </div>

      <AddHolidayDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

function HolidayGrid({
  holidays,
  todayKey,
}: {
  holidays: Array<Holiday>
  todayKey: string
}) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {holidays.map((holiday) => {
        const date = parseDateKey(holiday.holiday_date)
        const isToday = holiday.holiday_date === todayKey
        return (
          <div
            key={holiday.holiday_date}
            className={cn(
              'flex items-center gap-4 rounded-lg border border-border bg-background p-4 shadow-sm',
              isToday && 'border-primary/40',
            )}
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="text-lg leading-none font-bold tabular-nums">
                {String(date.getDate()).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase">
                {new Intl.DateTimeFormat('pt-BR', { month: 'short' })
                  .format(date)
                  .replace('.', '')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {holiday.holiday_description}
              </p>
              <p className="text-xs text-muted-foreground">
                {dateFormatter.format(date)}
                {isToday && ' · hoje'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
