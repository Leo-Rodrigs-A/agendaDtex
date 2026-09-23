import { useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { inviteUser } from '@/services/profiles'
import { useData } from '@/components/DataProvider'
import type { Role } from '@/types'

type AddUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Convite de usuário (apenas admin): envia e-mail de convite via Edge
 * Function `invite-user`, já com a role escolhida (vendedor ou designer).
 * O convidado define a senha e confirma o nome no primeiro acesso.
 */
export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { refreshUsers } = useData()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('vendedor')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setRole('vendedor')
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await inviteUser({
        email: email.trim(),
        name: name.trim() || undefined,
        role,
      })
      await refreshUsers()
      toast.success(`Convite enviado para ${email.trim()}!`)
      onOpenChange(false)
      reset()
    } catch (err) {
      console.error('[Convite] Falha ao convidar usuário', err)
      setError(err instanceof Error ? err.message : 'Falha ao enviar convite')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            A pessoa receberá um e-mail de convite e definirá a senha no
            primeiro acesso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Maria Silva"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@dtex.com"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Função</span>
            <div className="flex gap-2">
              {(
                [
                  {
                    value: 'vendedor',
                    label: 'Vendedor',
                    hint: 'cria pedidos',
                  },
                  {
                    value: 'designer',
                    label: 'Designer',
                    hint: 'só visualiza',
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`flex flex-1 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                    role === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
