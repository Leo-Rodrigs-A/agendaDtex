import type { Holiday, Order } from '@/types'
import {
  businessDaysBack,
  dateKeyOf,
  nextBusinessDays,
  parseDateKey,
  toDateKey,
} from '@/lib/dates'

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

/**
 * Data de produção de um pedido (calculada só no front):
 * 2 dias úteis antes do `delivery_date` — mesma regra do lembrete da home.
 */
export function productionDateOf(order: Order, holidays: Array<Holiday>): Date {
  return businessDaysBack(parseDateKey(order.delivery_date), 2, holidays)
}

/** Pedidos cuja produção cai no dia informado. */
export function ordersForProductionDay(
  orders: Array<Order>,
  day: Date,
  holidays: Array<Holiday>,
): Array<Order> {
  const key = toDateKey(day)
  return orders.filter((o) => toDateKey(productionDateOf(o, holidays)) === key)
}

/** Pedidos encomendados (criados) no dia informado, com base em `created_at`. */
export function ordersCreatedOnDay(
  orders: Array<Order>,
  day: Date,
): Array<Order> {
  const key = toDateKey(day)
  return orders.filter((o) => {
    const created = new Date(o.created_at)
    return !Number.isNaN(created.getTime()) && toDateKey(created) === key
  })
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

/**
 * Pedidos criados (encomendados) no mês informado (month: 0-11),
 * com base em `created_at`. Base dos KPIs mensais de vendas.
 */
export function ordersCreatedInMonth(
  orders: Array<Order>,
  month: number,
  year: number,
): Array<Order> {
  return orders.filter((o) => {
    const created = new Date(o.created_at)
    return created.getMonth() === month && created.getFullYear() === year
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

export type DayBreakdown = {
  date: Date
  /** Rótulo curto do eixo X (ex.: "seg 22"). */
  label: string
  shirts: number
  others: number
}

const breakdownFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
})

/**
 * Soma de camisetas e de shorts/outros agendados para os próximos `count`
 * dias úteis a partir de `from` (inclusive). Base do area chart da home.
 */
export function businessDaysBreakdown(
  orders: Array<Order>,
  from: Date,
  count: number,
): Array<DayBreakdown> {
  return nextBusinessDays(from, count).map((date) => {
    const dayOrders = ordersForDay(orders, date)
    return {
      date,
      label: breakdownFormatter.format(date),
      shirts: dayOrders.reduce((acc, o) => acc + num(o.shirt_count), 0),
      others: dayOrders.reduce((acc, o) => acc + num(o.others_items_count), 0),
    }
  })
}

// ---- Ordenação das tabelas de pedidos ----

export type OrderSortKey =
  | 'order_name'
  | 'seller'
  | 'shirt_count'
  | 'others_items_count'
  | 'created_at'
  | 'delivery_date'
  | 'total_amount'

export type OrderSortDir = 'asc' | 'desc'

/**
 * Compara datas por timestamp (número), não por string. Strings de data da
 * planilha podem ter formatos variados ("YYYY-MM-DD", ISO com hora, Date
 * serializado) — comparação textual agrupava errado por mês.
 */
function compareDates(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime()
}

/**
 * Retorna uma cópia de `orders` ordenada pela coluna/direção informadas.
 * `sellerName` resolve o nome do vendedor para a coluna "seller".
 */
export function sortOrders(
  orders: Array<Order>,
  key: OrderSortKey,
  dir: OrderSortDir,
  sellerName: (userId: string) => string = () => '',
): Array<Order> {
  const sorted = [...orders]
  sorted.sort((a, b) => {
    let cmp: number
    switch (key) {
      case 'created_at':
      case 'delivery_date':
        cmp = compareDates(a[key], b[key])
        break
      case 'shirt_count':
      case 'others_items_count':
      case 'total_amount':
        cmp = num(a[key]) - num(b[key])
        break
      case 'seller':
        cmp = sellerName(a.user_id).localeCompare(
          sellerName(b.user_id),
          'pt-BR',
        )
        break
      default:
        cmp = a.order_name.localeCompare(b.order_name, 'pt-BR')
    }
    return dir === 'asc' ? cmp : -cmp
  })
  return sorted
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
