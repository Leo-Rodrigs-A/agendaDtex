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
