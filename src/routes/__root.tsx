import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { AuthGate } from '@/components/AuthGate'
import { AppProviders } from '@/contexts'
import '@/styles.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <AppProviders>
      <RootContent />
    </AppProviders>
  )
}

function RootContent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // Rotas públicas/de primeiro acesso renderizam fora do shell (sem sidebar)
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/onboarding')

  if (isAuthRoute) {
    return <Outlet />
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen w-full bg-muted/20">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </AuthGate>
  )
}
