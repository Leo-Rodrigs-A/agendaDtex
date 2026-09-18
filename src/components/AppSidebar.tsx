import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { CalendarDays, Home, SquareMenu } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AppSidebar() {
  const pathname = useLocation({ select: (loc) => loc.pathname })

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
      <SidebarHeader className="h-16 border-b border-sidebar-border px-6 flex items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-md">
            DT
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sidebar-foreground leading-tight">
              Agenda Dtex
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Pedidos & Produção
            </span>
          </div>
        </div>
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
                  <Link
                    to={item.url}
                    className="flex items-center gap-3 font-medium"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://github.com/shadcn.png" alt="Usuário" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-sidebar-foreground">
              Operador Interno
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              operador@dtex.com
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
