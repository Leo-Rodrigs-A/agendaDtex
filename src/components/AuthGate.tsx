import type { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/components/AuthProvider'
import { SplashScreen } from '@/components/SplashScreen'
import { useSplashGate } from '@/hooks/use-splash-gate'

/**
 * Protege o shell autenticado da aplicação:
 * - sessão/profile carregando → SplashScreen
 * - sem sessão → /login
 * - sessão sem profile (primeiro acesso via convite) → /onboarding
 * - profile inativo → signOut (o RLS também bloqueia; aqui é só UX)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, isLoading, signOut } = useAuth()
  // Mínimo de 2s (1 loop da animação do logo), mesmo se os dados já chegaram
  const showSplash = useSplashGate(isLoading)

  if (showSplash) return <SplashScreen />
  if (!session) return <Navigate to="/login" replace />
  // Sessão sem profile (edge: trigger falhou) ou onboarding pendente
  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }
  if (!profile.is_active) {
    // Força logout de usuário desativado (segurança real está no RLS)
    void signOut()
    return <SplashScreen />
  }
  return <>{children}</>
}
