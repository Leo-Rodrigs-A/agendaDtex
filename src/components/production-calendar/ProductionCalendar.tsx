import { useMemo, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useData } from '@/components/DataProvider'
import { useProductionCalendar } from '@/hooks/use-production-calendar'
import { groupOrdersByProductionDate } from '@/lib/production-calendar'
import { ProductionCalendarToolbar } from './ProductionCalendarToolbar'
import { ProductionCalendarMonth } from './ProductionCalendarMonth'
import { ProductionCalendarDays } from './ProductionCalendarDays'
import { OrderImageViewer } from '@/components/OrderImageViewer'
import { useNavigate } from '@tanstack/react-router'

export function ProductionCalendar() {
  const navigate = useNavigate()
  const { orders, holidays, users } = useData()
  const { profile } = useAuth()
  const {
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
  } = useProductionCalendar()

  const canWrite = profile?.role !== 'designer'

  // Agrupa pedidos por data de produção
  const grouped = useMemo(
    () => groupOrdersByProductionDate(orders, holidays, scope, profile?.id),
    [orders, holidays, scope, profile?.id],
  )

  // Handlers
  const handleOrderClick = (order: (typeof orders)[0]) => {
    if (order.imgurl?.trim()) {
      setImageOrder(order)
    }
  }

  const handleFollowClick = (order: (typeof orders)[0]) => {
    navigate({ to: '/pedidos', search: { q: order.order_name } })
  }

  const handleExpandDay = (day: Date) => {
    setView('3-days', day)
  }

  const [imageOrder, setImageOrder] = useState<(typeof orders)[0] | null>(null)

  if (!profile) return null

  return (
    <div className="flex flex-col h-full min-h-0 gap-6">
      {/* Toolbar */}
      <ProductionCalendarToolbar
        scope={scope}
        onScopeChange={setScope}
        view={view}
        onViewChange={setView}
        periodLabel={periodLabel}
        anchorDate={anchorDate}
        onMonthChange={jumpToMonth}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      {/* Conteúdo: coluna flex para os filhos esticarem até a base.
          min-h-[360px] nas visões evita linhas colapsadas em janelas baixas:
          aí o card estoura e quem rola é este wrapper, não a página */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-auto">
        {view === 'month' ? (
          <ProductionCalendarMonth
            grouped={grouped}
            anchorDate={anchorDate}
            onExpandDay={handleExpandDay}
            onOrderClick={handleOrderClick}
            onFollowClick={handleFollowClick}
          />
        ) : (
          <ProductionCalendarDays
            grouped={grouped}
            days={visibleDays}
            onOrderClick={handleOrderClick}
            onFollowClick={handleFollowClick}
          />
        )}
      </div>

      {/* Image Viewer */}
      <OrderImageViewer
        order={imageOrder}
        onClose={() => setImageOrder(null)}
      />
    </div>
  )
}
