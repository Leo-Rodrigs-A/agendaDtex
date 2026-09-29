import { useEffect, useMemo, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import {
  navigateMonth,
  navigateWeek,
  getMonthGridDays,
  getDaysForView,
  normalizeAnchorForView,
} from '@/lib/production-calendar'
import type { CalendarView } from '@/lib/production-calendar'

type Scope = 'all' | 'mine'

const VIEW_KEY = 'dtex-calendar-view'
const SCOPE_KEY = 'dtex-calendar-scope'

export function useProductionCalendar() {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const isCalendarRoute = pathname === '/calendario'

  // Estado: view, scope, anchorDate
  const [view, setViewState] = useState<CalendarView>(() => {
    if (typeof window === 'undefined') return 'month'
    try {
      const stored = localStorage.getItem(VIEW_KEY)
      if (stored === 'month' || stored === '7-days' || stored === '3-days') {
        return stored
      }
    } catch {}
    return 'month'
  })

  const [scope, setScopeState] = useState<Scope>(() => {
    if (typeof window === 'undefined') return 'all'
    try {
      const stored = localStorage.getItem(SCOPE_KEY)
      if (stored === 'all' || stored === 'mine') {
        return stored
      }
    } catch {}
    return 'all'
  })

  const [anchorDate, setAnchorDateState] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // Persistência
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {}
  }, [view])

  useEffect(() => {
    try {
      localStorage.setItem(SCOPE_KEY, scope)
    } catch {}
  }, [scope])

  // Reset ao default ao entrar na rota (ou ao montar)
  useEffect(() => {
    if (isCalendarRoute) {
      setViewState('month')
      setScopeState('all')
      const today = new Date()
      setAnchorDateState(new Date(today.getFullYear(), today.getMonth(), 1))
    }
  }, [isCalendarRoute])

  // Setters
  /**
   * Troca a visão e reposiciona a âncora (`normalizeAnchorForView`) quando a
   * visão realmente muda — clicar na opção já selecionada não move nada.
   * `anchor` explícito (ex.: expandir um dia do mês) sempre tem prioridade.
   */
  const setView = (v: CalendarView, anchor?: Date) => {
    if (anchor) {
      setViewState(v)
      setAnchorDateState(anchor)
      return
    }
    if (v === view) return
    setViewState(v)
    setAnchorDateState((current) =>
      normalizeAnchorForView(current, v, new Date()),
    )
  }
  const setScope = (s: Scope) => setScopeState(s)

  // Navegação
  const goPrev = () => {
    if (view === 'month') {
      setAnchorDateState(navigateMonth(anchorDate, -1))
    } else if (view === '7-days') {
      setAnchorDateState(navigateWeek(anchorDate, -1))
    }
    // 3-days: não faz nada
  }

  const goNext = () => {
    if (view === 'month') {
      setAnchorDateState(navigateMonth(anchorDate, 1))
    } else if (view === '7-days') {
      setAnchorDateState(navigateWeek(anchorDate, 1))
    }
    // 3-days: não faz nada
  }

  const goToday = () => {
    const today = new Date()
    if (view === 'month') {
      setAnchorDateState(new Date(today.getFullYear(), today.getMonth(), 1))
    } else {
      setAnchorDateState(
        new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      )
    }
  }

  const jumpToMonth = (month: number, year: number) => {
    setAnchorDateState(new Date(year, month, 1))
    setViewState('month')
  }

  // Dias visíveis conforme a view
  const visibleDays = useMemo(() => {
    if (view === 'month') {
      return getMonthGridDays(anchorDate)
    }
    return getDaysForView(anchorDate, view)
  }, [view, anchorDate])

  // Label do período atual
  const periodLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    })
    if (view === 'month') {
      return formatter.format(anchorDate).replace(/^\w/, (c) => c.toUpperCase())
    }
    const endDate = new Date(visibleDays[visibleDays.length - 1])
    const startLabel = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(visibleDays[0])
    const endLabel = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(endDate)
    return `${startLabel} – ${endLabel}`
  }, [view, anchorDate, visibleDays])

  return {
    view,
    scope,
    anchorDate,
    visibleDays,
    periodLabel,
    setView,
    setScope,
    goPrev,
    goNext,
    goToday,
    jumpToMonth,
    isCalendarRoute,
  }
}
