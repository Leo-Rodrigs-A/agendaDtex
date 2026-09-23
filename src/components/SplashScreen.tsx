/**
 * Tela de carregamento full-page, exibida enquanto a sessão/profile
 * inicializam (boot do app e refresh) e em transições de auth.
 *
 * A animação do logo (SplashLogo) dura 2s por loop; quem renderiza deve
 * combinar com useSplashGate para garantir no mínimo 1 loop (2s).
 */
import { SplashLogo } from '@/components/SplashLogo'
import { cn } from '@/lib/utils'

export function SplashScreen({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-screen w-full flex-col items-center justify-center bg-background',
        className,
      )}
      role="status"
      aria-label="Carregando"
    >
      <SplashLogo />
    </div>
  )
}
