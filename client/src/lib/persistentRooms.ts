import { supabase } from './supabase'

export type PersistentRoom = {
  id: string
  title: string
  hostName: string
  hostAvatarUrl?: string
  hostUserId?: string
  isPrivate: boolean
  passwordHash?: string
  createdAt: string
  lastActiveAt: string
}

type SaveRoomInput = {
  id: string
  title: string
  hostName: string
  hostAvatarUrl?: string
  isPrivate?: boolean
  password?: string
  userId?: string
}

const storageKey = 'duhocmate_persistent_rooms'

const readLocalRooms = (): PersistentRoom[] => {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeLocalRooms = (rooms: PersistentRoom[]) => {
  localStorage.setItem(storageKey, JSON.stringify(rooms.slice(0, 100)))
}

export const hashRoomPassword = async (password: string) => {
  const normalized = password.trim()
  if (!normalized) return ''

  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

const fromRow = (row: any): PersistentRoom => ({
  id: row.id,
  title: row.title || `Phong ${row.id}`,
  hostName: row.host_name || 'Ban hoc',
  hostAvatarUrl: row.host_avatar_url || '',
  hostUserId: row.host_user_id || '',
  isPrivate: !!row.is_private,
  passwordHash: row.password_hash || '',
  createdAt: row.created_at,
  lastActiveAt: row.last_active_at || row.created_at,
})

export const loadPersistentRooms = async (): Promise<PersistentRoom[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id,title,host_user_id,host_name,host_avatar_url,is_private,password_hash,created_at,last_active_at')
        .order('last_active_at', { ascending: false })
        .limit(100)

      if (!error && data) return (data as any[]).map(fromRow)
    } catch {
      // Local fallback keeps room reuse available before the SQL is applied.
    }
  }

  return readLocalRooms()
}

export const findPersistentRoom = async (roomId: string): Promise<PersistentRoom | null> => {
  const id = roomId.trim().toUpperCase()
  if (!id) return null

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id,title,host_user_id,host_name,host_avatar_url,is_private,password_hash,created_at,last_active_at')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) return fromRow(data)
    } catch {
      // Local fallback below.
    }
  }

  return readLocalRooms().find(room => room.id === id) || null
}

export const savePersistentRoom = async (room: SaveRoomInput): Promise<PersistentRoom> => {
  const now = new Date().toISOString()
  const passwordHash = room.isPrivate && room.password ? await hashRoomPassword(room.password) : ''
  const next: PersistentRoom = {
    id: room.id.trim().toUpperCase(),
    title: room.title.trim() || `Phong ${room.id}`,
    hostName: room.hostName.trim() || 'Ban hoc',
    hostAvatarUrl: room.hostAvatarUrl || '',
    hostUserId: room.userId || '',
    isPrivate: !!room.isPrivate,
    passwordHash,
    createdAt: now,
    lastActiveAt: now,
  }

  const localRooms = readLocalRooms()
  writeLocalRooms([next, ...localRooms.filter(item => item.id !== next.id)])

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .upsert({
          id: next.id,
          title: next.title,
          host_user_id: room.userId || null,
          host_name: next.hostName,
          host_avatar_url: next.hostAvatarUrl,
          is_private: next.isPrivate,
          password_hash: next.passwordHash,
          last_active_at: now,
        }, { onConflict: 'id' })
        .select('id,title,host_user_id,host_name,host_avatar_url,is_private,password_hash,created_at,last_active_at')
        .single()

      if (!error && data) return fromRow(data)
    } catch {
      // Local copy already saved.
    }
  }

  return next
}

export const touchPersistentRoom = async (roomId: string) => {
  const id = roomId.trim().toUpperCase()
  const now = new Date().toISOString()

  const localRooms = readLocalRooms()
  const localRoom = localRooms.find(room => room.id === id)
  if (localRoom) {
    writeLocalRooms([{ ...localRoom, lastActiveAt: now }, ...localRooms.filter(room => room.id !== id)])
  }

  if (!supabase) return
  try {
    await supabase.from('rooms').update({ last_active_at: now }).eq('id', id)
  } catch {
    // Non-blocking freshness update.
  }
}

export const deletePersistentRoom = async (roomId: string) => {
  const id = roomId.trim().toUpperCase()
  if (!id) return

  writeLocalRooms(readLocalRooms().filter(room => room.id !== id))

  if (!supabase) return
  try {
    await supabase.from('rooms').delete().eq('id', id)
  } catch {
    // Local removal is still useful if the SQL delete policy has not been applied yet.
  }
}
