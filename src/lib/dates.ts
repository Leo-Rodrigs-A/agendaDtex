import type { Holiday } from '@/types'

/** Converte Date local para "YYYY-MM-DD" (sem timezone). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Converte "YYYY-MM-DD" (ou string ISO "YYYY-MM-DDT...") para Date local
 * (meia-noite, sem deslocamento de fuso).
 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Extrai o "YYYY-MM-DD" de uma data vinda da API (string pura ou ISO). */
export function dateKeyOf(value: string): string {
  return value.slice(0, 10)
}

/** Matcher do react-day-picker para fins de semana (sábado e domingo). */
export const WEEKEND_MATCHER = { dayOfWeek: [0, 6] }

/** Dates locais correspondentes aos feriados cadastrados. */
export function holidayDates(holidays: Array<Holiday>): Array<Date> {
  return holidays.map((h) => parseDateKey(h.holiday_date))
}

function isWeekend(date: Date): boolean {
  const dow = date.getDay()
  return dow === 0 || dow === 6
}

/**
 * Avança/volta `delta` dias ignorando fins de semana e feriados
 * (delta positivo = próximo dia útil; negativo = anterior).
 */
export function shiftBusinessDay(
  day: Date,
  delta: 1 | -1,
  holidays: Array<Holiday>,
): Date {
  const holidayKeys = new Set(holidays.map((h) => h.holiday_date.slice(0, 10)))
  const cursor = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  do {
    cursor.setDate(cursor.getDate() + delta)
  } while (isWeekend(cursor) || holidayKeys.has(toDateKey(cursor)))
  return cursor
}

/**
 * Retrocede `count` dias úteis a partir de `day` (excluindo fds e feriados).
 * Usado no lembrete de produção da home (2 dias úteis antes da entrega).
 */
export function businessDaysBack(
  day: Date,
  count: number,
  holidays: Array<Holiday>,
): Date {
  let cursor = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  for (let i = 0; i < count; i++) {
    cursor = shiftBusinessDay(cursor, -1, holidays)
  }
  return cursor
}

/**
 * Avança `count` dias úteis a partir de `day` (excluindo fds e feriados).
 * Usado no hint de entrega da home (2 dias úteis depois da produção).
 */
export function businessDaysForward(
  day: Date,
  count: number,
  holidays: Array<Holiday>,
): Date {
  let cursor = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  for (let i = 0; i < count; i++) {
    cursor = shiftBusinessDay(cursor, 1, holidays)
  }
  return cursor
}

/**
 * Próximos `count` dias úteis a partir de `startDate` (inclusive),
 * excluindo sábados e domingos.
 */
export function nextBusinessDays(startDate: Date, count: number): Array<Date> {
  const days: Array<Date> = []
  const cursor = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  )
  while (days.length < count) {
    if (!isWeekend(cursor)) {
      days.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}
