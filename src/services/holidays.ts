import { supabase } from '@/lib/supabase'
import type { Holiday, CreateHolidayPayload } from '@/types'

/** Lista todos os feriados, em ordem cronológica. */
export async function listHolidays(): Promise<Array<Holiday>> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('holiday_date', { ascending: true })
  if (error) throw error
  return data as Array<Holiday>
}

/** Cria um feriado (apenas admin — RLS bloqueia vendedores). */
export async function createHoliday(
  payload: CreateHolidayPayload,
): Promise<Holiday> {
  const { data, error } = await supabase
    .from('holidays')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Holiday
}
