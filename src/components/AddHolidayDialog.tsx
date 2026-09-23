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
import { createHoliday } from '@/services/holidays'
import { useData } from '@/components/DataProvider'
import { toDateKey } from '@/lib/dates'

const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

type AddHolidayDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Modal de cadastro de feriado (título + data). */
export function AddHolidayDialog({
  open,
  onOpenChange,
}: AddHolidayDialogProps) {
  const { refreshHolidays } = useData()

  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setDescription('')
    setDate(new Date())
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await createHoliday({
        holiday_date: toDateKey(date),
        holiday_description: description,
      })
      await refreshHolidays()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar feriado')
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
          <DialogTitle>Adicionar Feriado</DialogTitle>
          <DialogDescription>
            Feriados bloqueiam o agendamento de entregas no formulário de
            pedidos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="holiday-description"
              className="text-sm font-medium"
            >
              Título
            </label>
            <Input
              id="holiday-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Natal"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data</label>
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
                {dateLabel.format(date)}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={date}
                  onSelect={(selected) => {
                    if (selected) {
                      setDate(selected)
                      setCalendarOpen(false)
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando…' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
