import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Order, Holiday, User } from '@/types'
import { getOrders, getHolidays, getUsers } from '@/services/api'

type DataState = {
  orders: Array<Order>
  holidays: Array<Holiday>
  users: Array<User>
  isLoading: boolean
  error: string | null
  /** Re-busca o recurso na API. Chamar após POST bem-sucedido. */
  refreshOrders: () => Promise<void>
  refreshHolidays: () => Promise<void>
  refreshUsers: () => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Array<Order>>([])
  const [holidays, setHolidays] = useState<Array<Holiday>>([])
  const [users, setUsers] = useState<Array<User>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshOrders = useCallback(async () => {
    setOrders(await getOrders())
  }, [])

  const refreshHolidays = useCallback(async () => {
    setHolidays(await getHolidays())
  }, [])

  const refreshUsers = useCallback(async () => {
    setUsers(await getUsers())
  }, [])

  // Fetch inicial: todos os recursos em paralelo. allSettled garante que a
  // falha de um recurso não impeça o carregamento dos demais.
  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      const [ordersRes, holidaysRes, usersRes] = await Promise.allSettled([
        getOrders(),
        getHolidays(),
        getUsers(),
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
  }, [])

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
