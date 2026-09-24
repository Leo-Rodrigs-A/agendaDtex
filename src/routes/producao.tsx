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

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Toolbar: segmented dia/mês à esquerda, seletores + escopo à direita */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1 self-start">
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

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="gap-2 font-normal"
                    title="Escopo de usuário"
                  />
                }
              >
                {scopeName}
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
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => setScopeUserId(u.id)}
                  >
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
          )}
          {view === 'day' ? (
            <DaySelector showLatestJump={false} />
          ) : (
            <MonthSelector />
          )}
        </div>
      </div>

      <p className="text-muted-foreground">
        Encomendas de{' '}
        <span className="font-medium text-primary">{periodLabel}</span>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Pedidos fechados
            </p>
            <h3 className="text-3xl font-bold mt-1">
              {isLoading ? '…' : orderCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{scopeName}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <PackageCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Valor vendido
            </p>
            <h3 className="text-3xl font-bold mt-1">
              {isLoading ? '…' : formatBRL(revenue)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {view === 'day' ? 'no dia selecionado' : 'no mês selecionado'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-1">
          Pedidos encomendados em{' '}
          <span className="font-medium text-primary">{periodLabel}</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading
            ? 'Carregando pedidos…'
            : `${orderCount} pedidos · ${sumPieces(scopedOrders)} peças · ${formatBRL(revenue)} em vendas`}
        </p>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Carregando pedidos…
          </div>
        ) : (
          <OrdersTable
            orders={scopedOrders}
            users={users}
            variant="full"
            emptyMessage="Nenhum pedido encomendado neste período."
          />
        )}
      </div>
    </div>
  )
}
