'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string, userFullName?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If table doesn't exist or no profile found, create a default profile
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('profiles table not found or no profile exists. Creating default profile for user:', userId)
          return {
            id: userId,
            email: userEmail || '',
            full_name: userFullName || userEmail || '',
            app_role: 'operator' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        console.error('Error fetching user profile:', error.message || error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Return a default profile if there's an error
      return {
        id: userId,
        email: userEmail || '',
        full_name: userFullName || userEmail || '',
        app_role: 'operator' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        fetchUserProfile(
          session.user.id, 
          session.user.email, 
          session.user.user_metadata?.full_name
        ).then(setUserProfile)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profile = await fetchUserProfile(
            session.user.id, 
            session.user.email, 
            session.user.user_metadata?.full_name
          )
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchUserProfile])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(
        user.id, 
        user.email, 
        user.user_metadata?.full_name
      )
      setUserProfile(profile)
    }
  }, [user, fetchUserProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setSession(null)
  }, [supabase])

  const value = {
    user,
    userProfile,
    session,
    loading,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}