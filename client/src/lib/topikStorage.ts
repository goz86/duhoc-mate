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
  ai_examples?: { sentence: string; meaning: string }[]
  created_at?: string
}

const LOCAL_KEY = 'topik_ai_words'

// ─── localStorage helpers ───────────────────────────────────────

function getLocalWords(): TopikWord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      // Dữ liệu bị hỏng, xóa đi
      localStorage.removeItem(LOCAL_KEY)
      return []
    }
    return parsed
  } catch {
    // JSON bị lỗi, xóa dữ liệu hỏng
    localStorage.removeItem(LOCAL_KEY)
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

/**
 * Lấy danh sách ví dụ AI đã lưu của một từ
 */
export async function getWordExamples(ko: string, level: number): Promise<{ sentence: string; meaning: string }[]> {
  // Thử Supabase trước
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('topik_words')
        .select('ai_examples')
        .eq('ko', ko)
        .eq('level', level)
        .maybeSingle()

      if (!error && data && data.ai_examples) {
        return data.ai_examples as { sentence: string; meaning: string }[]
      }
    } catch (err) {
      console.warn('[TopikStorage] Supabase getWordExamples fallback:', err)
    }
  }

  // Fallback localStorage
  const local = getLocalWords()
  const match = local.find(w => w.ko === ko && w.level === level)
  return match?.ai_examples || []
}

/**
 * Lưu danh sách ví dụ AI cho một từ
 */
export async function saveWordExamples(
  card: { ko: string; level: number; vi: string; en: string; example?: string },
  examples: { sentence: string; meaning: string }[]
): Promise<void> {
  // 1. Lưu localStorage
  const local = getLocalWords()
  const existingIdx = local.findIndex(w => w.ko === card.ko && w.level === card.level)
  if (existingIdx > -1) {
    local[existingIdx].ai_examples = examples
  } else {
    local.push({
      ko: card.ko,
      level: card.level,
      vi: card.vi,
      en: card.en,
      example: card.example,
      ai_examples: examples,
    })
  }
  saveLocalWords(local)

  // 2. Lưu Supabase
  if (supabaseEnabled && supabase) {
    try {
      const row = {
        ko: card.ko,
        level: card.level,
        vi: card.vi,
        en: card.en,
        example: card.example || null,
        ai_examples: examples,
      }
      const { error } = await supabase.from('topik_words').upsert([row], {
        onConflict: 'ko,level',
      })
      if (error) {
        console.warn('[TopikStorage] Supabase saveWordExamples upsert warning:', error.message)
      }
    } catch (err) {
      console.warn('[TopikStorage] Supabase saveWordExamples fallback to localStorage:', err)
    }
  }
}


// ─── Exam Date Persistence (Supabase + localStorage) ────────────

const EXAM_DATE_KEY = 'topik_exam_date'

/** Lấy device ID duy nhất để lưu settings */
function getDeviceId(): string {
  let id = localStorage.getItem('topik_device_id')
  if (!id) {
    id = crypto.randomUUID?.() || `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem('topik_device_id', id)
  }
  return id
}

/**
 * Lưu ngày thi TOPIK vào Supabase + localStorage
 */
export async function saveExamDate(date: string): Promise<void> {
  localStorage.setItem(EXAM_DATE_KEY, date)

  if (supabaseEnabled && supabase) {
    try {
      const deviceId = getDeviceId()
      await supabase.from('topik_settings').upsert({
        device_id: deviceId,
        exam_date: date,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'device_id' })
    } catch (err) {
      console.warn('[TopikStorage] Supabase saveExamDate fallback:', err)
    }
  }
}

/**
 * Đọc ngày thi TOPIK từ Supabase, fallback localStorage
 */
export async function loadExamDate(): Promise<string> {
  // Thử Supabase trước
  if (supabaseEnabled && supabase) {
    try {
      const deviceId = getDeviceId()
      const { data, error } = await supabase
        .from('topik_settings')
        .select('exam_date')
        .eq('device_id', deviceId)
        .single()

      if (!error && data?.exam_date) {
        // Đồng bộ xuống localStorage
        localStorage.setItem(EXAM_DATE_KEY, data.exam_date)
        return data.exam_date
      }
    } catch {
      // fallback
    }
  }

  return localStorage.getItem(EXAM_DATE_KEY) || ''
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


// ─── TOPIK Mock Exams Persistence (Supabase Only) ────────────────

export interface TopikExam {
  id?: string
  exam_number?: number
  title: string
  category: 'reading' | 'listening'
  level: number // 1: TOPIK I, 2: TOPIK II
  created_at?: string
  created_by: string
}

export interface TopikExamQuestion {
  id?: string
  exam_id?: string
  question_number: number
  question_type: string
  instructions: string
  passage?: string
  question_text: string
  options: string[]
  correct_option: number
  explanation?: string
  audio_script?: string
}

/**
 * Lưu đề thi mới vào Supabase
 */
export async function saveExamToDb(
  exam: TopikExam,
  questions: TopikExamQuestion[]
): Promise<TopikExam> {
  if (!supabaseEnabled || !supabase) {
    throw new Error('Supabase không khả dụng')
  }

  // 1. Insert đề thi
  const { data: examData, error: examError } = await supabase
    .from('topik_exams')
    .insert([exam])
    .select()
    .single()

  if (examError || !examData) {
    throw new Error(`Lỗi tạo đề thi: ${examError?.message || 'Không có dữ liệu trả về'}`)
  }

  // 2. Insert các câu hỏi
  const questionsToInsert = questions.map(q => ({
    exam_id: examData.id,
    question_number: q.question_number,
    question_type: q.question_type,
    instructions: q.instructions,
    passage: q.passage || null,
    question_text: q.question_text,
    options: q.options,
    correct_option: q.correct_option,
    explanation: q.explanation || null,
    audio_script: q.audio_script || null,
  }))

  const { error: questionsError } = await supabase
    .from('topik_exam_questions')
    .insert(questionsToInsert)

  if (questionsError) {
    // Dọn dẹp đề thi lỗi để tránh rác dữ liệu
    await supabase.from('topik_exams').delete().eq('id', examData.id)
    throw new Error(`Lỗi tạo câu hỏi: ${questionsError.message}`)
  }

  return examData
}

/**
 * Tải danh sách đề thi hiện có
 */
export async function loadExamsFromDb(category?: 'reading' | 'listening', level?: number): Promise<TopikExam[]> {
  if (!supabaseEnabled || !supabase) {
    return []
  }

  try {
    let query = supabase.from('topik_exams').select('*').order('exam_number', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }
    if (level) {
      query = query.eq('level', level)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[TopikStorage] Lỗi tải danh sách đề thi:', err)
    return []
  }
}

/**
 * Tải danh sách câu hỏi của một đề thi cụ thể
 */
export async function loadExamQuestions(examId: string): Promise<TopikExamQuestion[]> {
  if (!supabaseEnabled || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('topik_exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[TopikStorage] Lỗi tải câu hỏi đề thi:', err)
    return []
  }
}

/**
 * Xóa một đề thi khỏi cơ sở dữ liệu
 */
export async function deleteExamFromDb(examId: string): Promise<void> {
  if (!supabaseEnabled || !supabase) {
    throw new Error('Supabase không khả dụng')
  }

  const { error } = await supabase
    .from('topik_exams')
    .delete()
    .eq('id', examId)

  if (error) {
    throw new Error(`Lỗi xóa đề thi: ${error.message}`)
  }
}


