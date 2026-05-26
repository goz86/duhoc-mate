import { describe, expect, it } from 'vitest';
import { getNextPlaylistItem } from './playlist';

describe('getNextPlaylistItem', () => {
  it('returns the highest ranked item at the top of the playlist', () => {
    const next = getNextPlaylistItem([
      { id: 'top', videoId: 'a', title: 'Top vote', votes: 4, status: 'queued' },
      { id: 'later', videoId: 'b', title: 'Later', votes: 2 },
    ]);

    expect(next?.id).toBe('top');
  });

  it('returns null when there is no queued item', () => {
    expect(getNextPlaylistItem([])).toBeNull();
  });

  it('skips played and currently playing items', () => {
    const next = getNextPlaylistItem([
      { id: 'played', videoId: 'a', title: 'Played', votes: 10, status: 'played' },
      { id: 'playing', videoId: 'b', title: 'Playing', votes: 9, status: 'playing' },
      { id: 'queued', videoId: 'c', title: 'Queued', votes: 1, status: 'queued' },
    ]);

    expect(next?.id).toBe('queued');
  });

  it('continues after the current playlist item when earlier rows are still queued', () => {
    const next = getNextPlaylistItem([
      { id: 'first', videoId: 'a', title: 'First', votes: 4, status: 'queued' },
      { id: 'current', videoId: 'b', title: 'Current', votes: 2, status: 'playing' },
      { id: 'third', videoId: 'c', title: 'Third', votes: 1, status: 'queued' },
    ], { playlistItemId: 'current', videoId: 'b' });

    expect(next?.id).toBe('third');
  });
});
