import { supabase, supabaseEnabled } from './supabase'
import {
  TOPIK_GRAMMAR_PATTERNS,
  TOPIK_PRACTICE_QUESTIONS,
  type TopikGrammarPattern,
  type TopikPracticeQuestion,
  type TopikRoomGameType,
} from './topikGrammar'
import type { AiGrammarBundle, AiGrammarValidation } from './aiService'

const GRAMMAR_CACHE_KEY = 'duhocmate_topik_grammar_cache_v1'
const QUESTION_CACHE_KEY = 'duhocmate_topik_question_cache_v1'
const PAGE_SIZE = 1000

export const TOPIK_GRAMMAR_TARGETS: Record<number, number> = {
  1: 50,
  2: 70,
  3: 125,
  4: 125,
  5: 125,
  6: 125,
}

export type TopikContentSubmission = {
  id: string
  user_id: string
  level: number
  grammar_payload: Record<string, any>
  questions_payload: Record<string, any>[]
  validation_report: Record<string, any>
  status: 'pending' | 'approved' | 'rejected'
  review_note: string
  created_at: string
}

type GrammarRow = {
  id: string
  level: number
  title: string
  formula: string
  meaning_vi: string
  meaning_en: string
  examples: TopikGrammarPattern['examples']
  common_mistake: string
}

type QuestionRow = {
  id: string
  level: number
  category: TopikPracticeQuestion['category']
  game_types?: TopikRoomGameType[]
  error_type: TopikPracticeQuestion['errorType']
  pattern_id?: string | null
  prompt: string
  options: string[]
  answer_index: number
  explanation: string
}

function readCache<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCache<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch {
    // Content still remains usable from memory if browser storage is full.
  }
}

function slugifyPattern(title: string) {
  const ascii = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
  return ascii || `grammar-${Date.now()}`
}

function buildSubmissionPayload(bundle: AiGrammarBundle, level: number) {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const patternId = `ai-g${level}-${slugifyPattern(bundle.pattern.title)}-${suffix}`
  const grammarPayload = {
    id: patternId,
    ...bundle.pattern,
    ai_model: 'deepseek-chat',
    ai_prompt_version: 'grammar-v1',
  }
  const questionsPayload = bundle.questions.map((question, index) => ({
    id: `${patternId}-q${String(index + 1).padStart(2, '0')}`,
    level,
    category: question.category,
    game_types: question.usage === 'game'
      ? question.game_types
      : [],
    error_type: question.error_type,
    pattern_id: patternId,
    prompt: question.prompt,
    options: question.options,
    answer_index: question.answer_index,
    explanation: question.explanation,
    difficulty: question.difficulty,
    usage: question.usage,
  }))
  return { grammarPayload, questionsPayload }
}

function mapGrammarRow(row: GrammarRow): TopikGrammarPattern {
  return {
    id: row.id,
    level: row.level,
    title: row.title,
    formula: row.formula,
    meaningVi: row.meaning_vi,
    meaningEn: row.meaning_en || '',
    examples: Array.isArray(row.examples) ? row.examples : [],
    commonMistake: row.common_mistake || '',
  }
}

function mapQuestionRow(row: QuestionRow): TopikPracticeQuestion {
  return {
    id: row.id,
    level: row.level,
    category: row.category,
    gameType: row.game_types?.[0],
    errorType: row.error_type,
    patternId: row.pattern_id || undefined,
    prompt: row.prompt,
    options: Array.isArray(row.options) ? row.options : [],
    answerIndex: row.answer_index,
    explanation: row.explanation || '',
  }
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const rows = new Map<string, T>()
  fallback.forEach(item => rows.set(item.id, item))
  primary.forEach(item => rows.set(item.id, item))
  return Array.from(rows.values())
}

export async function loadPublishedGrammarPatterns(): Promise<TopikGrammarPattern[]> {
  if (supabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase
        .from('topik_grammar_patterns')
        .select('id,level,title,formula,meaning_vi,meaning_en,examples,common_mistake')
        .eq('status', 'published')
        .order('level', { ascending: true })
        .order('quality_score', { ascending: false })

      if (!error && data?.length) {
        const mapped = (data as GrammarRow[]).map(mapGrammarRow)
        const merged = mergeById(mapped, TOPIK_GRAMMAR_PATTERNS)
        writeCache(GRAMMAR_CACHE_KEY, merged)
        return merged
      }
      if (error && error.code !== '42P01') {
        console.warn('[TopikContent] Grammar read warning:', error.message)
      }
    } catch (error) {
      console.warn('[TopikContent] Grammar read fallback:', error)
    }
  }

  const cached = readCache<TopikGrammarPattern>(GRAMMAR_CACHE_KEY)
  return cached.length ? mergeById(cached, TOPIK_GRAMMAR_PATTERNS) : TOPIK_GRAMMAR_PATTERNS
}

