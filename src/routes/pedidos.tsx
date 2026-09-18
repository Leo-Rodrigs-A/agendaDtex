import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/pedidos')({
  component: PedidosPage,
})

function PedidosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            Gerencie os pedidos de camisetas e shorts, acompanhe prazos e
            status.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo Pedido
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vendedor ou nome do pedido..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4" /> Filtrar Status
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-base font-medium">
            Nenhum pedido cadastrado ainda.
          </p>
          <p className="text-sm mt-1">
            Clique em "Novo Pedido" para iniciar o primeiro registro.
          </p>
        </div>
      </div>
    </div>
  )
}
