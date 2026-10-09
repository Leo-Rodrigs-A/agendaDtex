import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ptBR } from 'react-day-picker/locale'
import { cn } from 'cn'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { DateMaskInput } from '@/components/DateMaskInput'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createOrder, updateOrder } from '@/services/orders'
import { useIsMobile } from '@/hooks/use-mobile'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import {
  WEEKEND_MATCHER,
  businessDaysBack,
  formatNumericDayMonth,
  getBusinessDaysUntil,
  holidayDates,
  nextBusinessDays,
  parseDateKey,
  toDateKey,
} from '@/lib/dates'
import { ordersDeliveredOnDay, sumPieces } from '@/lib/orders'
import type { Order } from '@/types'

// Texto colado pode trazer quebras de linha/espaços extras — limpa antes de enviar
function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

// Number() retorna NaN para texto colado com formatação ("R$ 1.500,00");
// NaN quebraria a persistência — sempre cair em número válido
function toSafeNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Fecha o calendário no Tab devolvendo o foco ao campo vizinho do form.
// O DayPicker mantém sempre um dia com tabIndex=0 (isFocusTarget): sem
// preventDefault o Tab entraria no grid e, ao desmontar, o foco cairia no
// body — o próximo Tab recomeçaria do topo do dialog.
function focusSibling(current: HTMLElement, direction: 1 | -1): void {
  const form = current.closest('form')
  if (!form) return
  const focusables = Array.from(
    form.querySelectorAll<HTMLElement>(
      'input, button, select, textarea, a[href]',
    ),
  ).filter((el) => !el.hasAttribute('disabled'))
  const index = focusables.indexOf(current)
  const next = focusables.at(index + direction)
  if (next) next.focus()
}

type NewOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Quando presente, o modal vira "Editar Pedido" (campos preenchidos). */
  order?: Order | null
}

/**
 * Modal de pedido (criar ou editar). Na criação, o vendedor é o usuário logado.
 * A data de entrega bloqueia fins de semana e feriados (regra de agendamento).
 */
