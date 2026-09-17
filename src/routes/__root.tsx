import { Outlet, createRootRoute } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import '../styles.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-muted/20">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-8">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
