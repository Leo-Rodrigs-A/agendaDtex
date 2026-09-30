import { describe, it, expect } from 'vitest'
import type { Holiday, Order } from '@/types'
import {
  averageTicket,
  businessDaysBreakdown,
  countPieces,
  formatBRL,
  ordersCreatedInMonth,
  ordersCreatedOnDay,
  ordersForProductionDay,
  productionDateOf,
  sortOrders,
  sumPieces,
  sumRevenue,
} from './orders'
import { toDateKey } from './dates'

const localDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day)
}

const createOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '1',
  user_id: 'user-1',
  order_name: 'Pedido Teste',
  shirt_count: 10,
  others_items_count: 5,
  total_amount: 100,
  created_at: '2026-10-05T10:00:00.000Z',
  delivery_date: '2026-10-15',
  is_done: false,
  imgurl: '',
  ...overrides,
})

const createHoliday = (date: string): Holiday => ({
  id: '1',
  holiday_date: date,
  holiday_description: 'Feriado',
})

const holidays: Holiday[] = [createHoliday('2026-10-12')]

describe('countPieces', () => {
  it('soma camisetas e outros', () => {
    expect(countPieces(createOrder())).toBe(15)
  })

  it('tolera valores string e vazios da planilha', () => {
    expect(
      countPieces(createOrder({ shirt_count: '8' as unknown as number })),
    ).toBe(13)
    expect(
      countPieces(
        createOrder({
          shirt_count: '' as unknown as number,
          others_items_count: '' as unknown as number,
        }),
      ),
    ).toBe(0)
  })
})

describe('productionDateOf', () => {
  it('produção = 2 dias úteis antes da entrega', () => {
    expect(toDateKey(productionDateOf(createOrder(), holidays))).toBe(
      '2026-10-13',
    ) // 15 → 14 → 13
  })

  it('permanece correto sem feriado', () => {
    expect(toDateKey(productionDateOf(createOrder(), []))).toBe('2026-10-13')
  })
})

describe('ordersForProductionDay', () => {
  const orders = [
    createOrder({ id: '1', delivery_date: '2026-10-15' }), // produção 13/10
    createOrder({ id: '2', delivery_date: '2026-10-16' }), // produção 14/10
    createOrder({ id: '3', delivery_date: '2026-10-19' }), // produção 15/10
  ]

  it('filtra pela data de produção (não a de entrega)', () => {
    const result = ordersForProductionDay(
      orders,
      localDate(2026, 10, 13),
      holidays,
    )
    expect(result.map((o) => o.id)).toEqual(['1'])
  })
})

// ISO a partir de meio-dia LOCAL: o mesmo dia local em qualquer fuso, já que
// `toDateKey`/getMonth usam getters locais.
const isoAtLocalNoon = (year: number, month: number, day: number): string =>
  new Date(year, month - 1, day, 12).toISOString()

describe('ordersCreatedOnDay', () => {
  it('filtra por created_at no dia (ignora o horário)', () => {
    const orders = [
      createOrder({ id: '1', created_at: isoAtLocalNoon(2026, 10, 5) }),
      createOrder({ id: '2', created_at: isoAtLocalNoon(2026, 10, 5) }),
      createOrder({ id: '3', created_at: isoAtLocalNoon(2026, 10, 6) }),
    ]
    const result = ordersCreatedOnDay(orders, localDate(2026, 10, 5))
    expect(result.map((o) => o.id)).toEqual(['1', '2'])
  })

  it('descarta created_at inválido', () => {
    const orders = [createOrder({ id: '1', created_at: 'não é data' })]
    expect(ordersCreatedOnDay(orders, localDate(2026, 10, 5))).toEqual([])
  })
})

describe('ordersCreatedInMonth', () => {
  it('filtra por mês/ano de created_at', () => {
    const orders = [
      createOrder({ id: '1', created_at: isoAtLocalNoon(2026, 10, 15) }),
      createOrder({ id: '2', created_at: isoAtLocalNoon(2026, 9, 30) }),
      createOrder({ id: '3', created_at: isoAtLocalNoon(2026, 10, 31) }),
    ]
    const result = ordersCreatedInMonth(orders, 9, 2026) // mês 9 = outubro
    expect(result.map((o) => o.id)).toEqual(['1', '3'])
  })
})

describe('sumPieces / sumRevenue / averageTicket', () => {
  const orders = [
    createOrder({ shirt_count: 10, others_items_count: 5, total_amount: 100 }),
    createOrder({ shirt_count: 3, others_items_count: 2, total_amount: 200 }),
  ]

  it('sumPieces soma peças', () => {
    expect(sumPieces(orders)).toBe(20)
  })

  it('sumRevenue soma valores (tolerando string)', () => {
    const withString = [
      createOrder({ total_amount: '150' as unknown as number }),
    ]
    expect(sumRevenue(withString)).toBe(150)
  })

  it('averageTicket = receita / pedidos', () => {
    expect(averageTicket(orders)).toBe(150)
  })

  it('averageTicket de lista vazia é 0', () => {
    expect(averageTicket([])).toBe(0)
  })
})

