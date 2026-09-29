import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/calendario')({
  component: CalendarioPage,
})

function CalendarioPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Calendário de Produção — em construção
      </div>
    </div>
  )
}
