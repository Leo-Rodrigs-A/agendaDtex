import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type AddUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * MVP: o convite de usuários é feito manualmente no dashboard do Supabase
 * (Authentication > Users > Invite). Uma Edge Function `invite-user` fará
 * isso de dentro do app numa fase posterior. Ver .agent/migracao-supabase.md.
 */
export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            Por segurança, novos usuários são convidados por e-mail através do
            painel do Supabase.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Abra o dashboard do Supabase →{' '}
            <strong>Authentication → Users</strong>.
          </li>
          <li>
            Clique em <strong>Invite</strong> e informe o e-mail do vendedor.
          </li>
          <li>
            O usuário recebe o convite, define a senha e confirma o nome no
            primeiro acesso.
          </li>
          <li>
            Para tornar alguém <strong>admin</strong>, edite o campo{' '}
            <code>role</code> na tabela <code>profiles</code>.
          </li>
        </ol>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
