import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'cn'
import { Check, ChevronDown, DollarSign, PackageCheck } from 'lucide-react'
import { DaySelector } from '@/components/DaySelector'
import { MonthSelector } from '@/components/MonthSelector'
import { OrdersTable } from '@/components/OrdersTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFilters } from '@/components/FilterProvider'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import { KpiPair } from '@/components/KpiPair'
import {
  formatBRL,
  ordersCreatedInMonth,
  ordersCreatedOnDay,
  sumPieces,
  sumRevenue,
} from '@/lib/orders'

export const Route = createFileRoute('/producao')({
  component: ProducaoPage,
})

/**
 * Produção: o que foi ENCOMENDADO (created_at) no dia/mês selecionado.
 * Usa o mesmo FilterProvider da home — trocar o dia/mês em qualquer
 * lugar reflete em todas as telas.
 *
 * Escopo: vendedor/designer veem só os próprios números; admin pode
 * alternar entre visão geral da empresa e um usuário específico.
 */
function ProducaoPage() {
  const { day, month, year } = useFilters()
  const { orders, users, isLoading, error } = useData()
  const { profile } = useAuth()

  const [view, setView] = useState<'day' | 'month'>('day')
  const isAdmin = profile?.role === 'admin'
  // Padrão: usuário da sessão; admin pode abrir a visão geral ('' = todos)
  const [scopeUserId, setScopeUserId] = useState<string | null>(null)
  const effectiveScope = scopeUserId ?? profile?.id ?? ''

  const dayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(day)
  const rawMonthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
  }).format(new Date(year, month, 1))
  const monthLabel =
    rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1)

  const baseOrders =
    view === 'day'
      ? ordersCreatedOnDay(orders, day)
      : ordersCreatedInMonth(orders, month, year)

  const scopedOrders = isAdmin
    ? effectiveScope
      ? baseOrders.filter((o) => o.user_id === effectiveScope)
      : baseOrders
    : baseOrders.filter((o) => o.user_id === profile?.id)

  const orderCount = scopedOrders.length
  const revenue = sumRevenue(scopedOrders)
  const periodLabel = view === 'day' ? dayLabel : monthLabel
  const scopeName = effectiveScope
    ? (users.find((u) => u.id === effectiveScope)?.name ?? '—')
    : 'Todos os usuários'

  // Dropdown de escopo (só admin) — renderizado em dois lugares conforme o
  // breakpoint: na 1ª linha no mobile, junto dos seletores no desktop
  const scopeDropdown = isAdmin ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="max-w-[16ch] gap-2 font-normal"
            title={scopeName}
          />
        }
      >
        <span className="truncate">{scopeName}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => setScopeUserId('')}>
          <Check
            className={cn(
              'h-4 w-4',
              effectiveScope ? 'invisible' : 'text-primary',
            )}
          />
          Todos os usuários
        </DropdownMenuItem>
        {users.map((u) => (
          <DropdownMenuItem key={u.id} onClick={() => setScopeUserId(u.id)}>
            <Check
              className={cn(
                'h-4 w-4',
                effectiveScope === u.id ? 'text-primary' : 'invisible',
              )}
            />
            {u.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null

  return (
    <div className="space-y-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-6 lg:space-y-0">
      {error && (
        <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Toolbar:
          mobile → linha 1: segmented (esq) + dropdown de escopo (dir);
                   linha 2: seletor de avanço centralizado.
          desktop → segmented à esquerda; escopo + seletor à direita (linha única) */}
      <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-2 lg:contents">
          <div className="inline-flex items-center gap-1 self-start rounded-lg bg-muted p-1">
            {(['day', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                  view === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode === 'day' ? 'Dia' : 'Mês'}
              </button>
            ))}
          </div>
          {/* Escopo no mobile (fica na 1ª linha, à direita) */}
          <div className="lg:hidden">{scopeDropdown}</div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
          {/* Escopo no desktop (ao lado do seletor) */}
          <div className="hidden lg:block">{scopeDropdown}</div>
          {view === 'day' ? (
            <DaySelector showLatestJump={false} />
          ) : (
            <MonthSelector />
          )}
        </div>
      </div>

      <p className="shrink-0 text-muted-foreground">
        Encomendas de{' '}
        <span className="font-medium text-primary">{periodLabel}</span>.
      </p>

      <div className="shrink-0">
        <KpiPair>
          <div
            key="kpi-orders"
            className="flex h-full items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pedidos fechados
              </p>
              <h3 className="mt-1 text-3xl font-bold">
                {isLoading ? '…' : orderCount}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{scopeName}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck className="h-6 w-6" />
            </div>
          </div>

          <div
            key="kpi-revenue"
            className="flex h-full items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Valor vendido
              </p>
              <h3 className="mt-1 text-3xl font-bold">
                {isLoading ? '…' : formatBRL(revenue)}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {view === 'day' ? 'no dia selecionado' : 'no mês selecionado'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </KpiPair>
      </div>

      {/* Tabela: estica (flex-1) e rola internamente no desktop */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-1 shrink-0 text-lg font-semibold">
          Pedidos encomendados em{' '}
          <span className="font-medium text-primary">{periodLabel}</span>
        </h3>
        <p className="mb-4 shrink-0 text-sm text-muted-foreground">
          {isLoading
            ? 'Carregando pedidos…'
            : `${orderCount} pedidos · ${sumPieces(scopedOrders)} peças · ${formatBRL(revenue)} em vendas`}
        </p>
        {isLoading ? (
          <div className="flex h-64 flex-1 items-center justify-center text-muted-foreground">
            Carregando pedidos…
          </div>
        ) : (
          <div className="min-h-0 flex-1 lg:overflow-y-auto">
            <OrdersTable
              orders={scopedOrders}
              users={users}
              variant="full"
              emptyMessage="Nenhum pedido encomendado neste período."
            />
          </div>
        )}
      </div>
    </div>
  )
}
