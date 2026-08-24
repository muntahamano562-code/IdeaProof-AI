import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_NOT_CONFIGURED_MESSAGE,
} from '../../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSession(sess)
        setUser(sess?.user ?? null)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return { error: { message: SUPABASE_NOT_CONFIGURED_MESSAGE } }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    // If no session is returned, Supabase requires email confirmation first.
    return { data, needsConfirmation: !data.session }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return { error: { message: SUPABASE_NOT_CONFIGURED_MESSAGE } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) {
      return { error: { message: SUPABASE_NOT_CONFIGURED_MESSAGE } }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [])

  const resetPassword = useCallback(async ({ email }) => {
    if (!supabase) {
      return { error: { message: SUPABASE_NOT_CONFIGURED_MESSAGE } }
    }
    const redirectTo = `${window.location.origin}/login`
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    return { data, error }
  }, [])

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
