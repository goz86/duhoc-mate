export type StageMode = 'youtube' | 'tiktok' | 'music' | 'pdf' | 'pomodoro' | 'topik' | 'video' | 'ideas';

export interface Member {
  id: string;
  username: string;
  isHost: boolean;
  friendCode?: string;
  avatarUrl?: string;
  role?: 'host' | 'cohost' | 'moderator' | 'member';
  mutedUntil?: string | number | null;
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  duration: string;
  votes: number;
  votedUsers: string[];
  addedBy: string;
  status?: 'queued' | 'playing' | 'played';
  playedAt?: string;
}

export interface VideoState {
  id: string;
  time: number;
  playing: boolean;
  playlistItemId?: string;
  pausedByHost?: boolean;
  lastUpdated?: number; // server timestamp (Date.now) — dùng để bù trễ mạng khi đồng bộ
}

export interface Message {
  id: string;
  sender: string;
  senderId?: string;
  isHost?: boolean;
  role?: 'host' | 'cohost' | 'moderator' | 'member';
  type?: 'user' | 'system';
  text: string;
  timestamp: string;
  sentAt?: number;  // unix ms — dùng cho chat bubble
}

export interface PomodoroState {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  isBreak: boolean;
}

export interface StudyTableSeat {
  memberId: string;
  username: string;
  isHost: boolean;
  joinedAt: number;
  active: boolean;
  status: string;
  personalPomodoro: PomodoroState;
}

export interface StudyTableReaction {
  id: string;
  memberId: string;
  senderId?: string;
  senderName?: string;
  label: string;
  createdAt: number;
}

export interface StudyTableState {
  seats: Record<string, StudyTableSeat>;
  reactions: StudyTableReaction[];
}
