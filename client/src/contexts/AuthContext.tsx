import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  supabaseReady: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string, city?: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabaseReady = supabase !== null

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string, userEmail?: string, metadata?: any) => {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data as Profile)
    } else {
      // Tạo profile cho user Google OAuth nếu chưa tồn tại
      const fallbackUsername = metadata?.full_name || metadata?.name || userEmail?.split('@')[0] || `user_${userId.substring(0, 5)}`;
      const newProfile = {
        id: userId,
        username: fallbackUsername,
        avatar_url: metadata?.avatar_url || '',
        language: 'vi' as const,
        created_at: new Date().toISOString()
      }
      const { data: inserted } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()
      if (inserted) {
        setProfile(inserted as Profile)
      } else {
        setProfile(newProfile as Profile)
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase chưa được cấu hình') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, username: string, city?: string) => {
    if (!supabase) return { error: new Error('Supabase chưa được cấu hình') }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        city: city || '',
        language: 'vi',
        created_at: new Date().toISOString()
      })
    }
    return { error }
  }

  const signInWithGoogle = async () => {
    if (!supabase) return { error: new Error('Supabase chưa được cấu hình') }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !supabase) return
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (data) setProfile(data as Profile)
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, supabaseReady, signIn, signUp, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
