import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types'
import { useData } from '@/components/DataProvider'

type UserState = {
  /** Usuário ativo: o selecionado, ou o primeiro da lista como fallback. */
  activeUser: User | null
  setActiveUser: (userId: string) => void
}

const ActiveUserContext = createContext<UserState | null>(null)

const STORAGE_KEY = 'dtex-active-user'

/**
 * Gerencia o usuário ativo (vendedor logado, sem auth).
 * Persiste o id no localStorage; precisa estar dentro de <DataProvider>.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const { users } = useData()
  const [activeUserId, setActiveUserId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const activeUser = useMemo<User | null>(() => {
    const selected = users.find((u) => u.id === activeUserId)
    if (selected) return selected
    const firstActive = users.find((u) => u.is_active)
    return firstActive ?? null
  }, [users, activeUserId])

  const setActiveUser = useCallback((userId: string) => {
    setActiveUserId(userId)
    localStorage.setItem(STORAGE_KEY, userId)
  }, [])

  const value = useMemo<UserState>(
    () => ({ activeUser, setActiveUser }),
    [activeUser, setActiveUser],
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
