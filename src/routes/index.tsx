import { createFileRoute } from '@tanstack/react-router'
import { ShoppingCart, DollarSign, CalendarCheck, AlertCircle, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Operacional</h2>
        <p className="text-muted-foreground">Visão geral do volume de pedidos, faturamento e progresso da produção.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pedidos no Mês</p>
            <h3 className="text-3xl font-bold mt-1">132</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> +12% que o mês passado
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Valor Vendido (Mês)</p>
            <h3 className="text-3xl font-bold mt-1">R$ 45.000</h3>
            <p className="text-xs text-muted-foreground mt-1">Ticket médio R$ 340</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pedidos Hoje</p>
            <h3 className="text-3xl font-bold mt-1">7</h3>
            <p className="text-xs text-muted-foreground mt-1">86 peças alocadas</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
            <h3 className="text-3xl font-bold text-destructive mt-1">3</h3>
            <p className="text-xs text-destructive/80 mt-1">Requer atenção imediata</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Evolução Diária de Pedidos</h3>
          <p className="text-sm text-muted-foreground mb-4">Quantidade de pedidos registrados nos últimos 7 dias.</p>
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground">
            Gráfico de Evolução (Mock)
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Status da Produção</h3>
          <p className="text-sm text-muted-foreground mb-4">Distribuição atual dos pedidos por etapa de fabricação.</p>
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg text-muted-foreground">
            Gráfico de Status (Mock)
          </div>
        </div>
      </div>
    </div>
  )
}
