import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { cn } from 'cn'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { businessDaysBreakdown } from '@/lib/orders'
import type { Order } from '@/types'

const RANGES = [
  { days: 3, label: '3 dias' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
] as const

const chartConfig = {
  shirts: {
    label: 'Camisetas',
    color: 'var(--chart-1)',
  },
  others: {
    label: 'Shorts/Outros',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

/** Area chart de produção prevista (camisetas + shorts/outros) dos próximos dias úteis. */
export function ProductionChart({ orders }: { orders: Array<Order> }) {
  const [days, setDays] = useState<(typeof RANGES)[number]['days']>(7)
  const data = businessDaysBreakdown(orders, new Date(), days)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Produção Prevista</h3>
          <p className="text-sm text-muted-foreground">
            Peças agendadas para os próximos {days} dias úteis.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => setDays(range.days)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                days === range.days
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="shirts"
            stroke="var(--color-shirts)"
            fill="var(--color-shirts)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="others"
            stroke="var(--color-others)"
            fill="var(--color-others)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
