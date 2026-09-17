import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useLocation } from '@tanstack/react-router'

export function Header() {
  const pathname = useLocation({ select: (loc) => loc.pathname })

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard Geral'
      case '/pedidos':
        return 'Gestão de Pedidos'
      case '/agenda':
        return 'Agenda & Capacidade de Produção'
      default:
        return 'Sistema de Pedidos'
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-6 transition-all">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold text-foreground">{getPageTitle(pathname)}</h1>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ● Sistema Online
          </span>
        </div>
      </div>
    </header>
  )
}
