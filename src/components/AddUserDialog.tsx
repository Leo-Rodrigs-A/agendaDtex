import { useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
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
import { createUser } from '@/services/api'
import { useData } from '@/components/DataProvider'

type AddUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Modal de cadastro de funcionário (vendedor). Após criar, torna-se o usuário ativo. */
export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { refreshUsers } = useData()

  const [name, setName] = useState('')
  const [mail, setMail] = useState('')
  const [role, setRole] = useState('vendedor')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setMail('')
    setRole('vendedor')
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await createUser({ name, mail, role, is_active: true })
      await refreshUsers()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar usuário')
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
          <DialogTitle>Adicionar Funcionário</DialogTitle>
          <DialogDescription>
            Cadastre um novo vendedor para registrar pedidos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="user-name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="user-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Maria Silva"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="user-mail" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="user-mail"
              type="email"
              required
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder="maria@dtex.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="user-role" className="text-sm font-medium">
              Cargo
            </label>
            <Input
              id="user-role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="vendedor"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando…' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
