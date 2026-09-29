import { createFileRoute } from '@tanstack/react-router'
import { ProductionCalendar } from '@/components/production-calendar/ProductionCalendar'

export const Route = createFileRoute('/calendario')({
  component: CalendarioPage,
})

// Sem wrapper: a raiz do ProductionCalendar já é o container
// `flex flex-col h-full min-h-0` que herda a altura do <main>.
function CalendarioPage() {
  return <ProductionCalendar />
}
