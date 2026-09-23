import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { CalendarDays, Home, PanelLeftOpen, SquareMenu } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { UserMenu } from '@/components/UserMenu'

export function AppSidebar() {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const { toggleSidebar } = useSidebar()

  const navigationItems = [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
    {
      title: 'Pedidos',
      url: '/pedidos',
      icon: SquareMenu,
    },
    {
      title: 'Feriados',
      url: '/feriados',
      icon: CalendarDays,
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
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link to={item.url} />}
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
