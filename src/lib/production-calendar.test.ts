import { describe, it, expect } from 'vitest'
import {
  groupOrdersByProductionDate,
  getOrdersForDay,
  getMonthGridDays,
  getDaysForView,
  navigateMonth,
  navigateWeek,
  truncateOrderName,
  isToday,
  isSameMonth,
  isWeekend,
} from './production-calendar'
import type { Order, Holiday } from '@/types'

// Helper para criar Date local (meia-noite, sem timezone issues)
const localDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day)
}

// Mock de pedidos para testes
const createOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '1',
  user_id: 'user-1',
  order_name: 'Pedido Teste',
  shirt_count: 10,
  others_items_count: 5,
  total_amount: 100,
  created_at: new Date().toISOString(),
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

describe('production-calendar', () => {
  const holidays: Holiday[] = [
    createHoliday('2026-10-12'), // segunda
  ]

  describe('groupOrdersByProductionDate', () => {
    it('exclui pedidos concluídos', () => {
      const orders = [
        createOrder({ id: '1', is_done: false }),
        createOrder({ id: '2', is_done: true }),
      ]
      const grouped = groupOrdersByProductionDate(
        orders,
        holidays,
        'all',
        'user-1',
      )
      expect(grouped.size).toBe(1)
    })

    it('filtra por scope=mine', () => {
      const orders = [
        createOrder({ id: '1', user_id: 'user-1' }),
        createOrder({ id: '2', user_id: 'user-2' }),
      ]
      const grouped = groupOrdersByProductionDate(
        orders,
        holidays,
        'mine',
        'user-1',
      )
      expect(grouped.size).toBe(1)
    })

    it('agrupa corretamente por data de produção', () => {
      // delivery 15/10 (qui) - 2 dias úteis = 13/10 (ter) [12/10 é feriado]
      const orders = [createOrder({ id: '1', delivery_date: '2026-10-15' })]
      const grouped = groupOrdersByProductionDate(
        orders,
        holidays,
        'all',
        'user-1',
      )
      const key = '2026-10-13'
      expect(grouped.has(key)).toBe(true)
      expect(grouped.get(key)?.length).toBe(1)
    })

    it('scope=all não filtra por usuário', () => {
      const orders = [
        createOrder({ id: '1', user_id: 'user-1' }),
        createOrder({ id: '2', user_id: 'user-2' }),
      ]
      const grouped = groupOrdersByProductionDate(
        orders,
        holidays,
        'all',
        'user-1',
      )
      expect(grouped.size).toBeGreaterThan(0)
    })
  })

  describe('getOrdersForDay', () => {
    it('retorna pedidos do dia', () => {
      const grouped = new Map<string, Order[]>([
        ['2026-10-13', [createOrder({ id: '1' })]],
      ])
      const day = localDate(2026, 10, 13)
      expect(getOrdersForDay(grouped, day).length).toBe(1)
    })

    it('retorna array vazio para dia sem pedidos', () => {
      const grouped = new Map<string, Order[]>()
      const day = localDate(2026, 10, 13)
      expect(getOrdersForDay(grouped, day)).toEqual([])
    })
  })

  describe('getMonthGridDays', () => {
    it('retorna 35 ou 42 dias', () => {
      const anchor = localDate(2026, 10, 15)
      const days = getMonthGridDays(anchor)
      expect([35, 42]).toContain(days.length)
    })

    it('primeiro dia é domingo', () => {
      const anchor = localDate(2026, 10, 15)
      const days = getMonthGridDays(anchor)
      expect(days[0].getDay()).toBe(0)
    })

    it('último dia é sábado', () => {
      const anchor = localDate(2026, 10, 15)
      const days = getMonthGridDays(anchor)
      expect(days[days.length - 1].getDay()).toBe(6)
    })
  })

  describe('getDaysForView', () => {
    it('retorna 3 dias para 3-days', () => {
      const anchor = localDate(2026, 10, 15)
      const days = getDaysForView(anchor, '3-days')
      expect(days.length).toBe(3)
      expect(days[0].getTime()).toBe(anchor.getTime())
    })

    it('retorna 7 dias para 7-days', () => {
      const anchor = localDate(2026, 10, 15)
      const days = getDaysForView(anchor, '7-days')
      expect(days.length).toBe(7)
      expect(days[0].getTime()).toBe(anchor.getTime())
    })
  })

  describe('navigateMonth', () => {
    it('avança para próximo mês', () => {
      const anchor = localDate(2026, 10, 15)
      const next = navigateMonth(anchor, 1)
      expect(next.getMonth()).toBe(10) // novembro (0-indexed)
      expect(next.getDate()).toBe(1)
    })

    it('volta para mês anterior', () => {
      const anchor = localDate(2026, 10, 15)
      const prev = navigateMonth(anchor, -1)
      expect(prev.getMonth()).toBe(8) // setembro
      expect(prev.getDate()).toBe(1)
    })
  })

  describe('navigateWeek', () => {
    it('avança 7 dias', () => {
      const anchor = localDate(2026, 10, 15)
      const next = navigateWeek(anchor, 1)
      expect(next.getTime() - anchor.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('volta 7 dias', () => {
      const anchor = localDate(2026, 10, 15)
      const prev = navigateWeek(anchor, -1)
      expect(anchor.getTime() - prev.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
    })
  })

  describe('truncateOrderName', () => {
    it('não trunca se <= 12', () => {
      expect(truncateOrderName('123456789012')).toBe('123456789012')
    })

    it('trunca e adiciona ellipsis se > 12', () => {
      expect(truncateOrderName('1234567890123')).toBe('123456789012…')
    })
  })

  describe('isToday', () => {
    it('retorna true para hoje', () => {
      expect(isToday(new Date())).toBe(true)
    })

    it('retorna false para ontem', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe('isSameMonth', () => {
    it('true para mesmo mês/ano', () => {
      expect(
        isSameMonth(localDate(2026, 10, 15), localDate(2026, 10, 20)),
      ).toBe(true)
    })

    it('false para mês diferente', () => {
      expect(
        isSameMonth(localDate(2026, 10, 15), localDate(2026, 11, 15)),
      ).toBe(false)
    })

    it('false para ano diferente', () => {
      expect(
        isSameMonth(localDate(2026, 10, 15), localDate(2027, 10, 15)),
      ).toBe(false)
    })
  })

  describe('isWeekend', () => {
    it('true para sábado', () => {
      expect(isWeekend(localDate(2026, 10, 10))).toBe(true) // sábado
    })

    it('true para domingo', () => {
      expect(isWeekend(localDate(2026, 10, 11))).toBe(true) // domingo
    })

    it('false para dia útil', () => {
      expect(isWeekend(localDate(2026, 10, 12))).toBe(false) // segunda
    })
  })
})