export async function loadPublishedQuestionBank(): Promise<TopikPracticeQuestion[]> {
  if (supabaseEnabled && supabase) {
    try {
      const rows: QuestionRow[] = []
      for (let from = 0; from < 10000; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('topik_question_bank')
          .select('id,level,category,game_types,error_type,pattern_id,prompt,options,answer_index,explanation')
          .eq('status', 'published')
          .order('quality_score', { ascending: false })
          .range(from, from + PAGE_SIZE - 1)

        if (error) {
          if (error.code !== '42P01') console.warn('[TopikContent] Question bank read warning:', error.message)
          break
        }
        if (!data?.length) break
        rows.push(...data as QuestionRow[])
        if (data.length < PAGE_SIZE) break
      }

      if (rows.length) {
        const mapped = mergeById(rows.map(mapQuestionRow), TOPIK_PRACTICE_QUESTIONS)
        writeCache(QUESTION_CACHE_KEY, mapped)
        return mapped
      }
    } catch (error) {
      console.warn('[TopikContent] Question bank read fallback:', error)
    }
  }

  const cached = readCache<TopikPracticeQuestion>(QUESTION_CACHE_KEY)
  return cached.length ? mergeById(cached, TOPIK_PRACTICE_QUESTIONS) : TOPIK_PRACTICE_QUESTIONS
}

export function pickQuestionSession(
  bank: TopikPracticeQuestion[],
  level: number,
  patternId?: string,
  count = 5
) {
  const exact = bank.filter(question => patternId ? question.patternId === patternId : question.level === level)
  const sameLevel = bank.filter(question => question.level === level)
  const grammarFallback = bank.filter(question => question.category === 'grammar')
  const seen = new Set<string>()
  return [...exact, ...sameLevel, ...grammarFallback]
    .filter(question => {
      if (seen.has(question.id)) return false
      seen.add(question.id)
      return true
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

export async function loadPublishedGrammarCounts(): Promise<Record<number, number>> {
  const fallback = TOPIK_GRAMMAR_PATTERNS.reduce<Record<number, number>>((counts, pattern) => {
    counts[pattern.level] = (counts[pattern.level] || 0) + 1
    return counts
  }, {})
  if (!supabaseEnabled || !supabase) return fallback

  try {
    const { data, error } = await supabase
      .from('topik_grammar_patterns')
      .select('level')
      .eq('status', 'published')
      .limit(2000)
    if (error || !data) return fallback
    if (data.length === 0) return fallback
    return data.reduce<Record<number, number>>((counts, row: any) => {
      counts[row.level] = (counts[row.level] || 0) + 1
      return counts
    }, {})
  } catch {
    return fallback
  }
}

export async function createGrammarGenerationJob(
  userId: string,
  level: number,
  requestedCount: number,
  grammarType: string,
  topic: string,
) {
  if (!supabaseEnabled || !supabase) return null
  const { data, error } = await supabase
    .from('topik_generation_jobs')
    .insert({
      user_id: userId,
      level,
      requested_count: requestedCount,
      grammar_type: grammarType || 'general',
      topic: topic || '',
      status: 'running',
    })
    .select('id')
    .single()
  if (error) {
    if (error.code !== '42P01') console.warn('[TopikContent] Create generation job warning:', error.message)
    return null
  }
  return data?.id || null
}

export async function completeGrammarGenerationJob(
  jobId: string | null,
  status: 'completed' | 'failed',
  generatedCount: number,
  errorMessage = '',
) {
  if (!jobId || !supabaseEnabled || !supabase) return
  const { error } = await supabase
    .from('topik_generation_jobs')
    .update({
      status,
      generated_count: generatedCount,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  if (error && error.code !== '42P01') console.warn('[TopikContent] Complete generation job warning:', error.message)
}

export async function submitGrammarBundle(
  userId: string,
  level: number,
  bundle: AiGrammarBundle,
  validation: AiGrammarValidation,
) {
  if (!validation.valid || validation.practiceCount < 10 || validation.gameCount < 5) {
    throw new Error('Bộ ngữ pháp chưa đạt chuẩn 10 câu luyện tập và 5 câu game.')
  }
  if (!supabaseEnabled || !supabase) throw new Error('Supabase chưa được cấu hình.')
  const { grammarPayload, questionsPayload } = buildSubmissionPayload(bundle, level)
  const { data, error } = await supabase
    .from('topik_content_submissions')
    .insert({
      user_id: userId,
      level,
      grammar_payload: grammarPayload,
      questions_payload: questionsPayload,
      validation_report: validation,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(error.code === '42P01' ? 'Hãy chạy supabase-topik-product.sql trước.' : error.message)
  return data?.id as string
}

export async function loadOwnGrammarSubmissions(userId: string): Promise<TopikContentSubmission[]> {
  if (!supabaseEnabled || !supabase) return []
  const { data, error } = await supabase
    .from('topik_content_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    if (error.code !== '42P01') console.warn('[TopikContent] Own submissions warning:', error.message)
    return []
  }
  return (data || []) as TopikContentSubmission[]
}

export async function loadPendingGrammarSubmissions(): Promise<TopikContentSubmission[]> {
  if (!supabaseEnabled || !supabase) return []
  const { data, error } = await supabase
    .from('topik_content_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw error
  return (data || []) as TopikContentSubmission[]
}

export async function approveGrammarSubmission(id: string) {
  if (!supabaseEnabled || !supabase) throw new Error('Supabase chưa được cấu hình.')
  const { error } = await supabase.rpc('approve_topik_submission', { submission_id: id })
  if (error) throw error
}

export async function rejectGrammarSubmission(id: string, note: string) {
  if (!supabaseEnabled || !supabase) throw new Error('Supabase chưa được cấu hình.')
  const { error } = await supabase
    .from('topik_content_submissions')
    .update({
      status: 'rejected',
      review_note: note,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}
