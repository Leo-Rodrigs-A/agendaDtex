// Interfaces das tabelas do Supabase (Postgres).
// Schema de referência: supabase/migrations/0001_schema.sql

// tabela `profiles`: id, name, role, is_active, onboarding_completed, created_at
// 1:1 com auth.users — o e-mail fica no Auth, não no profile.
// designer: somente leitura (não cria nem edita nada).
export type Role = 'admin' | 'vendedor' | 'designer'

export interface Profile {
  id: string
  name: string
  role: Role
  is_active: boolean
  onboarding_completed: boolean
}

// Alias de compatibilidade da era Apps Script (planilha `users`).
// Novos códigos devem usar `Profile`.
export type User = Profile

// tabela `orders`
// - created_at: string ISO gerada no banco (now())
// - delivery_date: "YYYY-MM-DD" (coluna date, sem horário/timezone)
export interface Order {
  id: string
  user_id: string
  order_name: string
  shirt_count: number
  others_items_count: number
  total_amount: number
  created_at: string
  delivery_date: string
  imgurl?: string | null
  is_done?: boolean
}

// tabela `holidays`: id, holiday_date, holiday_description
export interface Holiday {
  id: string
  holiday_date: string
  holiday_description: string
}

// Payloads de criação. id/created_at/is_done são gerados no banco.
export type CreateOrderPayload = Omit<Order, 'id' | 'created_at' | 'is_done'>
export type CreateHolidayPayload = Omit<Holiday, 'id'>
