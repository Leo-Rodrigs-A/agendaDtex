import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/AuthProvider'
import { SplashScreen } from '@/components/SplashScreen'
import { SplashLogo } from '@/components/SplashLogo'
import { useSplashGate } from '@/hooks/use-splash-gate'
import { supabase } from '@/lib/supabase'
import { completeOnboarding } from '@/services/profiles'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

/**
 * Primeiro acesso (convite por e-mail): o usuário define a senha e confirma
 * seu nome. Role NUNCA aparece aqui — vem do banco, definida pelo admin.
 */
function OnboardingPage() {
  const { session, profile, isLoading, refreshProfile } = useAuth()
  // Mínimo de 2s (1 loop da animação do logo)
  const showSplash = useSplashGate(isLoading)
  const navigate = useNavigate()
  const [name, setName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (showSplash) return <SplashScreen />
  if (!session) return <Navigate to="/login" replace />
  // Onboarding já concluído: essa tela só aparece uma vez
  if (profile?.onboarding_completed) return <Navigate to="/" replace />

  const displayName = name ?? profile?.name ?? ''

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não conferem.')
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      await completeOnboarding(displayName)
      await refreshProfile()
      toast.success('Tudo pronto! Bem-vindo(a).')
      navigate({ to: '/' })
    } catch (err) {
      console.error('[Onboarding] Falha ao concluir cadastro', err)
      toast.error('Não foi possível concluir o cadastro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <SplashLogo className="h-16" />
          <div>
            <h1 className="text-lg font-semibold">Complete seu cadastro</h1>
            <p className="text-sm text-muted-foreground">
              Confirme seu nome e defina uma senha de acesso
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="onboarding-name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="onboarding-name"
              required
              value={displayName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="onboarding-password"
              className="text-sm font-medium"
            >
              Senha
            </label>
            <Input
              id="onboarding-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="onboarding-confirm" className="text-sm font-medium">
              Confirmar senha
            </label>
            <Input
              id="onboarding-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Salvando…' : 'Concluir cadastro'}
          </Button>
        </form>
      </div>
    </div>
  )
}
