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
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import { useActiveUser } from '@/components/UserProvider'
import {
  DAILY_PIECE_QUOTA,
  DAILY_ORDER_QUOTA,
  averageTicket,
  formatBRL,
  ordersCreatedInMonth,
  ordersForDay,
  sumPieces,
  sumRevenue,
} from '@/lib/orders'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { day, month, year } = useFilters()
  const { orders, users, isLoading, error } = useData()
  const { activeUser } = useActiveUser()

  // Só relevante abaixo de lg: qual grupo (dia/mês) está visível.
  // Em lg+ os dois grupos aparecem lado a lado.
  const [activeTab, setActiveTab] = useState<'day' | 'month'>('day')

  const dayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(day)

  const rawMonthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
  }).format(new Date(year, month, 1))
  const monthLabel =
    rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1)

  // ---- Grupo Dia ----
  const dayOrders = ordersForDay(orders, day)
  const dayCount = dayOrders.length
  const dayPieces = sumPieces(dayOrders)
  const overOrderQuota = dayCount > DAILY_ORDER_QUOTA
  const overPieceQuota = dayPieces > DAILY_PIECE_QUOTA
  const capacityPct = Math.min((dayPieces / DAILY_PIECE_QUOTA) * 100, 100)

  // ---- Grupo Mês (KPIs do usuário ativo, por data de encomenda) ----
  const monthOrders = ordersCreatedInMonth(orders, month, year).filter(
    (o) => o.user_id === activeUser?.id,
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
  ).filter((o) => o.user_id === activeUser?.id)
  const growthPct =
    prevMonthOrders.length > 0
      ? Math.round(
          ((monthCount - prevMonthOrders.length) / prevMonthOrders.length) *
            100,
        )
      : null

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Segmented control mobile: alterna entre o grupo do dia e o do mês (oculto em lg+) */}
      <div className="flex justify-center lg:hidden">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className={cn(
            'space-y-4',
            activeTab === 'day' ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground">
              Visão diária{' '}
              <span className="font-medium text-primary">{dayLabel}</span>.
            </p>
            <DaySelector />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pedidos para{' '}
                  <span className="font-medium text-primary">{dayLabel}</span>
                </p>
                <h3
                  className={cn(
                    'text-3xl font-bold mt-1',
                    overOrderQuota && 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {isLoading ? '…' : dayCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {overOrderQuota
                    ? `acima da recomendação (${DAILY_ORDER_QUOTA}/dia)`
                    : `${dayPieces} peças alocadas`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Capacidade em{' '}
                  <span className="font-medium text-primary">{dayLabel}</span>
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
              <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    overPieceQuota ? 'bg-amber-500' : 'bg-primary',
                  )}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
              {overPieceQuota && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  cota estourada — considere o próximo dia útil
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className={cn(
            'space-y-4',
            activeTab === 'month' ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground">
              Acompanhamento mensal {monthLabel}.
            </p>
            <MonthSelector />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pedidos em {monthLabel}
                </p>
                <h3 className="text-3xl font-bold mt-1">
                  {isLoading ? '…' : monthCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {monthPieces} peças encomendadas
                </p>
                {growthPct !== null && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {growthPct >= 0 ? '+' : ''}
                    {growthPct}% que o mês passado
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Valor Vendido em {monthLabel}
                </p>
                <h3 className="text-3xl font-bold mt-1">
                  {isLoading ? '…' : formatBRL(monthRevenue)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ticket médio {formatBRL(monthTicket)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">
            Todos os pedidos para {dayLabel}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Os pedidos para o dia selecionado são exibidos aqui.
          </p>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Carregando pedidos…
            </div>
          ) : (
            <OrdersTable
              orders={dayOrders}
              users={users}
              emptyMessage="Nenhum pedido para este dia."
            />
          )}
        </div>
        <ProductionChart orders={orders} />
      </div>
    </div>
  )
}
