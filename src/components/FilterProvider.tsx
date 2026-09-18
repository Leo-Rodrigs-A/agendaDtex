import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Filters = {
  day: Date
  month: number // 0-11
  year: number
  setDay: (day: Date) => void
  setMonthYear: (month: number, year: number) => void
}

const FilterContext = createContext<Filters | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => new Date(), [])
  const [day, setDay] = useState<Date>(today)
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const value = useMemo<Filters>(
    () => ({
      day,
      month,
      year,
      setDay,
      setMonthYear: (nextMonth, nextYear) => {
        setMonth(nextMonth)
        setYear(nextYear)
      },
    }),
    [day, month, year],
  )

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) {
    throw new Error('useFilters deve ser usado dentro de <FilterProvider>')
  }
  return ctx
}
