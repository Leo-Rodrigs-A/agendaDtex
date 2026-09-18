import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/feriados')({
  component: FeriadosPage,
})

function FeriadosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            Defina os feriados para que o sistema não permita agendamentos epara
            esses dias.
          </p>
        </div>

        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Feriado
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Calendário de Feriados</h3>
        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
          Nenhum Feriado Registrado no sistema por enquanto.
        </div>
      </div>
    </div>
  )
}
