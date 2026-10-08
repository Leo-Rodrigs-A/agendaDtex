import { describe, it, expect, afterEach } from 'vitest'
import type { Holiday } from '@/types'
import {
  businessDaysBack,
  businessDaysForward,
  capitalize,
  dateKeyOf,
  formatDayMonth,
  formatFullDate,
  formatMonthLong,
  formatMonthLongYear,
  formatMonthShort,
  formatMonthShortTitle,
  formatNumericDayMonth,
  getBusinessDaysUntil,
  isSameMonth,
  isToday,
  isWeekend,
  nextBusinessDays,
  parseDateKey,
  shiftBusinessDay,
  shiftSelectableDay,
  toDateKey,
} from './dates'

// Helper para criar Date local (meia-noite, sem timezone issues)
const localDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day)
}

const createHoliday = (date: string): Holiday => ({
  id: '1',
  holiday_date: date,
  holiday_description: 'Feriado',
})

// Outubro/2026: 10 = sábado, 11 = domingo, 12 = segunda (feriado),
// 13 = terça, 14 = quarta, 15 = quinta, 16 = sexta.
const holidays: Holiday[] = [createHoliday('2026-10-12')]

describe('toDateKey / parseDateKey / dateKeyOf', () => {
  it('formata Date local sem timezone', () => {
    expect(toDateKey(localDate(2026, 10, 13))).toBe('2026-10-13')
    expect(toDateKey(localDate(2026, 1, 5))).toBe('2026-01-05')
  })

  it('parseDateKey converte "YYYY-MM-DD" para Date local', () => {
    const d = parseDateKey('2026-10-13')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(9)
    expect(d.getDate()).toBe(13)
  })

  it('parseDateKey ignora a parte de tempo de string ISO', () => {
    const d = parseDateKey('2026-10-13T12:00:00')
    expect(toDateKey(d)).toBe('2026-10-13')
  })

  it('roundtrip parseDateKey/toDateKey é identidade', () => {
    expect(toDateKey(parseDateKey('2026-10-13'))).toBe('2026-10-13')
  })

  it('dateKeyOf extrai só os 10 primeiros chars', () => {
    expect(dateKeyOf('2026-10-13')).toBe('2026-10-13')
    expect(dateKeyOf('2026-10-13T00:00:00.000Z')).toBe('2026-10-13')
  })
})

