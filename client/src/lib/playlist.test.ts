import { describe, expect, it } from 'vitest';
import { getNextPlaylistItem } from './playlist';

describe('getNextPlaylistItem', () => {
  it('returns the highest ranked item at the top of the playlist', () => {
    const next = getNextPlaylistItem([
      { id: 'top', videoId: 'a', title: 'Top vote', votes: 4 },
      { id: 'later', videoId: 'b', title: 'Later', votes: 2 },
    ]);

    expect(next?.id).toBe('top');
  });

  it('returns null when there is no queued item', () => {
    expect(getNextPlaylistItem([])).toBeNull();
  });
});
