import type { TopikErrorType } from './topikGrammar'
import { supabase, supabaseEnabled } from './supabase'

const MISTAKE_KEY = 'duhocmate_topik_mistakes_v1'
const MAX_MISTAKES = 120

export type TopikMistake = {
  id: string
  createdAt: number
  source: 'quick-practice' | 'room-game'
  questionId: string
  level: number
  category: string
  errorType: TopikErrorType
  prompt: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  wrongCount: number
}

function readRawMistakes(): TopikMistake[] {
  try {
    const raw = localStorage.getItem(MISTAKE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.map(item => ({ ...item, wrongCount: item.wrongCount || 1 }))
      : []
  } catch {
    return []
  }
}

function writeMistakes(mistakes: TopikMistake[]) {
  localStorage.setItem(MISTAKE_KEY, JSON.stringify(mistakes.slice(0, MAX_MISTAKES)))
}

export function loadTopikMistakes() {
  return readRawMistakes()
}

function toSupabaseRow(userId: string, mistake: TopikMistake) {
  return {
    user_id: userId,
    question_id: mistake.questionId,
    source: mistake.source,
    level: mistake.level,
    error_type: mistake.errorType,
    prompt_snapshot: mistake.prompt,
    last_wrong_answer: mistake.userAnswer,
    correct_answer: mistake.correctAnswer,
    explanation_snapshot: mistake.explanation,
    wrong_count: mistake.wrongCount,
    last_wrong_at: new Date(mistake.createdAt).toISOString(),
    mastered_at: null,
  }
}

function fromSupabaseRow(row: any): TopikMistake {
  return {
    id: `${row.source}-${row.question_id}-${new Date(row.last_wrong_at).getTime()}`,
    createdAt: new Date(row.last_wrong_at).getTime(),
    source: row.source,
    questionId: row.question_id,
    level: row.level,
    category: '',
    errorType: row.error_type,
    prompt: row.prompt_snapshot,
    userAnswer: row.last_wrong_answer,
    correctAnswer: row.correct_answer,
    explanation: row.explanation_snapshot || '',
    wrongCount: row.wrong_count || 1,
  }
}

export function addTopikMistake(
  mistake: Omit<TopikMistake, 'id' | 'createdAt' | 'wrongCount'>,
  userId?: string | null
) {
  const current = readRawMistakes()
  const previous = current.find(item => item.questionId === mistake.questionId && item.source === mistake.source)
  const next: TopikMistake = {
    ...mistake,
    id: `${mistake.source}-${mistake.questionId}-${Date.now()}`,
    createdAt: Date.now(),
    wrongCount: (previous?.wrongCount || 0) + 1,
  }
  const deduped = current.filter(item => !(item.questionId === mistake.questionId && item.source === mistake.source))
  writeMistakes([next, ...deduped])

  if (userId && supabaseEnabled && supabase) {
    void supabase
      .from('topik_user_mistakes')
      .upsert(toSupabaseRow(userId, next), { onConflict: 'user_id,question_id,source' })
      .then(({ error }) => {
        if (error && error.code !== '42P01') console.warn('[TopikMistakes] Supabase upsert warning:', error.message)
      })
  }
  return next
}

export function removeTopikMistake(id: string, userId?: string | null) {
  const current = readRawMistakes()
  const target = current.find(item => item.id === id)
  writeMistakes(current.filter(item => item.id !== id))
  if (target && userId && supabaseEnabled && supabase) {
    void supabase
      .from('topik_user_mistakes')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', target.questionId)
      .eq('source', target.source)
  }
}

export function clearTopikMistakes(userId?: string | null) {
  localStorage.removeItem(MISTAKE_KEY)
  if (userId && supabaseEnabled && supabase) {
    void supabase.from('topik_user_mistakes').delete().eq('user_id', userId)
  }
}

export async function syncTopikMistakes(userId?: string | null): Promise<TopikMistake[]> {
  const local = readRawMistakes()
  if (!userId || !supabaseEnabled || !supabase) return local

  try {
    const { data, error } = await supabase
      .from('topik_user_mistakes')
      .select('*')
      .eq('user_id', userId)
      .order('last_wrong_at', { ascending: false })

    if (error) {
      if (error.code !== '42P01') console.warn('[TopikMistakes] Supabase sync warning:', error.message)
      return local
    }

    const remote = (data || []).map(fromSupabaseRow)
    const mergedMap = new Map<string, TopikMistake>()
    for (const item of [...remote, ...local]) {
      const key = `${item.source}:${item.questionId}`
      const previous = mergedMap.get(key)
      if (!previous || item.createdAt > previous.createdAt) mergedMap.set(key, item)
    }
    const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt)
    writeMistakes(merged)

    if (local.length) {
      const { error: upsertError } = await supabase
        .from('topik_user_mistakes')
        .upsert(local.map(item => toSupabaseRow(userId, item)), { onConflict: 'user_id,question_id,source' })
      if (upsertError && upsertError.code !== '42P01') {
        console.warn('[TopikMistakes] Local merge warning:', upsertError.message)
      }
    }
    return merged
  } catch (error) {
    console.warn('[TopikMistakes] Supabase sync fallback:', error)
    return local
  }
}