describe('chaves de dia independentes do fuso', () => {
  const originalTz = process.env.TZ

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = originalTz
    }
  })

  it('toDateKey usa getters locais em fuso UTC+', () => {
    process.env.TZ = 'Asia/Tokyo' // UTC+9
    const day = localDate(2026, 10, 13)
    // Precondição do bug antigo: a chave ISO viraria o dia anterior.
    expect(day.toISOString().split('T')[0]).toBe('2026-10-12')
    expect(toDateKey(day)).toBe('2026-10-13')
  })

  it('toDateKey usa getters locais em fuso UTC-', () => {
    process.env.TZ = 'America/Sao_Paulo' // UTC-3
    expect(toDateKey(localDate(2026, 10, 13))).toBe('2026-10-13')
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

describe('shiftSelectableDay', () => {
  it('pula sábado e domingo (padrão sem sábado)', () => {
    expect(
      toDateKey(shiftSelectableDay(localDate(2026, 10, 10), 1, holidays)),
    ).toBe('2026-10-13') // 10(sab) → 11(dom) → 12(feriado) → 13
  })

  it('inclui sábado quando allowSaturday=true', () => {
    expect(
      toDateKey(
        shiftSelectableDay(localDate(2026, 10, 12), -1, holidays, true),
      ),
    ).toBe('2026-10-10') // 11(dom) → 10(sab, liberado)
  })

  it('pula domingo sempre, mesmo com allowSaturday', () => {
    expect(
      toDateKey(
        shiftSelectableDay(localDate(2026, 10, 12), -1, holidays, true),
      ),
    ).not.toBe('2026-10-11') // domingo nunca é selecionável
  })

  it('sem feriados, avança para a segunda seguinte', () => {
    expect(toDateKey(shiftSelectableDay(localDate(2026, 10, 9), 1, []))).toBe(
      '2026-10-12',
    )
  })
})

describe('shiftBusinessDay', () => {
  it('avança um dia útil pulando feriado', () => {
    expect(
      toDateKey(shiftBusinessDay(localDate(2026, 10, 12), 1, holidays)),
    ).toBe('2026-10-13')
  })

  it('volta um dia útil pulando fds e feriado', () => {
    expect(
      toDateKey(shiftBusinessDay(localDate(2026, 10, 12), -1, holidays)),
    ).toBe('2026-10-09') // 11(dom) → 10(sab) → 09
  })
})

describe('businessDaysBack / businessDaysForward', () => {
  it('recua contando dias úteis', () => {
    expect(
      toDateKey(businessDaysBack(localDate(2026, 10, 15), 2, holidays)),
    ).toBe('2026-10-13')
  })

  it('recua atravessando feriado', () => {
    expect(
      toDateKey(businessDaysBack(localDate(2026, 10, 15), 3, holidays)),
    ).toBe('2026-10-09') // 14 → 13 → pula 12(feriado)/11/10 → 09
  })

  it('avança contando dias úteis', () => {
    expect(
      toDateKey(businessDaysForward(localDate(2026, 10, 13), 2, holidays)),
    ).toBe('2026-10-15')
  })

  it('avança atravessando feriado', () => {
    expect(
      toDateKey(businessDaysForward(localDate(2026, 10, 9), 2, holidays)),
    ).toBe('2026-10-14') // 13 (pula 12) → 14
  })
})

describe('nextBusinessDays', () => {
  it('inclui o dia inicial e ignora fds', () => {
    const days = nextBusinessDays(localDate(2026, 10, 9), 3).map(toDateKey)
    expect(days).toEqual(['2026-10-09', '2026-10-12', '2026-10-13'])
  })

  it('não considera feriados (documentado)', () => {
    const days = nextBusinessDays(localDate(2026, 10, 9), 2).map(toDateKey)
    expect(days).toEqual(['2026-10-09', '2026-10-12'])
  })
})

describe('getBusinessDaysUntil', () => {
  // Janela contada: (hoje, alvo] — exclui hoje, inclui o alvo se for dia útil.
  // Fixa de out/2026: 10 = sáb, 11 = dom, 12 = feriado (seg), 13 = ter.
  // holidays globais do arquivo: [2026-10-12].

  it('retorna "past" quando o alvo é um dia útil no passado', () => {
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 9),
        holidays,
        localDate(2026, 10, 13),
      ),
    ).toEqual({
      type: 'past',
    })
  })

  it('retorna "past" mesmo quando o alvo no passado é sábado', () => {
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 10),
        holidays,
        localDate(2026, 10, 13),
      ),
    ).toEqual({
      type: 'past',
    })
  })

  it('retorna "today" quando o alvo é hoje', () => {
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 13),
        holidays,
        localDate(2026, 10, 13),
      ),
    ).toEqual({
      type: 'today',
    })
  })

  it('"today" é insensível à hora do dia de hoje', () => {
    const today = new Date(2026, 9, 13, 23, 59)
    expect(
      getBusinessDaysUntil(localDate(2026, 10, 13), holidays, today),
    ).toEqual({
      type: 'today',
    })
  })

  it('"future" com 1 dia útil para amanhã', () => {
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 14),
        holidays,
        localDate(2026, 10, 13),
      ),
    ).toEqual({
      type: 'future',
      businessDays: 1,
    })
  })

  it('"future" conta dois dias úteis à frente', () => {
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 15),
        holidays,
        localDate(2026, 10, 13),
      ),
    ).toEqual({
      type: 'future',
      businessDays: 2,
    })
  })

  it('atravessa fim de semana contando só dias úteis (sem feriado)', () => {
    // sex 09 → seg 12: janela 10(sab)+11(dom) pulados, 12 conta → 1.
    expect(
      getBusinessDaysUntil(localDate(2026, 10, 12), [], localDate(2026, 10, 9)),
    ).toEqual({
      type: 'future',
      businessDays: 1,
    })
  })

  it('atravessa fim de semana e feriado', () => {
    // sex 09 → ter 13: 10(sab)+11(dom)+12(feriado) pulados, 13 conta → 1.
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 13),
        holidays,
        localDate(2026, 10, 9),
      ),
    ).toEqual({
      type: 'future',
      businessDays: 1,
    })
  })

  it('data-alvo em feriado não conta (janela vazia vale 0)', () => {
    const holidayTarget: Holiday[] = [createHoliday('2026-10-14')]
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 14),
        holidayTarget,
        localDate(2026, 10, 13),
      ),
    ).toEqual({
      type: 'future',
      businessDays: 0,
    })
  })

  it('sábado como "today" conta a partir do próximo dia útil', () => {
    // sáb 10 → seg 12: janela 11(dom) pulado, 12 conta → 1.
    expect(
      getBusinessDaysUntil(
        localDate(2026, 10, 12),
        [],
        localDate(2026, 10, 10),
      ),
    ).toEqual({
      type: 'future',
      businessDays: 1,
    })
  })

  it('atravessa a virada de mês', () => {
    // qua 30/09 → sex 02/10: janela 01/10 + 02/10 → 2.
    expect(
      getBusinessDaysUntil(localDate(2026, 10, 2), [], localDate(2026, 9, 30)),
    ).toEqual({
      type: 'future',
      businessDays: 2,
    })
  })

  it('atravessa a virada de ano', () => {
    // qua 30/12/2026 → seg 04/01/2027: 31/12(qui)+01/01(sex) contam,
    // 02/01(sáb)+03/01(dom) pulados, 04/01(seg) conta → 3.
    expect(
      getBusinessDaysUntil(localDate(2027, 1, 4), [], localDate(2026, 12, 30)),
    ).toEqual({
      type: 'future',
      businessDays: 3,
    })
  })

  it('hora do dia no alvo não altera a contagem', () => {
    const targetWithTime = new Date(2026, 9, 15, 23, 59)
    expect(
      getBusinessDaysUntil(targetWithTime, holidays, localDate(2026, 10, 13)),
    ).toEqual({
      type: 'future',
      businessDays: 2,
    })
  })
})

