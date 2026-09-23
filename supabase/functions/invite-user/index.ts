// Edge Function: invite-user
// Admin convida um usuário por e-mail, já definindo a role (vendedor|designer).
// Deploy: `supabase functions deploy invite-user` (requer CLI logada e projeto linkado).
// O SEGREDO (service_role) nunca vai para o front — só existe aqui.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'missing authorization' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    // Quem está chamando? Precisa ser admin.
    const callerClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'unauthenticated' }, 401)

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', caller.id)
      .single()
    if (callerProfile?.role !== 'admin' || !callerProfile.is_active) {
      return json({ error: 'admin only' }, 403)
    }

    const { email, name, role } = await req.json()
    if (!email || typeof email !== 'string') {
      return json({ error: 'email is required' }, 400)
    }
    if (!['vendedor', 'designer'].includes(role)) {
      return json({ error: 'role must be vendedor or designer' }, 400)
    }

    // Envia o convite (o trigger handle_new_user cria o profile como vendedor)
    const { data: invited, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { name: typeof name === 'string' ? name : undefined },
      })
    if (inviteError) return json({ error: inviteError.message }, 400)

    // Ajusta a role escolhida pelo admin (profile já existe via trigger)
    if (role !== 'vendedor') {
      await adminClient
        .from('profiles')
        .update({ role })
        .eq('id', invited.user.id)
    }

    return json({ ok: true, user_id: invited.user.id })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
