import { createClient } from '@supabase/supabase-js'

// Cliente Supabase singleton (SPA).
// Defaults do auth já são os corretos para este app:
//   persistSession: true  (sessão no localStorage — sobrevive a reload/PWA)
//   autoRefreshToken: true
//   detectSessionInUrl: true (convite/recuperação de senha chegam por link)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
