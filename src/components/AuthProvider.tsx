import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getMyProfile } from '@/services/profiles'
import type { Profile } from '@/types'

type AuthState = {
  session: Session | null
  profile: Profile | null
  /** true enquanto a sessão inicial ou o profile estão carregando. */
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Re-busca o profile do usuário logado (ex.: após onboarding). */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // 1) Sessão: o callback de onAuthStateChange só atualiza estado local.
  //    NUNCA chamar supabase.from()/rpc() aqui dentro — risco de deadlock
  //    (alerta oficial da documentação do Supabase).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 2) Profile: carregado em efeito separado, reagindo à sessão.
  const userId = session?.user.id ?? null
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let cancelled = false
    setProfileLoading(true)
    getMyProfile(userId)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch((err) => {
        console.error('[AuthProvider] Falha ao carregar profile', err)
        if (!cancelled) setProfile(null)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    setProfile(await getMyProfile(userId))
  }, [userId])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      isLoading: !sessionReady || (userId != null && profileLoading),
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      sessionReady,
      userId,
      profileLoading,
      signIn,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return ctx
}
