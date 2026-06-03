import { describe, expect, it } from 'vitest';
import {
  buildTopikProgressRow,
  normalizeTopikProgress,
  topikProgressStorageKey,
  topikWordProgressKey,
} from './topikProgress';

describe('topik progress helpers', () => {
  it('uses a stable word key that does not depend on card order', () => {
    expect(topikWordProgressKey({ level: 4, ko: ' 가치관 ' })).toBe('4:가치관');
  });

  it('normalizes duplicate keys and lets known override unknown conflicts', () => {
    expect(normalizeTopikProgress({
      knownKeys: ['4:가치관', '4:가치관'],
      unknownKeys: ['4:관계', '4:가치관', '4:관계'],
    })).toEqual({
      knownKeys: ['4:가치관'],
      unknownKeys: ['4:관계'],
    });
  });

  it('builds a Supabase row per user and level', () => {
    expect(buildTopikProgressRow('user-1', 4, {
      knownKeys: ['4:가치관'],
      unknownKeys: ['4:관계'],
    })).toEqual({
      user_id: 'user-1',
      level: 4,
      known_keys: ['4:가치관'],
      unknown_keys: ['4:관계'],
    });
  });

  it('keeps local progress keys separated by level and account', () => {
    expect(topikProgressStorageKey(4, 'user-1')).toBe('topik_progress_user-1_4');
    expect(topikProgressStorageKey(4)).toBe('topik_progress_local_4');
  });
});
