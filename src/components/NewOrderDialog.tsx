import { useState } from 'react'
import type { FormEvent } from 'react'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createOrder } from '@/services/api'
import { useData } from '@/components/DataProvider'
import { useActiveUser } from '@/components/UserProvider'
import {
  WEEKEND_MATCHER,
  holidayDates,
  nextBusinessDays,
  toDateKey,
} from '@/lib/dates'

const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

type NewOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal "Novo Pedido". O vendedor é sempre o usuário ativo.
 * A data de entrega bloqueia fins de semana e feriados (regra de agendamento).
 */
export function NewOrderDialog({ open, onOpenChange }: NewOrderDialogProps) {
  const { holidays, refreshOrders } = useData()
  const { activeUser } = useActiveUser()

  // Default: próximo dia útil a partir de hoje
  const defaultDate = () => nextBusinessDays(new Date(), 1)[0]

  const [orderName, setOrderName] = useState('')
  const [shirts, setShirts] = useState('')
  const [others, setOthers] = useState('')
  const [total, setTotal] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [deliveryDate, setDeliveryDate] = useState<Date>(defaultDate)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setOrderName('')
    setShirts('')
    setOthers('')
    setTotal('')
    setImageUrl('')
    setDeliveryDate(defaultDate())
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!activeUser) {
      setError('Selecione um usuário ativo antes de criar um pedido.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await createOrder({
        user_id: activeUser.id,
        order_name: orderName,
        shirt_count: Number(shirts) || 0,
        others_items_count: Number(others) || 0,
        total_amount: Number(total) || 0,
        delivery_date: toDateKey(deliveryDate),
        // Campo opcional: só envia se preenchido
        ...(imageUrl.trim() && { imgurl: imageUrl.trim() }),
      })
      await refreshOrders()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
          <DialogDescription>
            O pedido será registrado em nome de{' '}
            <strong>{activeUser?.name ?? '—'}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="order-name" className="text-sm font-medium">
              Nome do pedido
            </label>
            <Input
              id="order-name"
              required
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder="Ex.: Turma 3ºB - formatura"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label htmlFor="order-shirts" className="text-sm font-medium">
                Camisetas
              </label>
              <Input
                id="order-shirts"
                type="number"
                min={0}
                required
                value={shirts}
                onChange={(e) => setShirts(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="order-others" className="text-sm font-medium">
                Shorts/Outros
              </label>
              <Input
                id="order-others"
                type="number"
                min={0}
                required
                value={others}
                onChange={(e) => setOthers(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="order-total" className="text-sm font-medium">
                Valor (R$)
              </label>
              <Input
                id="order-total"
                type="number"
                min={0}
                step="0.01"
                required
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="order-image" className="text-sm font-medium">
              Imagem do pedido{' '}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <Input
              id="order-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Link de compartilhamento do Google Drive"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data de entrega</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 font-normal"
                  />
                }
              >
                <CalendarDays className="h-4 w-4" />
                {dateLabel.format(deliveryDate)}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={deliveryDate}
                  onSelect={(date) => {
                    if (date) {
                      setDeliveryDate(date)
                      setCalendarOpen(false)
                    }
                  }}
                  // Regra de agendamento: fds e feriados bloqueados aqui
                  disabled={[WEEKEND_MATCHER, ...holidayDates(holidays)]}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Fins de semana e feriados não podem ser selecionados.
            </p>
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando…' : 'Criar pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
