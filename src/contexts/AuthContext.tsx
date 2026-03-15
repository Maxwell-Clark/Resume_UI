import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import posthog from 'posthog-js'
import { supabase } from '@/lib/supabase'

// Define types based on Supabase auth responses
type User = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

type Session = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}

type AuthError = {
  message: string
  status?: number
  name?: string
} | null

interface UpdateUserAttributes {
  email?: string
  password?: string
  data?: Record<string, unknown>
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithLinkedIn: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  getAccessToken: () => string | null
  updateUser: (attributes: UpdateUserAttributes) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setSession(session as Session | null)
      setUser((session?.user as User) ?? null)
      setLoading(false)

      // Identify user in PostHog for analytics
      if (session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session as Session | null)
      setUser((session?.user as User) ?? null)
      setLoading(false)

      // Identify user in PostHog for analytics
      if (session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        })
      } else {
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signInWithLinkedIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const getAccessToken = () => {
    return session?.access_token ?? null
  }

  const updateUser = async (attributes: UpdateUserAttributes) => {
    const { error } = await supabase.auth.updateUser(attributes)
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    getAccessToken,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

