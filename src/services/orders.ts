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

/**
 * Lista pedidos com entrega a partir de `fromDate` ("YYYY-MM-DD").
 * Usado no fetch escalonado: o boot traz mês atual + futuros primeiro,
 * o histórico completo chega em background logo em seguida.
 */
export async function listOrdersFrom(fromDate: string): Promise<Array<Order>> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('delivery_date', fromDate)
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

/** Edita os campos de um pedido (dono ou admin — via RPC update_order). */
export async function updateOrder(payload: {
  id: string
  order_name: string
  shirt_count: number
  others_items_count: number
  total_amount: number
  delivery_date: string
  imgurl: string | null
}): Promise<void> {
  const { error } = await supabase.rpc('update_order', {
    order_id: payload.id,
    new_order_name: payload.order_name,
    new_shirt_count: payload.shirt_count,
    new_others_items_count: payload.others_items_count,
    new_total_amount: payload.total_amount,
    new_delivery_date: payload.delivery_date,
    new_imgurl: payload.imgurl,
  })
  if (error) throw error
}

/** Exclui um pedido (dono ou admin — via RPC delete_order). */
export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_order', { order_id: id })
  if (error) throw error
}
