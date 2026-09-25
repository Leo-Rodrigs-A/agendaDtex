import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  CalendarDays,
  Factory,
  Home,
  PanelLeftOpen,
  Search,
  SquareMenu,
} from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { UserMenu } from '@/components/UserMenu'
import { useCommandPalette } from '@/components/CommandPaletteProvider'

export function AppSidebar() {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar()
  const { openPalette } = useCommandPalette()

  // No mobile a sidebar é uma Sheet: clicar numa rota recolhe ela após navegar
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  const navigationGroups = [
    {
      label: 'Acompanhamento',
      items: [
        { title: 'Home', url: '/', icon: Home },
        { title: 'Produção', url: '/producao', icon: Factory },
      ],
    },
    {
      label: 'Cadastros',
      items: [
        { title: 'Pedidos', url: '/pedidos', icon: SquareMenu },
        { title: 'Feriados', url: '/feriados', icon: CalendarDays },
      ],
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-sidebar-border px-6 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-3">
          {/* Modo recolhido: o ícone vira o botão que restaura a sidebar */}
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expandir sidebar"
            className="group/logo hidden h-9 w-9 items-center justify-center group-data-[collapsible=icon]:flex"
          >
            <img
              src="/dtex192.png"
              alt="DTex"
              className="h-9 w-9 rounded-lg shadow-md group-hover/logo:hidden"
            />
            <PanelLeftOpen className="hidden h-5 w-5 group-hover/logo:block" />
          </button>
          <img
            src="/logodtex-animar.svg"
            alt="DTex"
            className="h-8 w-auto group-data-[collapsible=icon]:hidden"
          />
        </div>
        <SidebarTrigger className="-mr-2 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link to={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                        onClick={closeMobileSidebar}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Botão da paleta de comandos (Ctrl+K) — acima da linha divisória */}
      <div className="px-2 pb-1">
        <button
          type="button"
          onClick={() => {
            closeMobileSidebar()
            openPalette()
          }}
          title="Encontrar (Ctrl+K)"
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:justify-center"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">
            Encontrar
          </span>
          <kbd className="ml-auto rounded border border-sidebar-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
            Ctrl K
          </kbd>
        </button>
      </div>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
