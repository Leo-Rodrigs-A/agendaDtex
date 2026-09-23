/**
 * Tela de carregamento full-page, exibida enquanto a sessão/profile
 * inicializam (boot do app e refresh) e em transições de auth.
 *
 * TODO: substituir o placeholder abaixo pelo SVG oficial da empresa
 * (arquivo será enviado posteriormente) e ajustar a animação.
 */
import { cn } from '@/lib/utils'

export function SplashScreen({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background',
        className,
      )}
      role="status"
      aria-label="Carregando"
    >
      {/* Placeholder do logo — trocar pelo SVG oficial da empresa */}
      <div className="animate-splash-logo flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg">
        DT
      </div>
      <div className="flex items-center gap-1.5">
        <span className="animate-splash-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="animate-splash-dot h-1.5 w-1.5 rounded-full bg-primary [animation-delay:150ms]" />
        <span className="animate-splash-dot h-1.5 w-1.5 rounded-full bg-primary [animation-delay:300ms]" />
      </div>
    </div>
  )
}
