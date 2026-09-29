import { createContext, useContext, useMemo, type ReactNode } from 'react'

type CalendarNavigationContextType = {
  goPrev: () => void
  goNext: () => void
  isCalendarRoute: boolean
} | null

const CalendarNavigationContext =
  createContext<CalendarNavigationContextType>(null)

export function CalendarNavigationProvider({
  children,
  goPrev,
  goNext,
  isCalendarRoute,
}: {
  children: ReactNode
  goPrev: () => void
  goNext: () => void
  isCalendarRoute: boolean
}) {
  const value = useMemo(
    () => ({ goPrev, goNext, isCalendarRoute }),
    [goPrev, goNext, isCalendarRoute],
  )

  return (
    <CalendarNavigationContext.Provider value={value}>
      {children}
    </CalendarNavigationContext.Provider>
  )
}

export function useCalendarNavigation() {
  return useContext(CalendarNavigationContext)
}
