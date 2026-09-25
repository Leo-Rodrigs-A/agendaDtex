import { useState } from 'react'
import { LogOut, Settings, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuth } from '@/components/AuthProvider'
import { AddUserDialog } from '@/components/AddUserDialog'
import { UsersManagerDialog } from '@/components/UsersManagerDialog'
import { ColorSwatches, ThemeToggleButton } from '@/components/ThemeControls'

function initials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

/** Footer da sidebar: usuário autenticado (perfil real) + ações de conta. */
export function UserMenu() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('[UserMenu] Falha ao sair', err)
      toast.error('Falha ao sair da conta.')
    }
  }

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"
            />
          }
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials(profile?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {profile?.name ?? '…'}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60 capitalize">
              {profile?.role ?? '—'}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-64 p-2">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials(profile?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {profile?.name ?? '—'}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {profile?.role ?? '—'}
              </p>
            </div>
          </div>

          {/* Aparência: só no mobile (no desktop esses controles ficam no Header) */}
          <div className="mt-1 rounded-lg p-2 lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aparência</span>
              <ThemeToggleButton />
            </div>
            <div className="mt-3">
              <ColorSwatches />
            </div>
          </div>

          {profile?.role === 'admin' && (
            <>
              <Button
                variant="ghost"
                className="mt-1 w-full justify-start gap-2"
                onClick={() => {
                  setMenuOpen(false)
                  setAddUserOpen(true)
                }}
              >
                <UserPlus className="h-4 w-4" /> Convidar usuário
              </Button>
              <Button
                variant="ghost"
                className="mt-1 w-full justify-start gap-2"
                onClick={() => {
                  setMenuOpen(false)
                  setManagerOpen(true)
                }}
              >
                <Users className="h-4 w-4" /> Gerenciar usuários
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-2"
            disabled
            title="Em breve"
          >
            <Settings className="h-4 w-4" /> Configurações
          </Button>

          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </PopoverContent>
      </Popover>

      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />
      <UsersManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />
    </>
  )
}
