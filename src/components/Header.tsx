import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ColorPickerButton,
  ThemeToggleButton,
} from '@/components/ThemeControls'
import { NewOrderDialog } from '@/components/NewOrderDialog'
import { useAuth } from '@/components/AuthProvider'

export function Header() {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const { profile } = useAuth()
  const canWrite = profile?.role !== 'designer'
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard Geral'
      case '/pedidos':
        return 'Acompanhamento de Pedidos'
      case '/feriados':
        return 'Lista de Feriados'
      default:
        return 'Sistema de Pedidos'
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-border bg-background px-6 transition-all">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          {getPageTitle(pathname)}
        </h1>
        <div className="flex items-center gap-2">
          <ColorPickerButton />
          <ThemeToggleButton />
          {canWrite && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setNewOrderOpen(true)}
                  />
                }
              >
                <Plus className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Novo pedido (N)</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />
    </header>
  )
}
