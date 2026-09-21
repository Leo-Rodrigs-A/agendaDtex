import { useRef, useState } from 'react'
import { Check, Settings, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useData } from '@/components/DataProvider'
import { useActiveUser } from '@/components/UserProvider'
import { AddUserDialog } from '@/components/AddUserDialog'

function initials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

/** Footer da sidebar: região do avatar clicável (hover) que abre o popover de usuário. */
export function UserMenu() {
  const { users, isLoading } = useData()
  const { activeUser, setActiveUser } = useActiveUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleListClose = () => {
    closeTimer.current = setTimeout(() => setListOpen(false), 150)
  }
  const cancelListClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  return (
    <>
      <Popover
        open={menuOpen}
        onOpenChange={(open) => {
          // O popover da lista é renderizado em portal próprio; não deixamos
          // o clique nele fechar o menu principal enquanto estiver aberto.
          if (!open && listOpen) return
          setMenuOpen(open)
        }}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"
            />
          }
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials(activeUser?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {isLoading ? 'Carregando…' : (activeUser?.name ?? 'Sem usuário')}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {activeUser?.mail ?? `${users.length} usuários`}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-64 p-2">
          {/* Hovercard do usuário ativo: hover abre a lista lateral de usuários */}
          <Popover open={listOpen} onOpenChange={setListOpen}>
            <PopoverTrigger
              onMouseEnter={() => {
                cancelListClose()
                setListOpen(true)
              }}
              onMouseLeave={scheduleListClose}
              render={
                <div className="w-full cursor-pointer rounded-lg p-2 transition-colors hover:bg-accent" />
              }
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials(activeUser?.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {activeUser?.name ?? 'Sem usuário ativo'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activeUser?.mail ?? '—'}
                  </p>
                  {activeUser?.role && (
                    <p className="truncate text-xs text-muted-foreground capitalize">
                      {activeUser.role}
                    </p>
                  )}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="end"
              sideOffset={8}
              className="w-56 p-1"
              onMouseEnter={cancelListClose}
              onMouseLeave={scheduleListClose}
            >
              <ul className="max-h-60 overflow-y-auto">
                {users.map((user) => {
                  const isActive = user.id === activeUser?.id
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveUser(user.id)
                          setListOpen(false)
                          setMenuOpen(false)
                        }}
                        className="flex w-full items-center justify-between gap-6 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.name}</span>
                        </span>
                        {isActive && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setListOpen(false)
                  setMenuOpen(false)
                  setAddUserOpen(true)
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-border px-2 pt-2 pb-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <UserPlus className="h-4 w-4" /> Adicionar usuário
              </button>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-2"
            disabled
            title="Em breve"
          >
            <Settings className="h-4 w-4" /> Configurações
          </Button>
        </PopoverContent>
      </Popover>

      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />
    </>
  )
}
