import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/agenda')({
  component: AgendaPage,
})

function AgendaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agenda de Produção</h2>
        <p className="text-muted-foreground">Visualize a alocação de capacidade diária e entregas previstas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Capacidade Hoje</span>
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">85 / 100</span>
            <span className="text-xs text-muted-foreground">peças</span>
          </div>
          <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Próximas Entregas</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">12</span>
            <span className="text-xs text-muted-foreground">pedidos esta semana</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Concluídos no Prazo</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">98%</span>
            <span className="text-xs text-muted-foreground">taxa de pontualidade</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Calendário de Produção (Próximos dias)</h3>
        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
          Nenhum agendamento ativo na matriz de capacidade do backend.
        </div>
      </div>
    </div>
  )
}
