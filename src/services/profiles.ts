import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

/** Lista todos os perfis (vendedores/admins) do sistema. */
export async function listProfiles(): Promise<Array<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, is_active, onboarding_completed')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

/** Busca o profile do usuário autenticado (null se não existir). */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, is_active, onboarding_completed')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Atualiza o próprio nome via RPC (role/is_active nunca são editáveis). */
export async function updateOwnName(name: string): Promise<void> {
  const { error } = await supabase.rpc('update_own_name', { new_name: name })
  if (error) throw error
}

/** Conclui o onboarding: define o nome e marca a flag (RPC atômica). */
export async function completeOnboarding(name: string): Promise<void> {
  const { error } = await supabase.rpc('complete_onboarding', {
    new_name: name,
  })
  if (error) throw error
}
