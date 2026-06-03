export type TopikProgressState = {
  knownKeys: string[]
  unknownKeys: string[]
}

export function topikWordProgressKey(word: { level: number; ko: string }): string {
  return `${word.level}:${word.ko.trim()}`
}

export function normalizeTopikProgress(progress: TopikProgressState): TopikProgressState {
  const knownKeys = Array.from(new Set(progress.knownKeys.filter(Boolean)))
  const knownSet = new Set(knownKeys)
  const unknownKeys = Array.from(new Set(progress.unknownKeys.filter(Boolean))).filter(key => !knownSet.has(key))

  return { knownKeys, unknownKeys }
}

export function buildTopikProgressRow(userId: string, level: number, progress: TopikProgressState) {
  const normalized = normalizeTopikProgress(progress)
  return {
    user_id: userId,
    level,
    known_keys: normalized.knownKeys,
    unknown_keys: normalized.unknownKeys,
  }
}

export function topikProgressStorageKey(level: number, userId?: string | null): string {
  const owner = userId?.trim() || 'local'
  return `topik_progress_${owner}_${level}`
}
