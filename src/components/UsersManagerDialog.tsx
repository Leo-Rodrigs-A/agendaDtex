import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import { adminUpdateUser } from '@/services/profiles'
import type { Role } from '@/types'

function initials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  vendedor: 'Vendedor',
  designer: 'Designer',
}

type UsersManagerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Gerenciador de usuários (apenas admin): alterar função e ativar/desativar.
 * O admin não pode alterar a própria role nem desativar a si mesmo (a RPC
 * admin_update_user também bloqueia isso no banco).
 */
export function UsersManagerDialog({
  open,
  onOpenChange,
}: UsersManagerDialogProps) {
  const { users, refreshUsers } = useData()
  const { profile } = useAuth()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const update = async (
    userId: string,
    change: { role?: Role; isActive?: boolean },
  ) => {
    setPendingId(userId)
    try {
      await adminUpdateUser({ userId, ...change })
      await refreshUsers()
      toast.success('Usuário atualizado!')
    } catch (err) {
      console.error('[Gerenciar usuários] Falha', err)
      toast.error('Falha ao atualizar usuário.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar usuários</DialogTitle>
          <DialogDescription>
            Altere funções ou desative acessos. Designers só visualizam; você
            não pode alterar a própria conta.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {users.map((user) => {
            const isSelf = user.id === profile?.id
            const busy = pendingId === user.id
            return (
              <li
                key={user.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.name}
                    {isSelf && (
                      <span className="text-muted-foreground"> (você)</span>
                    )}
                  </p>
                  <p
                    className={`text-xs ${user.is_active ? 'text-muted-foreground' : 'text-destructive'}`}
                  >
                    {user.is_active ? 'Ativo' : 'Desativado'}
                  </p>
                </div>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <select
                      value={user.role}
                      disabled={isSelf}
                      onChange={(e) =>
                        update(user.id, { role: e.target.value as Role })
                      }
                      className="h-8 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                    >
                      {(Object.keys(ROLE_LABELS) as Array<Role>).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant={user.is_active ? 'outline' : 'default'}
                      size="sm"
                      disabled={isSelf}
                      onClick={() =>
                        update(user.id, { isActive: !user.is_active })
                      }
                    >
                      {user.is_active ? 'Desativar' : 'Reativar'}
                    </Button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
