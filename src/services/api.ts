import type {
  Order,
  Holiday,
  User,
  CreateOrderPayload,
  CreateHolidayPayload,
  CreateUserPayload,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL as string

// Resposta de erro padrão dos POSTs do Apps Script: { error: string }
// (ou null/objeto vazio em caso de sucesso)
type ApiErrorBody = { error?: string } | null

async function get<T>(resource: string): Promise<Array<T>> {
  const res = await fetch(`${API_URL}?resource=${resource}`)
  if (!res.ok) {
    throw new Error(`Falha ao buscar ${resource}: HTTP ${res.status}`)
  }
  let data: unknown = await res.json()
  // O cache do Apps Script pode devolver JSON duplamente serializado (string)
  if (typeof data === 'string') {
    data = JSON.parse(data)
  }
  if (!Array.isArray(data)) {
    throw new Error(`Resposta inesperada de ${resource}: esperado um array`)
  }
  return data as Array<T>
}

async function post<TPayload>(
  resource: string,
  payload: TPayload,
): Promise<void> {
  const res = await fetch(`${API_URL}?resource=${resource}`, {
    method: 'POST',
    // text/plain evita preflight CORS (OPTIONS), que o Apps Script não responde
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(`Falha ao criar em ${resource}: HTTP ${res.status}`)
  }
  const body = (await res.json()) as ApiErrorBody
  if (body?.error) {
    throw new Error(body.error)
  }
}

// GETs — retornam arrays puros (ver .agent/contexto da api.md)
export const getOrders = () => get<Order>('orders')
export const getHolidays = () => get<Holiday>('holidays')
export const getUsers = () => get<User>('users')

// POSTs — após sucesso, chamar o refresh correspondente do DataProvider
// (a API não retorna o objeto criado; estratégia: re-fetch do recurso)
export const createOrder = (payload: CreateOrderPayload) =>
  post('orders', payload)
export const createHoliday = (payload: CreateHolidayPayload) =>
  post('holidays', payload)
export const createUser = (payload: CreateUserPayload) => post('users', payload)

// Atualização parcial de pedido (hoje: toggle de is_done)
export const updateOrderDone = (payload: { id: string; is_done: boolean }) =>
  post('update_order', payload)
