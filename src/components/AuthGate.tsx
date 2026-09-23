import type { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/components/AuthProvider'
import { SplashScreen } from '@/components/SplashScreen'

/**
 * Protege o shell autenticado da aplicação:
 * - sessão/profile carregando → SplashScreen
 * - sem sessão → /login
 * - sessão sem profile (primeiro acesso via convite) → /onboarding
 * - profile inativo → signOut (o RLS também bloqueia; aqui é só UX)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, isLoading, signOut } = useAuth()

  if (isLoading) return <SplashScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  if (!profile.is_active) {
    // Força logout de usuário desativado (segurança real está no RLS)
    void signOut()
    return <SplashScreen />
  }
  return <>{children}</>
}
