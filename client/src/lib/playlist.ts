export interface QueuedPlaylistItem {
  id: string;
  videoId: string;
  title: string;
  votes?: number;
  status?: 'queued' | 'playing' | 'played';
}

export const getNextPlaylistItem = <T extends QueuedPlaylistItem>(playlist: T[]): T | null =>
  playlist.find((item) => item.status !== 'playing' && item.status !== 'played') || null;
