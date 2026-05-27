import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imqrvssxfrhivlumhoze.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_d-szvo4evO2V69FCNc__IQ_xc8OqFPV'

const isValidUrl = (url: string) => {
  try { new URL(url); return true } catch { return false }
}

export const supabase: SupabaseClient | null =
  isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key'
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const supabaseEnabled = supabase !== null

export type Profile = {
  id: string
  username: string
  avatar_url?: string
  city?: string
  bio?: string
  language: 'vi' | 'ko' | 'en'
  is_admin?: boolean
  created_at: string
}

export type HelpPost = {
  id: string
  user_id: string
  username: string
  title: string
  content: string
  category: 'housing' | 'job' | 'food' | 'transport' | 'study' | 'emergency' | 'social' | 'other'
  city: string
  created_at: string
  contact?: string
}
