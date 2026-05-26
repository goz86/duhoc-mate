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
  const isAvailable = (item: T) => item.status !== 'playing' && item.status !== 'played';
  const currentIndex = playlist.findIndex((item) => (
    (current?.playlistItemId && item.id === current.playlistItemId) ||
    (!current?.playlistItemId && current?.videoId && item.videoId === current.videoId)
  ));

  if (currentIndex >= 0) {
    const afterCurrent = playlist.slice(currentIndex + 1).find(isAvailable);
    if (afterCurrent) return afterCurrent;
  }

  return playlist.find((item) => (
    isAvailable(item) &&
    item.id !== current?.playlistItemId &&
    item.videoId !== current?.videoId
  )) || null;
};