describe('capitalize', () => {
  it('capitaliza a primeira letra', () => {
    expect(capitalize('setembro')).toBe('Setembro')
  })

  it('não quebra com string vazia', () => {
    expect(capitalize('')).toBe('')
  })
})

describe('formatadores pt-BR', () => {
  it('formatMonthShort: "set."', () => {
    expect(formatMonthShort(localDate(2026, 9, 1))).toBe('set.')
  })

  it('formatMonthShortTitle: "Jan"/"Set"', () => {
    expect(formatMonthShortTitle(localDate(2026, 1, 1))).toBe('Jan')
    expect(formatMonthShortTitle(localDate(2026, 9, 1))).toBe('Set')
  })

  it('formatMonthLong: "setembro"', () => {
    expect(formatMonthLong(localDate(2026, 9, 1))).toBe('setembro')
  })

  it('formatMonthLongYear: "setembro de 2026"', () => {
    expect(formatMonthLongYear(localDate(2026, 9, 1))).toBe('setembro de 2026')
  })

  it('formatDayMonth: "14 de set."', () => {
    expect(formatDayMonth(localDate(2026, 9, 14))).toBe('14 de set.')
  })

  it('formatNumericDayMonth: "14/09"', () => {
    expect(formatNumericDayMonth(localDate(2026, 9, 14))).toBe('14/09')
  })

  it('formatFullDate: "14 de set. de 2026"', () => {
    expect(formatFullDate(localDate(2026, 9, 14))).toBe('14 de set. de 2026')
  })
})

describe('predicado isToday vs toDateKey (padrão unificado)', () => {
  it('isToday(day) equivale a toDateKey(day) === toDateKey(hoje)', () => {
    const day = new Date()
    expect(isToday(day)).toBe(toDateKey(day) === toDateKey(new Date()))
  })
})
