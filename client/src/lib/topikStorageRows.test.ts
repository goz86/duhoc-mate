import { describe, expect, it } from 'vitest';
import {
  buildTopikExampleRow,
  buildTopikWordRow,
  isMissingSupabaseColumnError,
} from './topikStorageRows';

describe('topik storage row helpers', () => {
  it('builds word rows with optional Supabase columns by default', () => {
    expect(buildTopikWordRow({
      ko: '관계',
      vi: 'quan hệ',
      en: 'relationship',
      level: 6,
      example: '두 사람은 관계가 좋아요.',
      pronunciation: '관계',
    })).toEqual({
      ko: '관계',
      vi: 'quan hệ',
      en: 'relationship',
      level: 6,
      example: '두 사람은 관계가 좋아요.',
      pronunciation: '관계',
    });
  });

  it('can omit pronunciation for older Supabase schemas', () => {
    const row = buildTopikWordRow({
      ko: '관계',
      vi: 'quan hệ',
      en: 'relationship',
      level: 6,
      pronunciation: '관계',
    }, { includePronunciation: false });

    expect(row).not.toHaveProperty('pronunciation');
  });

  it('builds example rows with ai_examples when the schema supports it', () => {
    expect(buildTopikExampleRow(
      { ko: '관계', vi: 'quan hệ', en: 'relationship', level: 6 },
      [{ sentence: '관계가 중요해요.', meaning: 'Mối quan hệ rất quan trọng.' }],
    )).toMatchObject({
      ko: '관계',
      level: 6,
      ai_examples: [{ sentence: '관계가 중요해요.', meaning: 'Mối quan hệ rất quan trọng.' }],
    });
  });

  it('recognizes Supabase missing column errors', () => {
    expect(isMissingSupabaseColumnError({
      code: '42703',
      message: 'column topik_words.ai_examples does not exist',
    }, 'ai_examples')).toBe(true);
  });
});
