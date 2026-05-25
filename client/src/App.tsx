import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AlertTriangle, ArrowLeft,
  Coffee, MessageCircle, ListMusic,
  Users, ThumbsUp, Play, Pause, RotateCcw, Send,
  CloudRain,
  Clock, FileText, Video,
  Headphones, Music2, ChevronRight, Search, Sparkles,
  Minimize2, Palette, Settings, Crown,
  Link2, Volume2, VolumeX, SkipForward, Plus, Share2, X,
  Mic, MicOff, PhoneOff
} from 'lucide-react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useTranslation } from 'react-i18next';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import TopikStudy from './components/TopikStudy';
import IdeaBoard from './components/IdeaBoard';
import CreateTemplateModal from './components/CreateTemplateModal';
import LandingPage from './components/LandingPage';
import { getTemplateRoomId, seedRoomIds } from './lib/templateRooms';
import RoomHeader from './components/RoomHeader';
import StageSelector from './components/StageSelector';
import StudyTableStage from './components/StudyTableStage';
import {
  cloneTasks,
  loadRoomTasks,
  loadTemplates,
  saveRoomTasks,
  saveTemplate,
  type IdeaTask,
  type RoomTemplate
} from './lib/communityTemplates';
import type { StageMode } from './types';
import { deletePersistentRoom, findPersistentRoom, hashRoomPassword, savePersistentRoom, type PersistentRoom } from './lib/persistentRooms';
import { getNextPlaylistItem } from './lib/playlist';
import {
  createEstimatedLyrics,
  findBestLyricsTrack,
  getOffsetForLyricAnchor,
  getLyricsSearchCandidates,
  parseSyncedLyrics,
  type LyricLine
} from './lib/lyrics';

// Kết nối Socket Server — đọc từ env var khi deploy, fallback localhost khi dev
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const LOCAL_API_BASE_URL = 'http://localhost:3001';
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : LOCAL_API_BASE_URL);

const getApiBaseCandidates = () => {
  const bases = [API_BASE_URL, '', LOCAL_API_BASE_URL];
  return Array.from(new Set(bases.map((base) => base.replace(/\/$/, ''))));
};

let socket: Socket;


interface Member {
  id: string;
  username: string;
  isHost: boolean;
  friendCode?: string;
}

interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  duration: string;
  votes: number;
  votedUsers: string[];
  addedBy: string;
}

interface VideoState {
  id: string;
  time: number;
  playing: boolean;
}

interface Message {
  id: string;
  sender: string;
  senderId?: string;
  isHost?: boolean;
  type?: 'user' | 'system';
  text: string;
  timestamp: string;
}

interface PomodoroState {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  isBreak: boolean;
}

const trendingVideoSuggestions = [
  {
    videoId: 'TURbeWK2wwg',
    title: 'Korean Listening Practice for Beginners',
    duration: '25:00',
    category: 'Korean',
  },
  {
    videoId: 'lTRiuFIWV54',
    title: 'Study With Me Korea - Pomodoro',
    duration: '50:00',
    category: 'Study with me',
  },
  {
    videoId: '4xDzrJKXOOY',
    title: 'Lo-Fi Hip Hop Study Music Mix',
    duration: '1:00:00',
    category: 'Lo-fi',
  },
  {
    videoId: '5qap5aO4i9A',
    title: 'Lo-Fi Girl Study Beat',
    duration: 'LIVE',
    category: 'Lo-fi',
  },
  {
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    duration: 'LIVE',
    category: 'Study music',
  },
];

