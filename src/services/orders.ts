import { supabase } from '@/lib/supabase'
import type { Order, CreateOrderPayload } from '@/types'

// Regra de prazo/disponibilidade de delivery_date: validação client-side no
// MVP (form de novo pedido). Dívida consciente — futura RPC `create_order`
// validará feriados/fds/capacidade no banco. Ver .agent/migracao-supabase.md.

/** Lista todos os pedidos, mais recentes primeiro. */
export async function listOrders(): Promise<Array<Order>> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Array<Order>
}

/** Cria um pedido e retorna a linha criada. */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Order
}

/**
 * Conclui/reabre um pedido via RPC `complete_order` — única forma de UPDATE
 * em orders pelo app (a RPC altera somente `is_done`).
 */
export async function toggleOrderDone(
  id: string,
  done: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('complete_order', {
    order_id: id,
    done,
  })
  if (error) throw error
}
