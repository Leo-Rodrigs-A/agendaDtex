import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/AuthProvider'
import { SplashScreen } from '@/components/SplashScreen'
import { useSplashGate } from '@/hooks/use-splash-gate'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { session, profile, isLoading, signIn } = useAuth()
  // Mínimo de 3s (1 loop da animação do logo)
  const showSplash = useSplashGate(isLoading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (showSplash) return <SplashScreen />
  if (session && profile?.onboarding_completed)
    return <Navigate to="/" replace />
  if (session) return <Navigate to="/onboarding" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      console.error('[Login] Falha ao entrar', err)
      toast.error('E-mail ou senha inválidos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logodtex-animar.svg" alt="DTex" className="h-16 w-auto" />
          <div>
            <h1 className="text-lg font-semibold">Agenda DTex</h1>
            <p className="text-sm text-muted-foreground">
              Entre com sua conta para continuar
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@dtex.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium">
              Senha
            </label>
            <Input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
