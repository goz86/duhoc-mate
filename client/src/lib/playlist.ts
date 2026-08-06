export interface QueuedPlaylistItem {
  id: string;
  videoId: string;
  title: string;
  votes?: number;
  status?: 'queued' | 'playing' | 'played';
}

export const getNextPlaylistItem = <T extends QueuedPlaylistItem>(
  playlist: T[],
  current?: { playlistItemId?: string; videoId?: string }
): T | null => {
  if (!playlist || playlist.length === 0) return null;

  const isAvailable = (item: T) => item.status !== 'playing' && item.status !== 'played';
  const currentIndex = playlist.findIndex((item) => (
    (current?.playlistItemId && item.id === current.playlistItemId) ||
    (!current?.playlistItemId && current?.videoId && item.videoId === current.videoId)
  ));

  if (currentIndex >= 0) {
    const afterCurrent = playlist.slice(currentIndex + 1).find(isAvailable);
    if (afterCurrent) return afterCurrent;
  }

  const firstAvailable = playlist.find((item) => (
    isAvailable(item) &&
    item.id !== current?.playlistItemId &&
    item.videoId !== current?.videoId
  ));

  if (firstAvailable) return firstAvailable;

  // Auto-loop fallback: If all items in playlist have been played or no queued items remain,
  // wrap around to the next item in playlist that is not currently playing.
  const fallbackItem = playlist.find((item) => (
    item.id !== current?.playlistItemId &&
    item.videoId !== current?.videoId
  )) || playlist[0];

  return fallbackItem || null;
};

