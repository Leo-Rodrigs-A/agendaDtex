import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/types'

/** Lista todos os perfis (vendedores/admins/designers) do sistema. */
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

/** Admin: convida usuário por e-mail com a role escolhida (Edge Function). */
export async function inviteUser(payload: {
  email: string
  name?: string
  role: Role
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: payload,
  })
  if (error) throw error
  if ((data as { error?: string } | null)?.error) {
    throw new Error((data as { error: string }).error)
  }
}

/** Admin: altera role e/ou is_active de um usuário (RPC admin_update_user). */
export async function adminUpdateUser(payload: {
  userId: string
  role?: Role
  isActive?: boolean
}): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user', {
    target_user: payload.userId,
    new_role: payload.role ?? null,
    new_is_active: payload.isActive ?? null,
  })
  if (error) throw error
}
