import type { TopikWord } from './topikStorage';

type WordRowOptions = {
  includePronunciation?: boolean;
};

export function buildTopikWordRow(word: TopikWord, options: WordRowOptions = {}) {
  const { includePronunciation = true } = options;
  const row: Record<string, unknown> = {
    ko: word.ko,
    vi: word.vi,
    en: word.en,
    level: word.level,
    example: word.example || null,
  };

  if (includePronunciation) {
    row.pronunciation = word.pronunciation || null;
  }

  return row;
}

export function buildTopikExampleRow(
  card: { ko: string; level: number; vi: string; en: string; example?: string; pronunciation?: string },
  examples: { sentence: string; meaning: string }[],
  options: WordRowOptions = {},
) {
  return {
    ...buildTopikWordRow(card, options),
    ai_examples: examples,
  };
}

export function isMissingSupabaseColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { code?: unknown; message?: unknown };
  return (
    maybeError.code === '42703' &&
    typeof maybeError.message === 'string' &&
    maybeError.message.includes(columnName)
  );
}
