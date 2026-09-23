import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Order, Holiday, Profile } from '@/types'
import {
  listOrders,
  toggleOrderDone as rpcToggleOrderDone,
} from '@/services/orders'
import { listHolidays } from '@/services/holidays'
import { listProfiles } from '@/services/profiles'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'

type DataState = {
  orders: Array<Order>
  holidays: Array<Holiday>
  users: Array<Profile>
  isLoading: boolean
  error: string | null
  /** Re-busca o recurso no Supabase. */
  refreshOrders: () => Promise<void>
  refreshHolidays: () => Promise<void>
  refreshUsers: () => Promise<void>
  /**
   * Alterna `is_done` com update otimista (RPC complete_order). Em caso de
   * erro, o valor é revertido e um toast de erro é exibido.
   */
  toggleOrderDone: (id: string, isDone: boolean) => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Array<Order>>([])
  const [holidays, setHolidays] = useState<Array<Holiday>>([])
  const [users, setUsers] = useState<Array<Profile>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshOrders = useCallback(async () => {
    setOrders(await listOrders())
  }, [])

  const refreshHolidays = useCallback(async () => {
    setHolidays(await listHolidays())
  }, [])

  const refreshUsers = useCallback(async () => {
    setUsers(await listProfiles())
  }, [])

  const toggleOrderDone = useCallback(
    async (id: string, isDone: boolean) => {
      // 1) Otimista: aplica na hora no estado local
      setOrders((current) =>
        current.map((o) => (o.id === id ? { ...o, is_done: isDone } : o)),
      )
      try {
        // 2) Background: persiste via RPC complete_order
        await rpcToggleOrderDone(id, isDone)
        toast.success(isDone ? 'Pedido concluído!' : 'Pedido reaberto!')
        // 3) Silencioso: sincroniza com o servidor sem loading visual
        await refreshOrders()
      } catch (err) {
        // 4) Rollback + toast de erro
        setOrders((current) =>
          current.map((o) => (o.id === id ? { ...o, is_done: !isDone } : o)),
        )
        console.error('[toggleOrderDone] Falha na RPC complete_order', {
          id,
          is_done: isDone,
          err,
        })
        toast.error('Falha ao atualizar o pedido!')
      }
    },
    [refreshOrders],
  )

  // Fetch inicial (por autenticação): todos os recursos em paralelo.
  // allSettled garante que a falha de um recurso não impeça os demais.
  // Ao deslogar (session → null), os dados são limpos.
  useEffect(() => {
    if (!session) {
      setOrders([])
      setHolidays([])
      setUsers([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    async function loadInitial() {
      const [ordersRes, holidaysRes, usersRes] = await Promise.allSettled([
        listOrders(),
        listHolidays(),
        listProfiles(),
      ])
      if (cancelled) return

      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value)
      if (holidaysRes.status === 'fulfilled') setHolidays(holidaysRes.value)
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value)

      const failures = [ordersRes, holidaysRes, usersRes]
        .map((r, i) => ({ r, name: ['pedidos', 'feriados', 'usuários'][i] }))
        .filter(({ r }) => r.status === 'rejected')
      if (failures.length > 0) {
        const names = failures.map(({ name }) => name).join(', ')
        const reason =
          failures[0].r.status === 'rejected'
            ? String(failures[0].r.reason)
            : ''
        setError(`Falha ao carregar ${names}. ${reason}`)
      }

      setIsLoading(false)
    }

    loadInitial()
    return () => {
      cancelled = true
    }
  }, [session])

  const value = useMemo<DataState>(
    () => ({
      orders,
      holidays,
      users,
      isLoading,
      error,
      refreshOrders,
      refreshHolidays,
      refreshUsers,
      toggleOrderDone,
    }),
    [
      orders,
      holidays,
      users,
      isLoading,
      error,
      refreshOrders,
      refreshHolidays,
      refreshUsers,
      toggleOrderDone,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('useData deve ser usado dentro de <DataProvider>')
  }
  return ctx
}
