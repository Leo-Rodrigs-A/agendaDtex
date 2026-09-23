import { useContext, createContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/components/AuthProvider'
import type { Profile } from '@/types'

type UserState = {
  /** Usuário ativo = profile do usuário autenticado. */
  activeUser: Profile | null
  /**
   * @deprecated Com autenticação real não existe mais "trocar de usuário".
   * Mantido só para compatibilidade durante a migração — é um no-op.
   */
  setActiveUser: (userId: string) => void
}

const ActiveUserContext = createContext<UserState | null>(null)

/**
 * Shim de compatibilidade da era "usuário ativo em localStorage".
 * Agora o usuário ativo é simplesmente o profile da sessão autenticada.
 * TODO (pós-migração): trocar os usos de useActiveUser por useAuth direto.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()

  const value = useMemo<UserState>(
    () => ({
      activeUser: profile,
      setActiveUser: () => {
        console.warn(
          '[UserProvider] setActiveUser foi descontinuado: o usuário ativo é o da sessão.',
        )
      },
    }),
    [profile],
  )

  return (
    <ActiveUserContext.Provider value={value}>
      {children}
    </ActiveUserContext.Provider>
  )
}

export function useActiveUser() {
  const ctx = useContext(ActiveUserContext)
  if (!ctx) {
    throw new Error('useActiveUser deve ser usado dentro de <UserProvider>')
  }
  return ctx
}