export default function App() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();

  const [customAlert, setCustomAlert] = useState<{ message: string; show: boolean } | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalRoomId, setPasswordModalRoomId] = useState('');
  const [enteredRoomPassword, setEnteredRoomPassword] = useState('');
  const [passwordModalError, setPasswordModalError] = useState('');

  const [showGuestJoinModal, setShowGuestJoinModal] = useState(false);
  const [guestJoinRoomId, setGuestJoinRoomId] = useState('');
  const [guestJoinTemplate, setGuestJoinTemplate] = useState<RoomTemplate | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      setCustomAlert({ message: String(message), show: true });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (customAlert && customAlert.show) {
      const timer = setTimeout(() => {
        setCustomAlert(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [customAlert]);

  // Navigation & Auth states
  const [view, setView] = useState<'landing' | 'room'>('landing');
  const [roomId, setRoomId] = useState('');
  const [currentRoomTitle, setCurrentRoomTitle] = useState('');
  const [username, setUsername] = useState(() => {
    // Dùng profile.username nếu đã đăng nhập, không thì dùng localStorage
    return localStorage.getItem('duhocmate_username') || '';
  });
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // YouTube error handling
  const [videoError, setVideoError] = useState(false);

  // Session tracking cho popup tổng kết
  const joinTimeRef = useRef<number>(Date.now());
  const songsPlayedRef = useRef<number>(0);
  const messagesSentRef = useRef<number>(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [sessionStats, setSessionStats] = useState({ minutes: 0, songs: 0, messages: 0 });

  // Help board
  const [showHelpBoard, setShowHelpBoard] = useState(false);

  // Lobby (landing card) states
  // lobbyTab removed — new design uses sections instead of tabs
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [recentRooms, setRecentRooms] = useState<any[]>(() => {
    try {
      const data = localStorage.getItem('duhocmate_recent_rooms');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [friendsList, setFriendsList] = useState<string[]>(() => {
    try {
      const data = localStorage.getItem('duhocmate_friends');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [friendCode] = useState<string>(() => {
    let code = localStorage.getItem('duhocmate_friend_code');
    if (!code) {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('duhocmate_friend_code', code);
    }
    return code;
  });
  const [friendInputCode, setFriendInputCode] = useState('');
  const [templates, setTemplates] = useState<RoomTemplate[]>([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  // Room states
  const [members, setMembers] = useState<Member[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  // StageMode controls the main room module: media, focus timer, TOPIK, or idea board.
  const [stageMode, setStageMode] = useState<StageMode>('youtube');
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'playlist' | 'members'>('playlist');
  const [ideaTasks, setIdeaTasks] = useState<IdeaTask[]>([]);
  const [roomCollapsed, setRoomCollapsed] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [roomTheme, setRoomTheme] = useState<'cream' | 'midnight' | 'sakura' | 'ocean' | 'forest' | 'sunset' | 'neon' | 'arctic'>('cream');
  const [roomSettingsName, setRoomSettingsName] = useState('');
  const [roomSettingsPublic, setRoomSettingsPublic] = useState(true);
  const [roomSettingsPassword, setRoomSettingsPassword] = useState('');
  const [roomBackgroundUrl, setRoomBackgroundUrl] = useState('');

  // TikTok states
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [tiktokVideoId, setTiktokVideoId] = useState('');

  // YouTube states
  const [songSearch, setSongSearch] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState<any[]>([]);
  const [musicSearchLoading, setMusicSearchLoading] = useState(false);
  const [musicSearchError, setMusicSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoState>({
    id: '',
    time: 0,
    playing: false
  });
  const playerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef(currentVideo);
  useEffect(() => { currentVideoRef.current = currentVideo; }, [currentVideo]);
  const playlistRef = useRef<PlaylistItem[]>(playlist);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  const advancingPlaylistRef = useRef(false);
  const roomIdRef = useRef(roomId);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  const [localPaused, setLocalPaused] = useState(false);
  const localPausedRef = useRef(false);
  const [isHostPaused, setIsHostPaused] = useState(false);
  const isHostPausedRef = useRef(false);
  const [showHostPausedToast, setShowHostPausedToast] = useState(false);
  // Timestamp của lần pause gần nhất (host) - dùng để chặn spurious state=1 từ YouTube
  const hostLastPauseAtRef = useRef<number>(0);
  // Flag bền vững: host CÓ muốn play hay không (set qua UI button của ta)
  // Mục đích: chặn YouTube tự fire state=1 sau buffer/seek/ad khi host đã pause
  // false = host đã pause, không cho phép emit play từ onStateChange spurious
  const hostWantsToPlayRef = useRef<boolean>(false);
  // Trigger để force re-init YouTube player (không còn dùng setPlayerReinitTrigger sau fix NUCLEAR OPTION)
  const [playerReinitTrigger] = useState(0);
  const [playerVideoTitle, setPlayerVideoTitle] = useState('');
  // Âm lượng YouTube player (0-100), tách biệt với WebRTC voice volume
  const [playerVolume, setPlayerVolumeState] = useState(100);
  const [lyrics, setLyrics] = useState<string>('');
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [lyricsOffset, setLyricsOffset] = useState(0);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showYoutubeCaptions, setShowYoutubeCaptions] = useState(false);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);

  // ── Voice Chat (WebRTC) ────────────────────────────────────────────────────
  // socket là module-level let, có thể undefined trên first render → cast an toàn
  const voiceChat = useVoiceChat((socket as Socket | null) ?? null, roomId, isHost);

  // PDF states
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Pomodoro states
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    timeLeft: 25 * 60,
    duration: 25 * 60,
    isRunning: false,
    isBreak: false
  });

  // Study table state. Real Jitsi embed is intentionally disabled for now so
  // the virtual table does not get interrupted by a raw "Join meeting" iframe.
  const [jitsiActive, setJitsiActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Điều chỉnh âm lượng YouTube player (0-100) + lưu state để slider sync
  const setPlayerVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    setPlayerVolumeState(clamped);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(clamped);
    }
    if (playerRef.current) {
      if (clamped === 0) {
        playerRef.current.mute?.();
      } else {
        playerRef.current.unMute?.();
      }
    }
  };

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, []);

  // 1. Kết nối socket & Khởi tạo
  useEffect(() => {
    socket = io(SOCKET_URL);

    socket.on('room-users', (users: Member[]) => {
      setMembers(users);
      // Tìm xem mình có phải host mới không (trong trường hợp host cũ rời phòng)
      const me = users.find(u => u.id === socket.id);
      if (me) setIsHost(me.isHost);
    });

    socket.on('init-room-state', ({ playlist, videoState, pomodoro, chatMessages, isHost, tiktokVideoId, ideaTasks }) => {
      setPlaylist(playlist);
      setCurrentVideo(videoState);
      setVideoError(false);
      // Reset session tracking
      joinTimeRef.current = Date.now();
      songsPlayedRef.current = 0;
      messagesSentRef.current = 0;
      setPomodoro(pomodoro);
      setChatMessages(chatMessages || []);
      setIdeaTasks(ideaTasks || []);
      setIsHost(isHost);
      // Khởi tạo trạng thái host pause khi vào phòng
      const hostPaused = !!videoState?.pausedByHost;
      isHostPausedRef.current = hostPaused;
      setIsHostPaused(hostPaused);
      // Nếu là host và video đang playing → set flag cho phép emit play
      if (isHost && videoState?.playing) {
        hostWantsToPlayRef.current = true;
      } else {
        hostWantsToPlayRef.current = false;
      }
      if (tiktokVideoId) {
        setTiktokVideoId(tiktokVideoId);
        setStageMode('tiktok');
      }
    });

    socket.on('assigned-host', (val: boolean) => {
      setIsHost(val);
      // Khi được assign làm host mới → sync flag theo trạng thái video hiện tại
      if (val) {
        hostWantsToPlayRef.current = !!currentVideoRef.current?.playing;
      }
    });

    socket.on('room-settings-updated', ({ roomTitle, isPrivate }: { roomTitle?: string; isPrivate?: boolean }) => {
      if (roomTitle) {
        setCurrentRoomTitle(roomTitle);
        setRoomSettingsName(roomTitle);
      }
      if (typeof isPrivate === 'boolean') {
        setRoomSettingsPublic(!isPrivate);
      }
    });

    socket.on('room-closed', ({ roomId: closedRoomId }: { roomId: string }) => {
      setCustomAlert({ message: `Phòng ${closedRoomId} đã được host đóng.`, show: true });
      setView('landing');
      setRoomId('');
      socket.emit('request-active-rooms');
    });

    socket.on('receive-message', (msg: Message) => {
      setChatMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    });

    socket.on('update-playlist', (updatedList: PlaylistItem[]) => {
      setPlaylist(updatedList);
      // Tự động phát bài đầu tiên nếu playlist có bài và hiện tại đang phát bài mặc định hoặc bài hát đã hết
      if (updatedList.length > 0 && currentVideo.id !== updatedList[0].videoId) {
        // Có bài hát mới được đẩy lên đầu
      }
    });

    socket.on('video-sync', ({ action, time, videoId, userInitiated, videoState }) => {
      console.log('[SOCKET] video-sync received', {
        action,
        time,
        videoId,
        userInitiated,
        pausedByHost: videoState?.pausedByHost,
        isHost: isHostRef.current
      });
      // Track số bài đã phát trong phiên
      const isSongChange = videoId && videoId !== currentVideoRef.current?.id;
      if (isSongChange) {
        songsPlayedRef.current += 1;
      }

      // Khách tạm dừng riêng: KHÔNG tự động phát lại nếu đó chỉ là gói tin sync định kỳ từ host
      // Chỉ khi host thực sự nhấn Play (userInitiated=true) hoặc đổi bài mới thì mới cho phép đồng bộ play
      const shouldIgnorePlay = action === 'play' &&
                               !isHostRef.current &&
                               localPausedRef.current &&
                               !userInitiated &&
                               !isSongChange;

      if (shouldIgnorePlay) {
        console.log('[SOCKET] Ignoring periodic host sync play event because user is locally paused');
        return;
      }

      setCurrentVideo(videoState);

      // Cập nhật trạng thái "Host đã dừng"
      const hostPaused = !!videoState.pausedByHost;
      isHostPausedRef.current = hostPaused;
      setIsHostPaused(hostPaused);

      // HOST: sync hostWantsToPlayRef theo action (cho phép auto-play của bài mới)
      // Nếu là host VÀ nhận action play (vd server auto-play bài đầu) → cho phép emit play sau này
      if (isHostRef.current) {
        hostWantsToPlayRef.current = (action === 'play');
      }

      // Nếu host phát lại → reset local pause, ẩn toast
      if (action === 'play') {
        localPausedRef.current = false;
        setLocalPaused(false);
        setShowHostPausedToast(false);
      }
      // Nếu host dừng → show toast cho non-host
      if (action === 'pause' && !isHostRef.current) {
        setShowHostPausedToast(true);
      }

      if (!playerRef.current) return;

      if (videoId && playerRef.current.getVideoData?.().video_id !== videoId) {
        playerRef.current.loadVideoById(videoId, time || 0);
      }

      if (action === 'play') {
        // Seek trước để đảm bảo guest sync đúng vị trí với host
        // Ngưỡng > 1s (thay vì > 2s cũ) để catch drift nhỏ hơn
        if (time !== undefined && Math.abs(playerRef.current.getCurrentTime() - time) > 1) {
          playerRef.current.seekTo(time, true);
        }
        playerRef.current.playVideo();
      } else if (action === 'pause') {
        playerRef.current.pauseVideo();
        // KHÔNG seek khi pause - seekTo trên video đã pause vẫn có thể trigger buffer → auto-play
        // Khi host play lại sẽ tự sync time
      }
    });

    socket.on('pomodoro-sync', (pState: PomodoroState) => {
      setPomodoro(pState);
    });

    socket.on('idea-board-sync', (tasks: IdeaTask[]) => {
      const nextTasks = tasks || [];
      setIdeaTasks(nextTasks);
      const rid = roomIdRef.current;
      if (rid) saveRoomTasks(rid, nextTasks);
    });

    socket.on('pomodoro-done', ({ isBreak }) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
      audio.play().catch(() => {});
      alert(isBreak ? "Đã hết giờ học! Đến giờ nghỉ giải lao 5 phút rồi." : "Hết giờ giải lao! Bắt đầu tập trung học tiếp nào.");
    });

    // Đồng bộ chuyển trang PDF qua Socket (sử dụng sự kiện video-action tạm thời cho đơn giản)
    socket.on('pdf-page-sync', (page: number) => {
      setPdfPage(page);
    });

    // Nhận danh sách phòng hoạt động
    socket.on('active-rooms-list', (rooms: any[]) => {
      setActiveRooms(rooms);
    });

    // TikTok sync (Phase B)
    socket.on('tiktok-sync', ({ videoId }: { videoId: string }) => {
      setTiktokVideoId(videoId);
    });

    // Nhận danh sách user online để xem bạn bè có online không
    socket.on('online-users-changed', (users: any[]) => {
      setOnlineUsers(users);
    });

    socket.on('join-room-error', (errorMessage: string) => {
      alert(errorMessage);
      setView('landing');
    });

    // Đăng ký thông tin của bản thân và yêu cầu danh sách phòng ban đầu
    const localUsername = localStorage.getItem('duhocmate_username') || '';
    const localFriendCode = localStorage.getItem('duhocmate_friend_code') || '';
    socket.emit('register-user', { friendCode: localFriendCode, username: localUsername });
    socket.emit('request-active-rooms');

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync username từ Supabase profile khi login
  useEffect(() => {
    if (profile?.username && profile.username !== username) {
      setUsername(profile.username);
      localStorage.setItem('duhocmate_username', profile.username);
    }
  }, [profile]);

  useEffect(() => {
    if (view !== 'room' || !roomId) return;
    loadRoomTasks(roomId).then(tasks => {
      if (tasks.length > 0) {
        setIdeaTasks(tasks);
        socket?.emit('idea-board-update', { roomId, tasks });
      }
    });
  }, [view, roomId]);

  // Theo dõi cập nhật tên / mã bạn bè lên server
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem('duhocmate_username', username);
      if (socket && socket.connected) {
        socket.emit('register-user', { friendCode, username });
      }
    }
  }, [username, friendCode]);

  // === YouTube IFrame API – Khá�  // Init or update player when currentVideo.id becomes available
  useEffect(() => {
    if (view !== 'room') return;
    void playerReinitTrigger;

    if (!currentVideo.id) {
      // Nếu không có video ID, hủy player nếu có
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      return;
    }

    const initPlayer = () => {
      if (!iframeContainerRef.current) return;

      // Reset container
      iframeContainerRef.current.innerHTML = '<div id="yt-player-iframe"></div>';

      playerRef.current = new (window as any).YT.Player('yt-player-iframe', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setVideoError(false);
            const title = event.target.getVideoData?.()?.title;
            if (title) setPlayerVideoTitle(title);
            const duration = event.target.getDuration?.();
            if (typeof duration === 'number' && duration > 0) setVideoDuration(duration);
            // Áp dụng volume đã lưu khi player init mới
            event.target.setVolume?.(playerVolume);
            // Nếu join phòng khi host đã pause sẵn → stop + mute + ẩn iframe ngay
            if (isHostPausedRef.current && !isHostRef.current) {
              event.target.mute();
              event.target.stopVideo();
              if (iframeContainerRef.current) {
                iframeContainerRef.current.style.visibility = 'hidden';
              }
              return;
            }
            if (currentVideoRef.current.playing) {
              event.target.playVideo();
            }
            if (currentVideoRef.current.time) {
              event.target.seekTo(currentVideoRef.current.time, true);
            }
          },
          onError: (event: any) => {
            // 2 = video không hợp lệ/bị xóa/offline
            // 100, 101, 150 = video bị chặn embed/yêu cầu xác minh
            if ([2, 100, 101, 150].includes(event.data)) {
              setVideoError(true);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data; // 1=playing, 2=paused, 0=ended, 3=buffering, 5=cued, -1=unstarted
            const curTime = event.target.getCurrentTime();
            const title = event.target.getVideoData?.()?.title;
            if (title) setPlayerVideoTitle(title);
            const duration = event.target.getDuration?.();
            if (typeof duration === 'number' && duration > 0) setVideoDuration(duration);
            const cvr = currentVideoRef.current;
            setVideoError(false);

            // DEBUG: log mọi state change để debug
            console.log('[YT-STATE]', {
              state,
              isHost: isHostRef.current,
              isHostPaused: isHostPausedRef.current,
              hostWantsToPlay: hostWantsToPlayRef.current,
              cvrPlaying: cvr.playing
            });

            // Non-host: chỉ cập nhật local state, KHÔNG emit socket
            if (!isHostRef.current) {
              // state=1 (playing) hoặc state=3 (buffering) khi host đã pause → PAUSE ngay lập tức
              // Dùng pauseVideo() thay vì stopVideo() để giữ nguyên vị trí video
              // → khi host resume, guest play ngay từ đúng vị trí, không cần tạo lại player
              if (isHostPausedRef.current && (state === 1 || state === 3)) {
                console.log('[YT-STATE] NON-HOST blocked - pauseVideo (host paused)');
                event.target.pauseVideo();
                return;
              }
              if (state === 2) {
                localPausedRef.current = true;
                setLocalPaused(true);
              } else if (state === 1) {
                localPausedRef.current = false;
                setLocalPaused(false);
              }
              return;
            }

            // Chỉ host mới đồng bộ video cho cả phòng
            // Differentiate 2 cases of state=1 sau khi pause:
            // - Spurious từ YouTube (sau buffer/seek/ad) thường < 2s sau pause → CHẶN
            // - User explicitly click YouTube native play → ALLOW (sincePause > 2s)
            if (state === 1) {
              advancingPlaylistRef.current = false;
            }

            if (state === 0 && !advancingPlaylistRef.current) {
              const nextItem = getNextPlaylistItem(playlistRef.current);
              if (nextItem) {
                advancingPlaylistRef.current = true;
                hostWantsToPlayRef.current = true;
                hostLastPauseAtRef.current = 0;
                const nextVideoState = { id: nextItem.videoId, time: 0, playing: true };
                setVideoError(false);
                setCurrentVideo(nextVideoState);
                event.target.loadVideoById?.(nextItem.videoId, 0);
                socket.emit('video-action', {
                  roomId: roomIdRef.current,
                  action: 'play',
                  time: 0,
                  videoId: nextItem.videoId,
                  userInitiated: true,
                });
                socket.emit('remove-song', { roomId: roomIdRef.current, songId: nextItem.id });
              }
              return;
            }

            if (state === 1 && !cvr.playing) {
              const sincePause = Date.now() - (hostLastPauseAtRef.current || 0);
              // Chặn spurious state=1 nếu trong vòng 2s sau pause VÀ flag không bật
              if (!hostWantsToPlayRef.current && sincePause < 2000) {
                console.log(`[YT-STATE] HOST blocked spurious state=1 (sincePause=${sincePause}ms)`);
                event.target.pauseVideo();
                return;
              }
              console.log('[YT-STATE] HOST emit PLAY (userInitiated)');
              // OPTIMISTIC: update local state ngay → cvr.playing = true → interval emit play đúng
              hostWantsToPlayRef.current = true;
              hostLastPauseAtRef.current = 0;
              setCurrentVideo(prev => ({ ...prev, playing: true, time: curTime }));
              socket.emit('video-action', { roomId: roomIdRef.current, action: 'play', time: curTime, userInitiated: true });
            } else if (state === 2 && cvr.playing) {
              console.log('[YT-STATE] HOST emit PAUSE');
              hostWantsToPlayRef.current = false;
              hostLastPauseAtRef.current = Date.now(); // Track thời điểm pause để chặn spurious play < 2s
              // OPTIMISTIC: update local state ngay → cvr.playing = false → interval KHÔNG emit play nữa
              // Đây là FIX chính: nếu không update, interval mỗi 5s sẽ emit play với cvr.playing=true cũ
              // → server unset pausedByHost → non-host tự phát lại
              setCurrentVideo(prev => ({ ...prev, playing: false, time: curTime }));
              socket.emit('video-action', { roomId: roomIdRef.current, action: 'pause', time: curTime, userInitiated: true });
            }
          }
        }
      });
    };

    if (!playerRef.current) {
      if (!(window as any).YT || !(window as any).YT.Player) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        (window as any).onYouTubeIframeAPIReady = initPlayer;
      } else {
        setTimeout(initPlayer, 100);
      }
    } else {
      if (playerRef.current.loadVideoById) {
        setPlayerVideoTitle('');
        setVideoDuration(0);
        playerRef.current.loadVideoById(currentVideo.id, currentVideo.time || 0);
        setTimeout(() => {
          const title = playerRef.current?.getVideoData?.()?.title;
          if (title) setPlayerVideoTitle(title);
          const duration = playerRef.current?.getDuration?.();
          if (typeof duration === 'number' && duration > 0) setVideoDuration(duration);
        }, 700);
      }
    }

    // Interval đồng bộ thời gian (chỉ host gửi, CHỈ khi đang play)
    // Không emit khi host đang pause - tránh non-host bị seek + auto-play loop
    const interval = setInterval(() => {
      if (
        isHostRef.current &&
        playerRef.current?.getCurrentTime &&
        currentVideoRef.current.playing
      ) {
        const time = playerRef.current.getCurrentTime();
        socket.emit('video-action', {
          roomId: roomIdRef.current,
          action: 'play',
          time
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [view, currentVideo.id, playerReinitTrigger]);

  // Hủy player khi rời phòng (view khác 'room')
  useEffect(() => {
    if (view !== 'room') {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    }
  }, [view]);

  // Load video mới khi currentVideo.id thay đổi (nhưng player đã tồn tại)
  useEffect(() => {
    if (!playerRef.current) return;
    if (!currentVideo.id) return;

    if (playerRef.current.loadVideoById) {
      setPlayerVideoTitle('');
      setVideoDuration(0);
      playerRef.current.loadVideoById(currentVideo.id, currentVideo.time || 0);
      setTimeout(() => {
        const title = playerRef.current?.getVideoData?.()?.title;
        if (title) setPlayerVideoTitle(title);
        const duration = playerRef.current?.getDuration?.();
        if (typeof duration === 'number' && duration > 0) setVideoDuration(duration);
      }, 700);
      // Nếu host đang pause toàn phòng và ta là non-host → pause ngay sau khi load
      if (isHostPausedRef.current && !isHostRef.current) {
        setTimeout(() => playerRef.current?.pauseVideo?.(), 300);
      }
    }
  }, [currentVideo.id]);

  // ENFORCE: khi host pause → chỉ PAUSE player guest (giữ player sống để resume nhanh)
  // Khi host resume → video-sync handler đã gọi playVideo() trực tiếp → không cần reinit
  // FIX: không destroy player nữa vì reinit mất 2-3s → guest phát chậm 2s so với host
  useEffect(() => {
    if (isHost) return; // Host không bị ảnh hưởng

    if (isHostPaused) {
      console.log('[ENFORCE] Host paused - pause guest player (keep alive for quick resume)');
      // Chỉ pause, không destroy → giữ nguyên vị trí video, player sẵn sàng resume ngay
      if (playerRef.current?.pauseVideo) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.error('[ENFORCE] pauseVideo error', e);
        }
      }
      // onStateChange guard sẽ chặn mọi spurious state=1 trong khi isHostPaused=true
    }
    // Khi host resume (isHostPaused = false):
    // → video-sync handler nhận action='play' → gọi playerRef.current.playVideo() ngay lập tức
    // → player đã sẵn sàng, không cần tạo lại → KHÔNG có độ trễ 2s nữa
  }, [isHostPaused, isHost]);

  // Toggle only the study-table presence state. A polished call layer can be
  // added later without leaking the default Jitsi prejoin UI into the room.
  const toggleJitsi = () => {
    setJitsiActive(prev => !prev);
  };

  // 2. Chức năng Phòng (Tạo/Tham Gia)
  const handleCreateRoom = (
    seedTasks: IdeaTask[] = [],
    roomTitle?: string,
    isPrivate?: boolean,
    password?: string,
    avatarUrl?: string
  ) => {
    if (!username.trim()) return alert("Vui lòng nhập tên của bạn trước!");
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nextRoomTitle = roomTitle || `Phòng của ${username}`;
    setRoomId(generatedId);
    setCurrentRoomTitle(nextRoomTitle);
    setRoomSettingsName(nextRoomTitle);
    setRoomSettingsPublic(!isPrivate);
    setRoomSettingsPassword(password || '');
    setIdeaTasks(seedTasks);
    
    // Lưu vào phòng gần đây
    const newRecent = [
      { 
        id: generatedId, 
        hostName: username, 
        currentSong: 'Phòng mới tạo',
        roomTitle: roomTitle || `Phòng của ${username}`,
        isPrivate: !!isPrivate,
        hostAvatarUrl: avatarUrl || profile?.avatar_url || ''
      },
      ...recentRooms.filter(r => r.id !== generatedId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));

    // Lưu mật khẩu phòng cục bộ để không cần nhập lại khi vào lại
    if (isPrivate && password) {
      try {
        const roomPasswordsRaw = localStorage.getItem('duhocmate_room_passwords');
        const roomPasswords = roomPasswordsRaw ? JSON.parse(roomPasswordsRaw) : {};
        roomPasswords[generatedId] = password;
        localStorage.setItem('duhocmate_room_passwords', JSON.stringify(roomPasswords));
      } catch (err) {
        console.error(err);
      }
    }

    // Lưu thông tin phòng persistent
    savePersistentRoom({
      id: generatedId,
      title: roomTitle || `Phòng của ${username}`,
      hostName: username,
      hostAvatarUrl: avatarUrl || profile?.avatar_url || '',
      isPrivate: !!isPrivate,
      password: password || '',
      userId: user?.id
    }).catch(err => console.error("Error saving persistent room:", err));

    if (seedTasks.length) saveRoomTasks(generatedId, seedTasks);
    socket.emit('join-room', { 
      roomId: generatedId, 
      username, 
      ideaTasks: seedTasks,
      roomTitle: roomTitle || `Phòng của ${username}`,
      isPrivate: !!isPrivate,
      password: password || '',
      hostAvatarUrl: avatarUrl || profile?.avatar_url || '',
      friendCode
    });
    setView('room');
  };

  const handleJoinRoom = async (
    e?: React.FormEvent | string,
    enteredPassword?: string,
    isGuestConfirmed?: boolean,
    guestUsername?: string
  ) => {
    let targetRoomId = roomId;
    if (typeof e === 'string') {
      targetRoomId = e;
    } else if (e) {
      e.preventDefault();
    }

    if (!targetRoomId.trim()) return alert("Vui lòng nhập mã phòng!");
    
    const formattedId = targetRoomId.trim().toUpperCase();
    setRoomId(formattedId);

    // Nếu chưa đăng nhập, bắt buộc hiện popup nhập tên khách / đăng nhập Google
    if (!user && !isGuestConfirmed) {
      setGuestJoinRoomId(formattedId);
      setGuestJoinTemplate(null);
      setGuestNameInput(username || '');
      setShowGuestJoinModal(true);
      return;
    }
    setRoomId(formattedId);

    // Lấy thông tin phòng hiện tại nếu nó đang active để lưu thông tin chính xác
    const matchedActive = activeRooms.find(r => r.id === formattedId);
    let isPrivate = matchedActive?.isPrivate || false;
    let storedRoomRecord: PersistentRoom | null = null;

    try {
      const storedRoom = await findPersistentRoom(formattedId);
      if (storedRoom) {
        isPrivate = storedRoom.isPrivate;
        storedRoomRecord = storedRoom;
      }
    } catch {
      // Fallback
    }

    // Kiểm tra phòng có tồn tại hay không
    const isTemplateRoom = seedRoomIds.has(formattedId) || templates.some(t => getTemplateRoomId(t) === formattedId);
    if (!matchedActive && !storedRoomRecord && !isTemplateRoom) {
      alert("Phòng không tồn tại hoặc mã phòng không chính xác!");
      return;
    }

    if (isPrivate && !enteredPassword) {
      // Xác định xem user hiện tại có phải là chủ phòng (host) của phòng này không
      let isHostOfRoom = false;
      let savedPassword = '';
      try {
        const roomPasswordsRaw = localStorage.getItem('duhocmate_room_passwords');
        const roomPasswords = roomPasswordsRaw ? JSON.parse(roomPasswordsRaw) : {};
        if (roomPasswords[formattedId] !== undefined) {
          isHostOfRoom = true;
          savedPassword = roomPasswords[formattedId];
        }
      } catch {}

      if (user && storedRoomRecord?.hostUserId === user.id) {
        isHostOfRoom = true;
      }

      if (isHostOfRoom && savedPassword) {
        // Đã có mật khẩu lưu cục bộ của chủ phòng, tự động dùng nó
        enteredPassword = savedPassword;
      } else {
        setPasswordModalRoomId(formattedId);
        setEnteredRoomPassword('');
        setPasswordModalError('');
        setShowPasswordModal(true);
        return;
      }
    }

    if (isPrivate && enteredPassword) {
      // Xác định xem user hiện tại có phải là chủ phòng (host) của phòng này không
      let isHostOfRoom = false;
      try {
        const roomPasswordsRaw = localStorage.getItem('duhocmate_room_passwords');
        const roomPasswords = roomPasswordsRaw ? JSON.parse(roomPasswordsRaw) : {};
        if (roomPasswords[formattedId] !== undefined) {
          isHostOfRoom = true;
        }
      } catch {}

      if (user && storedRoomRecord?.hostUserId === user.id) {
        isHostOfRoom = true;
      }

      if (storedRoomRecord && storedRoomRecord.passwordHash) {
        const enteredHash = await hashRoomPassword(enteredPassword);
        if (enteredHash !== storedRoomRecord.passwordHash) {
          // Bỏ qua kiểm tra mật khẩu nếu đúng là chủ phòng đã xác minh bằng hostUserId/local
          if (!isHostOfRoom) {
            setPasswordModalError('Mật khẩu không chính xác!');
            return;
          }
        } else {
          // Đúng mật khẩu, lưu lại vào local storage để lần sau không cần nhập lại
          try {
            const roomPasswordsRaw = localStorage.getItem('duhocmate_room_passwords');
            const roomPasswords = roomPasswordsRaw ? JSON.parse(roomPasswordsRaw) : {};
            roomPasswords[formattedId] = enteredPassword;
            localStorage.setItem('duhocmate_room_passwords', JSON.stringify(roomPasswords));
          } catch (err) {
            console.error(err);
          }
        }
      }
    }

    // Lưu vào phòng gần đây
    const newRecent = [
      { 
        id: formattedId, 
        hostName: matchedActive?.hostName || storedRoomRecord?.hostName || 'Bạn học', 
        currentSong: 'Phòng học tập',
        roomTitle: matchedActive?.roomTitle || storedRoomRecord?.title || 'Phòng học tập',
        isPrivate: isPrivate,
        hostAvatarUrl: matchedActive?.hostAvatarUrl || storedRoomRecord?.hostAvatarUrl || ''
      },
      ...recentRooms.filter(r => r.id !== formattedId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));
    const joinedRoomTitle = matchedActive?.roomTitle || storedRoomRecord?.title || 'Phòng học tập';
    setCurrentRoomTitle(joinedRoomTitle);
    setRoomSettingsName(joinedRoomTitle);
    setRoomSettingsPublic(!isPrivate);
    setRoomSettingsPassword(enteredPassword || '');

    socket.emit('join-room', { 
      roomId: formattedId, 
      username: guestUsername || username,
      password: enteredPassword || '',
      friendCode
    });
    setShowPasswordModal(false);
    setView('room');
  };

  const handlePasswordModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredRoomPassword.trim()) {
      setPasswordModalError('Vui lòng nhập mật khẩu!');
      return;
    }
    handleJoinRoom(passwordModalRoomId, enteredRoomPassword);
  };

  const handleJoinTemplateRoom = async (
    template: RoomTemplate,
    isGuestConfirmed?: boolean,
    guestUsername?: string
  ) => {
    const fixedRoomId = getTemplateRoomId(template);

    // Nếu chưa đăng nhập, bắt buộc hiện popup nhập tên khách / đăng nhập Google
    if (!user && !isGuestConfirmed) {
      setGuestJoinRoomId(fixedRoomId);
      setGuestJoinTemplate(template);
      setGuestNameInput(username || '');
      setShowGuestJoinModal(true);
      return;
    }
    const storedTasks = await loadRoomTasks(fixedRoomId);
    const seedTasks = storedTasks.length ? storedTasks : cloneTasks(template.tasks);

    if (!storedTasks.length) {
      await saveRoomTasks(fixedRoomId, seedTasks);
    }

    setRoomId(fixedRoomId);
    setCurrentRoomTitle(template.title);
    setRoomSettingsName(template.title);
    setRoomSettingsPublic(true);
    setRoomSettingsPassword('');
    setIdeaTasks(seedTasks);
    setStageMode('ideas');

    const newRecent = [
      { id: fixedRoomId, hostName: template.title, currentSong: 'Phòng mở 24/24' },
      ...recentRooms.filter(r => r.id !== fixedRoomId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));

    socket.emit('join-room', { roomId: fixedRoomId, username: guestUsername || username, ideaTasks: seedTasks, friendCode, roomTitle: template.title });
    setView('room');
  };

  const handleGuestJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameInput.trim()) {
      alert("Vui lòng nhập tên hiển thị của bạn!");
      return;
    }
    const cleanName = guestNameInput.trim();
    setUsername(cleanName);
    localStorage.setItem('duhocmate_username', cleanName);
    setShowGuestJoinModal(false);

    if (guestJoinTemplate) {
      handleJoinTemplateRoom(guestJoinTemplate, true, cleanName);
    } else {
      handleJoinRoom(guestJoinRoomId, undefined, true, cleanName);
    }
  };

  const handleIdeaTasksChange = (tasks: IdeaTask[]) => {
    setIdeaTasks(tasks);
    if (roomId) {
      saveRoomTasks(roomId, tasks);
      socket?.emit('idea-board-update', { roomId, tasks });
    }
  };

  const handleSaveTemplate = async (template: Omit<RoomTemplate, 'id' | 'createdAt' | 'uses'>) => {
    const saved = await saveTemplate(template);
    setTemplates(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const code = friendInputCode.trim().toUpperCase();
    if (!code) return;
    if (code === friendCode) return alert("Bạn không thể kết bạn với chính mình!");
    if (friendsList.includes(code)) return alert("Mã bạn bè này đã có trong danh sách!");
    
    const newList = [...friendsList, code];
    setFriendsList(newList);
    localStorage.setItem('duhocmate_friends', JSON.stringify(newList));
    setFriendInputCode('');
  };

  // TikTok: extract video ID from URL and sync to room
  const handleTikTokLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const url = tiktokUrl.trim();
    if (!url) return;

    // Extract TikTok video ID from URL patterns:
    // https://www.tiktok.com/@user/video/1234567890
    // https://vm.tiktok.com/XXXXXX/
    const longMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
    const shortMatch = url.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/);

    let videoId = '';
    if (longMatch) {
      videoId = longMatch[1];
    } else if (shortMatch) {
      // Short URL – we just use the slug, not ideal but workable
      videoId = shortMatch[1];
    } else if (/^\d{15,20}$/.test(url)) {
      // Already a raw video ID
      videoId = url;
    }

    if (!videoId) {
      alert('Link TikTok không hợp lệ. Vui lòng dán link đầy đủ từ TikTok.');
      return;
    }

    setTiktokVideoId(videoId);
    // Sync to room so others see it too
    socket.emit('tiktok-sync', { roomId, videoId });
  };

  const [friendCodeCopied, setFriendCodeCopied] = useState(false);
  const copyFriendCode = () => {
    navigator.clipboard.writeText(friendCode);
    setFriendCodeCopied(true);
    setTimeout(() => setFriendCodeCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    const minutes = Math.max(0, Math.floor((Date.now() - joinTimeRef.current) / 60000));
    setSessionStats({ minutes, songs: songsPlayedRef.current, messages: messagesSentRef.current });
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = () => {
    window.location.reload();
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomInvite = () => {
    const invite = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(invite);
    setShowInviteModal(true);
    setCustomAlert({ message: 'Đã sao chép link mời vào phòng.', show: true });
  };

  const toggleMiniPlayback = () => {
    const currentTime = playerRef.current?.getCurrentTime?.() || currentVideo.time || 0;
    if (isHostRef.current) {
      // Host: điều khiển toàn phòng qua socket
      if (currentVideo.playing) {
        hostWantsToPlayRef.current = false; // CHẶN mọi spurious state=1 sau pause
        hostLastPauseAtRef.current = Date.now();
        playerRef.current?.pauseVideo?.();
        socket.emit('video-action', { roomId, action: 'pause', time: currentTime, userInitiated: true });
        setCurrentVideo(prev => ({ ...prev, playing: false, time: currentTime }));
      } else {
        hostWantsToPlayRef.current = true; // CHO PHÉP state=1 emit play
        hostLastPauseAtRef.current = 0;
        playerRef.current?.playVideo?.();
        socket.emit('video-action', { roomId, action: 'play', time: currentTime, userInitiated: true });
        setCurrentVideo(prev => ({ ...prev, playing: true, time: currentTime }));
      }
    } else {
      // Non-host: chỉ điều khiển local
      if (!localPausedRef.current) {
        // Đang phát → tạm dừng riêng
        playerRef.current?.pauseVideo?.();
        localPausedRef.current = true;
        setLocalPaused(true);
      } else {
        // Đang tạm dừng → phát lại
        if (isHostPausedRef.current) {
          // Host đã dừng toàn phòng → không cho resume, show toast
          setShowHostPausedToast(true);
          return;
        }
        playerRef.current?.seekTo?.(currentVideo.time || 0, true);
        playerRef.current?.playVideo?.();
        localPausedRef.current = false;
        setLocalPaused(false);
      }
    }
  };

  const addFriendFromMember = (member: Member) => {
    if (!member.friendCode) {
      setCustomAlert({ message: 'Bạn học này chưa có mã bạn bè để kết bạn nhanh.', show: true });
      return;
    }
    if (member.friendCode === friendCode) {
      setCustomAlert({ message: 'Đây là bạn trong phòng hiện tại.', show: true });
      return;
    }
    if (friendsList.includes(member.friendCode)) {
      setCustomAlert({ message: `${member.username} đã có trong danh sách bạn bè.`, show: true });
      return;
    }
    const newList = [...friendsList, member.friendCode];
    setFriendsList(newList);
    localStorage.setItem('duhocmate_friends', JSON.stringify(newList));
    setCustomAlert({ message: `Đã thêm ${member.username} vào danh sách bạn bè.`, show: true });
  };

  const transferHost = (memberId?: string) => {
    if (!isHost) {
      setCustomAlert({ message: 'Chỉ host hiện tại mới có thể chuyển host.', show: true });
      return;
    }
    const target = memberId
      ? members.find(member => member.id === memberId)
      : members.find(member => member.id !== socket?.id);
    if (!target) {
      setCustomAlert({ message: 'Chưa có bạn học khác để chuyển host.', show: true });
      return;
    }
    socket.emit('transfer-host', { roomId, targetId: target.id });
  };

  const saveRoomSettings = () => {
    const nextName = roomSettingsName.trim() || currentRoomTitle || `Phòng ${roomId}`;
    setCurrentRoomTitle(nextName);
    socket.emit('room-settings-update', {
      roomId,
      roomTitle: nextName,
      isPrivate: !roomSettingsPublic,
      password: roomSettingsPassword,
    });
    savePersistentRoom({
      id: roomId,
      title: nextName,
      hostName: username || profile?.username || 'Bạn học',
      hostAvatarUrl: profile?.avatar_url || '',
      isPrivate: !roomSettingsPublic,
      password: roomSettingsPassword,
      userId: user?.id,
    }).catch(err => console.error('Error saving room settings:', err));
    setShowRoomSettings(false);
    setCustomAlert({ message: 'Đã lưu cài đặt phòng.', show: true });
  };

  const closeRoomPermanently = async () => {
    if (!isHost) {
      setCustomAlert({ message: 'Chỉ host mới được đóng phòng vĩnh viễn.', show: true });
      return;
    }
    const ok = window.confirm('Đóng phòng vĩnh viễn? Phòng sẽ bị xóa khỏi danh sách và người khác không vào lại bằng mã này được nữa.');
    if (!ok) return;
    socket.emit('close-room', { roomId });
    await deletePersistentRoom(roomId);
    const nextRecent = recentRooms.filter(room => room.id !== roomId);
    setRecentRooms(nextRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(nextRecent));
    setView('landing');
    setRoomId('');
    socket.emit('request-active-rooms');
  };

  // 3. Chức năng Chat
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('send-message', { roomId, message: chatInput });
    messagesSentRef.current += 1;
    setChatInput('');
  };

  // 4. Chức năng Playlist & Jukebox
  // Thêm bài qua link trực tiếp (URL hoặc ID)
  const handleAddSongDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songSearch.trim()) return;

    const input = songSearch.trim();
    let videoId = input;
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = input.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else if (input.length !== 11) {
      // Không phải link/ID → trigger search
      handleSearchMusic();
      return;
    }

    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      const title = data.title || `Video YouTube (${videoId})`;
      socket.emit('add-to-playlist', { roomId, videoId, title, duration: '04:30' });
    } catch {
      socket.emit('add-to-playlist', { roomId, videoId, title: `Bài hát (${videoId})`, duration: '05:00' });
    }
    setSongSearch('');
    setShowSearchResults(false);
  };

  // Tìm kiếm nhạc qua Invidious API (proxy server)
  const handleSearchMusic = async () => {
    if (!songSearch.trim()) return;
    setMusicSearchLoading(true);
    setMusicSearchError('');
    setMusicSearchResults([]);
    setShowSearchResults(true);
    
    try {
      const SEARCH_URL = `${getApiBaseCandidates()[0]}/api/search-music`;

      const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(songSearch.trim())}`);
      const data = await res.json();

      if (data.error && !data.results?.length) {
        setMusicSearchError(data.error);
      } else {
        setMusicSearchResults(data.results || []);
      }
    } catch {
      setMusicSearchError('Không thể kết nối server tìm kiếm. Hãy thử lại hoặc dán link YouTube trực tiếp.');
    } finally {
      setMusicSearchLoading(false);
    }
  };

  // Thêm bài từ kết quả tìm kiếm
  const addSongFromResult = (result: any) => {
    socket.emit('add-to-playlist', {
      roomId,
      videoId: result.videoId,
      title: result.title,
      duration: result.duration
    });
    setSongSearch('');
    setShowSearchResults(false);
    setMusicSearchResults([]);
    setSidebarTab('playlist');
  };

  const addSuggestedVideo = (suggestion: typeof trendingVideoSuggestions[number]) => {
    socket.emit('add-to-playlist', {
      roomId,
      videoId: suggestion.videoId,
      title: suggestion.title,
      duration: suggestion.duration
    });
    setShowSearchResults(false);
    setMusicSearchResults([]);
    setSidebarTab('playlist');
  };


  const voteSong = (songId: string) => {
    socket.emit('vote-song', { roomId, songId });
  };

  const playSong = (item: PlaylistItem) => {
    // Cập nhật state local ngay lập tức (không chờ server echo lại)
    const newVideoState = { id: item.videoId, time: 0, playing: true };
    setCurrentVideo(newVideoState);

    // Nếu player đã tồn tại → loadVideoById trực tiếp
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(item.videoId, 0);
    } else {
      // Player chưa sẵn sàng → destroy và re-init qua useEffect (trigger bởi currentVideo.id thay đổi)
      playerRef.current = null;
    }

    // Đồng bộ cho những người khác trong phòng
    socket.emit('video-action', { 
      roomId, 
      action: 'play', 
      time: 0, 
      videoId: item.videoId 
    });
    // Xóa bài đó ra khỏi hàng đợi
    socket.emit('remove-song', { roomId, songId: item.id });
  };

  // 5. Chức năng Pomodoro
  const controlPomodoro = (action: 'start' | 'pause' | 'reset', isBreak = false) => {
    socket.emit('pomodoro-control', { roomId, action, isBreak });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 6. PDF Rendering & Sync
  const loadPdfJs = () => {
    if ((window as any).pdfjsLib) return Promise.resolve();
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(null);
      };
      document.head.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await loadPdfJs();
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);
      const pdfjsLib = (window as any).pdfjsLib;
      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        pdfDocRef.current = pdf;
        setPdfTotalPages(pdf.numPages);
        setPdfPage(1);
        renderPdfPage(1);
      } catch (err) {
        alert("Lỗi đọc file PDF!");
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  const renderPdfPage = async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const scale = viewportHeight < 760 ? 0.9 : viewportWidth < 1440 ? 1.1 : 1.35;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
    } catch (err) {
      console.error("PDF page render error:", err);
    }
  };

  useEffect(() => {
    if (stageMode === 'pdf' && pdfDocRef.current) {
      renderPdfPage(pdfPage);
    }
  }, [pdfPage, stageMode]);

  useEffect(() => {
    if (stageMode !== 'pdf') return;
    const handleResize = () => {
      if (pdfDocRef.current) renderPdfPage(pdfPage);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfPage, stageMode]);

  useEffect(() => {
    if (sidebarTab === 'chat') {
      setTimeout(scrollToBottom, 50);
    }
  }, [chatMessages, sidebarTab]);

  const changePdfPage = (dir: 'next' | 'prev') => {
    let newPage = pdfPage;
    if (dir === 'next' && pdfPage < pdfTotalPages) {
      newPage += 1;
    } else if (dir === 'prev' && pdfPage > 1) {
      newPage -= 1;
    }

    if (newPage !== pdfPage) {
      setPdfPage(newPage);
      // Đồng bộ trang sang các client khác qua Socket
      socket.emit('pdf-page-sync', { roomId, page: newPage });
    }
  };

  // Tìm kiếm trạng thái online của bạn bè
  const friendsWithStatus = friendsList.map(code => {
    const onlineUser = onlineUsers.find(u => u.friendCode === code);
    return {
      code,
      username: onlineUser?.username || 'Bạn học',
      online: !!onlineUser,
      currentRoomId: onlineUser?.currentRoomId || null,
      currentSong: onlineUser?.currentSong || null
    };
  });

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-100 text-red-700 border-red-200', 
      'bg-amber-100 text-amber-700 border-amber-200', 
      'bg-emerald-100 text-emerald-700 border-emerald-200', 
      'bg-blue-100 text-blue-700 border-blue-200', 
      'bg-purple-100 text-purple-700 border-purple-200', 
      'bg-pink-100 text-pink-700 border-pink-200'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const roomThemeOptions = [
    { key: 'cream', label: 'Cream', icon: 'C' },
    { key: 'midnight', label: 'Midnight', icon: 'M' },
    { key: 'sakura', label: 'Sakura', icon: 'S' },
    { key: 'ocean', label: 'Ocean', icon: 'O' },
    { key: 'forest', label: 'Forest', icon: 'F' },
    { key: 'sunset', label: 'Sunset', icon: 'SUN' },
    { key: 'neon', label: 'Neon', icon: 'N' },
    { key: 'arctic', label: 'Arctic', icon: 'A' },
  ] as const;

  const activeVideoTitle = playlist.find(item => item.videoId === currentVideo.id)?.title || playerVideoTitle || (currentVideo.id ? `Video YouTube (${currentVideo.id})` : 'Lo-Fi Girl Study Beat');

  // Fetch lyrics khi video thay đổi
  React.useEffect(() => {
    if (!activeVideoTitle || activeVideoTitle === 'Lo-Fi Girl Study Beat') {
      setLyrics('');
      setSyncedLyrics([]);
      setShowLyrics(false);
      return;
    }
    setLyricsLoading(true);
    setLyrics('');
    setSyncedLyrics([]);
    setShowLyrics(false);
    // Tách tên bài hát (bỏ phần "- Official MV", "(Official)", v.v.)
    const lyricQueries = getLyricsSearchCandidates(activeVideoTitle);
    Promise.all(
      lyricQueries.map((query: string) =>
        fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}&limit=8`)
          .then(res => res.json())
          .catch(() => [])
      )
    )
      .then((results) => results.flat())
      .then((data: any[]) => {
        const track = findBestLyricsTrack(Array.isArray(data) ? data : [], activeVideoTitle);
        const synced = parseSyncedLyrics(track?.syncedLyrics);
        const plain = track?.plainLyrics || synced.map((line: LyricLine) => line.text).join('\n');
        if (plain) {
          setLyrics(plain);
          setSyncedLyrics(synced);
          setShowLyrics(true);
        } else {
          setLyrics('');
          setSyncedLyrics([]);
        }
      })
      .catch(() => {
        setLyrics('');
        setSyncedLyrics([]);
      })
      .finally(() => setLyricsLoading(false));
  }, [activeVideoTitle]);

  React.useEffect(() => {
    if (!showLyrics || !lyrics) return;
    const updateTime = () => {
      const time = playerRef.current?.getCurrentTime?.();
      if (typeof time === 'number') setPlaybackTime(time);
      const duration = playerRef.current?.getDuration?.();
      if (typeof duration === 'number' && duration > 0) setVideoDuration(duration);
    };
    updateTime();
    const timer = window.setInterval(updateTime, 500);
    return () => window.clearInterval(timer);
  }, [showLyrics, lyrics, currentVideo.id]);

  React.useEffect(() => {
    if (!currentVideo.id) {
      setLyricsOffset(0);
      return;
    }
    const saved = Number(localStorage.getItem(`duhocmate_lyrics_offset_${currentVideo.id}`));
    setLyricsOffset(Number.isFinite(saved) ? saved : 0);
  }, [currentVideo.id]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (showYoutubeCaptions) {
        player.loadModule?.('captions');
        player.setOption?.('captions', 'track', {});
        player.setOption?.('captions', 'fontSize', 1);
      } else {
        player.unloadModule?.('captions');
      }
    } catch (error) {
      console.warn('[YouTube Captions] Unable to toggle captions:', error);
    }
  }, [showYoutubeCaptions, currentVideo.id, playerReinitTrigger]);

  const adjustLyricsOffset = (delta: number) => {
    setLyricsOffset((prev) => {
      const next = Math.max(-20, Math.min(30, Number((prev + delta).toFixed(1))));
      if (currentVideo.id) {
        localStorage.setItem(`duhocmate_lyrics_offset_${currentVideo.id}`, String(next));
      }
      return next;
    });
  };

  const syncLyricsToLine = (line: LyricLine) => {
    const playerTime = playerRef.current?.getCurrentTime?.();
    const currentTime = typeof playerTime === 'number' ? playerTime : playbackTime;
    const next = getOffsetForLyricAnchor({
      playbackTime: currentTime,
      lyricTime: line.time,
    });
    setPlaybackTime(currentTime);
    setLyricsOffset(next);
    if (currentVideo.id) {
      localStorage.setItem(`duhocmate_lyrics_offset_${currentVideo.id}`, String(next));
    }
  };

  const effectiveLyricTime = Math.max(0, playbackTime - lyricsOffset);
  const estimatedLyrics = syncedLyrics.length ? [] : createEstimatedLyrics(lyrics, videoDuration);
  const displayLyricLines = syncedLyrics.length ? syncedLyrics : estimatedLyrics;
  const activeLyricIndex = displayLyricLines.reduce((activeIndex: number, line: LyricLine, index: number) => (
    effectiveLyricTime + 0.15 >= line.time ? index : activeIndex
  ), -1);

  React.useEffect(() => {
    activeLyricRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeLyricIndex]);

  return (
    <div className="min-h-screen bg-brand-cream text-brand-brown-dark font-sans selection:bg-brand-accent selection:text-white flex flex-col items-center">
      
      {/* LANDING PAGE — LOBBY-FIRST DESIGN */}
      {view === 'landing' && (
        <LandingPage
          username={username}
          setUsername={setUsername}
          roomId={roomId}
          setRoomId={setRoomId}
          onlineUsersCount={onlineUsers.length}
          user={user}
          profile={profile}
          signOut={signOut}
          setAuthMode={setAuthMode}
          setShowAuthModal={setShowAuthModal}
          getAvatarColor={getAvatarColor}
          handleCreateRoom={handleCreateRoom}
          handleJoinRoom={handleJoinRoom}
          handleJoinTemplateRoom={handleJoinTemplateRoom}
          templates={templates}
          activeRooms={activeRooms}
          requestActiveRooms={() => socket.emit('request-active-rooms')}
          recentRooms={recentRooms}
          friendCode={friendCode}
          friendCodeCopied={friendCodeCopied}
          copyFriendCode={copyFriendCode}
          friendInputCode={friendInputCode}
          setFriendInputCode={setFriendInputCode}
          handleAddFriend={handleAddFriend}
          friendsWithStatus={friendsWithStatus}
          showHelpBoard={showHelpBoard}
          setShowHelpBoard={setShowHelpBoard}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      <CreateTemplateModal
        open={showCreateTemplate}
        tasks={ideaTasks}
        creatorName={profile?.username || username || 'Duhoc Mate'}
        onClose={() => setShowCreateTemplate(false)}
        onSave={handleSaveTemplate}
      />

      {/* Guest Join Modal – nhập tên trước khi vào phòng (không cần đăng nhập) */}
      {showGuestJoinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="font-display text-xl font-black text-brand-brown-dark">Vào phòng học</h2>
            <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
              Nhập tên hiển thị của bạn để tham gia phòng
            </p>
            <form onSubmit={handleGuestJoinSubmit} className="mt-5 flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Tên của bạn..."
                value={guestNameInput}
                onChange={e => setGuestNameInput(e.target.value)}
                maxLength={30}
                className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuestJoinModal(false)}
                  className="flex-1 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark"
                >
                  Vào phòng →
                </button>
              </div>
            </form>
            <p className="mt-4 text-center text-xs font-semibold text-brand-brown-light">
              Hoặc{' '}
              <button
                type="button"
                onClick={() => { setShowGuestJoinModal(false); setAuthMode('login'); setShowAuthModal(true); }}
                className="font-black text-brand-terracotta underline underline-offset-2"
              >
                đăng nhập
              </button>
              {' '}để lưu lịch sử phòng
            </p>
          </div>
        </div>
      )}

      {/* Custom Alert Toast */}
      {customAlert && customAlert.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] max-w-sm w-full bg-white rounded-2xl shadow-xl border border-brand-terracotta-light/20 p-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta">
              <Sparkles size={16} />
            </div>
            <div className="flex-grow">
              <p className="text-xs font-bold text-brand-brown-dark">{customAlert.message}</p>
            </div>
            <button
              onClick={() => setCustomAlert(null)}
              className="flex-shrink-0 text-brand-brown-light hover:text-brand-brown-dark text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Host Paused Toast */}
      {showHostPausedToast && !isHost && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] max-w-xs w-full bg-brand-brown-dark rounded-2xl shadow-xl p-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Pause size={15} />
            </div>
            <div className="flex-grow">
              <p className="text-xs font-bold text-white">⏸ Host đã tạm dừng video</p>
              <p className="text-[10px] text-white/60 mt-0.5">Chờ host phát lại để tiếp tục đồng bộ</p>
            </div>
            <button
              onClick={() => setShowHostPausedToast(false)}
              className="flex-shrink-0 text-white/50 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-black text-brand-brown-dark">Mời bạn bè</h2>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-full p-2 text-brand-brown-light transition hover:bg-brand-light"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 rounded-3xl border border-brand-terracotta-light/25 bg-brand-light/35 p-5 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${window.location.origin}?room=${roomId}`)}`}
                alt="QR mời vào phòng"
                className="mx-auto h-56 w-56 rounded-2xl bg-white p-3"
              />
            </div>
            <div className="mt-5 text-center">
              <p className="text-xs font-bold text-brand-brown-light">Mã phòng</p>
              <p className="mt-2 font-mono text-3xl font-black tracking-[0.28em] text-brand-brown-dark">{roomId}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}?room=${roomId}`);
                  setCustomAlert({ message: 'Đã sao chép link mời vào phòng.', show: true });
                }}
                className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => navigator.share?.({ title: 'Duhoc Mate', text: `Vào phòng ${roomId}`, url: `${window.location.origin}?room=${roomId}` })}
                className="rounded-2xl border border-brand-terracotta-light/25 bg-white px-4 text-brand-brown-dark transition hover:bg-brand-light"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Room Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-display text-xl font-black text-brand-brown-dark">Nhập mật khẩu phòng</h2>
            <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
              Phòng này đã được thiết lập riêng tư. Vui lòng nhập mật khẩu để tham gia.
            </p>
            <form onSubmit={handlePasswordModalSubmit} className="mt-5 flex flex-col gap-3">
              <input
                autoFocus
                type="password"
                placeholder="Mật khẩu..."
                value={enteredRoomPassword}
                onChange={e => {
                  setEnteredRoomPassword(e.target.value);
                  setPasswordModalError('');
                }}
                className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
              />
              {passwordModalError && (
                <p className="text-xs font-bold text-brand-terracotta">{passwordModalError}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark"
                >
                  Tham gia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-display text-xl font-black text-brand-brown-dark">Chọn giao diện phòng</h2>
            <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
              Lựa chọn tông màu sắc phù hợp với không gian học của bạn.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {roomThemeOptions.map((theme) => {
                const isSelected = roomTheme === theme.key;
                return (
                  <button
                    key={theme.key}
                    type="button"
                    onClick={() => {
                      setRoomTheme(theme.key);
                      setShowThemeModal(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition text-left cursor-pointer ${
                      isSelected
                        ? 'border-brand-terracotta bg-brand-light text-brand-brown-dark font-black'
                        : 'border-black/[0.06] hover:border-brand-terracotta-light/40 text-brand-brown-light font-bold bg-white'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-brand-terracotta-light/30 flex items-center justify-center font-display font-extrabold text-xs text-brand-terracotta uppercase">
                      {theme.icon}
                    </span>
                    <span className="text-sm">{theme.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowThemeModal(false)}
              className="w-full mt-6 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-display text-xl font-black text-brand-brown-dark">Cài đặt phòng học</h2>
            <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
              Điều chỉnh thông tin phòng học của bạn.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); saveRoomSettings(); }} className="mt-5 flex flex-col gap-4">
              {!isHost && (
                <div className="p-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-2xl mb-2 border border-amber-200">
                  Chỉ có chủ phòng mới có quyền thay đổi các cài đặt này.
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-brand-brown-light uppercase block mb-1">Tên phòng</label>
                <input
                  type="text"
                  placeholder="Tên phòng..."
                  disabled={!isHost}
                  value={roomSettingsName}
                  onChange={e => setRoomSettingsName(e.target.value)}
                  className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-brown-light uppercase block mb-1">Hình nền phòng (URL)</label>
                <input
                  type="text"
                  placeholder="URL ảnh nền (jpeg, png, webp)..."
                  disabled={!isHost}
                  value={roomBackgroundUrl}
                  onChange={e => setRoomBackgroundUrl(e.target.value)}
                  className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-light/60 border border-brand-terracotta-light/10">
                <div>
                  <p className="text-sm font-bold text-brand-brown-dark">Phòng công khai</p>
                  <p className="text-xs text-brand-brown-light font-medium">Bất kỳ ai cũng có thể thấy và vào phòng</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomSettingsPublic}
                  onChange={e => setRoomSettingsPublic(e.target.checked)}
                  className="h-5 w-5 rounded border-black/[0.1] text-brand-terracotta focus:ring-brand-terracotta disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {!roomSettingsPublic && (
                <div>
                  <label className="text-xs font-bold text-brand-brown-light uppercase block mb-1">Mật khẩu phòng</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu..."
                    disabled={!isHost}
                    value={roomSettingsPassword}
                    onChange={e => setRoomSettingsPassword(e.target.value)}
                    className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomSettings(false)}
                    className="flex-1 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light"
                  >
                    Đóng
                  </button>
                  {isHost && (
                    <button
                      type="submit"
                      className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark"
                    >
                      Lưu cấu hình
                    </button>
                  )}
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomSettings(false);
                      closeRoomPermanently();
                    }}
                    className="w-full rounded-2xl border-2 border-red-200 hover:bg-red-50 py-3 text-sm font-black text-red-600 transition"
                  >
                    Đóng phòng vĩnh viễn
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM WORKSPACE */}
      {/* ── Popup tổng kết phiên học khi rời phòng ── */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-brand-terracotta to-brand-brown-dark px-6 pt-8 pb-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white" />
              </div>
              <div className="relative">
                <div className="text-5xl mb-3">🎧</div>
                <h2 className="font-display font-black text-white text-xl">Tổng kết phiên học</h2>
                <p className="text-white/70 text-sm mt-1">{username || 'Bạn học'}</p>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-brand-terracotta-light/20 -mt-5 mx-6 bg-white rounded-2xl shadow-lg shadow-brand-brown-dark/10 border border-brand-terracotta-light/20">
              <div className="flex flex-col items-center py-4 px-2">
                <span className="font-display font-black text-2xl text-brand-terracotta">{sessionStats.minutes}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown-light mt-0.5">Phút</span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="font-display font-black text-2xl text-brand-terracotta">{sessionStats.songs}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown-light mt-0.5">Bài</span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="font-display font-black text-2xl text-brand-terracotta">{sessionStats.messages}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown-light mt-0.5">Tin nhắn</span>
              </div>
            </div>
            {/* Motivational message */}
            <p className="text-center text-brand-brown-light text-sm px-6 mt-5">
              {sessionStats.minutes >= 60
                ? '🔥 Tuyệt vời! Một phiên học siêu tập trung!'
                : sessionStats.minutes >= 25
                ? '⭐ Giỏi lắm! Tiếp tục duy trì nhé!'
                : '💪 Khởi đầu tốt! Cố lên nhé!'}
            </p>
            {/* Buttons */}
            <div className="flex gap-3 p-6 pt-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-brand-terracotta-light/30 font-bold text-brand-brown-dark hover:bg-brand-light transition text-sm"
              >
                Ở lại
              </button>
              <button
                onClick={confirmLeaveRoom}
                className="flex-1 px-4 py-3 rounded-2xl bg-brand-terracotta hover:bg-brand-brown-dark text-white font-bold text-sm transition"
              >
                Rời phòng
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'room' && (
        <div className={`w-full flex-1 flex flex-col ${
          roomTheme === 'midnight' ? 'bg-slate-950 text-white' :
          roomTheme === 'sakura' ? 'bg-pink-50' :
          roomTheme === 'ocean' ? 'bg-cyan-50' :
          roomTheme === 'forest' ? 'bg-emerald-50' :
          roomTheme === 'sunset' ? 'bg-orange-50' :
          roomTheme === 'neon' ? 'bg-violet-950 text-white' :
          roomTheme === 'arctic' ? 'bg-sky-50' :
          ''
        }`} style={roomBackgroundUrl ? { backgroundImage: `linear-gradient(rgba(250,246,240,0.82), rgba(250,246,240,0.82)), url(${roomBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <RoomHeader
            roomId={roomId}
            copied={copied}
            members={members}
            currentSocketId={socket?.id}
            isHost={isHost}
            onCopyRoomId={copyRoomId}
            onLeaveRoom={handleLeaveRoom}
            onAddFriend={addFriendFromMember}
            onTransferHost={transferHost}
          />

          <div className="flex flex-wrap items-center gap-2 border-b border-brand-terracotta-light/15 bg-white/55 px-5 py-3 backdrop-blur">
            <button onClick={() => setRoomCollapsed(prev => !prev)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
              <Minimize2 size={14} /> {roomCollapsed ? 'Trở lại phòng' : 'Thu gọn player'}
            </button>
            <button onClick={copyRoomInvite} className="inline-flex items-center gap-2 rounded-full border border-brand-terracotta/20 bg-brand-terracotta px-4 py-2 text-xs font-black text-white shadow-md shadow-brand-terracotta/15 transition hover:bg-brand-brown-dark">
              <Link2 size={14} /> Mời vào phòng
              <span className="rounded-full bg-white/18 px-2 py-0.5 font-mono text-[10px]">{roomId}</span>
            </button>
            <button onClick={() => setShowThemeModal(true)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
              <Palette size={14} /> Giao diện
            </button>
            <button onClick={() => setShowRoomSettings(true)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
              <Settings size={14} /> Cài đặt phòng
            </button>
            <button onClick={() => transferHost()} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
              <Crown size={14} /> Chuyển host
            </button>

          </div>

          {/* Core Content Grid — adaptive columns based on stageMode */}
          {(() => {
            const mainSpan = roomCollapsed ? 'lg:col-span-12' : 'lg:col-span-9';
            const sideSpan = roomCollapsed ? 'hidden' : 'lg:col-span-3';
            return (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:overflow-hidden lg:max-h-[calc(100vh-108px)] xl:max-h-[calc(100vh-96px)]">

            {/* LEFT / CENTER: Stage workspace */}
            <main className={`${mainSpan} p-4 xl:p-6 flex flex-col gap-4 lg:overflow-y-auto transition-all duration-300`}>

              {!roomCollapsed && <StageSelector stageMode={stageMode} onChange={setStageMode} />}

              {/* ── STAGE DISPLAY AREA – adapts per stageMode ── */}
              <div className={`${roomCollapsed ? 'flex-1 min-h-[520px] flex items-center justify-center p-5' : 'flex-1 glass-panel rounded-3xl p-4 xl:p-5 shadow-xl border border-white min-h-[360px] xl:min-h-[420px] flex flex-col'} relative overflow-hidden`}>

                {roomCollapsed && (
                  <div className="w-full max-w-xl space-y-8 text-center">
                    <h2 className="font-display text-lg font-black text-brand-brown-light">{activeVideoTitle}</h2>
                    <div className="rounded-3xl border border-brand-terracotta-light/25 bg-white/75 p-5 shadow-sm">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-brand-brown-light">
                        <span>{formatTime(Math.floor(currentVideo.time || 0))}</span>
                        <div className="relative h-1 flex-1 rounded-full bg-brand-terracotta-light/30">
                          <div className="absolute left-0 top-0 h-full w-1/2 rounded-full bg-brand-terracotta/55" />
                          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-terracotta" />
                        </div>
                        <span>4:04</span>
                      </div>
                      <div className="mt-5 flex items-center justify-center gap-5">
                        <Volume2 size={15} className="text-brand-brown-light" />
                        <div className="h-1 w-24 rounded-full bg-brand-terracotta-light/30">
                          <div className="h-full w-1/2 rounded-full bg-brand-terracotta" />
                        </div>
                        <RotateCcw size={15} className="text-brand-brown-light" />
                        <button
                          type="button"
                          onClick={toggleMiniPlayback}
                          className="grid h-11 w-11 place-items-center rounded-full bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark"
                          aria-label={currentVideo.playing ? 'Tạm dừng' : 'Phát'}
                        >
                          {currentVideo.playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => playerRef.current?.seekTo?.((playerRef.current?.getCurrentTime?.() || 0) + 15, true)}
                          className="grid h-9 w-9 place-items-center rounded-full border border-brand-terracotta-light/25 bg-white text-brand-brown-light transition hover:text-brand-terracotta"
                          aria-label="Tua tiếp"
                        >
                          <SkipForward size={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoomCollapsed(false)}
                      className="flex h-12 w-full items-center justify-between rounded-2xl border border-brand-terracotta-light/25 bg-white/80 px-5 text-sm font-black text-brand-brown-dark shadow-sm transition hover:bg-white"
                    >
                      <span className="flex items-center gap-2">
                        <Link2 size={16} className="text-brand-terracotta" />
                        {activeVideoTitle}
                      </span>
                      <ChevronRight size={16} className="rotate-90 text-brand-brown-light" />
                    </button>
                  </div>
                )}

                {/* ── 1. YOUTUBE STAGE (16:9) ── */}
                <div className={`${stageMode === 'youtube' && !roomCollapsed ? 'flex flex-1 flex-col gap-3 h-full justify-start overflow-y-auto pr-1' : 'absolute h-px w-px overflow-hidden opacity-0 pointer-events-none'}`} aria-hidden={stageMode !== 'youtube' || roomCollapsed}>
                    <div className={`mx-auto grid w-full max-w-[1180px] gap-3 ${showLyrics && (lyrics || lyricsLoading) ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'}`}>
                    <div
                      className="relative flex-none rounded-2xl overflow-hidden border border-brand-terracotta-light/10 bg-black"
                      style={{
                        width: showLyrics && (lyrics || lyricsLoading) ? '100%' : 'min(100%, 99.5vh, 1180px)',
                        aspectRatio: '16 / 9',
                        minHeight: '220px'
                      }}
                    >
                      <div className="w-full h-full" ref={iframeContainerRef}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center pointer-events-none z-0">
                          <Clock className="text-white/20 animate-spin" size={32} />
                          <p className="text-xs text-white/40">Đang tải YouTube Player...</p>
                        </div>
                      </div>
                      {/* Man hinh cho khi chua co video — cũng hiện khi lỗi + playlist rỗng */}
                      {(!currentVideo.id && playlist.length === 0) && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 p-8 text-center bg-gradient-to-br from-brand-brown-dark/95 to-black/95">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-brand-terracotta/20 border-2 border-brand-terracotta/30 flex items-center justify-center animate-pulse">
                              <Music2 size={34} className="text-brand-terracotta" />
                            </div>
                            <h3 className="font-display font-black text-white text-xl mt-1">Chưa có video nào</h3>
                            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
                              Tìm và thêm bài nhạc vào playlist bên phải để bắt đầu học cùng nhau!
                            </p>
                          </div>
                          <div className="w-full max-w-sm space-y-2">
                            <p className="text-white/30 text-xs font-bold uppercase tracking-wider mb-3">Gợi ý phổ biến</p>
                            {trendingVideoSuggestions.slice(0, 3).map(s => (
                              <button
                                key={s.videoId}
                                type="button"
                                onClick={() => {
                                  socket.emit('add-to-playlist', { roomId, videoId: s.videoId, title: s.title, duration: s.duration });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 hover:border-brand-terracotta/40 transition text-left cursor-pointer"
                                title="Thêm vào playlist"
                              >
                                <div className="w-9 h-9 rounded-xl bg-brand-terracotta/20 flex items-center justify-center shrink-0">
                                  <Play size={14} className="text-brand-terracotta ml-0.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-white/90 text-xs font-bold truncate">{s.title}</p>
                                  <p className="text-white/40 text-[10px] mt-0.5">{s.category} · {s.duration}</p>
                                </div>
                                <Plus size={14} className="text-white/40 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Overlay khi host đã pause toàn phòng — chặn user nhìn thấy YouTube auto-resume */}
                      {isHostPaused && !isHost && currentVideo.id && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 p-8 text-center bg-gradient-to-br from-brand-brown-dark/95 to-black/95 backdrop-blur-md">
                          <div className="w-16 h-16 rounded-full bg-brand-terracotta/20 border-2 border-brand-terracotta/40 flex items-center justify-center">
                            <Pause size={28} className="text-brand-terracotta" />
                          </div>
                          <div>
                            <h3 className="font-display font-black text-white text-xl mb-1">Host đã tạm dừng</h3>
                            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                              Video sẽ tiếp tục khi host phát lại
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-white/40 text-xs">
                            <span className="h-2 w-2 rounded-full bg-brand-terracotta animate-pulse"></span>
                            <span>Đang chờ host...</span>
                          </div>
                        </div>
                      )}

                      {videoError && playlist.length > 0 && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 p-8 text-center">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
                            <Video size={28} className="text-white/60" />
                          </div>
                          <h3 className="font-display font-black text-white text-lg">Video không phát được</h3>
                          <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                            Video bị giới hạn embed hoặc đang tạm thời offline. Thử phát lại hoặc chọn video khác.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => { setVideoError(false); if (playerRef.current?.playVideo) playerRef.current.playVideo(); }}
                              className="px-5 py-2.5 rounded-full bg-brand-terracotta hover:bg-brand-brown-dark text-white font-bold text-sm transition cursor-pointer"
                            >
                              Phát lại
                            </button>
                            <a
                              href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition cursor-pointer"
                            >
                              Mở YouTube
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Info bar + local pause cho non-host — ẩn khi chưa có video */}
                    {showLyrics && (lyrics || lyricsLoading) && (
                      <aside
                        className="relative min-h-[220px] overflow-y-auto rounded-2xl border border-brand-terracotta-light/20 bg-white/90 p-4 shadow-sm backdrop-blur-sm"
                        style={{ maxHeight: 'min(56vh, 560px)' }}
                      >
                        <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-3 border-b border-brand-terracotta-light/15 bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
                          <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wide text-brand-terracotta">
                              {syncedLyrics.length ? 'Đồng bộ lời bài hát' : 'Lời bài hát'}
                            </p>
                            <h4 className="truncate text-sm font-black text-brand-brown-dark">{activeVideoTitle}</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowLyrics(false)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand-terracotta-light/20 bg-white text-brand-brown-light transition hover:text-brand-terracotta"
                            aria-label="Đóng lời bài hát"
                          >
                            <X size={14} />
                          </button>
                          </div>
                          <p className="mt-2 text-[11px] font-bold text-brand-brown-light/75">
                            Nhấn đúp vào một dòng để chỉnh lời bài hát khớp với video.
                          </p>
                        </div>

                        {lyricsLoading ? (
                          <p className="py-10 text-center text-xs text-brand-brown-light animate-pulse">Đang tải lời bài hát...</p>
                        ) : displayLyricLines.length > 0 ? (
                          <div className="relative">
                            <div className="sticky top-2 z-20 ml-auto mb-2 flex w-10 flex-col items-center rounded-full border border-brand-terracotta-light/20 bg-white/95 p-1 shadow-sm backdrop-blur">
                              <button
                                type="button"
                                onClick={() => adjustLyricsOffset(-1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-brand-brown-dark transition hover:bg-brand-terracotta hover:text-white"
                                title="Loi chay som hon 1 giay"
                                aria-label="Loi chay som hon 1 giay"
                              >
                                ^
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLyricsOffset(0);
                                  if (currentVideo.id) localStorage.removeItem(`duhocmate_lyrics_offset_${currentVideo.id}`);
                                }}
                                className="flex min-h-7 w-full items-center justify-center rounded-full px-1 text-[10px] font-black text-brand-terracotta transition hover:bg-brand-light"
                                title="Reset lech loi"
                                aria-label="Reset lech loi"
                              >
                                {lyricsOffset > 0 ? '+' : ''}{lyricsOffset.toFixed(0)}s
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustLyricsOffset(1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-brand-brown-dark transition hover:bg-brand-terracotta hover:text-white"
                                title="Loi chay cham lai 1 giay"
                                aria-label="Loi chay cham lai 1 giay"
                              >
                                v
                              </button>
                            </div>
                            <div className="space-y-1.5 pb-6 pr-10">
                            {displayLyricLines.map((line: LyricLine, index: number) => {
                              const isActive = index === activeLyricIndex;
                              return (
                                <p
                                  key={`${line.time}-${index}`}
                                  ref={isActive ? activeLyricRef : undefined}
                                  onDoubleClick={() => syncLyricsToLine(line)}
                                  title="Double click de dong bo dong nay voi video"
                                  className={`relative px-3 py-2 text-sm leading-relaxed transition ${
                                    isActive
                                      ? 'font-black text-brand-terracotta'
                                      : 'font-medium text-brand-brown-light hover:text-brand-brown-dark'
                                  }`}
                                >
                                  {isActive && (
                                    <span className="pointer-events-none absolute inset-y-0 -left-1 flex items-center text-[13px] text-brand-terracotta">
                                      &gt;
                                    </span>
                                  )}
                                  {line.text}
                                  {isActive && (
                                    <span className="pointer-events-none absolute inset-y-0 -right-1 flex items-center text-[13px] text-brand-terracotta">
                                      &lt;
                                    </span>
                                  )}
                                </p>
                              );
                            })}
                            </div>
                          </div>
                        ) : lyrics ? (
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-brand-brown-dark">{lyrics}</pre>
                        ) : (
                          <p className="py-10 text-center text-xs text-brand-brown-light">Không tìm thấy lời bài hát.</p>
                        )}
                      </aside>
                    )}
                    </div>
                    <div className={`mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-3 bg-brand-light/40 border border-brand-terracotta-light/20 rounded-2xl transition-all duration-300 ${!currentVideo.id ? 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden' : ''}`}>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-brand-terracotta uppercase">
                          {isHost ? '★ Host · Đang đồng bộ' : isHostPaused ? '⏸ Host đã tạm dừng' : localPaused ? '⏸ Tạm dừng riêng' : '· Đang đồng bộ'}
                        </span>
                        <h4 className="font-display font-extrabold text-sm truncate text-brand-brown-dark">
                          {activeVideoTitle}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {!isHost && (
                          <button
                            type="button"
                            onClick={() => {
                              if (localPaused) {
                                if (isHostPaused) {
                                  // Host đã dừng toàn phòng → không cho resume
                                  setShowHostPausedToast(true);
                                  return;
                                }
                                playerRef.current?.seekTo?.(currentVideo.time || 0, true);
                                playerRef.current?.playVideo?.();
                                localPausedRef.current = false;
                                setLocalPaused(false);
                              } else {
                                playerRef.current?.pauseVideo?.();
                                localPausedRef.current = true;
                                setLocalPaused(true);
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/30 bg-white px-3 py-1.5 text-[11px] font-bold text-brand-brown-dark shadow-sm transition hover:bg-brand-light"
                          >
                            {localPaused
                              ? <><Play size={12} className="text-brand-terracotta" /><span>Phát lại</span></>
                              : <><Pause size={12} className="text-brand-brown-light" /><span>Tạm dừng</span></>
                            }
                          </button>
                        )}
                        {/* ── Volume Control (YouTube player volume) ── */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            title={playerVolume === 0 ? 'Bật âm lượng' : 'Tắt tiếng'}
                            onClick={() => setPlayerVolume(playerVolume === 0 ? 80 : 0)}
                            className="rounded-full p-1 text-brand-brown-light transition hover:text-brand-terracotta"
                          >
                            {playerVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </button>
                          <input
                            type="range"
                            min="0" max="100" step="2"
                            value={playerVolume}
                            onChange={e => setPlayerVolume(parseInt(e.target.value))}
                            className="hidden sm:block w-20 h-1 accent-brand-terracotta cursor-pointer"
                            title={`Âm lượng: ${playerVolume}%`}
                          />
                        </div>

                        {/* ── Voice Controls (Discord-style: Mic | Headphones | Hang-up) ── */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Mic button: chưa vào voice → join; đang voice → toggle mute */}
                          <button
                            type="button"
                            title={voiceChat.isInVoice
                              ? (voiceChat.isMuted ? 'Bỏ tắt mic' : 'Tắt mic')
                              : 'Bật mic để chat voice'}
                            onClick={() => voiceChat.isInVoice ? voiceChat.toggleMute() : voiceChat.joinVoice()}
                            className={`relative flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition border ${
                              voiceChat.isInVoice
                                ? voiceChat.isMuted
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-white border-brand-terracotta-light/30 text-brand-brown-dark hover:bg-brand-light'
                            }`}
                          >
                            {voiceChat.isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                            <span className="hidden sm:inline">
                              {voiceChat.isInVoice ? (voiceChat.isMuted ? 'Muted' : 'Mic') : 'Mic'}
                            </span>
                            {voiceChat.isSpeaking && !voiceChat.isMuted && (
                              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 animate-ping" />
                            )}
                          </button>

                          {/* Headphone (Deafen) button – chỉ hiện khi đang trong voice */}
                          {voiceChat.isInVoice && (
                            <button
                              type="button"
                              title={voiceChat.isDeafened ? 'Bỏ tắt tai nghe' : 'Tắt tai nghe (không nghe ai)'}
                              onClick={voiceChat.toggleDeafen}
                              className={`relative flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition border ${
                                voiceChat.isDeafened
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-white border-brand-terracotta-light/30 text-brand-brown-dark hover:bg-brand-light'
                              }`}
                            >
                              <Headphones size={12} />
                              <span className="hidden sm:inline">
                                {voiceChat.isDeafened ? 'Deafened' : 'Nghe'}
                              </span>
                            </button>
                          )}

                          {/* Hang-up button – rời voice */}
                          {voiceChat.isInVoice && (
                            <button
                              type="button"
                              title="Rời voice chat"
                              onClick={voiceChat.leaveVoice}
                              className="flex-shrink-0 rounded-full p-1.5 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white border border-red-200 transition"
                            >
                              <PhoneOff size={12} />
                            </button>
                          )}
                        </div>

                        {(lyrics || lyricsLoading) && (
                          <button
                            type="button"
                            onClick={() => setShowLyrics(v => !v)}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm transition ${showLyrics ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/30 bg-white text-brand-brown-dark hover:bg-brand-light'}`}
                          >
                            <Music2 size={12} /> Lời bài hát
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowYoutubeCaptions(v => !v)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm transition ${showYoutubeCaptions ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/30 bg-white text-brand-brown-dark hover:bg-brand-light'}`}
                        >
                          <FileText size={12} /> Phụ đề YouTube
                        </button>
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                        <span className="text-[10px] font-bold text-brand-brown-light uppercase hidden sm:block">Live Sync</span>
                      </div>
                    </div>
                    {false && showLyrics && (
                      <div className="mx-auto max-h-44 w-full max-w-[1180px] overflow-y-auto rounded-2xl border border-brand-terracotta-light/20 bg-white/85 p-4 backdrop-blur-sm xl:max-h-52">
                        {lyricsLoading ? (
                          <p className="text-center text-xs text-brand-brown-light animate-pulse">Đang tải lời bài hát...</p>
                        ) : lyrics ? (
                          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-brand-brown-dark">{lyrics}</pre>
                        ) : (
                          <p className="text-center text-xs text-brand-brown-light">Không tìm thấy lời bài hát.</p>
                        )}
                      </div>
                    )}
                </div>


                {/* ── 2. TIKTOK STAGE (9:16) ── */}
                {stageMode === 'tiktok' && (
                  <div className="flex-1 flex flex-col gap-3 h-full">
                    {/* URL Input */}
                    <form onSubmit={handleTikTokLoad} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('room.tiktok.placeholder')}
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400/40 text-sm font-medium text-brand-brown-dark"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-sm transition cursor-pointer flex-shrink-0"
                      >
                        {t('room.tiktok.load')}
                      </button>
                    </form>

                    {tiktokVideoId ? (
                      <div className="flex-1 flex justify-center items-start overflow-hidden">
                        {/* 9:16 TikTok embed centered */}
                        <div className="relative w-full max-w-[340px]" style={{ aspectRatio: '9/16' }}>
                          <iframe
                            src={`https://www.tiktok.com/embed/v2/${tiktokVideoId}`}
                            className="w-full h-full rounded-2xl border-0 shadow-lg"
                            allowFullScreen
                            allow="autoplay; encrypted-media"
                            title="TikTok video"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 rounded-2xl py-12">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg">
                          <Music2 size={28} className="text-white" />
                        </div>
                        <div className="text-center px-4">
                          <p className="font-bold text-sm text-brand-brown-dark">{t('room.tiktok.noVideo')}</p>
                          <p className="text-xs text-brand-brown-light mt-1 max-w-xs">{t('room.tiktok.noVideoDesc')}</p>
                        </div>
                        <div className="text-[10px] text-brand-brown-light/50 mt-2">
                          Ví dụ: https://www.tiktok.com/@user/video/123...
                        </div>
                      </div>
                    )}

                    {/* Sync notice for host */}
                    {tiktokVideoId && (
                      <div className={`text-[10px] font-semibold text-center px-3 py-2 rounded-xl border ${
                        isHost
                          ? 'bg-amber-50 border-amber-200/50 text-amber-700'
                          : 'bg-brand-light border-brand-light text-brand-brown-light'
                      }`}>
                        {isHost ? '★ ' : ''}{t('room.tiktok.syncNotice')}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 3. MUSIC / LO-FI RADIO STAGE ── */}
                {stageMode === 'music' && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6">
                    {/* Hidden YouTube player (still needs the DOM container) */}
                    <div
                      ref={iframeContainerRef}
                      className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
                      aria-hidden="true"
                    />

                    {/* Album Art / Animated Orb */}
                    <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-terracotta via-amber-500 to-brand-brown-dark opacity-20 blur-xl animate-pulse" />
                      {/* Main circle */}
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand-brown-dark via-brand-terracotta to-amber-600 flex items-center justify-center shadow-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent" />
                        {/* Pulsing rings */}
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="absolute rounded-full border border-white/15"
                            style={{
                              inset: `${i * 14}%`,
                              animation: `ping ${1.2 + i * 0.5}s cubic-bezier(0,0,0.2,1) infinite`,
                              animationDelay: `${i * 0.4}s`
                            }}
                          />
                        ))}
                        <Headphones size={52} className="text-white relative z-10 drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Track info */}
                    <div className="text-center space-y-1.5 px-4">
                      <p className="text-[10px] font-black text-brand-terracotta uppercase">
                        🎧 {t('room.music.radioMode')}
                      </p>
                      <h3 className="font-display font-black text-lg sm:text-xl text-brand-brown-dark leading-tight">
                        {playlist.find(item => item.videoId === currentVideo.id)?.title || 'Lo-Fi Girl Study Beat'}
                      </h3>
                      <p className="text-sm text-brand-brown-light">
                        {currentVideo.playing ? t('room.music.nowPlaying') : t('room.music.paused')}
                      </p>
                    </div>

                    {/* Equalizer bars */}
                    <div className="flex gap-[3px] items-end h-10">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-brand-terracotta"
                          style={{
                            height: `${30 + Math.sin(i * 0.8) * 50}%`,
                            animation: currentVideo.playing
                              ? `equalize ${0.4 + (i % 5) * 0.15}s ease-in-out infinite alternate`
                              : 'none',
                            minHeight: '4px',
                            opacity: currentVideo.playing ? 1 : 0.3
                          }}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-brand-brown-light/60 text-center max-w-[240px]">
                      {t('room.music.screenHidden')}
                    </p>

                    <button
                      onClick={() => setStageMode('youtube')}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-brand-terracotta/30 text-brand-brown-dark text-sm font-bold hover:bg-brand-terracotta hover:text-white transition cursor-pointer"
                    >
                      {t('room.music.showVideo')} <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* ── 4. PDF STAGE ── */}
                {stageMode === 'pdf' && (
                  <div className="flex-1 flex flex-col gap-3 justify-start h-full items-center overflow-y-auto pr-1">
                    <div className="w-full flex justify-between items-center gap-4 bg-brand-light/60 p-3 rounded-2xl border border-brand-terracotta-light/20">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-terracotta file:text-white hover:file:bg-brand-brown-dark file:cursor-pointer"
                      />
                      {pdfDocRef.current && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button onClick={() => changePdfPage('prev')} disabled={pdfPage <= 1} className="px-3 py-1.5 rounded-lg bg-white border border-brand-terracotta-light/20 font-bold text-xs disabled:opacity-50 cursor-pointer">
                            Trước
                          </button>
                          <span className="text-xs font-bold whitespace-nowrap">Trang {pdfPage} / {pdfTotalPages}</span>
                          <button onClick={() => changePdfPage('next')} disabled={pdfPage >= pdfTotalPages} className="px-3 py-1.5 rounded-lg bg-white border border-brand-terracotta-light/20 font-bold text-xs disabled:opacity-50 cursor-pointer">
                            Sau
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full flex items-start justify-center min-h-[240px] max-h-[calc(100vh-300px)] border border-dashed border-brand-terracotta-light/30 rounded-2xl p-4 bg-white/30 overflow-auto xl:min-h-[300px]">
                      {pdfDocRef.current ? (
                        <canvas ref={canvasRef} className="shadow-lg rounded-xl max-h-full max-w-full bg-white object-contain" />
                      ) : (
                        <div className="text-center space-y-2 max-w-sm">
                          <FileText size={40} className="mx-auto text-brand-terracotta-light" />
                          <h4 className="font-display font-extrabold text-sm">Chưa có Slide PDF nào</h4>
                          <p className="text-xs text-brand-brown-light">Tải file PDF bài học lên. Host chuyển trang → tất cả tự động nhảy theo.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── 5. POMODORO STAGE ── */}
                {stageMode === 'pomodoro' && (
                  <div className="flex-1 flex flex-col justify-center items-center gap-8 py-8">
                    <div className="relative w-64 h-64 rounded-full flex flex-col justify-center items-center shadow-inner bg-brand-light/30 border-8 border-brand-terracotta-light/20">
                      <div className="absolute inset-2 rounded-full border-4 border-dashed border-brand-terracotta/20 animate-spin-slow"></div>
                      <span className="text-[10px] font-bold text-brand-terracotta uppercase mb-1">
                        {pomodoro.isBreak ? t('pomodoro.break') : t('pomodoro.focus')}
                      </span>
                      <span className="font-display font-black text-5xl tabular-nums">
                        {formatTime(pomodoro.timeLeft)}
                      </span>
                      <span className="text-[10px] text-brand-brown-light mt-2">
                        {pomodoro.isRunning ? t('pomodoro.running') : t('pomodoro.paused')}
                      </span>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                      {pomodoro.isRunning ? (
                        <button onClick={() => controlPomodoro('pause')} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer">
                          <Pause size={14} /> {t('pomodoro.pause')}
                        </button>
                      ) : (
                        <button onClick={() => controlPomodoro('start')} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs transition cursor-pointer">
                          <Play size={14} /> {t('pomodoro.start')}
                        </button>
                      )}
                      <button onClick={() => controlPomodoro('reset', false)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-light hover:bg-brand-terracotta-light/40 border border-brand-terracotta-light/20 font-bold text-xs transition cursor-pointer">
                        <RotateCcw size={14} /> {t('pomodoro.study25')}
                      </button>
                      <button onClick={() => controlPomodoro('reset', true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-light hover:bg-brand-terracotta-light/40 border border-brand-terracotta-light/20 font-bold text-xs transition cursor-pointer">
                        <Coffee size={14} /> {t('pomodoro.rest5')}
                      </button>
                    </div>
                    <p className="text-xs text-brand-brown-light text-center max-w-sm">{t('pomodoro.desc')}</p>
                  </div>
                )}

                {/* ── 6. TOPIK STAGE ── */}
                {stageMode === 'topik' && (
                  <TopikStudy roomId={roomId} socket={socket} />
                )}

                {stageMode === 'video' && (
                  <StudyTableStage
                    members={members}
                    username={username}
                    jitsiActive={jitsiActive}
                    pomodoro={pomodoro}
                    onToggleJitsi={toggleJitsi}
                    onControlPomodoro={controlPomodoro}
                  />
                )}

                {stageMode === 'ideas' && (
                  <IdeaBoard
                    tasks={ideaTasks}
                    members={members}
                    onChange={handleIdeaTasksChange}
                    onCreateTemplate={() => setShowCreateTemplate(true)}
                  />
                )}
              </div>

            </main>

            {/* RIGHT SIDEBAR: Chat, Playlist, Members — width adapts with sideSpan */}
            <aside className={`${sideSpan} min-w-0 border-l border-brand-terracotta-light/20 bg-white/30 backdrop-blur-lg flex flex-col lg:max-h-full transition-all duration-300`}>
              
              {/* Tab Navigation in Sidebar */}
              <div className="p-3 border-b border-brand-terracotta-light/10 grid grid-cols-3 gap-1.5 bg-white/40 xl:p-4 xl:gap-2">
                <button
                  onClick={() => setSidebarTab('playlist')}
                  className={`h-10 min-w-0 rounded-xl px-1.5 font-bold text-xs xl:h-11 xl:px-2 xl:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'playlist'
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'hover:bg-brand-light text-brand-brown-light'
                  }`}
                >
                  <ListMusic size={16} className="shrink-0" /> <span className="truncate">Playlist ({playlist.length})</span>
                </button>
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`h-10 min-w-0 rounded-xl px-1.5 font-bold text-xs xl:h-11 xl:px-2 xl:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'chat'
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'hover:bg-brand-light text-brand-brown-light'
                  }`}
                >
                  <MessageCircle size={16} className="shrink-0" /> <span className="truncate">Chat ({chatMessages.length})</span>
                </button>
                <button
                  onClick={() => setSidebarTab('members')}
                  className={`h-10 min-w-0 rounded-xl px-1.5 font-bold text-xs xl:h-11 xl:px-2 xl:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'members'
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'hover:bg-brand-light text-brand-brown-light'
                  }`}
                >
                  <Users size={16} /> Bạn học ({members.length})
                </button>
              </div>

              {/* Sidebar Content Panel */}
              <div className="flex-1 lg:overflow-y-auto p-3 xl:p-4 flex flex-col min-h-0">
                
                {/* 1. PLAYLIST & JUKEBOX TAB */}
                {sidebarTab === 'playlist' && (
                  <div className="flex-1 flex flex-col gap-3 min-h-0">
                    
                    {/* Search / Add Song Form */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tên bài hát, nghệ sĩ hoặc link YouTube..."
                          value={songSearch}
                          onChange={(e) => setSongSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), songSearch.length < 20 || songSearch.startsWith('http') ? handleAddSongDirect(e as any) : handleSearchMusic())}
                          className="flex-1 px-4 py-3 rounded-xl border border-brand-terracotta-light/30 bg-white/70 text-base focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                        />
                        <button
                          type="button"
                          onClick={handleSearchMusic}
                          disabled={musicSearchLoading}
                          className="px-4 py-3 rounded-xl bg-brand-terracotta text-white font-bold text-sm hover:bg-brand-brown-dark transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {musicSearchLoading ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          ) : <Search size={14} />}
                          Tìm
                        </button>
                      </div>

                      {/* Quick Tags */}
                      {!showSearchResults && (
                        <div className="flex flex-wrap gap-2">
                          {[
                            { icon: <Sparkles size={13} />, label: 'Lofi Girl', q: 'lofi girl study' },
                            { icon: <Coffee size={13} />, label: 'K-Pop Học Bài', q: 'kpop study playlist 2024' },
                            { icon: <CloudRain size={13} />, label: 'Tiếng Mưa Cozy', q: 'rain cozy study music' },
                            { icon: <Music2 size={13} />, label: 'Piano Nhẹ', q: 'piano soft study music' },
                          ].map(tag => (
                            <button
                              key={tag.label}
                              type="button"
                              onClick={() => { setSongSearch(tag.q); }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/60 hover:bg-white rounded-lg border border-brand-terracotta-light/10 text-xs text-brand-brown-light transition font-medium"
                            >
                              {tag.icon}
                              <span>{tag.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Search Results */}
                      {showSearchResults && (
                        <div className="relative">
                          {/* Nút đóng kết quả */}
                          <button
                            type="button"
                            onClick={() => { setShowSearchResults(false); setMusicSearchResults([]); }}
                            className="inline-flex items-center gap-1 text-[9px] text-brand-brown-light hover:text-brand-terracotta font-bold cursor-pointer mb-1.5"
                          >
                            <ArrowLeft size={11} />
                            Quay về playlist
                          </button>

                          {musicSearchLoading && (
                            <div className="flex items-center justify-center py-8 gap-2 text-brand-brown-light">
                              <span className="w-4 h-4 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs">Đang tìm kiếm...</span>
                            </div>
                          )}

                          {musicSearchError && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-[10px] text-amber-700 leading-relaxed">
                              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                              <span>{musicSearchError}</span>
                            </div>
                          )}

                          {!musicSearchLoading && !musicSearchError && musicSearchResults.length === 0 && (
                            <div className="text-center py-6 text-brand-brown-light text-xs">
                              Không tìm thấy kết quả. Thử từ khóa khác?
                            </div>
                          )}

                          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5 custom-scrollbar">
                            {musicSearchResults.map((result) => (
                              <div
                                key={result.videoId}
                                className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/80 border border-brand-terracotta-light/10 hover:shadow-md hover:border-brand-terracotta/20 transition group cursor-pointer"
                                onClick={() => addSongFromResult(result)}
                              >
                                {/* Thumbnail */}
                                <div className="relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-brand-light">
                                  <img
                                    src={result.thumbnail}
                                    alt={result.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                    <Play className="text-white opacity-0 group-hover:opacity-100 transition" size={14} />
                                  </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-brand-brown-dark truncate leading-tight">{result.title}</p>
                                  <p className="text-[9px] text-brand-brown-light truncate mt-0.5">
                                    {result.author} · {result.duration}
                                    {result.views > 0 && ` · ${result.views >= 1000000 ? `${(result.views/1000000).toFixed(1)}M` : result.views >= 1000 ? `${Math.floor(result.views/1000)}K` : result.views} lượt xem`}
                                  </p>
                                </div>

                                {/* Add Button */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); addSongFromResult(result); }}
                                  className="flex-shrink-0 px-2 py-1 rounded-lg bg-brand-terracotta text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition"
                                >
                                  + Thêm
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-[1px] bg-brand-terracotta-light/10 my-0" />

                    {/* Playlist Queue */}
                    <div className="overflow-y-auto overscroll-y-contain space-y-3 pr-1 max-h-[40vh] lg:max-h-none lg:overflow-visible">
                      {playlist.length === 0 ? (
                        <div className="py-4 text-brand-brown-light space-y-3">
                          <div className="rounded-2xl border border-dashed border-brand-terracotta-light/40 bg-white/60 p-4 text-center">
                            <ListMusic className="mx-auto text-brand-terracotta-light/60" size={34} />
                            <p className="mt-2 text-sm font-black text-brand-brown-dark">Danh sách phát đang trống</p>
                            <p className="mt-1 text-xs leading-relaxed">Chọn nhanh một video đang phổ biến cho phòng học, hoặc dán link YouTube ở trên.</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-black text-brand-brown-dark">Gợi ý hôm nay</p>
                            {trendingVideoSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.videoId}
                                type="button"
                                onClick={() => addSuggestedVideo(suggestion)}
                                className="group flex w-full items-center gap-3 rounded-2xl border border-brand-terracotta-light/10 bg-white/80 p-2 text-left transition hover:border-brand-terracotta/30 hover:shadow-sm"
                              >
                                <div className="relative h-12 w-18 flex-shrink-0 overflow-hidden rounded-xl bg-brand-light">
                                  <img
                                    src={`https://i.ytimg.com/vi/${suggestion.videoId}/hqdefault.jpg`}
                                    alt={suggestion.title}
                                    className="h-full w-full object-cover"
                                    onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition group-hover:opacity-100">
                                    <Play size={14} className="text-white" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black text-brand-brown-dark">{suggestion.title}</p>
                                  <p className="mt-1 text-[10px] font-bold text-brand-brown-light">{suggestion.category} · {suggestion.duration}</p>
                                </div>
                                <span className="rounded-lg bg-brand-terracotta px-2 py-1 text-[10px] font-black text-white">Thêm</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        playlist.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl bg-white/60 border border-brand-terracotta-light/10 flex justify-between items-center shadow-sm hover:shadow transition ${
                              idx === 0 ? 'ring-2 ring-brand-terracotta/20 bg-brand-light/30' : ''
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                {idx === 0 && <span className="px-2 py-1 rounded-md text-xs font-black bg-brand-terracotta text-white uppercase">TOP</span>}
                                <p className="font-display font-extrabold text-sm truncate text-brand-brown-dark">{item.title}</p>
                              </div>
                              <p className="text-xs text-brand-brown-light font-medium">Gợi ý bởi: <span className="font-bold">{item.addedBy}</span></p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Vote button */}
                              <button
                                onClick={() => voteSong(item.id)}
                                className={`flex items-center gap-1 py-2 px-3 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                  item.votedUsers.includes(socket?.id || '')
                                    ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-sm'
                                    : 'bg-white border-brand-terracotta-light/20 hover:bg-brand-light text-brand-brown-light'
                                }`}
                              >
                                <ThumbsUp size={14} /> {item.votes}
                              </button>

                              {/* Play directly — chỉ host mới được phát */}
                              {isHost && (
                                <button
                                  onClick={() => playSong(item)}
                                  className="p-2 rounded-lg bg-brand-light hover:bg-brand-terracotta hover:text-white border border-brand-terracotta-light/10 transition cursor-pointer text-brand-terracotta"
                                  title="Phát bài này ngay"
                                >
                                  <Play size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CHAT TAB */}
                {sidebarTab === 'chat' && (
                  <div className="flex h-full min-h-[calc(100vh-235px)] flex-col gap-0">
                    {/* Messages Area */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain space-y-4 pr-1 mb-3 custom-scrollbar">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-brand-brown-light space-y-2">
                          <MessageCircle className="mx-auto text-brand-terracotta-light/40" size={36} />
                          <p className="text-sm font-semibold">Chưa có cuộc trò chuyện nào</p>
                          <p className="text-xs">Gửi lời chào đầu tiên tới các bạn học đi thôi!</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMyMessage = msg.senderId === socket?.id;
                          const isSystem = msg.type === 'system';
                          const isHostMsg = msg.isHost;

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="flex justify-center my-2">
                                <div className="bg-brand-light/80 text-brand-brown-light/80 px-4 py-2 rounded-full text-xs font-bold border border-brand-terracotta-light/10 max-w-[90%] text-center shadow-sm select-none">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Sparkles size={13} />
                                    {msg.text}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex flex-col gap-1 ${isMyMessage ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 px-2">
                                {!isMyMessage && (
                                  <span className={`text-xs font-bold ${isHostMsg ? 'text-amber-600' : 'text-brand-terracotta'}`}>
                                    {msg.sender}
                                  </span>
                                )}
                                {isHostMsg && (
                                  <span className="px-2 rounded bg-amber-500/20 text-amber-700 text-[10px] font-black uppercaser">Host</span>
                                )}
                                <span className="text-xs text-brand-brown-light/70">{msg.timestamp}</span>
                              </div>

                              <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm border ${
                                isMyMessage
                                  ? 'bg-brand-terracotta text-white border-brand-terracotta rounded-tr-none'
                                  : isHostMsg
                                    ? 'bg-amber-50/80 text-brand-brown-dark border-amber-200/50 rounded-tl-none'
                                    : 'bg-white text-brand-brown-dark border-brand-terracotta-light/10 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="mt-auto shrink-0 border-t border-brand-terracotta-light/10 pt-3">
                    {/* Quick Emojis Bar */}
                    <div className="flex gap-2 pb-3 overflow-x-auto select-none animate-fadeIn">
                      {['☕', '📖', '🎵', '🔥', '👏', '🇻🇳', '🇰🇷', '💪'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { socket.emit('send-message', { roomId, message: emoji }); }}
                          className="w-9 h-9 flex items-center justify-center bg-white hover:bg-brand-terracotta hover:text-white border border-brand-terracotta-light/15 rounded-full text-base transition cursor-pointer shadow-sm active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Chat Form */}
                    <form onSubmit={sendChatMessage} className="flex gap-2 pt-2 shrink-0">
                      <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-brand-terracotta-light/30 bg-white/70 text-base focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 text-brand-brown-dark"
                      />
                      <button
                        type="submit"
                        className="p-3 rounded-xl bg-brand-terracotta text-white hover:bg-brand-brown-dark transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center w-10 h-10"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                    </div>
                  </div>
                )}

                {/* 3. MEMBERS TAB – Discord-style with voice indicators */}
                {sidebarTab === 'members' && (
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-brand-terracotta-light/10 mb-2">
                      <span className="text-xs font-bold uppercase text-brand-brown-light">Danh sách bạn học</span>
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-brand-terracotta-light/30 text-brand-terracotta">{members.length} đang online</span>
                    </div>

                    {/* Voice channel header – hiển thị khi đang trong voice */}
                    {voiceChat.isInVoice && (
                      <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-bold text-green-700 flex-1">
                          Voice Chat · {voiceChat.voiceUsers.size} người
                        </span>
                        {/* Mic toggle */}
                        <button
                          type="button"
                          title={voiceChat.isMuted ? 'Bỏ tắt mic' : 'Tắt mic'}
                          onClick={voiceChat.toggleMute}
                          className={`rounded-full p-1.5 transition ${voiceChat.isMuted ? 'bg-red-500 text-white' : 'bg-green-200 text-green-700 hover:bg-green-300'}`}
                        >
                          {voiceChat.isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                        </button>
                        {/* Headphone / Deafen toggle */}
                        <button
                          type="button"
                          title={voiceChat.isDeafened ? 'Bỏ tắt tai nghe' : 'Tắt tai nghe'}
                          onClick={voiceChat.toggleDeafen}
                          className={`rounded-full p-1.5 transition ${voiceChat.isDeafened ? 'bg-red-500 text-white' : 'bg-green-200 text-green-700 hover:bg-green-300'}`}
                        >
                          <Headphones size={11} />
                        </button>
                        {/* Leave voice */}
                        <button
                          type="button"
                          onClick={voiceChat.leaveVoice}
                          className="rounded-full bg-red-100 p-1.5 text-red-500 hover:bg-red-200 transition"
                          title="Rời voice"
                        >
                          <PhoneOff size={11} />
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {members.map((m) => {
                        const vUser = voiceChat.voiceUsers.get(m.id);
                        const isInVoice = !!vUser;
                        const isSpeakingNow = vUser?.speaking ?? false;
                        const isMutedNow = vUser?.muted ?? false;
                        const isMe = m.id === socket?.id;

                        return (
                          <div
                            key={m.id}
                            className={`relative p-3 rounded-2xl border flex justify-between items-center shadow-sm transition-all duration-300 ${
                              isSpeakingNow
                                ? 'bg-green-50/80 border-green-400 shadow-[0_0_0_2px_rgba(74,222,128,0.25)]'
                                : 'bg-white/60 border-brand-terracotta-light/10'
                            }`}
                          >
                            {/* Speaking ping dot */}
                            {isSpeakingNow && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 animate-ping" />
                            )}

                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar with speaking ring */}
                              <div className={`relative w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-display font-extrabold text-sm uppercase transition-all ${
                                isSpeakingNow
                                  ? 'bg-green-100 text-green-800 ring-2 ring-green-400 ring-offset-1'
                                  : 'bg-brand-terracotta-light/40 text-brand-brown-dark'
                              }`}>
                                {m.username.substring(0, 2)}
                                {/* In-voice indicator (small dot on avatar) */}
                                {isInVoice && !isSpeakingNow && (
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isMutedNow ? 'bg-red-400' : 'bg-green-400'}`} />
                                )}
                              </div>

                              <div className="space-y-0.5 min-w-0">
                                <p className="font-display font-extrabold text-sm text-brand-brown-dark truncate">{m.username}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-brand-brown-light font-medium">
                                    {isMe ? "Bạn" : "Bạn học"}
                                  </span>
                                  {isSpeakingNow && (
                                    <span className="text-[10px] font-bold text-green-600 animate-pulse">đang nói...</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right side: mic + headphone (to, cùng hàng với HOST badge) */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Mic button – to hơn (size 16), click để join/mute */}
                              <button
                                type="button"
                                title={
                                  isMe
                                    ? (voiceChat.isInVoice ? (voiceChat.isMuted ? 'Bỏ tắt mic' : 'Tắt mic') : 'Bật mic')
                                    : (isInVoice ? (isMutedNow ? 'Đã tắt mic' : 'Đang bật mic') : 'Chưa bật mic')
                                }
                                onClick={() => {
                                  if (isMe) {
                                    voiceChat.isInVoice ? voiceChat.toggleMute() : voiceChat.joinVoice();
                                  } else if (isHost && isInVoice) {
                                    voiceChat.hostMuteUser(m.id, !isMutedNow);
                                  }
                                }}
                                className={`relative rounded-full p-2 transition ${
                                  isInVoice
                                    ? isMutedNow
                                      ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                      : isSpeakingNow
                                        ? 'bg-green-100 text-green-600 ring-2 ring-green-400 ring-offset-1'
                                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                                    : 'bg-brand-light/80 text-brand-brown-light/50 hover:text-brand-terracotta hover:bg-brand-light'
                                } ${isMe || (isHost && isInVoice) ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                {isInVoice
                                  ? (isMutedNow ? <MicOff size={16} /> : <Mic size={16} />)
                                  : <Mic size={16} />
                                }
                                {/* Speaking pulse */}
                                {isSpeakingNow && (
                                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 animate-ping" />
                                )}
                              </button>

                              {/* Headphone (deafen) – chỉ bản thân, khi đang voice */}
                              {isMe && isInVoice && (
                                <button
                                  type="button"
                                  title={voiceChat.isDeafened ? 'Bỏ tắt tai nghe' : 'Tắt tai nghe (không nghe ai)'}
                                  onClick={voiceChat.toggleDeafen}
                                  className={`rounded-full p-2 transition ${
                                    voiceChat.isDeafened
                                      ? 'bg-red-500 text-white'
                                      : 'bg-brand-light text-brand-brown-light hover:text-brand-terracotta hover:bg-brand-light'
                                  }`}
                                >
                                  <Headphones size={16} />
                                </button>
                              )}

                              {/* Host badge */}
                              {m.isHost && (
                                <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-700 uppercase border border-amber-500/10">Host</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Join voice CTA nếu chưa vào voice */}
                    {!voiceChat.isInVoice && (
                      <button
                        type="button"
                        onClick={voiceChat.joinVoice}
                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-green-300 bg-green-50/50 py-2.5 text-xs font-bold text-green-700 transition hover:bg-green-50"
                      >
                        <Mic size={13} />
                        Bật mic để hát karaoke cùng nhau
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
          ); // end IIFE return
          })()} {/* end adaptive grid IIFE */}
        </div>
      )}
    </div>
  );
}
