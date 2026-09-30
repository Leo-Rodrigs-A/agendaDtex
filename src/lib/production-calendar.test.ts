import { describe, it, expect, afterEach } from 'vitest'
import {
  groupOrdersByProductionDate,
  getOrdersForDay,
  getMonthGridDays,
  getDaysForView,
  navigateMonth,
  navigateWeek,
  navigateDays,
  normalizeAnchorForView,
  truncateOrderName,
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

    // Regressão: as telas montavam a chave com `day.toISOString()`, que
    // converte para UTC — em fusos UTC+ a meia-noite local vira o dia
    // ANTERIOR e os pedidos apareciam na célula errada. `toDateKey` lê os
    // getters locais, então o dia certo é achado em qualquer fuso.
    describe('chave de dia independente do fuso', () => {
      const originalTz = process.env.TZ

      afterEach(() => {
        // `= undefined` escreveria a string "undefined" e o Node cairia
        // num fuso inválido no resto da suíte — é preciso remover a chave.
        if (originalTz === undefined) {
          delete process.env.TZ
        } else {
          process.env.TZ = originalTz
        }
      })

      it('acha o pedido em fuso UTC+', () => {
        process.env.TZ = 'Asia/Tokyo' // UTC+9
        const day = localDate(2026, 10, 13)
        const grouped = new Map<string, Order[]>([
          ['2026-10-13', [createOrder({ id: '1' })]],
        ])

        // Precondição do bug: em UTC a chave antiga seria 12/10.
        expect(day.toISOString().split('T')[0]).toBe('2026-10-12')
        expect(getOrdersForDay(grouped, day)).toHaveLength(1)
      })

      it('acha o pedido em fuso UTC-', () => {
        process.env.TZ = 'America/Sao_Paulo' // UTC-3
        const day = localDate(2026, 10, 13)
        const grouped = new Map<string, Order[]>([
          ['2026-10-13', [createOrder({ id: '1' })]],
        ])

        expect(getOrdersForDay(grouped, day)).toHaveLength(1)
      })
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

  describe('navigateDays', () => {
    it('avança 3 dias', () => {
      const anchor = localDate(2026, 10, 15)
      const next = navigateDays(anchor, 1)
      expect(next.getTime() - anchor.getTime()).toBe(3 * 24 * 60 * 60 * 1000)
    })

    it('volta 3 dias', () => {
      const anchor = localDate(2026, 10, 15)
      const prev = navigateDays(anchor, -1)
      expect(anchor.getTime() - prev.getTime()).toBe(3 * 24 * 60 * 60 * 1000)
    })

    it('atravessa a virada de mês', () => {
      expect(navigateDays(localDate(2026, 10, 30), 1).getDate()).toBe(2)
      expect(navigateDays(localDate(2026, 10, 2), -1).getMonth()).toBe(8)
    })
  })

  describe('normalizeAnchorForView', () => {
    const today = localDate(2026, 10, 15)

    it('visão mês sempre cai no 1º dia do mês da âncora', () => {
      const anchor = localDate(2026, 10, 28)
      const result = normalizeAnchorForView(anchor, 'month', today)
      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(9)
      expect(result.getFullYear()).toBe(2026)
    })

    it('visão mês mantém o ano quando a âncora é de outro ano', () => {
      const anchor = localDate(2027, 3, 20)
      const result = normalizeAnchorForView(anchor, 'month', today)
      expect(result.getFullYear()).toBe(2027)
      expect(result.getMonth()).toBe(2)
      expect(result.getDate()).toBe(1)
    })

    it('3/7 dias no mês atual cai em hoje', () => {
      const anchor = localDate(2026, 10, 1)
      const seven = normalizeAnchorForView(anchor, '7-days', today)
      const three = normalizeAnchorForView(anchor, '3-days', today)
      expect(seven.getTime()).toBe(today.getTime())
      expect(three.getTime()).toBe(today.getTime())
    })

    it('3/7 dias com âncora no mesmo mês mas noutro ano cai no 1º do mês', () => {
      const anchor = localDate(2027, 10, 20)
      const result = normalizeAnchorForView(anchor, '7-days', today)
      expect(result.getFullYear()).toBe(2027)
      expect(result.getMonth()).toBe(9)
      expect(result.getDate()).toBe(1)
    })

    it('3/7 dias em outro mês cai no 1º dia daquele mês', () => {
      const anchor = localDate(2026, 12, 20)
      const seven = normalizeAnchorForView(anchor, '7-days', today)
      const three = normalizeAnchorForView(anchor, '3-days', today)
      expect(seven.getTime()).toBe(localDate(2026, 12, 1).getTime())
      expect(three.getTime()).toBe(localDate(2026, 12, 1).getTime())
    })

    it('não muta a âncora recebida', () => {
      const anchor = localDate(2026, 12, 20)
      normalizeAnchorForView(anchor, '7-days', today)
      expect(anchor.getDate()).toBe(20)
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
})
