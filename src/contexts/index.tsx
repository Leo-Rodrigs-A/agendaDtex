import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { FilterProvider } from '@/components/FilterProvider'
import { DataProvider } from '@/components/DataProvider'
import { UserProvider } from '@/components/UserProvider'
import { CommandPaletteProvider } from '@/components/CommandPaletteProvider'

/**
 * Ponto único de composição dos providers da aplicação.
 *
 * Ordem (dependências):
 * - ThemeProvider: não depende de nada (DOM/localStorage).
 * - TooltipProvider/SidebarProvider: infra de UI dos componentes shadcn.
 * - AuthProvider: sessão Supabase + profile (fonte do usuário ativo).
 * - FilterProvider: estado de filtros, independente dos dados.
 * - DataProvider: busca os dados do Supabase (depende da sessão).
 * - UserProvider: shim de compatibilidade — activeUser = profile da sessão.
 * - CommandPaletteProvider: estado global da paleta Ctrl+K (depende de Auth e Data).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AuthProvider>
            <FilterProvider>
              <DataProvider>
                <UserProvider>
                  <CommandPaletteProvider>
                    {children}
                    <Toaster position="bottom-right" />
                  </CommandPaletteProvider>
                </UserProvider>
              </DataProvider>
            </FilterProvider>
          </AuthProvider>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
