import type { Order } from '@/types'
import { dateKeyOf, nextBusinessDays, toDateKey } from '@/lib/dates'

/** Capacidade diária recomendada (não é bloqueio — só alerta visual). */
export const DAILY_PIECE_QUOTA = 100
export const DAILY_ORDER_QUOTA = 15

// As células numéricas da planilha podem vir como "" quando vazias
function num(value: number | string | null | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Total de peças de um pedido (camisetas + outros itens). */
export function countPieces(order: Order): number {
  return num(order.shirt_count) + num(order.others_items_count)
}

/** Pedidos cuja entrega cai no dia informado. */
export function ordersForDay(orders: Array<Order>, day: Date): Array<Order> {
  const key = toDateKey(day)
  return orders.filter((o) => dateKeyOf(o.delivery_date) === key)
}

/** Pedidos cujo mês de entrega é o informado (month: 0-11). */
export function ordersForMonth(
  orders: Array<Order>,
  month: number,
  year: number,
): Array<Order> {
  return orders.filter((o) => {
    const key = dateKeyOf(o.delivery_date)
    const [y, m] = key.split('-').map(Number)
    return y === year && m === month + 1
  })
}

export function sumPieces(orders: Array<Order>): number {
  return orders.reduce((acc, o) => acc + countPieces(o), 0)
}

export function sumRevenue(orders: Array<Order>): number {
  return orders.reduce((acc, o) => acc + num(o.total_amount), 0)
}

export function averageTicket(orders: Array<Order>): number {
  return orders.length === 0 ? 0 : sumRevenue(orders) / orders.length
}

export type WeekDayStatus = {
  date: Date
  orderCount: number
  pieceCount: number
}

/**
 * Status dos próximos 7 dias úteis a partir de `today` (inclusive),
 * excluindo sábados e domingos. Sempre relativo a hoje.
 */
export function weekStatus(
  orders: Array<Order>,
  today: Date,
): Array<WeekDayStatus> {
  return nextBusinessDays(today, 7).map((date) => {
    const dayOrders = ordersForDay(orders, date)
    return {
      date,
      orderCount: dayOrders.length,
      pieceCount: sumPieces(dayOrders),
    }
  })
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/** Formata número como moeda BRL sem centavos ("R$ 45.000"). */
export function formatBRL(value: number): string {
  return currencyFormatter.format(value)
}