describe('businessDaysBreakdown', () => {
  const orders = [
    createOrder({
      id: '1',
      delivery_date: '2026-10-09',
      shirt_count: 3,
      others_items_count: 1,
    }),
    createOrder({
      id: '2',
      delivery_date: '2026-10-12',
      shirt_count: 5,
      others_items_count: 2,
    }),
    createOrder({
      id: '3',
      delivery_date: '2026-10-13',
      shirt_count: 0,
      others_items_count: 4,
    }),
    createOrder({
      id: '4',
      delivery_date: '2026-10-16',
      shirt_count: 9,
      others_items_count: 9,
    }),
  ]

  const breakdown = businessDaysBreakdown(orders, localDate(2026, 10, 9), 3)

  it('gera os próximos N dias úteis a partir de `from`', () => {
    expect(breakdown.map((b) => toDateKey(b.date))).toEqual([
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
    ])
  })

  it('agrega camisetas e outros por dia (formato da entrega)', () => {
    expect(breakdown[0]).toMatchObject({ shirts: 3, others: 1 })
    expect(breakdown[1]).toMatchObject({ shirts: 5, others: 2 })
    expect(breakdown[2]).toMatchObject({ shirts: 0, others: 4 })
  })

  it('ignora pedidos fora da janela', () => {
    expect(breakdown.flatMap((b) => b.shirts + b.others)).not.toContain(18)
  })

  it('rotula o eixo X como "sex., 09"', () => {
    expect(breakdown[0].label).toBe('sex., 09')
  })
})

describe('sortOrders', () => {
  const orders = [
    createOrder({
      id: '1',
      order_name: 'Caju',
      shirt_count: 5,
      others_items_count: 1,
      total_amount: 100,
      delivery_date: '2026-10-15',
      created_at: '2026-10-15T10:00:00.000Z',
      user_id: 'u-a',
    }),
    createOrder({
      id: '2',
      order_name: 'Abacaxi',
      shirt_count: 1,
      others_items_count: 4,
      total_amount: 300,
      delivery_date: '2026-10-01T12:00:00.000Z',
      created_at: '2026-10-01T10:00:00.000Z',
      user_id: 'u-b',
    }),
    createOrder({
      id: '3',
      order_name: 'Banana',
      shirt_count: 3,
      others_items_count: 2,
      total_amount: 200,
      delivery_date: '2026-11-02',
      created_at: '2026-10-10T10:00:00.000Z',
      user_id: 'u-c',
    }),
  ]

  it('ordena por total_amount', () => {
    expect(sortOrders(orders, 'total_amount', 'asc').map((o) => o.id)).toEqual([
      '1',
      '3',
      '2',
    ])
    expect(sortOrders(orders, 'total_amount', 'desc').map((o) => o.id)).toEqual(
      ['2', '3', '1'],
    )
  })

  it('ordena datas por timestamp, aceitando formatos mistos', () => {
    expect(sortOrders(orders, 'delivery_date', 'asc').map((o) => o.id)).toEqual(
      ['2', '1', '3'],
    ) // 01/10 (ISO) < 15/10 (puro) < 02/11
    expect(sortOrders(orders, 'created_at', 'desc').map((o) => o.id)).toEqual([
      '1',
      '3',
      '2',
    ])
  })

  it('ordena por nome em pt-BR', () => {
    expect(sortOrders(orders, 'order_name', 'asc').map((o) => o.id)).toEqual([
      '2',
      '3',
      '1',
    ])
  })

  it('ordena por vendedor via resolver', () => {
    const names: Record<string, string> = {
      'u-a': 'Zé',
      'u-b': 'Ana',
      'u-c': 'Bia',
    }
    const result = sortOrders(orders, 'seller', 'asc', (id) => names[id])
    expect(result.map((o) => o.user_id)).toEqual(['u-b', 'u-c', 'u-a'])
  })

  it('não muta a lista original', () => {
    const ids = orders.map((o) => o.id)
    sortOrders(orders, 'total_amount', 'desc')
    expect(orders.map((o) => o.id)).toEqual(ids)
  })
})

describe('formatBRL', () => {
  it('formata sem centavos', () => {
    expect(formatBRL(45000)).toBe('R$\u00A045.000')
    expect(formatBRL(0)).toBe('R$\u00A00')
  })
})
