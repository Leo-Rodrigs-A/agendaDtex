import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Par de cards KPI:
 * - sm+: grid simétrico de 2 colunas (visual padrão do desktop)
 * - Mobile: carrossel com "peek" (card ~85% da largura revela uma fatia do
 *   próximo), scroll snap e bolinhas indicadoras controladas pelo onScroll.
 *
 * Uso: `<KpiPair>{cardA}{cardB}</KpiPair>` — sempre exatamente 2 filhos.
 */
export function KpiPair({ children }: { children: [ReactNode, ReactNode] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  /** Largura de um "passo" do carrossel (card + gap) para cálculo da bolinha. */
  const stepSize = () => {
    const el = trackRef.current
    if (!el || el.children.length === 0) return 1
    return (el.children[0] as HTMLElement).offsetWidth + 16 // gap-4
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(Math.min(1, Math.round(el.scrollLeft / stepSize())))
  }

  const scrollToCard = (index: number) => {
    trackRef.current?.scrollTo({
      left: index * stepSize(),
      behavior: 'smooth',
    })
  }

  return (
    <div>
      {/* Scroll interno da trilha (a página nunca rola pro lado);
          scrollbar escondida para o visual ficar limpo */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible"
      >
        {children.map((card, i) => (
          <div key={i} className="w-[85%] shrink-0 snap-center sm:w-auto">
            {card}
          </div>
        ))}
      </div>
      {/* Bolinhas indicadoras — só no mobile (no desktop os 2 cards aparecem) */}
      <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir para o card ${i + 1}`}
            onClick={() => scrollToCard(i)}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors',
              i === active ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
          />
        ))}
      </div>
    </div>
  )
}
