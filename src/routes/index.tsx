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

  // Só relevante abaixo de lg: qual grupo (dia/mês) está visível.
  // Em lg+ os dois grupos aparecem lado a lado.
  const [activeTab, setActiveTab] = useState<'day' | 'month'>('day')

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
  // Segmented control da tabela diária: todos os usuários x usuário ativo
  const [dayScope, setDayScope] = useState<'all' | 'mine'>('all')
  const dayScoped =
    dayScope === 'mine'
      ? dayOrders.filter((o) => o.user_id === activeUser?.id)
      : dayOrders
  const dayScopePieces = sumPieces(dayScoped)
  const dayScopeRevenue = sumRevenue(dayScoped)
  const dayCount = dayOrders.length
  const dayPieces = sumPieces(dayOrders)
  const overOrderQuota = dayCount > DAILY_ORDER_QUOTA
  const overPieceQuota = dayPieces > DAILY_PIECE_QUOTA
  const capacityPct = Math.min((dayPieces / DAILY_PIECE_QUOTA) * 100, 100)

  // ---- Grupo Mês (por data de encomenda) ----
  // Admin pode alternar entre soma de todos os usuários e somente os próprios
  // (segmented control ao lado do MonthSelector — visível só para admin).
  const isAdmin = activeUser?.role === 'admin'
  const [monthScope, setMonthScope] = useState<'all' | 'mine'>('all')
  const showAllUsers = isAdmin && monthScope === 'all'
  const monthOrders = ordersCreatedInMonth(orders, month, year).filter(
    (o) => showAllUsers || o.user_id === activeUser?.id,
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
  ).filter((o) => showAllUsers || o.user_id === activeUser?.id)
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

      {/* Segmented control: alterna entre o grupo do dia e o do mês (todos os tamanhos) */}
      <div className="flex justify-center">
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

      <div className="grid gap-6">
        <section
          className={cn('space-y-4', activeTab === 'day' ? 'block' : 'hidden')}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground">
              Visão diária{' '}
              <span className="font-medium text-primary">{dayLabel}</span>{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({deliveryDayLabel})
              </span>
              .
            </p>
            <DaySelector />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
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
            activeTab === 'month' ? 'block' : 'hidden',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground">
              Acompanhamento mensal {monthLabel}.
            </p>
            <div className="flex items-center gap-2">
              {/* Segmented control de escopo mensal — só para admin */}
              {isAdmin && (
                <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setMonthScope('all')}
                    className={cn(
                      'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      monthScope === 'all'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthScope('mine')}
                    className={cn(
                      'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      monthScope === 'mine'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Somente eu
                  </button>
                </div>
              )}
              <MonthSelector />
            </div>
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

      {activeTab === 'day' ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold">
              Pedidos para{' '}
              <span className="font-medium text-primary">{dayLabel}</span>{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({deliveryDayLabel})
              </span>
            </h3>
            <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setDayScope('all')}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  dayScope === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Todos os usuários
              </button>
              <button
                type="button"
                onClick={() => setDayScope('mine')}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  dayScope === 'mine'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {activeUser?.name ?? 'Usuário ativo'}
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {isLoading
              ? 'Carregando pedidos…'
              : `${dayScoped.length} pedidos · ${dayScopePieces} peças · ${formatBRL(dayScopeRevenue)} em vendas`}
          </p>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Carregando pedidos…
            </div>
          ) : (
            <OrdersTable
              orders={dayScoped}
              users={users}
              variant="day"
              emptyMessage="Nenhum pedido para este dia."
            />
          )}
        </div>
      ) : (
        <ProductionChart orders={orders} />
      )}
    </div>
  )
}
