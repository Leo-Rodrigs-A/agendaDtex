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
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import {
  DAILY_PIECE_QUOTA,
  DAILY_ORDER_QUOTA,
  averageTicket,
  formatBRL,
  ordersForDay,
  ordersForMonth,
  sumPieces,
  sumRevenue,
  weekStatus,
} from '@/lib/orders'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { day, month, year } = useFilters()
  const { orders, isLoading, error } = useData()

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

  // ---- Grupo Mês ----
  const monthOrders = ordersForMonth(orders, month, year)
  const monthCount = monthOrders.length
  const monthRevenue = sumRevenue(monthOrders)
  const monthTicket = averageTicket(monthOrders)

  const prevDate = new Date(year, month - 1, 1)
  const prevMonthOrders = ordersForMonth(
    orders,
    prevDate.getMonth(),
    prevDate.getFullYear(),
  )
  const growthPct =
    prevMonthOrders.length > 0
      ? Math.round(
          ((monthCount - prevMonthOrders.length) / prevMonthOrders.length) *
            100,
        )
      : null

  // ---- Gráfico da semana (sempre relativo a hoje) ----
  const week = weekStatus(orders, new Date())
  const weekMax = Math.max(...week.map((d) => d.orderCount), 1)

  const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <p className="text-muted-foreground">
          Visão geral do volume de pedidos, faturamento e progresso da produção.
        </p>
      </div>

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
            <p className="text-muted-foreground">Visão diária {dayLabel}.</p>
            <DaySelector />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pedidos para {dayLabel}
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
                  Capacidade em {dayLabel}
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
          ) : dayOrders.length === 0 ? (
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground">
              Nenhum pedido para este dia.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {dayOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{order.order_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.shirt_count} camisetas
                      {Number(order.others_items_count) > 0 &&
                        ` · ${order.others_items_count} outros itens`}
                    </p>
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatBRL(Number(order.total_amount) || 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Status da Semana Atual</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pedidos agendados para os próximos 7 dias úteis.
          </p>
          <div className="h-64 flex items-end gap-3">
            {week.map((dayStatus, index) => (
              <div
                key={dayStatus.date.toISOString()}
                className="flex flex-1 flex-col items-center gap-2 min-w-0"
              >
                <span className="text-sm font-semibold tabular-nums">
                  {dayStatus.orderCount}
                </span>
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    index === 0 ? 'bg-primary' : 'bg-primary/40',
                  )}
                  style={{
                    height: `${(dayStatus.orderCount / weekMax) * 100}%`,
                    minHeight: dayStatus.orderCount > 0 ? '4px' : '2px',
                  }}
                />
                <span className="text-xs text-muted-foreground capitalize whitespace-nowrap">
                  {weekdayFormatter.format(dayStatus.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