export function NewOrderDialog({
  open,
  onOpenChange,
  order = null,
}: NewOrderDialogProps) {
  const { orders, holidays, refreshOrders } = useData()
  const { profile } = useAuth()
  const isEdit = order != null

  // Default: próximo dia útil a partir de hoje
  const defaultDate = () => nextBusinessDays(new Date(), 1)[0]

  // Hoje em meia-noite local — bloqueia datas passadas só na criação
  // (em edição, pedidos antigos continuam com data no passado)
  const todayStart = (() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  })()

  const [orderName, setOrderName] = useState('')
  const [shirts, setShirts] = useState('')
  const [others, setOthers] = useState('')
  const [total, setTotal] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [deliveryDate, setDeliveryDate] = useState<Date>(defaultDate)
  const [calendarMonth, setCalendarMonth] = useState<Date>(defaultDate)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // No mobile o calendário abre ACIMA do input para não cortar na borda
  // inferior da tela; no desktop ele abre abaixo (âncora CSS, sem medição).
  const isMobile = useIsMobile()

  // Resumo abaixo do hint de produção: entregas previstas para o dia
  // selecionado + distância em dias úteis até a entrega
  const dayDeliveries = ordersDeliveredOnDay(orders, deliveryDate)
  const deliveriesCount = dayDeliveries.length
  const deliveriesPieces = sumPieces(dayDeliveries)
  const deliveriesSummary =
    deliveriesCount === 0
      ? 'Nenhum pedido para este dia.'
      : `${deliveriesCount} ${deliveriesCount === 1 ? 'pedido' : 'pedidos'} · ${deliveriesPieces} ${deliveriesPieces === 1 ? 'peça' : 'peças'}`
  const daysUntil = getBusinessDaysUntil(deliveryDate, holidays)
  const deliveryHint =
    daysUntil.type === 'past'
      ? 'Esta data já passou.'
      : daysUntil.type === 'today'
        ? 'Esta data é hoje.'
        : daysUntil.businessDays === 1
          ? '1 dia útil até a entrega.'
          : `${daysUntil.businessDays} dias úteis até a entrega.`

  // Abre o calendário já no mês da data selecionada (única ou do pedido)
  useEffect(() => setCalendarMonth(deliveryDate), [deliveryDate])

  // Preenche o form ao abrir em modo edição
  // (deps intencionalmente limitadas: só repovoar ao abrir/trocar de pedido)
  useEffect(() => {
    if (open && order) {
      setOrderName(order.order_name)
      setShirts(String(order.shirt_count))
      setOthers(String(order.others_items_count))
      setTotal(String(order.total_amount))
      setImageUrl(order.imgurl ?? '')
      const d = parseDateKey(order.delivery_date)
      setDeliveryDate(d)
      setCalendarMonth(d)
      setError(null)
    }
  }, [open, order?.id])

  const reset = () => {
    setOrderName('')
    setShirts('')
    setOthers('')
    setTotal('')
    setImageUrl('')
    setDeliveryDate(defaultDate())
    setError(null)
    setCalendarOpen(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    if (!profile) {
      setError('Você precisa estar autenticado para criar um pedido.')
      return
    }
    const cleanName = cleanText(orderName)
    if (!cleanName) {
      setError('Informe o nome do pedido.')
      return
    }
    const cleanImageUrl = imageUrl.replace(/\s/g, '')
    if (cleanImageUrl && !/^https?:\/\//i.test(cleanImageUrl)) {
      setError('A imagem precisa ser uma URL começando com http:// ou https://')
      return
    }
    // Defesa contra data no passado (só criação; edição não bloqueia)
    if (!isEdit && toDateKey(deliveryDate) < toDateKey(new Date())) {
      setError('A data de entrega não pode estar no passado.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        await updateOrder({
          id: order.id,
          order_name: cleanName,
          shirt_count: toSafeNumber(shirts),
          others_items_count: toSafeNumber(others),
          total_amount: toSafeNumber(total),
          delivery_date: toDateKey(deliveryDate),
          imgurl: cleanImageUrl || null,
        })
      } else {
        await createOrder({
          user_id: profile.id,
          order_name: cleanName,
          shirt_count: toSafeNumber(shirts),
          others_items_count: toSafeNumber(others),
          total_amount: toSafeNumber(total),
          delivery_date: toDateKey(deliveryDate),
          // Campo opcional: só envia se preenchido
          ...(cleanImageUrl && { imgurl: cleanImageUrl }),
        })
      }
      await refreshOrders()
      onOpenChange(false)
      reset()
    } catch (err) {
      console.error('[Pedido] Falha ao salvar', { isEdit, err })
      setError(err instanceof Error ? err.message : 'Falha ao salvar pedido')
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
          <DialogTitle>{isEdit ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados do pedido.'
              : `O pedido será registrado em nome de ${profile?.name ?? '—'}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Link de compartilhamento do Google Drive"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data de entrega</label>
            {/* Campo único: input mascarado + calendário que abre no foco/clique
                (não rouba o foco — dá pra digitar com o calendário aberto).
                Âncora CSS no wrapper relative: abaixo do input no desktop
                (pode ultrapassar a borda do modal — DialogContent não tem
                overflow), acima do input no mobile para não cortar na tela. */}
            <div
              className="relative"
              onFocus={(e) => {
                const input =
                  e.currentTarget.querySelector<HTMLInputElement>('input')
                if (e.target === input) setCalendarOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setCalendarOpen(false)
                  return
                }
                // Tab com o calendário aberto: fecha e segue para o campo
                // vizinho do form (Entrar digitando continua abrindo no foco).
                if (e.key === 'Tab' && calendarOpen) {
                  e.preventDefault()
                  setCalendarOpen(false)
                  const input =
                    e.currentTarget.querySelector<HTMLInputElement>('input')
                  if (input) focusSibling(input, e.shiftKey ? -1 : 1)
                }
              }}
            >
              <DateMaskInput
                date={deliveryDate}
                holidays={holidays}
                disallowPast={!isEdit}
                onSelect={(date) => {
                  setDeliveryDate(date)
                  setCalendarMonth(date)
                }}
              />
              {calendarOpen && (
                <>
                  {/* Backdrop transparente: clique fora fecha o calendário
                      (abaixo do modal — digitar no form segue possível) */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCalendarOpen(false)}
                  />
                  {/* mousedown preventDefault: não rouba o foco do input
                      antes de registrar o clique no dia.
                      Mesmas classes do PopoverContent (+ data-slot): o
                      calendário fica visualmente idêntico ao do DaySelector
                      (fundo transparente via regra do ui/calendar, ring
                      suave, animação fade/zoom de entrada) */}
                  <div
                    data-slot="popover-content"
                    className={cn(
                      'animate-in fade-in-0 zoom-in-95 absolute left-0 z-50 w-auto rounded-md bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100',
                      isMobile
                        ? 'slide-in-from-bottom-2 bottom-full mb-1'
                        : 'slide-in-from-top-2 top-full mt-1',
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selected={deliveryDate}
                      onSelect={(date) => {
                        if (date) {
                          setDeliveryDate(date)
                          setCalendarOpen(false)
                        }
                      }}
                      // Regra de agendamento: fds e feriados bloqueados aqui;
                      // na criação, também datas passadas (edição libera)
                      disabled={
                        isEdit
                          ? [WEEKEND_MATCHER, ...holidayDates(holidays)]
                          : [
                              WEEKEND_MATCHER,
                              { before: todayStart },
                              ...holidayDates(holidays),
                            ]
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A produção da fábrica será dia{' '}
              {formatNumericDayMonth(
                businessDaysBack(deliveryDate, 2, holidays),
              )}
              .
            </p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {deliveriesSummary}
              </p>
              <p className="text-xs text-muted-foreground">{deliveryHint}</p>
            </div>
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? 'Salvando…'
                : isEdit
                  ? 'Salvar alterações'
                  : 'Criar pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
