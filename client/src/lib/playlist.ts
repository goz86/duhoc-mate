export interface QueuedPlaylistItem {
  id: string;
  videoId: string;
  title: string;
  votes?: number;
}

export const getNextPlaylistItem = <T extends QueuedPlaylistItem>(playlist: T[]): T | null =>
  playlist.length > 0 ? playlist[0] : null;
