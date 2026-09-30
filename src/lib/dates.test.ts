import { describe, it, expect } from 'vitest'
import { isSameMonth, isToday, isWeekend, toDateKey } from './dates'

// Helper para criar Date local (meia-noite, sem timezone issues)
const localDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day)
}

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
    expect(isSameMonth(localDate(2026, 10, 15), localDate(2026, 10, 20))).toBe(
      true,
    )
  })

  it('false para mês diferente', () => {
    expect(isSameMonth(localDate(2026, 10, 15), localDate(2026, 11, 15))).toBe(
      false,
    )
  })

  it('false para ano diferente', () => {
    expect(isSameMonth(localDate(2026, 10, 15), localDate(2027, 10, 15))).toBe(
      false,
    )
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

describe('predicado isToday vs toDateKey (padrão unificado)', () => {
  it('isToday(day) equivale a toDateKey(day) === toDateKey(hoje)', () => {
    const day = new Date()
    expect(isToday(day)).toBe(toDateKey(day) === toDateKey(new Date()))
  })
})
