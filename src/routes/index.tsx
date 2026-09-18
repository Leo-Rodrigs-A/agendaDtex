import { createFileRoute } from '@tanstack/react-router'
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

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { day, month, year } = useFilters()

  const dayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(day)

  const rawMonthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
  }).format(new Date(year, month, 1))
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-muted-foreground">
          Visão geral do volume de pedidos, faturamento e progresso da produção.
        </p>
        <div className="flex gap-2">
          <DaySelector />
          <MonthSelector />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Pedidos para {dayLabel}
            </p>
            <h3 className="text-3xl font-bold mt-1">7</h3>
            <p className="text-xs text-muted-foreground mt-1">
              85 peças alocadas
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
            <span className="text-3xl font-bold">85 / 100</span>
            <span className="text-xs text-muted-foreground">peças</span>
          </div>
          <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: '85%' }}
            />
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Pedidos em {monthLabel}
            </p>
            <h3 className="text-3xl font-bold mt-1">132</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> +12% que o mês passado
            </p>
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
            <h3 className="text-3xl font-bold mt-1">R$ 45.000</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket médio R$ 340
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">
            Pedidos para (selecionar dia)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            os pedidos para o dia selecionado são exibidos aqui .
          </p>
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground">
            Lista de pedidos pro dia selecionado
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Status da Semana</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Distribuição atual dos pedidos para os próximos 7 dias.
          </p>
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground">
            Gráfico de barra com quantidades de pedidos pros próximos 7 dias
          </div>
        </div>
      </div>
    </div>
  )
}
