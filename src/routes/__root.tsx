import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { AuthGate } from '@/components/AuthGate'
import { GlobalHotkeys } from '@/components/GlobalHotkeys'
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
        {/* min-w-0: permite o conteúdo encolher — scroll horizontal fica só dentro das tabelas */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-w-0 flex-1 p-8">
            <Outlet />
          </main>
        </SidebarInset>
        <GlobalHotkeys />
      </div>
    </AuthGate>
  )
}
