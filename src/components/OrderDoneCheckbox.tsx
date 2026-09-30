import { useState } from 'react'
import { cn } from 'cn'
import type { Order } from '@/types'
import { useData } from '@/components/DataProvider'
import { useAuth } from '@/components/AuthProvider'
import { Checkbox } from '@/components/ui/checkbox'

type OrderDoneCheckboxProps = {
  order: Order
  className?: string
}

/**
 * Checkbox de conclusão do pedido — update otimista via `DataProvider`
 * (a RPC `complete_order` persiste; em caso de erro o valor reverte e
 * o próprio provider mostra o toast). Somente leitura para designers.
 *
 * Compartilhado entre a `OrdersTable` e os cards do Calendário de Produção
 * (`/calendario`) — as duas telas usam exatamente o mesmo comportamento.
 */
export function OrderDoneCheckbox({
  order,
  className,
}: OrderDoneCheckboxProps) {
  const { toggleOrderDone } = useData()
  const { profile } = useAuth()
  const [pending, setPending] = useState(false)
  const readOnly = profile?.role === 'designer'

  return (
    <Checkbox
      checked={order.is_done === true}
      disabled={pending || readOnly}
      title={
        readOnly
          ? 'Designers apenas visualizam'
          : order.is_done
            ? 'Marcar como pendente'
            : 'Marcar como concluído'
      }
      className={cn('cursor-pointer', className)}
      onClick={(e) => e.stopPropagation()}
      onCheckedChange={async (checked) => {
        setPending(true)
        try {
          await toggleOrderDone(order.id, checked === true)
        } finally {
          setPending(false)
        }
      }}
    />
  )
}
