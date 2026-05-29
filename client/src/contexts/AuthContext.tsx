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

  const loadGuestProfile = async () => {
    let guestId = localStorage.getItem('forum_guest_id')
    if (!guestId) {
      setProfile(null)
      return
    }

    if (!supabase) {
      const localUsername = localStorage.getItem('duhocmate_username') || 'Bạn học'
      setProfile({
        id: guestId,
        username: localUsername,
        avatar_url: '',
        language: 'vi',
        created_at: new Date().toISOString()
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('id', guestId)
        .maybeSingle()

      if (!error && data) {
        setProfile({
          id: guestId,
          username: data.username,
          avatar_url: data.avatar_url || '',
          language: 'vi',
          created_at: data.created_at
        })
        localStorage.setItem('duhocmate_username', data.username)
      } else {
        const localUsername = localStorage.getItem('duhocmate_username') || 'Bạn học'
        const newGuestProfile = {
          id: guestId,
          username: localUsername,
          avatar_url: '',
          language: 'vi' as const,
          created_at: new Date().toISOString()
        }
        void supabase.from('guest_profiles').insert(newGuestProfile)
        setProfile(newGuestProfile)
      }
    } catch (e) {
      console.warn('Failed to load guest profile:', e)
    }
  }

  const fetchProfile = async (userId: string, userEmail?: string, metadata?: any) => {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    const googleAvatar = metadata?.avatar_url || metadata?.picture || ''
    if (data) {
      const existing = data as Profile
      if (!existing.avatar_url && googleAvatar) {
        existing.avatar_url = googleAvatar
        void supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', userId)
      }
      setProfile(existing)
    } else {
      const fallbackUsername = metadata?.full_name || metadata?.name || userEmail?.split('@')[0] || `user_${userId.substring(0, 5)}`;
      const newProfile = {
        id: userId,
        username: fallbackUsername,
        avatar_url: googleAvatar,
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
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      }
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return
    if (user) {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('forum_guest_id')
      localStorage.removeItem('duhocmate_username')
      setProfile(null)
    }
  }

  useEffect(() => {
    if (!supabase) {
      loadGuestProfile()
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        loadGuestProfile()
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        loadGuestProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [])



  const updateProfile = async (updates: Partial<Profile>) => {
    if (!supabase) return
    if (!user) {
      const guestId = localStorage.getItem('forum_guest_id') || profile?.id
      if (!guestId) return

      const payload = {
        id: guestId,
        username: updates.username || profile?.username || 'Bạn học',
        avatar_url: updates.avatar_url ?? profile?.avatar_url ?? '',
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('guest_profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setProfile({
          id: guestId,
          username: data.username,
          avatar_url: data.avatar_url || '',
          language: 'vi',
          created_at: data.created_at
        })
        localStorage.setItem('duhocmate_username', data.username)
      }
      return
    }

    const payload = {
      id: user.id,
      username: updates.username || profile?.username || user.email?.split('@')[0] || `user_${user.id.substring(0, 5)}`,
      avatar_url: updates.avatar_url ?? profile?.avatar_url ?? '',
      city: updates.city ?? profile?.city ?? '',
      bio: updates.bio ?? profile?.bio ?? '',
      language: updates.language ?? profile?.language ?? ('vi' as const),
      created_at: profile?.created_at || new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
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
