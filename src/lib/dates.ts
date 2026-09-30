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

/** Matcher só para domingo (usado quando sábado é permitido, ex.: /producao). */
export const SUNDAY_ONLY_MATCHER = { dayOfWeek: [0] }

/**
 * Avança/volta `delta` dias ignorando domingos e feriados.
 * O sábado é opcionalmente incluído (`allowSaturday` = true em /producao,
 * onde o dia selecionado representa `created_at` e a loja cria pedidos no sábado).
 * `shiftBusinessDay`, `nextBusinessDays`, `businessDaysBack/Forward` **não mudam**.
 */
export function shiftSelectableDay(
  day: Date,
  delta: 1 | -1,
  holidays: Array<Holiday>,
  allowSaturday = false,
): Date {
  const holidayKeys = new Set(holidays.map((h) => h.holiday_date.slice(0, 10)))
  const cursor = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  do {
    cursor.setDate(cursor.getDate() + delta)
  } while (
    cursor.getDay() === 0 || // domingo sempre pula
    (!allowSaturday && cursor.getDay() === 6) || // sábado pula, a menos que liberado
    holidayKeys.has(toDateKey(cursor))
  )
  return cursor
}

/** Dates locais correspondentes aos feriados cadastrados. */
export function holidayDates(holidays: Array<Holiday>): Array<Date> {
  return holidays.map((h) => parseDateKey(h.holiday_date))
}

export function isWeekend(date: Date): boolean {
  const dow = date.getDay()
  return dow === 0 || dow === 6
}

/** Verifica se a data é hoje. */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/** Verifica se duas datas caem no mesmo mês/ano. */
export function isSameMonth(date: Date, anchorDate: Date): boolean {
  return (
    date.getMonth() === anchorDate.getMonth() &&
    date.getFullYear() === anchorDate.getFullYear()
  )
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

/** "An" -> "AN", "setembro" -> "Setembro". */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "jan.", "fev.", … (abreviado pt-BR, com ponto). */
export function formatMonthShort(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date)
}

/** "Jan", "Fev", … (abreviado, sem ponto, capitalizado). */
export function formatMonthShortTitle(date: Date): string {
  return capitalize(formatMonthShort(date).replace('.', ''))
}

/** "setembro". */
export function formatMonthLong(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date)
}

/** "setembro de 2026". */
export function formatMonthLongYear(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** "14 set." (2 dígitos). */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

/** "02/09" (numérico). */
export function formatNumericDayMonth(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

/** "14 set. 2026". */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
