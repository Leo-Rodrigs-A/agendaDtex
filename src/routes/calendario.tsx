import { createFileRoute } from '@tanstack/react-router'
import { ProductionCalendar } from '@/components/production-calendar/ProductionCalendar'

export const Route = createFileRoute('/calendario')({
  component: CalendarioPage,
})

function CalendarioPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <ProductionCalendar />
    </div>
  )
}
