import type { Holiday, Order } from '@/types'
import { productionDateOf } from './orders'
import { toDateKey } from './dates'

/** Visões do calendário de produção */
export type CalendarView = 'month' | '7-days' | '3-days'

/** Pedido já com sua data de produção calculada */
export type CalendarOrder = {
  order: Order
  productionDate: Date
}

/** Agrupa pedidos por data de produção (apenas não concluídos) */
export function groupOrdersByProductionDate(
  orders: Order[],
  holidays: Holiday[],
  scope: 'all' | 'mine',
  profileId: string | undefined,
): Map<string, Order[]> {
  const filtered = orders.filter((o) => {
    if (o.is_done === true) return false
    if (scope === 'mine' && o.user_id !== profileId) return false
    return true
  })

  const grouped = new Map<string, Order[]>()

  for (const order of filtered) {
    const prodDate = productionDateOf(order, holidays)
    const key = toDateKey(prodDate)
    const existing = grouped.get(key) ?? []
    existing.push(order)
    grouped.set(key, existing)
  }

  return grouped
}

/** Retorna pedidos de um dia específico a partir do mapa agrupado */
export function getOrdersForDay(
  grouped: Map<string, Order[]>,
  day: Date,
): Order[] {
  return grouped.get(toDateKey(day)) ?? []
}

/** Gera os dias do grid mensal (35 ou 42 células: completo semanas) */
export function getMonthGridDays(anchorDate: Date): Date[] {
  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0)

  const firstDayOfWeek = start.getDay() // 0=Dom, 1=Seg...
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - firstDayOfWeek)

  const lastDayOfWeek = end.getDay()
  const gridEnd = new Date(end)
  gridEnd.setDate(end.getDate() + (6 - lastDayOfWeek))

  const days: Date[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

/** Gera array de dias para visão N-dias (3 ou 7) a partir do anchorDate */
export function getDaysForView(
  anchorDate: Date,
  view: '3-days' | '7-days',
): Date[] {
  const count = view === '3-days' ? 3 : 7
  const days: Date[] = []
  const cursor = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate(),
  )
  for (let i = 0; i < count; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

/** Navega para mês anterior/próximo mantendo o dia 1 */
export function navigateMonth(anchorDate: Date, delta: -1 | 1): Date {
  return new Date(anchorDate.getFullYear(), anchorDate.getMonth() + delta, 1)
}

/** Navega para semana anterior/próxima (7 dias) */
export function navigateWeek(anchorDate: Date, delta: -1 | 1): Date {
  const result = new Date(anchorDate)
  result.setDate(result.getDate() + delta * 7)
  return result
}

/**
 * Reposiciona a âncora ao trocar de visão (regra do Slice 16.5):
 *  - visão mês → sempre o 1º dia do mês da âncora;
 *  - 3/7 dias → hoje, se a âncora já estiver no mês atual; senão o
 *    1º dia do mês da âncora.
 */
export function normalizeAnchorForView(
  anchorDate: Date,
  view: CalendarView,
  today: Date,
): Date {
  if (view === 'month') {
    return new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  }
  if (isSameMonth(anchorDate, today)) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }
  return new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
}

/** Abrevia nome do pedido para 12 chars + ellipsis */
export function truncateOrderName(name: string, max = 12): string {
  if (name.length <= max) return name
  return `${name.slice(0, max)}…`
}

/** Verifica se uma data é hoje */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/** Verifica se uma data é do mês do anchor (para células de outros meses no grid) */
export function isSameMonth(date: Date, anchorDate: Date): boolean {
  return (
    date.getMonth() === anchorDate.getMonth() &&
    date.getFullYear() === anchorDate.getFullYear()
  )
}

/** Verifica se é fim de semana (sábado ou domingo) */
export function isWeekend(date: Date): boolean {
  const dow = date.getDay()
  return dow === 0 || dow === 6
}
