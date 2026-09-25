import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'cn'
import {
  CalendarCheck2,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  CalendarDays,
} from 'lucide-react'
import { DaySelector } from '@/components/DaySelector'
import { MonthSelector } from '@/components/MonthSelector'
import { OrdersTable } from '@/components/OrdersTable'
import { ProductionChart } from '@/components/ProductionChart'
import { KpiPair } from '@/components/KpiPair'
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import { businessDaysForward } from '@/lib/dates'
import { useActiveUser } from '@/components/UserProvider'
import {
  DAILY_PIECE_QUOTA,
  DAILY_ORDER_QUOTA,
  averageTicket,
  formatBRL,
  ordersCreatedInMonth,
  ordersForProductionDay,
  sumPieces,
  sumRevenue,
} from '@/lib/orders'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { day, month, year } = useFilters()
  const { orders, users, holidays, isLoading, error } = useData()
  const { activeUser } = useActiveUser()

  // Visão ativa: dia ou mês (segmented da top bar, em todos os breakpoints)
  const [activeTab, setActiveTab] = useState<'day' | 'month'>('day')

  // Escopo global (só admin): afeta KPIs de dia, KPIs de mês e tabela do dia.
  // Não-admin: dia vê todos (como antes) e mês vê os próprios (como antes).
  const isAdmin = activeUser?.role === 'admin'
  const [scope, setScope] = useState<'all' | 'mine'>('all')

  const dayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(day)

  // O dia selecionado representa a data de PRODUÇÃO; o hint entre parênteses
  // é a data de entrega correspondente (2 dias úteis à frente).
  const deliveryDay = businessDaysForward(day, 2, holidays)
  const deliveryDayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(deliveryDay)

  const rawMonthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
  }).format(new Date(year, month, 1))
  const monthLabel =
    rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1)

  // ---- Grupo Dia (por data de produção = 2 dias úteis antes da entrega) ----
  const dayOrders = ordersForProductionDay(orders, day, holidays)
  const dayScoped =
    isAdmin && scope === 'mine'
      ? dayOrders.filter((o) => o.user_id === activeUser.id)
      : dayOrders
  const dayScopePieces = sumPieces(dayScoped)
  const dayScopeRevenue = sumRevenue(dayScoped)
  const dayCount = dayScoped.length
  const dayPieces = sumPieces(dayScoped)
  const overOrderQuota = dayCount > DAILY_ORDER_QUOTA
  const overPieceQuota = dayPieces > DAILY_PIECE_QUOTA
  const capacityPct = Math.min((dayPieces / DAILY_PIECE_QUOTA) * 100, 100)

  // ---- Grupo Mês (por data de encomenda) ----
  const monthShowAll = isAdmin && scope === 'all'
  const monthOrders = ordersCreatedInMonth(orders, month, year).filter(
    (o) => monthShowAll || o.user_id === activeUser?.id,
  )
  const monthCount = monthOrders.length
  const monthPieces = sumPieces(monthOrders)
  const monthRevenue = sumRevenue(monthOrders)
  const monthTicket = averageTicket(monthOrders)

  const prevDate = new Date(year, month - 1, 1)
  const prevMonthOrders = ordersCreatedInMonth(
    orders,
    prevDate.getMonth(),
    prevDate.getFullYear(),
  ).filter((o) => monthShowAll || o.user_id === activeUser?.id)
  const growthPct =
    prevMonthOrders.length > 0
      ? Math.round(
          ((monthCount - prevMonthOrders.length) / prevMonthOrders.length) *
            100,
        )
      : null

  // Escopo global Todos/Somente eu (só admin) — usado nas duas posições
  // de breakpoint da top bar (mobile na 1ª linha; sm+ ao lado do seletor)
  const scopeSeg = (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => setScope('all')}
        className={cn(
          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
          scope === 'all'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Todos
      </button>
      <button
        type="button"
        onClick={() => setScope('mine')}
        className={cn(
          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
          scope === 'mine'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Somente eu
      </button>
    </div>
  )

  return (
    <div className="space-y-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-6 lg:space-y-0">
      {error && (
        <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Top bar unificada (mesma lógica de /producao):
          mobile → linha 1: segmented Dia/Mês (esq) + Todos/Eu (dir, admin);
                   linha 2: seletor do período centralizado.
          sm+ → linha única: segmented à esquerda; escopo + seletor à direita */}
      <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:contents">
          <div className="inline-flex items-center gap-1 self-start rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setActiveTab('day')}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'day'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Dia
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Mês
            </button>
          </div>
          {/* Escopo no mobile (1ª linha, à direita) */}
          {isAdmin && <div className="sm:hidden">{scopeSeg}</div>}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          {/* Escopo no desktop (ao lado do seletor) */}
          {isAdmin && <div className="hidden sm:block">{scopeSeg}</div>}
          {activeTab === 'day' ? <DaySelector /> : <MonthSelector />}
        </div>
      </div>

      {activeTab === 'day' ? (
        <>
          {/* KPIs do dia — altura estável: linhas condicionais reservam espaço */}
          <section className="shrink-0 space-y-4">
            <p className="text-muted-foreground">
              Visão diária{' '}
              <span className="font-medium text-primary">{dayLabel}</span>{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({deliveryDayLabel})
              </span>
              .
            </p>
            <KpiPair>
              <div
                key="day-orders"
                className="flex h-full items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pedidos para{' '}
                    <span className="font-medium text-primary">{dayLabel}</span>{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({deliveryDayLabel})
                    </span>
                  </p>
                  <h3
                    className={cn(
                      'mt-1 text-3xl font-bold',
                      overOrderQuota && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {isLoading ? '…' : dayCount}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {overOrderQuota
                      ? `acima da recomendação (${DAILY_ORDER_QUOTA}/dia)`
                      : `${dayPieces} peças alocadas`}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <CalendarCheck className="h-6 w-6" />
                </div>
              </div>

              <div
                key="day-capacity"
                className="h-full rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Capacidade em{' '}
                    <span className="font-medium text-primary">{dayLabel}</span>{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({deliveryDayLabel})
                    </span>
                  </span>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={cn(
                      'text-3xl font-bold',
                      overPieceQuota && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {isLoading ? '…' : `${dayPieces} / ${DAILY_PIECE_QUOTA}`}
                  </span>
                  <span className="text-xs text-muted-foreground">peças</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      overPieceQuota ? 'bg-amber-500' : 'bg-primary',
                    )}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
                {/* Linha sempre presente (&nbsp; quando vazia): o card
                    nunca muda de altura ao estourar/voltar da cota */}
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {overPieceQuota
                    ? 'cota estourada — considere o próximo dia útil'
                    : ' '}
                </p>
              </div>
            </KpiPair>
          </section>

          {/* Tabela do dia: estica e rola internamente no desktop */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 shrink-0">
              <h3 className="text-lg font-semibold">
                Pedidos para{' '}
                <span className="font-medium text-primary">{dayLabel}</span>{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({deliveryDayLabel})
                </span>
              </h3>
            </div>
            <p className="mb-4 shrink-0 text-sm text-muted-foreground">
              {isLoading
                ? 'Carregando pedidos…'
                : `${dayScoped.length} pedidos · ${dayScopePieces} peças · ${formatBRL(dayScopeRevenue)} em vendas`}
            </p>
            {isLoading ? (
              <div className="flex h-64 flex-1 items-center justify-center text-muted-foreground">
                Carregando pedidos…
              </div>
            ) : (
              <div className="min-h-0 flex-1 lg:overflow-y-auto">
                <OrdersTable
                  orders={dayScoped}
                  users={users}
                  variant="day"
                  emptyMessage="Nenhum pedido para este dia."
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* KPIs do mês — altura estável: linha de crescimento usa
              `invisible` quando inexistente (bloco composto: ícone + texto) */}
          <section className="shrink-0 space-y-4">
            <p className="text-muted-foreground">
              Acompanhamento mensal {monthLabel}.
            </p>
            <KpiPair>
              <div
                key="month-orders"
                className="flex h-full items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pedidos em {monthLabel}
                  </p>
                  <h3 className="mt-1 text-3xl font-bold">
                    {isLoading ? '…' : monthCount}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {monthPieces} peças encomendadas
                  </p>
                  {/* Bloco composto → `invisible` reserva a linha inteira */}
                  <p
                    className={cn(
                      'mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400',
                      growthPct === null && 'invisible',
                    )}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {growthPct !== null && (
                      <>
                        {growthPct >= 0 ? '+' : ''}
                        {growthPct}% que o mês passado
                      </>
                    )}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarCheck2 className="h-6 w-6" />
                </div>
              </div>

              <div
                key="month-revenue"
                className="flex h-full items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor Vendido em {monthLabel}
                  </p>
                  <h3 className="mt-1 text-3xl font-bold">
                    {isLoading ? '…' : formatBRL(monthRevenue)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ticket médio {formatBRL(monthTicket)}
                  </p>
                  {/* Espelho da linha de crescimento do card vizinho:
                      mantém os dois cards do par com a mesma altura */}
                  <p className="invisible mt-1 text-xs"> </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </KpiPair>
          </section>

          {/* Visão mês: gráfico com altura própria (não estica) */}
          <div className="shrink-0">
            <ProductionChart orders={orders} />
          </div>
        </>
      )}
    </div>
  )
}
