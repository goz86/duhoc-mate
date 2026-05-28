/**
 * TOPIK Words Storage — Supabase + localStorage fallback
 * Lưu & truy vấn từ vựng TOPIK AI-generated
 */

import { supabase, supabaseEnabled } from './supabase'

export interface TopikWord {
  id?: string
  ko: string
  vi: string
  en: string
  level: number
  example?: string
  created_at?: string
}

const LOCAL_KEY = 'topik_ai_words'

// ─── localStorage helpers ───────────────────────────────────────

function getLocalWords(): TopikWord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalWords(words: TopikWord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(words))
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Lưu danh sách từ mới vào Supabase (nếu sẵn sàng) + localStorage fallback
 */
export async function saveWords(words: TopikWord[]): Promise<void> {
  // Luôn lưu localStorage để đảm bảo offline
  const existing = getLocalWords()
  const merged = [...existing]

  for (const w of words) {
    if (!merged.some(e => e.ko === w.ko && e.level === w.level)) {
      merged.push(w)
    }
  }
  saveLocalWords(merged)

  // Thử Supabase
  if (supabaseEnabled && supabase) {
    try {
      const rows = words.map(w => ({
        ko: w.ko,
        vi: w.vi,
        en: w.en,
        level: w.level,
        example: w.example || null,
      }))
      // upsert-style: chỉ insert những từ chưa tồn tại
      const { error } = await supabase.from('topik_words').upsert(rows, {
        onConflict: 'ko,level',
        ignoreDuplicates: true,
      })
      if (error) {
        console.warn('[TopikStorage] Supabase upsert warning:', error.message)
      }
    } catch (err) {
      console.warn('[TopikStorage] Supabase save fallback to localStorage:', err)
    }
  }
}

/**
 * Lấy tất cả từ vựng AI đã lưu theo level
 * Ưu tiên Supabase, dự phòng localStorage
 */
export async function getWordsByLevel(level: number): Promise<TopikWord[]> {
  // Thử Supabase trước
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('topik_words')
        .select('*')
        .eq('level', level)
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        // Đồng bộ xuống localStorage
        const local = getLocalWords()
        const merged = [...local]
        for (const w of data) {
          if (!merged.some(e => e.ko === w.ko && e.level === w.level)) {
            merged.push(w)
          }
        }
        saveLocalWords(merged)
        return data
      }
    } catch (err) {
      console.warn('[TopikStorage] Supabase read fallback:', err)
    }
  }

  // Fallback localStorage
  return getLocalWords().filter(w => w.level === level)
}

/**
 * Lấy tất cả từ đã lưu (dùng để chống trùng khi AI tạo mới)
 */
export async function getAllSavedKoWords(): Promise<string[]> {
  const local = getLocalWords().map(w => w.ko)

  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('topik_words')
        .select('ko')

      if (!error && data) {
        const supaWords = data.map((d: any) => d.ko)
        return [...new Set([...local, ...supaWords])]
      }
    } catch {
      // ignore
    }
  }

  return [...new Set(local)]
}


// ─── Seed-based Shuffle (Fisher-Yates) ──────────────────────────

/**
 * Simple seeded pseudo-random (mulberry32)
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Tạo seed number từ roomId string
 */
function stringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}

/**
 * Trộn mảng ngẫu nhiên theo roomId (Fisher-Yates seeded shuffle)
 * Đảm bảo mọi người trong cùng phòng thấy cùng thứ tự
 */
export function seedShuffle<T>(array: T[], roomId: string): T[] {
  const result = [...array]
  const rng = mulberry32(stringToSeed(roomId))

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }

  return result
}
