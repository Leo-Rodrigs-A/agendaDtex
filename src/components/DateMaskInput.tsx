import { useEffect, useState } from 'react'
import type { ComponentProps, Ref } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { toDateKey } from '@/lib/dates'
import type { Holiday } from '@/types'

/** Formata Date para "DD/MM/AAAA". */
function toMask(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

/** Aplica a máscara DD/MM/AAAA sobre os dígitos digitados. */
function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** Converte "DD/MM/AAAA" em Date local; null se inválida. */
function parseMask(mask: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(mask)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  if (
    date.getDate() !== Number(dd) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getFullYear() !== Number(yyyy)
  ) {
    return null
  }
  return date
}

/**
 * Input mascarado de data (DD/MM/AAAA). Valida data real e bloqueia
 * fds/feriados (mesma regra dos seletores). Quando completo e válido,
 * chama onSelect(date); em caso inválido, exibe toast e volta ao valor.
 */
export function DateMaskInput({
  date,
  onSelect,
  holidays,
  id,
  className,
  ref,
  ...props
}: {
  date: Date
  onSelect: (date: Date) => void
  holidays: Array<Holiday>
  ref?: Ref<HTMLInputElement>
} & Omit<
  ComponentProps<'input'>,
  'ref' | 'value' | 'onChange' | 'onBlur' | 'onKeyDown' | 'onFocus' | 'onSelect'
>) {
  const [text, setText] = useState(() => toMask(date))

  // Sincroniza o texto quando a data externa muda (chevrons, calendário…)
  useEffect(() => setText(toMask(date)), [date])

  const commit = () => {
    // Autocomplete: só dia → mês/ano da data atual do campo;
    // dia/mês → ano da data atual do campo.
    let target = text
    const digits = text.replace(/\D/g, '')
    if (digits.length >= 1 && digits.length <= 2 && !text.includes('/')) {
      target = toMask(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          Number(digits.slice(0, 2)),
        ),
      )
    } else if (digits.length >= 3 && digits.length <= 4) {
      target = toMask(
        new Date(
          date.getFullYear(),
          Number(digits.slice(2, 4)) - 1,
          Number(digits.slice(0, 2)),
        ),
      )
    }
    const parsed = parseMask(target)
    if (!parsed) {
      toast.error('Data inválida. Use o formato DD/MM/AAAA.')
      setText(toMask(date))
      return
    }
    const isWeekend = parsed.getDay() === 0 || parsed.getDay() === 6
    const isHoliday = holidays.some(
      (h) => h.holiday_date.slice(0, 10) === toDateKey(parsed),
    )
    if (isWeekend || isHoliday) {
      toast.error('Fins de semana e feriados não podem ser selecionados.')
      setText(toMask(date))
      return
    }
    onSelect(parsed)
  }

  return (
    <Input
      {...props}
      ref={ref}
      id={id}
      value={text}
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      maxLength={10}
      className={className}
      // Texto já vem selecionado: qualquer tecla limpa e começa do zero
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setText(applyMask(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') setText(toMask(date))
      }}
    />
  )
}
