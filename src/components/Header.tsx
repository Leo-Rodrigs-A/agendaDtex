import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
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
  const { toggleSidebar } = useSidebar()
  const canWrite = profile?.role !== 'designer'
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard Geral'
      case '/pedidos':
        return 'Acompanhamento de Pedidos'
      case '/producao':
        return 'Produção'
      case '/feriados':
        return 'Lista de Feriados'
      default:
        return 'Sistema de Pedidos'
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-border bg-background px-4 transition-all lg:px-6">
      {/* Mobile: logo vira trigger da sidebar | título centralizado | novo pedido */}
      <div className="flex w-full items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={toggleSidebar}
          title="Abrir menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
        >
          <img src="/dtex192.png" alt="DTex" className="h-7 w-7 rounded-md" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-foreground">
          {getPageTitle(pathname)}
        </h1>
        {canWrite ? (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Novo pedido (N)"
            onClick={() => setNewOrderOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          // Espaçador mantém o título centralizado para o designer
          <span className="w-9 shrink-0" />
        )}
      </div>

      {/* Desktop: layout original */}
      <div className="hidden w-full items-center justify-between lg:flex">
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
