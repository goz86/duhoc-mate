import { describe, expect, it } from 'vitest';
import { getOffsetForLyricAnchor } from './lyrics';

describe('getOffsetForLyricAnchor', () => {
  it('calculates the offset needed to make a clicked lyric line match the current video time', () => {
    expect(getOffsetForLyricAnchor({ playbackTime: 153, lyricTime: 157 })).toBe(-4);
    expect(getOffsetForLyricAnchor({ playbackTime: 153, lyricTime: 149 })).toBe(4);
  });

  it('clamps very large corrections to the supported lyric offset range', () => {
    expect(getOffsetForLyricAnchor({ playbackTime: 10, lyricTime: 80 })).toBe(-60);
    expect(getOffsetForLyricAnchor({ playbackTime: 90, lyricTime: 10 })).toBe(60);
  });
});
