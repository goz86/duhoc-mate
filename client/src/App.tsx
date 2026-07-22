import React, { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AlertTriangle,
  BookOpen, Coffee, MessageCircle, ListMusic,
  Users, ThumbsUp, Play, Pause, RotateCcw, Send,
  CloudRain,
  Clock, FileText, Video,
  Headphones, Music2, ChevronRight, Search,
  Minimize2, Palette, Settings, Crown,
  Link2, Volume2, VolumeX, SkipForward, Plus, X, Trash2, Shuffle,
  Mic, MicOff, PhoneOff, GripVertical, Camera, Pin, MoreVertical, Sparkles, ClipboardList, Timer, Gamepad2
} from 'lucide-react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import duhocMateLogo from './assets/duhoc-mate-logo-new.png';
import AuthModal from './components/AuthModal';
import { getTemplateRoomId, seedRoomIds } from './lib/templateRooms';
import RoomHeader from './components/RoomHeader';
import StageSelector from './components/StageSelector';
import {
  cloneTasks,
  loadRoomTasks,
  loadTemplates,
  saveRoomTasks,
  saveTemplate,
  type IdeaTask,
  type RoomTemplate
} from './lib/communityTemplates';
import ConfirmDialog from './components/modals/ConfirmDialog';
import PasswordRoomModal from './components/modals/PasswordRoomModal';
import GuestJoinModal from './components/modals/GuestJoinModal';
import InviteModal from './components/modals/InviteModal';
import ThemeModal, { type RoomThemeKey } from './components/modals/ThemeModal';
import type {
  StageMode,
  Member,
  PlaylistItem,
  VideoState,
  Message,
  PomodoroState,
  StudyTableState
} from './types';
import { deletePersistentRoom, findPersistentRoom, hashRoomPassword, savePersistentRoom, type PersistentRoom } from './lib/persistentRooms';
import { getNextPlaylistItem } from './lib/playlist';
import { downscaleImageToDataUrl, dataURLtoFile } from './lib/image';
import {
  createEstimatedLyrics,
  findBestLyricsTrack,
  getOffsetForLyricAnchor,
  getLyricsSearchCandidates,
  parseSyncedLyrics,
  type LyricLine
} from './lib/lyrics';
import {
  buildBreadcrumbSchema,
  buildSoftwareApplicationSchema,
  buildWebsiteSchema,
  getCanonicalUrl,
  getSeoPage,
  seoConfig,
} from './lib/seo';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CreateTemplateModal = lazy(() => import('./components/CreateTemplateModal'));
const IdeaBoard = lazy(() => import('./components/IdeaBoard'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const StudyTableStage = lazy(() => import('./components/StudyTableStage'));
const TopikStudy = lazy(() => import('./components/TopikStudy'));
const VocabularyMatchGame = lazy(() => import('./components/VocabularyMatchGame'));
const Whiteboard = lazy(() => import('./components/Whiteboard'));

const LazyPanelFallback = () => (
  <div className="flex min-h-[280px] w-full min-w-0 flex-1 items-center justify-center rounded-3xl border border-brand-terracotta-light/15 bg-white/55">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-terracotta-light/30 border-t-brand-terracotta" />
  </div>
);

// Kết nối Socket Server — đọc từ env var khi deploy, fallback localhost khi dev
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const LOCAL_API_BASE_URL = 'http://localhost:3001';
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : LOCAL_API_BASE_URL);
const INITIAL_VISIBLE_CHAT_MESSAGES = 25;
const CHAT_MESSAGES_PAGE_SIZE = 25;
// Bù thời gian YouTube buffer khi seek (giây) để guest theo kịp host khi đồng bộ video.
// Tăng nếu guest vẫn trễ, giảm nếu guest vượt trước host.
const VIDEO_SYNC_BUFFER = 0.2;
const STUDY_SESSION_HISTORY_KEY = 'duhocmate_study_session_history';
const STUDY_ROOM_CROWDED_THRESHOLD = 8;
const STUDY_ROOM_SOFT_LIMIT = 12;
const MAX_ACTIVE_STUDY_CAMERAS = 4;

type StudySessionStats = {
  minutes: number;
  songs: number;
  messages: number;
  pomodoros: number;
  notes: number;
  roomId: string;
  roomTitle: string;
  companions: string[];
  leftAt: string;
};

const getApiBaseCandidates = () => {
  const bases = [API_BASE_URL, '', LOCAL_API_BASE_URL];
  return Array.from(new Set(bases.map((base) => base.replace(/\/$/, ''))));
};

let socket: Socket;
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  if (!globalAny._socket) {
    globalAny._socket = io(SOCKET_URL, { autoConnect: true });
  }
  socket = globalAny._socket;
}


const trendingVideoSuggestions = [
  {
    videoId: 'nZtFlrwCbs4',
    title: 'Lofi Girl - beats to relax/study to 🌙',
    duration: '',
    category: 'Lo-fi',
  },
  {
    videoId: 'lTRiuFIWV54',
    title: '1 A.M Study Session 📚 [lofi hip hop/chill beats]',
    duration: '1:00:30',
    category: 'Lo-fi',
  },
  {
    videoId: 'S1ElLh_hf3k',
    title: 'Study With Me 🌿',
    duration: '',
    category: 'Study With Me',
  },
  {
    videoId: 'yYYO15hK730',
    title: 'Study With Me ☕',
    duration: '',
    category: 'Study With Me',
  },
  {
    videoId: 'n9iKoJ9ZE-Q',
    title: 'Study With Me 📖',
    duration: '',
    category: 'Study With Me',
  },
  {
    videoId: '0UN_HbOTTcI',
    title: 'Classical Music for Brain Power 🧠 (Mozart, Beethoven...)',
    duration: '2:19:10',
    category: 'Classical',
  },
  {
    videoId: 'TURbeWK2wwg',
    title: 'Korean Listening Practice for Beginners 🇰🇷',
    duration: '25:00',
    category: 'Korean',
  },
];



export default function App() {
  const { t } = useTranslation();
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const [relatedGenre, setRelatedGenre] = useState('');
  const [currentPathname, setCurrentPathname] = useState(() => window.location.pathname);
  const currentSeoPage = getSeoPage(currentPathname);

  // Dragging logic for the global floating widget
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0 });
  const [isWidgetDragging, setIsWidgetDragging] = useState(false);
  const widgetDragStartRef = useRef({ x: 0, y: 0 });
  const widgetDragOffsetRef = useRef({ x: 0, y: 0 });
  const widgetDragDistanceRef = useRef(0);

  const [customAlert, setCustomAlert] = useState<{ message: string; show: boolean } | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalRoomId, setPasswordModalRoomId] = useState('');
  const [passwordModalError, setPasswordModalError] = useState('');

  const [showGuestJoinModal, setShowGuestJoinModal] = useState(false);
  const [guestJoinRoomId, setGuestJoinRoomId] = useState('');
  const [guestJoinTemplate, setGuestJoinTemplate] = useState<RoomTemplate | null>(null);
  const [guestNameInput, setGuestNameInput] = useState('');

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const showConfirm = (message: string, description: string, onConfirm: () => void, confirmText = 'Xác nhận', cancelText = 'Huỷ') => {
    setConfirmDialog({ open: true, message, description, onConfirm, confirmText, cancelText });
  };
  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

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

  useEffect(() => {
    const updatePathname = () => setCurrentPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  useEffect(() => {
    const canonicalUrl = getCanonicalUrl(currentPathname);
    const schemas = [
      buildWebsiteSchema(),
      buildSoftwareApplicationSchema(),
      buildBreadcrumbSchema(currentPathname),
    ];

    document.title = currentSeoPage.title;

    const setMeta = (selector: string, attribute: 'content' | 'href', value: string) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute(attribute, value);
    };

    setMeta('meta[name="title"]', 'content', currentSeoPage.title);
    setMeta('meta[name="description"]', 'content', currentSeoPage.description);
    setMeta('meta[name="keywords"]', 'content', currentSeoPage.keywords.join(', '));
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', currentSeoPage.title);
    setMeta('meta[property="og:description"]', 'content', currentSeoPage.description);
    setMeta('meta[property="og:image"]', 'content', seoConfig.defaultImage);
    setMeta('meta[name="twitter:url"]', 'content', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'content', currentSeoPage.title);
    setMeta('meta[name="twitter:description"]', 'content', currentSeoPage.description);
    setMeta('meta[name="twitter:image"]', 'content', seoConfig.defaultImage);

    const schemaNode = document.getElementById('duhocmate-runtime-schema');
    if (schemaNode) {
      schemaNode.textContent = JSON.stringify(schemas);
    } else {
      const script = document.createElement('script');
      script.id = 'duhocmate-runtime-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schemas);
      document.head.appendChild(script);
    }
  }, [currentPathname, currentSeoPage]);

  // Navigation & Auth states
  // Hàm helper để điều hướng có URL sync
  const navigateToRoom = (id: string) => {
    window.location.hash = `room/${id}`;
  };
  const navigateToLanding = () => {
    window.location.hash = '';
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  // Khởi tạo view từ URL hash (để hỗ trợ reload trong phòng)
  const getInitialViewFromHash = (): { view: 'landing' | 'room'; roomId: string } => {
    const hash = window.location.hash; // e.g. "#room/ABC123"
    const hashMatch = hash.match(/^#room\/([A-Z0-9]+)$/i);
    if (hashMatch) {
      return { view: 'room', roomId: hashMatch[1].toUpperCase() };
    }
    // Fallback: support ?room=ABC123 (link mời cũ)
    const searchParams = new URLSearchParams(window.location.search);
    const qRoom = searchParams.get('room');
    if (qRoom) {
      const rid = qRoom.trim().toUpperCase();
      // Chuyển sang hash routing và xóa query param
      window.location.hash = `room/${rid}`;
      window.history.replaceState(null, '', `${window.location.pathname}#room/${rid}`);
      return { view: 'room', roomId: rid };
    }
    return { view: 'landing', roomId: '' };
  };

  const _initialNav = getInitialViewFromHash();
  const [view, setView] = useState<'landing' | 'room' | 'admin'>(_initialNav.view);
  const [roomId, setRoomId] = useState(_initialNav.roomId);
  const [roomInputId, setRoomInputId] = useState('');
  // Xử lý link mời: roomId lấy từ URL hash lúc mới mở app, và cờ đã xử lý (chỉ 1 lần)
  const initialHashRoomRef = useRef(_initialNav.view === 'room' ? _initialNav.roomId : '');
  const inviteJoinHandledRef = useRef(false);
  const [currentRoomTitle, setCurrentRoomTitle] = useState('');
  const [username, setUsername] = useState(() => {
    // Dùng profile.username nếu đã đăng nhập, không thì dùng localStorage
    return localStorage.getItem('duhocmate_username') || '';
  });
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [activeMemberMenuId, setActiveMemberMenuId] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('duhoc-mate-dark') === 'true';
  });

  const toggleDarkMode = () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    localStorage.setItem('duhoc-mate-dark', nextVal.toString());
    document.documentElement.classList.toggle('dark', nextVal);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // PWA Back Button & History Interceptor
  useEffect(() => {
    // 1. Pushing dummy state on Landing Page to prevent immediate app exit on Android back button
    if (view === 'landing') {
      if (window.history.state?.page !== 'landing') {
        window.history.pushState({ page: 'landing' }, '');
      }
    }

    const handlePopState = () => {
      if (isProgrammaticNavRef.current) {
        isProgrammaticNavRef.current = false;
        return;
      }

      const hash = window.location.hash;

      if (view === 'room') {
        const currentRoomHash = `#room/${roomId}`;
        if (hash !== currentRoomHash) {
          // Block navigation: force the hash back to the room hash immediately
          window.history.pushState({ page: 'room', roomId }, '', currentRoomHash);
          // Show leaving confirmation dialog
          handleLeaveRoom();
        }
      } else if (view === 'admin') {
        setView('landing');
        navigateToLanding();
      } else if (view === 'landing') {
        if (hash === '#forum' || hash.startsWith('#forum/post/')) {
          setShowHelpBoard(true);
        } else if (hash === '') {
          setShowHelpBoard(false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [view, roomId]);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // YouTube error handling
  const [videoError, setVideoError] = useState(false);

  // Session tracking cho popup tổng kết
  const joinTimeRef = useRef<number>(Date.now());
  const isProgrammaticNavRef = useRef(false);
  const songsPlayedRef = useRef<number>(0);
  const messagesSentRef = useRef<number>(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showMobileRoomMenu, setShowMobileRoomMenu] = useState(false);
  const [sessionStats, setSessionStats] = useState<StudySessionStats>({
    minutes: 0,
    songs: 0,
    messages: 0,
    pomodoros: 0,
    notes: 0,
    roomId: '',
    roomTitle: '',
    companions: [],
    leftAt: '',
  });

  // Help board – persists tab across page reloads
  const [showHelpBoard, setShowHelpBoard] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#forum' || window.location.hash.startsWith('#forum/post/'))) return true;
    try { return localStorage.getItem('duhocmate_show_forum') === 'true' } catch { return false }
  });
  useEffect(() => {
    try { localStorage.setItem('duhocmate_show_forum', String(showHelpBoard)) } catch {}
  }, [showHelpBoard]);

  const handleSetShowHelpBoard = (val: boolean) => {
    setShowHelpBoard(val);
    if (val) {
      window.location.hash = 'forum';
    } else {
      if (window.location.hash === '#forum' || window.location.hash.startsWith('#forum/post/')) {
        window.location.hash = '';
      }
    }
  };

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

  const [socketId, setSocketId] = useState(socket?.id || '');
  const [clockOffset, setClockOffset] = useState(0);

  // Room states
  const [members, setMembers] = useState<Member[]>([]);
  const myMember = members.find(m => m.id === socketId);
  const myRole = isHost ? 'host' : (myMember?.role || 'member');
  const canControlMusic = myRole === 'host' || myRole === 'cohost';
  const canReorderPlaylist = !!socketId && !!roomId;
  const canControlPomodoro = myRole === 'host' || myRole === 'cohost';
  const canModerateChat = myRole === 'host' || myRole === 'cohost' || myRole === 'moderator';
  const isHostConnected = members.some(m => m.isHost);
  const isPrimaryMusicController = isHost || (!isHostConnected && myRole === 'cohost' && members.filter(m => m.role === 'cohost')[0]?.id === socketId);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [visibleChatCount, setVisibleChatCount] = useState(INITIAL_VISIBLE_CHAT_MESSAGES);
  // StageMode controls the main room module: media, focus timer, TOPIK, or idea board.
  const [stageMode, setStageMode] = useState<StageMode>('youtube');
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'playlist' | 'members'>('playlist');
  const [mobileCompactView, setMobileCompactView] = useState<'youtube' | 'video' | 'topik' | 'chat' | 'pdf' | 'game'>('youtube');
  interface RoomActivity {
    id: string;
    type: 'chat' | 'reaction';
    senderName: string;
    content: string;
    createdAt: number;
  }
  const [latestActivity, setLatestActivity] = useState<RoomActivity | null>(null);
  const [activeActivity, setActiveActivity] = useState<RoomActivity | null>(null);
  const [showDesktopTicker, setShowDesktopTicker] = useState(false);
  const [showMobileTicker, setShowMobileTicker] = useState(false);

  useEffect(() => {
    if (!latestActivity) return;
    setActiveActivity(latestActivity);
    setShowDesktopTicker(true);
    setShowMobileTicker(true);
    const timer = setTimeout(() => {
      setShowDesktopTicker(false);
      setShowMobileTicker(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [latestActivity]);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [ideaTasks, setIdeaTasks] = useState<IdeaTask[]>([]);
  const [roomCollapsed, setRoomCollapsed] = useState(false);
  useEffect(() => {
    if (stageMode !== 'youtube') {
      setRoomCollapsed(false);
    }
  }, [stageMode]);

  const openMobileCompactView = (view: typeof mobileCompactView) => {
    setMobileCompactView(view);
    if (view === 'youtube' || view === 'video' || view === 'topik' || view === 'pdf' || view === 'game') {
      setStageMode(view);
      // Auto-show playlist panel when switching to youtube tab on mobile
      if (view === 'youtube') {
        setSidebarTab('playlist');
      }
      if (view === 'video' && !jitsiActive) {
        setJitsiActive(true);
        if (roomIdRef.current) {
          socket.emit('study-table-action', { roomId: roomIdRef.current, type: 'presence', payload: { active: true } });
        }
      }
    } else {
      setSidebarTab('chat');
      setUnreadChatCount(0);
    }
  };
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const loadingNewVideoRef = useRef(false);

  useEffect(() => {
    if (showInviteModal && roomId) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}#room/${roomId}`;
      QRCode.toDataURL(inviteUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [showInviteModal, roomId]);

  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [roomTheme, setRoomTheme] = useState<RoomThemeKey>('cream');
  const [roomSettingsName, setRoomSettingsName] = useState('');
  const [roomSettingsPublic, setRoomSettingsPublic] = useState(true);
  const [roomSettingsPassword, setRoomSettingsPassword] = useState('');
  const [roomBackgroundUrl, setRoomBackgroundUrl] = useState('');
  const [roomAvatarUrl] = useState('');
  const [currentRoomAvatarUrl, setCurrentRoomAvatarUrl] = useState('');
  const [roomAvatarFile, setRoomAvatarFile] = useState<File | null>(null);
  const [roomAvatarPreview, setRoomAvatarPreview] = useState('');
  const [roomAvatarUploading, setRoomAvatarUploading] = useState(false);
  const [roomBgFile, setRoomBgFile] = useState<File | null>(null);
  const [roomBgPreview, setRoomBgPreview] = useState('');

  // TikTok states
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [tiktokVideoId, setTiktokVideoId] = useState('');

  // YouTube states
  const [songSearch, setSongSearch] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState<any[]>([]);
  const [musicSearchLoading, setMusicSearchLoading] = useState(false);
  const [musicSearchError, setMusicSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  // Gợi ý "nghe tiếp" khi hết danh sách phát (cùng thể loại với bài vừa kết thúc)
  const [relatedSuggestions, setRelatedSuggestions] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedBasedOn, setRelatedBasedOn] = useState('');
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
  const playlistScrollRef = useRef<HTMLDivElement>(null);
  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
    if (roomId) {
      preloadTrendingMusic();
    }
  }, [roomId]);

  // Tự động tải trước gợi ý nhạc xu hướng ngầm ngay khi người dùng truy cập trang web
  useEffect(() => {
    preloadTrendingMusic();
  }, []);
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  const canControlMusicRef = useRef(canControlMusic);
  useEffect(() => { canControlMusicRef.current = canControlMusic; }, [canControlMusic]);
  const isPrimarySyncSourceRef = useRef(isPrimaryMusicController);
  useEffect(() => { isPrimarySyncSourceRef.current = isPrimaryMusicController; }, [isPrimaryMusicController]);
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
  // Lệch đồng hồ client→server (ms): serverNow ≈ Date.now() + clockOffsetRef. Dùng để bù trễ video.
  const clockOffsetRef = useRef<number>(0);
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
  const miniActiveLyricRef = useRef<HTMLParagraphElement>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const miniLyricsScrollRef = useRef<HTMLDivElement>(null);
  const lastSearchQueryRef = useRef('');
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  useEffect(() => {
    const trimmed = songSearch.trim();
    if (!trimmed) {
      setMusicSearchResults([]);
      setShowSearchResults(false);
      setMusicSearchError('');
      lastSearchQueryRef.current = '';
      return;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (trimmed === lastSearchQueryRef.current) return;
      lastSearchQueryRef.current = trimmed;
      setMusicSearchLoading(true);
      setMusicSearchError('');
      setShowSearchResults(true);
      try {
        const SEARCH_URL = `${getApiBaseCandidates()[0]}/api/search-music`;
        const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.error && !data.results?.length) {
          setMusicSearchError(data.error);
        } else {
          setMusicSearchResults(data.results || []);
        }
      } catch (err: any) {
        setMusicSearchError('Không thể kết nối server tìm kiếm. Hãy thử lại.');
      } finally {
        setMusicSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [songSearch]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const advanceToNextPlaylistItem = (player?: any) => {
    if (!isHostRef.current || advancingPlaylistRef.current) return false;

    const current = currentVideoRef.current;
    const nextItem = getNextPlaylistItem(playlistRef.current, {
      playlistItemId: current.playlistItemId,
      videoId: current.id,
    });
    if (!nextItem) return false;

    advancingPlaylistRef.current = true;
    hostWantsToPlayRef.current = true;
    hostLastPauseAtRef.current = 0;
    setRelatedSuggestions([]); // còn bài để phát → ẩn gợi ý "nghe tiếp"
    const nextVideoState = { id: nextItem.videoId, time: 0, playing: true, playlistItemId: nextItem.id };
    setVideoError(false);
    setCurrentVideo(nextVideoState);
    const activePlayer = player || playerRef.current;
    const currentVideoIdInPlayer = activePlayer?.getVideoData?.()?.video_id;
    if (currentVideoIdInPlayer !== nextItem.videoId) {
      loadingNewVideoRef.current = true;
      activePlayer?.loadVideoById?.(nextItem.videoId, 0);
    }
    socket.emit('video-action', {
      roomId: roomIdRef.current,
      action: 'play',
      time: 0,
      videoId: nextItem.videoId,
      playlistItemId: nextItem.id,
      userInitiated: true,
    });
    return true;
  };

  // ── Voice Chat (WebRTC) ────────────────────────────────────────────────────
  // socket là module-level let, có thể undefined trên first render → cast an toàn
  const voiceChat = useVoiceChat((socket as Socket | null) ?? null, roomId, isHost);
  const activeStudyCameraCount = useMemo(() => {
    const activeIds = new Set<string>();
    voiceChat.voiceUsers.forEach((state, userId) => {
      if (state.cameraOn) activeIds.add(userId);
    });
    if (voiceChat.isCameraOn && socketId) activeIds.add(socketId);
    return activeIds.size;
  }, [socketId, voiceChat.isCameraOn, voiceChat.voiceUsers]);

  const canUseCameraInCrowdedRoom = myRole === 'host' || myRole === 'cohost' || (voiceChat.isInVoice && voiceChat.isSpeaking);
  const isStudyRoomCrowded = members.length >= STUDY_ROOM_CROWDED_THRESHOLD;
  const canStartStudyCamera = !voiceChat.isCameraOn
    ? activeStudyCameraCount < MAX_ACTIVE_STUDY_CAMERAS && (!isStudyRoomCrowded || canUseCameraInCrowdedRoom)
    : true;
  const cameraPolicyNotice = useMemo(() => {
    if (activeStudyCameraCount >= MAX_ACTIVE_STUDY_CAMERAS && !voiceChat.isCameraOn) {
      return t('study.cameraNotice.maxActive', { max: MAX_ACTIVE_STUDY_CAMERAS });
    }
    if (isStudyRoomCrowded && !canUseCameraInCrowdedRoom && !voiceChat.isCameraOn) {
      return t('study.cameraNotice.crowdedRestricted', { count: members.length, limit: STUDY_ROOM_SOFT_LIMIT });
    }
    if (members.length >= STUDY_ROOM_SOFT_LIMIT) {
      return t('study.cameraNotice.softLimit', { limit: STUDY_ROOM_SOFT_LIMIT, max: MAX_ACTIVE_STUDY_CAMERAS });
    }
    if (members.length >= STUDY_ROOM_CROWDED_THRESHOLD) {
      return t('study.cameraNotice.crowded', { count: members.length, limit: STUDY_ROOM_SOFT_LIMIT });
    }
    return null;
  }, [activeStudyCameraCount, canUseCameraInCrowdedRoom, isStudyRoomCrowded, members.length, t, voiceChat.isCameraOn]);

  const handleStudyCameraToggle = async () => {
    if (voiceChat.isCameraOn) {
      await voiceChat.toggleCamera();
      return;
    }
    if (!canStartStudyCamera) {
      window.alert(cameraPolicyNotice || t('study.cameraNotice.maxSimple', { max: MAX_ACTIVE_STUDY_CAMERAS }));
      return;
    }
    await voiceChat.toggleCamera();
  };

  // Slide URL states (Google Slides / Canva embed)

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
  const [studyTable, setStudyTable] = useState<StudyTableState>({ seats: {}, reactions: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const visibleChatMessages = useMemo(
    () => chatMessages.slice(Math.max(0, chatMessages.length - visibleChatCount)),
    [chatMessages, visibleChatCount]
  );
  const hasOlderChatMessages = visibleChatCount < chatMessages.length;

  const loadOlderChatMessages = () => {
    setVisibleChatCount(count => Math.min(chatMessages.length, count + CHAT_MESSAGES_PAGE_SIZE));
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
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      if (!globalAny._socket) {
        globalAny._socket = io(SOCKET_URL);
      }
      socket = globalAny._socket;
    }

    if (socket && !socket.connected) {
      socket.connect();
    }

    // Đồng bộ đồng hồ với server (NTP đơn giản): đo RTT, tính offset chính xác
    socket.on('pong-time', ({ clientT0, serverTime }: { clientT0: number; serverTime: number }) => {
      const t1 = Date.now();
      const rtt = t1 - clientT0;
      if (rtt >= 0 && rtt < 5000) {
        // serverNow tại t1 ≈ serverTime + rtt/2  →  offset = serverNow - t1
        const offset = serverTime + rtt / 2 - t1;
        clockOffsetRef.current = offset;
        setClockOffset(offset);
      }
    });
    const sendPing = () => { if (socket?.connected) socket.emit('ping-time', Date.now()); };
    const handleConnect = () => {
      setSocketId(socket.id || '');
      sendPing();
      if (roomIdRef.current) {
        const savedUsername = localStorage.getItem('duhocmate_username') || '';
        const savedFriendCode = localStorage.getItem('duhocmate_friend_code') || '';
        if (savedUsername) {
          socket.emit('join-room', {
            roomId: roomIdRef.current,
            username: savedUsername,
            friendCode: savedFriendCode,
            avatarUrl: profile?.avatar_url || ''
          });
        }
      }
    };
    if (socket?.connected) {
      handleConnect();
    }
    socket.on('connect', handleConnect);
    const clockPingInterval = window.setInterval(sendPing, 20000);

    socket.on('room-users', (users: Member[]) => {
      setMembers(prev => {
        const oldHost = prev.find(m => m.isHost);
        const newHost = users.find(m => m.isHost);
        if (oldHost && newHost && oldHost.id !== newHost.id && newHost.id !== socketId) {
          setCustomAlert({ message: `${newHost.username} đã trở thành chủ phòng học!`, show: true });
        }
        return users;
      });
      // Tìm xem mình có phải host mới không (trong trường hợp host cũ rời phòng)
      const me = users.find(u => u.id === socketId);
      if (me) setIsHost(me.isHost);
    });

    socket.on('init-room-state', ({ playlist, videoState, pomodoro, chatMessages, isHost, tiktokVideoId, ideaTasks, studyTable, pinnedMessage: initPinnedMessage, roomAvatarUrl: initRoomAvatar, roomBackgroundUrl: initRoomBg }) => {
      setPlaylist(playlist);
      if (typeof initRoomAvatar === 'string') setCurrentRoomAvatarUrl(initRoomAvatar);
      if (typeof initRoomBg === 'string') setRoomBackgroundUrl(initRoomBg);
      setCurrentVideo(videoState);
      setVideoError(false);
      // Reset session tracking
      joinTimeRef.current = Date.now();
      songsPlayedRef.current = 0;
      messagesSentRef.current = 0;
      setPomodoro(pomodoro);
      setChatMessages(chatMessages || []);
      setVisibleChatCount(INITIAL_VISIBLE_CHAT_MESSAGES);
      setPinnedMessage(initPinnedMessage || null);
      setIdeaTasks(ideaTasks || []);
      setStudyTable(studyTable || { seats: {}, reactions: [] });
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
        setCustomAlert({ message: 'Bạn đã trở thành chủ phòng học!', show: true });
      }
    });

    socket.on('room-settings-updated', ({ roomTitle, isPrivate, roomAvatarUrl: updRoomAvatar, roomBackgroundUrl: updRoomBg }: { roomTitle?: string; isPrivate?: boolean; roomAvatarUrl?: string; roomBackgroundUrl?: string }) => {
      if (roomTitle) {
        setCurrentRoomTitle(roomTitle);
        setRoomSettingsName(roomTitle);
      }
      if (typeof isPrivate === 'boolean') {
        setRoomSettingsPublic(!isPrivate);
      }
      if (typeof updRoomAvatar === 'string') setCurrentRoomAvatarUrl(updRoomAvatar);
      if (typeof updRoomBg === 'string') setRoomBackgroundUrl(updRoomBg);
    });

    socket.on('room-closed', ({ roomId: closedRoomId }: { roomId: string }) => {
      setCustomAlert({ message: `Phòng ${closedRoomId} đã được host đóng.`, show: true });
      setView('landing');
      setRoomId('');
      navigateToLanding();
      socket.emit('request-active-rooms');
    });

    socket.on('receive-message', (msg: Message) => {
      setChatMessages(prev => [...prev, msg]);
      setVisibleChatCount(count => Math.max(INITIAL_VISIBLE_CHAT_MESSAGES, count));
      // Increment unread count if not viewing chat
      setUnreadChatCount(prev => {
        // Nếu user không đang xem chat, increment counter
        // Nếu đang xem, không increment
        return sidebarTab !== 'chat' ? prev + 1 : 0;
      });
      setLatestActivity({
        id: msg.id || String(Date.now()),
        type: 'chat',
        senderName: msg.sender || 'Bạn học',
        content: msg.text || '',
        createdAt: Date.now()
      });
      setTimeout(scrollToBottom, 50);
    });

    socket.on('chat-error', ({ code, message }: { code?: string; message?: string }) => {
      const key = code === 'rateLimit' ? 'chat.errorRateLimit' : code === 'invalid' ? 'chat.errorInvalid' : 'chat.error';
      setCustomAlert({ message: message || t(key), show: true });
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
        if (iframeContainerRef.current) {
          iframeContainerRef.current.style.visibility = 'visible';
        }
      }
      // Nếu host dừng → show toast cho non-host
      if (action === 'pause' && !isHostRef.current) {
        setShowHostPausedToast(true);
      }

      if (!playerRef.current) return;

      const currentVideoIdInPlayer = playerRef.current.getVideoData?.()?.video_id;
      if (videoId && currentVideoIdInPlayer !== videoId) {
        loadingNewVideoRef.current = true;
        playerRef.current.loadVideoById(videoId, time || 0);
      }

      if (action === 'play') {
        // Bù trễ để guest tới đúng vị trí host ĐANG xem:
        //  target = time + (thời gian trôi từ lúc server đóng dấu, theo đồng hồ ĐÃ ĐỒNG BỘ)
        //                 + VIDEO_SYNC_BUFFER (bù thời gian YouTube buffer khi seek).
        let target = time;
        if (typeof time === 'number') {
          const serverNow = Date.now() + clockOffset;
          const elapsed = typeof videoState?.lastUpdated === 'number'
            ? (serverNow - videoState.lastUpdated) / 1000
            : 0;
          target = time + Math.min(Math.max(elapsed, 0), 3) + VIDEO_SYNC_BUFFER;
        }
        // Seek nếu lệch > 0.6s (siết để bắt được độ trễ ~1s)
        if (typeof target === 'number' && Math.abs(playerRef.current.getCurrentTime() - target) > 0.6) {
          playerRef.current.seekTo(target, true);
        }
        if (playerVolume > 0) {
          playerRef.current.unMute?.();
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

    socket.on('study-table-sync', (state: StudyTableState) => {
      setStudyTable(prevTable => {
        const nextReactions = state?.reactions || [];
        const prevReactions = prevTable?.reactions || [];
        
        if (nextReactions.length > 0) {
          const lastReaction = nextReactions[nextReactions.length - 1];
          const hasAlreadySeen = prevReactions.some(r => r.id === lastReaction.id);
          
          if (!hasAlreadySeen) {
            setLatestActivity({
              id: lastReaction.id,
              type: 'reaction',
              senderName: lastReaction.senderName || 'Bạn học',
              content: lastReaction.label,
              createdAt: Date.now()
            });
          }
        }
        
        return {
          seats: state?.seats || {},
          reactions: nextReactions
        };
      });
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
      navigateToLanding();
    });

    // Auto-rejoin nhanh khi reload trong phòng và đã có tên sẵn (tránh nháy màn).
    // Trường hợp người được MỜI chưa có tên được xử lý ở effect riêng (gated theo auth loading) bên dưới.
    const initHash = window.location.hash;
    const initMatch = initHash.match(/^#room\/([A-Z0-9]+)$/i);
    if (initMatch) {
      const initRoomId = initMatch[1].toUpperCase();
      const savedUsername = localStorage.getItem('duhocmate_username') || '';
      const savedFriendCode = localStorage.getItem('duhocmate_friend_code') || '';
      if (savedUsername) {
        inviteJoinHandledRef.current = true;
        socket.emit('join-room', {
          roomId: initRoomId,
          username: savedUsername,
          friendCode: savedFriendCode,
          avatarUrl: profile?.avatar_url || ''
        });
      }
    }

    // Đăng ký thông tin của bản thân và yêu cầu danh sách phòng ban đầu
    const localUsername = localStorage.getItem('duhocmate_username') || '';
    const localFriendCode = localStorage.getItem('duhocmate_friend_code') || '';
    socket.emit('register-user', { friendCode: localFriendCode, username: localUsername });
    socket.emit('request-active-rooms');

    return () => {
      window.clearInterval(clockPingInterval);
      if (socket) {
        socket.off('pong-time');
        socket.off('connect', handleConnect);
        socket.off('room-users');
        socket.off('init-room-state');
        socket.off('assigned-host');
        socket.off('room-settings-updated');
        socket.off('room-closed');
        socket.off('receive-message');
        socket.off('chat-error');
        socket.off('update-playlist');
        socket.off('video-sync');
        socket.off('pomodoro-sync');
        socket.off('study-table-sync');
        socket.off('idea-board-sync');
        socket.off('pomodoro-done');
        socket.off('active-rooms-list');
        socket.off('tiktok-sync');
        socket.off('online-users-changed');
        socket.off('join-room-error');
        // Không disconnect socket vì được share qua window._socket
        // socket.disconnect() sẽ cắt kết nối WebSocket thật → update-playlist không nhận được
      }
    };
  }, []);

  // Sync username từ Supabase profile khi login/logout
  useEffect(() => {
    if (profile?.username) {
      if (profile.username !== username) {
        setUsername(profile.username);
        localStorage.setItem('duhocmate_username', profile.username);
      }
    } else {
      setUsername('');
    }
  }, [profile]);

  // LINK MỜI: khi mở app trực tiếp vào #room/XXX. Chờ auth tải xong rồi:
  //  - Có tên (đã đăng nhập hoặc đã từng đặt tên) → join thẳng vào phòng đang có.
  //  - Chưa có tên (khách mới) → hiện popup nhập tên, nhập xong sẽ join (trước đây
  //    không emit join-room nên ra phòng rỗng / về landing).
  useEffect(() => {
    if (loading) return;
    if (inviteJoinHandledRef.current) return;
    const target = initialHashRoomRef.current;
    if (!target) return; // chỉ xử lý khi mở app trực tiếp vào #room/XXX (link mời)

    const name = (profile?.username || localStorage.getItem('duhocmate_username') || '').trim();
    if (name) {
      inviteJoinHandledRef.current = true;
      setRoomId(target);
      setView('room');
      socket?.emit('join-room', {
        roomId: target,
        username: name,
        friendCode: localStorage.getItem('duhocmate_friend_code') || friendCode || '',
        avatarUrl: profile?.avatar_url || '',
      });
    } else if (!user) {
      inviteJoinHandledRef.current = true;
      setGuestJoinRoomId(target);
      setGuestJoinTemplate(null);
      setGuestNameInput('');
      setShowGuestJoinModal(true);
    }
  }, [loading, profile?.username, user]);

  // Khi avatar đổi (đăng nhập, đổi ảnh đại diện…) → cập nhật realtime cho cả phòng.
  // Dùng `roomId` thay vì `view === 'room'` vì modal đổi ảnh nằm ở trang landing
  // (lúc thu nhỏ phòng view='landing') → nếu chờ view==='room' thì phải reload mới thấy.
  useEffect(() => {
    if (roomId && profile?.avatar_url) {
      socket?.emit('update-avatar', { roomId, avatarUrl: profile.avatar_url });
    }
  }, [profile?.avatar_url, roomId]);

  useEffect(() => {
    if (roomId && profile?.username) {
      socket?.emit('update-username', { roomId, username: profile.username });
    }
  }, [profile?.username, roomId]);

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

  // Tự động cuộn xuống cuối khi có bài mới được thêm vào danh sách
  const prevPlaylistLengthRef = useRef(0);
  useEffect(() => {
    const newLen = playlist.length;
    const prevLen = prevPlaylistLengthRef.current;
    if (newLen > prevLen && playlistScrollRef.current) {
      // Delay nhỏ để DOM render xong rồi mới scroll
      setTimeout(() => {
        if (playlistScrollRef.current) {
          playlistScrollRef.current.scrollTo({ top: playlistScrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 80);
    }
    prevPlaylistLengthRef.current = newLen;
  }, [playlist.length]);

  // Tự động cuộn danh sách phát để đưa bài đang phát vào chính giữa
  useEffect(() => {
    if (currentVideo.id && view === 'room') {
      setTimeout(() => {
        const element = document.querySelector('.playing-item-container');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }, 200);
    }
  }, [currentVideo.id, playlist, view]);

  // === YouTube IFrame API – Khá�  // Init or update player when currentVideo.id becomes available
  useEffect(() => {
    if (roomId === '') return;
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
            } else {
              if (iframeContainerRef.current) {
                iframeContainerRef.current.style.visibility = 'visible';
              }
              if (playerVolume > 0) {
                event.target.unMute?.();
              }
            }
            if (currentVideoRef.current.playing) {
              event.target.playVideo();
            }
            // Vào đúng vị trí host đang xem: time lúc host gửi + thời gian đã trôi (đồng hồ đã đồng bộ) + bù buffer
            let startAt = currentVideoRef.current.time || 0;
            if (currentVideoRef.current.playing && typeof currentVideoRef.current.lastUpdated === 'number') {
              const serverNow = Date.now() + clockOffset;
              const elapsed = (serverNow - currentVideoRef.current.lastUpdated) / 1000;
              if (elapsed > 0 && elapsed < 30) startAt += elapsed + VIDEO_SYNC_BUFFER;
            }
            if (startAt > 0) {
              event.target.seekTo(startAt, true);
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

            // 1. Reset loading flag when the video successfully starts playing
            if (state === 1) {
              loadingNewVideoRef.current = false;
              advancingPlaylistRef.current = false;
            }

            // 2. Autoplay enforcement during transition / load
            if (loadingNewVideoRef.current && (state === 2 || state === 5 || state === -1)) {
              const wantsToPlay = canControlMusicRef.current ? cvr.playing : !isHostPausedRef.current;
              if (wantsToPlay) {
                console.log(`[YT-STATE] ${canControlMusicRef.current ? 'Music Controller' : 'NON-HOST'} forcing play during video transition (state=${state})`);
                event.target.playVideo();
                return;
              }
            }

            // Non-host: chỉ cập nhật local state, KHÔNG emit socket
            if (!canControlMusicRef.current) {
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

            if (state === 0 && !advancingPlaylistRef.current) {
              const advanced = advanceToNextPlaylistItem(event.target);
              if (!advanced) {
                // Hết danh sách phát → gợi ý bài cùng thể loại với bài vừa kết thúc
                const endedId = currentVideoRef.current?.id;
                const endedTitle =
                  event.target.getVideoData?.()?.title ||
                  playlistRef.current.find(i => i.videoId === endedId)?.title ||
                  '';
                if (endedTitle) fetchRelatedSuggestions(endedTitle);
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
        const currentVideoIdInPlayer = playerRef.current.getVideoData?.()?.video_id;
        if (currentVideoIdInPlayer !== currentVideo.id) {
          loadingNewVideoRef.current = true;
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
    }

    // Interval đồng bộ thời gian (chỉ host gửi, CHỈ khi đang play)
    // Không emit khi host đang pause - tránh non-host bị seek + auto-play loop
    const interval = setInterval(() => {
      if (
        isPrimarySyncSourceRef.current &&
        playerRef.current?.getCurrentTime &&
        currentVideoRef.current.playing
      ) {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration?.();
        if (
          typeof duration === 'number' &&
          duration > 5 &&
          time >= duration - 1.5 &&
          advanceToNextPlaylistItem(playerRef.current)
        ) {
          return;
        }
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
  }, [roomId, currentVideo.id, playerReinitTrigger]);

  // Hủy player khi rời phòng (view khác 'room' và không ở chế độ thu nhỏ)
  useEffect(() => {
    if (view !== 'room' && roomId === '') {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    }
  }, [view, roomId]);

  // Load video mới khi currentVideo.id thay đổi (nhưng player đã tồn tại)
  useEffect(() => {
    if (!playerRef.current) return;
    if (!currentVideo.id) return;

    if (playerRef.current.loadVideoById) {
      const currentVideoIdInPlayer = playerRef.current.getVideoData?.()?.video_id;
      if (currentVideoIdInPlayer !== currentVideo.id) {
        loadingNewVideoRef.current = true;
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
    setJitsiActive(prev => {
      const next = !prev;
      if (roomIdRef.current) {
        socket.emit('study-table-action', {
          roomId: roomIdRef.current,
          type: 'presence',
          payload: { active: next }
        });
      }
      return next;
    });
  };

  // Dừng timer khi tab bị ẩn, tiếp tục khi tab hiện lại
  useEffect(() => {
    const handleVisibility = () => {
      if (!roomIdRef.current || !jitsiActive) return;
      socket.emit('study-table-action', {
        roomId: roomIdRef.current,
        type: 'presence',
        payload: { active: !document.hidden }
      });
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [jitsiActive]);

  const sendStudyReaction = (label: string, targetMemberId?: string) => {
    if (!roomIdRef.current) return;
    socket.emit('study-table-action', {
      roomId: roomIdRef.current,
      type: 'reaction',
      payload: { label, targetMemberId }
    });
  };

  const controlPersonalPomodoro = (action: 'start' | 'pause' | 'reset', isBreak = false) => {
    if (!roomIdRef.current) return;
    socket.emit('study-table-action', {
      roomId: roomIdRef.current,
      type: 'personal-pomodoro',
      payload: { action, isBreak }
    });
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
    if (!socket || !socket.connected) {
      alert("Đang kết nối tới server...");
      return;
    }
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
      avatarUrl: profile?.avatar_url || '',
      friendCode
    });
    setView('room');
    navigateToRoom(generatedId);
  };

  const handleJoinRoom = async (
    e?: React.FormEvent | string,
    enteredPassword?: string,
    isGuestConfirmed?: boolean,
    guestUsername?: string
  ) => {
    if (!socket || !socket.connected) {
      alert("Đang kết nối tới server...");
      return;
    }

    let targetRoomId = roomInputId;
    if (typeof e === 'string') {
      targetRoomId = e;
    } else if (e) {
      e.preventDefault();
    }

    if (!targetRoomId.trim()) return alert("Vui lòng nhập mã phòng!");
    
    const formattedId = targetRoomId.trim().toUpperCase();

    // Nếu chưa đăng nhập và chưa có profile khách, bắt buộc hiện popup nhập tên khách / đăng nhập Google
    if (!user && !profile?.username && !isGuestConfirmed) {
      setGuestJoinRoomId(formattedId);
      setGuestJoinTemplate(null);
      setGuestNameInput(username || '');
      setShowGuestJoinModal(true);
      return;
    }

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

    // Kiểm tra phòng có tồn tại hay không.
    // Phòng từ LINK MỜI (mở app trực tiếp vào #room/XXX) luôn được tin tưởng —
    // bỏ qua kiểm tra này để tránh báo "không tồn tại" khi danh sách phòng chưa kịp đồng bộ.
    const isInviteRoom = formattedId === initialHashRoomRef.current;
    const isTemplateRoom = seedRoomIds.has(formattedId) || templates.some(t => getTemplateRoomId(t) === formattedId);
    if (!matchedActive && !storedRoomRecord && !isTemplateRoom && !isInviteRoom) {
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
        setPasswordModalError('');
        setShowPasswordModal(true);
        return;
      }
    }

    if (isPrivate && enteredPassword) {
      // Chỉ xem là chủ phòng chính thức nếu trùng ID chủ phòng trong database
      const isVerifiedHost = user && storedRoomRecord && storedRoomRecord.hostUserId === user.id;

      if (storedRoomRecord && storedRoomRecord.passwordHash) {
        const enteredHash = await hashRoomPassword(enteredPassword);
        if (enteredHash !== storedRoomRecord.passwordHash) {
          // Bỏ qua kiểm tra mật khẩu nếu là host đã được xác minh qua auth
          if (!isVerifiedHost) {
            // Sai mật khẩu -> Xoá mật khẩu lưu ở local storage nếu có để yêu cầu nhập lại
            try {
              const roomPasswordsRaw = localStorage.getItem('duhocmate_room_passwords');
              const roomPasswords = roomPasswordsRaw ? JSON.parse(roomPasswordsRaw) : {};
              delete roomPasswords[formattedId];
              localStorage.setItem('duhocmate_room_passwords', JSON.stringify(roomPasswords));
            } catch {}

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

    setRoomId(formattedId);
    socket.emit('join-room', {
      roomId: formattedId,
      username: guestUsername || username,
      password: enteredPassword || '',
      friendCode,
      avatarUrl: profile?.avatar_url || ''
    });
    setShowPasswordModal(false);
    setView('room');
    navigateToRoom(formattedId);
  };

  const handlePasswordModalSubmit = (password: string) => {
    handleJoinRoom(passwordModalRoomId, password);
  };

  const handleJoinTemplateRoom = async (
    template: RoomTemplate,
    isGuestConfirmed?: boolean,
    guestUsername?: string
  ) => {
    const fixedRoomId = getTemplateRoomId(template);
    const templateAvatarUrl = template.roomAvatarUrl || '';

    // Nếu chưa đăng nhập và chưa có profile khách, bắt buộc hiện popup nhập tên khách / đăng nhập Google
    if (!user && !profile?.username && !isGuestConfirmed) {
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
    setCurrentRoomAvatarUrl(templateAvatarUrl);
    setIdeaTasks(seedTasks);
    setStageMode('ideas');

    const newRecent = [
      { id: fixedRoomId, hostName: template.title, currentSong: 'Phòng mở 24/24', roomTitle: template.title, roomAvatarUrl: templateAvatarUrl },
      ...recentRooms.filter(r => r.id !== fixedRoomId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));

    socket.emit('join-room', { roomId: fixedRoomId, username: guestUsername || username, ideaTasks: seedTasks, friendCode, roomTitle: template.title, roomAvatarUrl: templateAvatarUrl, avatarUrl: profile?.avatar_url || '' });
    setView('room');
    navigateToRoom(fixedRoomId);
  };

  const handleGuestJoinSubmitWithName = async (cleanName: string) => {
    let guestId = localStorage.getItem('forum_guest_id');
    if (!guestId) {
      guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('forum_guest_id', guestId);
    }

    setUsername(cleanName);
    localStorage.setItem('duhocmate_username', cleanName);
    setShowGuestJoinModal(false);

    try {
      await updateProfile({ username: cleanName });
    } catch (err) {
      console.warn('Failed to initialize guest profile in Supabase:', err);
    }

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
    const companions = members
      .filter(member => member.id !== socketId)
      .map(member => member.username)
      .filter(Boolean)
      .slice(0, 8);
    const notes = ideaTasks.filter(task => task.title.trim() || task.note?.trim()).length;
    setSessionStats({
      minutes,
      songs: songsPlayedRef.current,
      messages: messagesSentRef.current,
      pomodoros: Math.floor(minutes / 25),
      notes,
      roomId,
      roomTitle: currentRoomTitle || `Phòng ${roomId}`,
      companions,
      leftAt: new Date().toISOString(),
    });
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = () => {
    try {
      const rawHistory = localStorage.getItem(STUDY_SESSION_HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      localStorage.setItem(
        STUDY_SESSION_HISTORY_KEY,
        JSON.stringify([sessionStats, ...(Array.isArray(history) ? history : [])].slice(0, 50))
      );
    } catch (error) {
      console.warn('Không thể lưu lịch sử phiên học:', error);
    }

    // Rời phòng: ngắt socket khỏi phòng, reset state, về landing (KHÔNG reload page)
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    // Destroy YouTube player
    if (playerRef.current?.destroy) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    setShowLeaveConfirm(false);
    setView('landing');
    setRoomId('');
    setCurrentRoomTitle('');
    setMembers([]);
    setPlaylist([]);
    setChatMessages([]);
    setVisibleChatCount(INITIAL_VISIBLE_CHAT_MESSAGES);
    setCurrentVideo({ id: '', time: 0, playing: false });
    setIdeaTasks([]);
    setPomodoro({ timeLeft: 25 * 60, duration: 25 * 60, isRunning: false, isBreak: false });
    isProgrammaticNavRef.current = true;
    navigateToLanding();
    socket.emit('request-active-rooms');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomInvite = () => {
    // Dùng hash routing để invite link hoạt động đúng khi reload
    const invite = `${window.location.origin}${window.location.pathname}#room/${roomId}`;
    navigator.clipboard.writeText(invite);
    setShowInviteModal(true);
    setCustomAlert({ message: 'Đã sao chép link mời vào phòng.', show: true });
  };

  const updateMemberRole = (targetId: string, role: string) => {
    socket.emit('update-member-role', { roomId, targetId, role });
    setActiveMemberMenuId(null);
  };

  const muteUser = (targetId: string, durationMinutes: number) => {
    socket.emit('mute-user', { roomId, targetId, durationMinutes });
    setActiveMemberMenuId(null);
  };

  const unmuteUser = (targetId: string) => {
    socket.emit('unmute-user', { roomId, targetId });
    setActiveMemberMenuId(null);
  };

  const deleteMessage = (messageId: string) => {
    socket.emit('delete-message', { roomId, messageId });
  };

  const pinMessage = (messageId: string) => {
    socket.emit('pin-message', { roomId, messageId });
  };

  const unpinMessage = () => {
    socket.emit('unpin-message', { roomId });
  };

  const toggleMiniPlayback = () => {
    const currentTime = playerRef.current?.getCurrentTime?.() || currentVideo.time || 0;
    if (canControlMusicRef.current) {
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
      : members.find(member => member.id !== socketId);
    if (!target) {
      setCustomAlert({ message: 'Chưa có bạn học khác để chuyển host.', show: true });
      return;
    }
    socket.emit('transfer-host', { roomId, targetId: target.id });
  };

  const saveRoomSettings = async () => {
    const nextName = roomSettingsName.trim() || currentRoomTitle || `Phòng ${roomId}`;
    setCurrentRoomTitle(nextName);
    setRoomAvatarUploading(true);
    let finalAvatarUrl = roomAvatarUrl || currentRoomAvatarUrl;
    // Folder hợp lệ với RLS: user đăng nhập → "{uid}/...", khách → "guests/{guestId}/..."
    const guestId = localStorage.getItem('forum_guest_id') || profile?.id || '';
    const storageFolder = user?.id ? user.id : (guestId ? `guests/${guestId}` : '');

    // Upload 1 file: thử Storage trước, lỗi (vd RLS) thì rớt về base64 thu nhỏ.
    const uploadRoomImage = async (file: File, prefix: string, maxSize: number): Promise<string | null> => {
      if (supabase && storageFolder) {
        try {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${storageFolder}/rooms/${roomId}/${prefix}${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { cacheControl: '3600', upsert: true });
          if (uploadError) throw uploadError;
          return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        } catch (e) {
          console.warn(`Upload ${prefix || 'avatar'} phòng lên Storage thất bại, dùng base64:`, e);
        }
      }
      try {
        return await downscaleImageToDataUrl(file, maxSize, 0.85);
      } catch (e) {
        console.error('Thu nhỏ ảnh thất bại:', e);
        return null;
      }
    };

    if (roomAvatarFile) {
      const url = await uploadRoomImage(roomAvatarFile, '', 256);
      if (url) finalAvatarUrl = url;
    }
    let finalBgUrl = roomBackgroundUrl;
    if (roomBgFile) {
      const url = await uploadRoomImage(roomBgFile, 'bg_', 1280);
      if (url) finalBgUrl = url;
    }
    setRoomAvatarUploading(false);
    if (finalAvatarUrl) setCurrentRoomAvatarUrl(finalAvatarUrl);
    if (finalBgUrl) setRoomBackgroundUrl(finalBgUrl);
    socket.emit('room-settings-update', {
      roomId,
      roomTitle: nextName,
      isPrivate: !roomSettingsPublic,
      password: roomSettingsPassword,
      roomAvatarUrl: finalAvatarUrl,
      roomBackgroundUrl: finalBgUrl,
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
    setRoomAvatarFile(null);
    setRoomBgFile(null);
    setCustomAlert({ message: 'Đã lưu cài đặt phòng.', show: true });
  };

  const closeRoomPermanently = async () => {
    if (!isHost) {
      setCustomAlert({ message: 'Chỉ host mới được đóng phòng vĩnh viễn.', show: true });
      return;
    }
    showConfirm(
      'Đóng phòng vĩnh viễn?',
      'Phòng sẽ bị xóa khỏi danh sách và người khác không vào lại bằng mã này được nữa.',
      async () => {
        socket.emit('close-room', { roomId });
        await deletePersistentRoom(roomId);
        const nextRecent = recentRooms.filter(room => room.id !== roomId);
        setRecentRooms(nextRecent);
        localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(nextRecent));
        setView('landing');
        setRoomId('');
        socket.emit('request-active-rooms');
      },
      'Đóng phòng',
      'Huỷ'
    );
  };

  // 3. Chức năng Chat
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.replace(/\r\n?/g, '\n').trim().slice(0, 800);
    if (!message) return;
    socket.emit('send-message', { roomId, message });
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
      // Optimistic update: hiện bài ngay lập tức
      const optimisticItem: PlaylistItem = {
        id: `optimistic-${Date.now()}`,
        videoId,
        title,
        duration: '04:30',
        votes: 1,
        votedUsers: [],
        addedBy: username,
        status: 'queued',
      };
      setPlaylist(prev => [...prev, optimisticItem]);
      socket.emit('add-to-playlist', { roomId, videoId, title, duration: '04:30' });
    } catch {
      const title = `Bài hát (${videoId})`;
      // Optimistic update khi không lấy được title
      const optimisticItem: PlaylistItem = {
        id: `optimistic-${Date.now()}`,
        videoId,
        title,
        duration: '05:00',
        votes: 1,
        votedUsers: [],
        addedBy: username,
        status: 'queued',
      };
      setPlaylist(prev => [...prev, optimisticItem]);
      socket.emit('add-to-playlist', { roomId, videoId, title, duration: '05:00' });
    }
    setSongSearch('');
    setShowSearchResults(false);
  };


  // Tìm kiếm nhạc qua Invidious API (proxy server)
  const handleSearchMusic = async () => {
    const trimmed = songSearch.trim();
    if (!trimmed) return;
    if (trimmed === lastSearchQueryRef.current) {
      setShowSearchResults(true);
      return;
    }
    lastSearchQueryRef.current = trimmed;
    setMusicSearchLoading(true);
    setMusicSearchError('');
    setMusicSearchResults([]);
    setShowSearchResults(true);
    
    try {
      const SEARCH_URL = `${getApiBaseCandidates()[0]}/api/search-music`;

      const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(trimmed)}`);
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
    // Optimistic update: hiện ngay trong playlist
    const optimisticItem: PlaylistItem = {
      id: `optimistic-${Date.now()}`,
      videoId: result.videoId,
      title: result.title,
      duration: result.duration || '00:00',
      votes: 1,
      votedUsers: [],
      addedBy: username,
      status: 'queued',
    };
    setPlaylist(prev => [...prev, optimisticItem]);
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

  // Tạo từ khóa tìm kiếm "cùng thể loại" từ tiêu đề bài vừa kết thúc
  // Bỏ phần trong ngoặc, lấy phần chính (tên bài + nghệ sĩ), bỏ các từ nhiễu
  const buildRelatedQuery = (title: string): { query: string; genreLabel: string } => {
    if (!title) return { query: 'lofi study beats', genreLabel: 'Nhạc Học Tập' };
    
    const lower = title.toLowerCase();
    
    // 1. Lo-fi / Chill
    if (lower.includes('lofi') || lower.includes('lo-fi') || lower.includes('chill') || lower.includes('relax') || lower.includes('beats') || lower.includes('coffee') || lower.includes('lo fi')) {
      return { query: 'lofi study beats chill', genreLabel: 'Lo-fi & Chill' };
    }
    
    // 2. Classical
    if (lower.includes('classical') || lower.includes('mozart') || lower.includes('beethoven') || lower.includes('piano') || lower.includes('violin') || lower.includes('cổ điển') || lower.includes('bach') || lower.includes('chopin')) {
      return { query: 'nhạc cổ điển tập trung học tập mozart piano', genreLabel: 'Nhạc Cổ Điển' };
    }
    
    // 3. Korean / TOPIK
    if (lower.includes('korean') || lower.includes('tiếng hàn') || lower.includes('topik') || lower.includes('eps')) {
      return { query: 'luyện nghe tiếng hàn giao tiếp topik', genreLabel: 'Tiếng Hàn' };
    }
    
    // 4. Jazz
    if (lower.includes('jazz') || lower.includes('bossa') || lower.includes('cafe')) {
      return { query: 'bossa nova jazz study cafe music', genreLabel: 'Jazz / Bossa Nova' };
    }
    
    // 5. Remix / EDM
    if (lower.includes('remix') || lower.includes('edm') || lower.includes('vinahouse') || lower.includes('house') || lower.includes('dance')) {
      return { query: 'nhạc remix tik tok hot nhất hiện nay', genreLabel: 'Remix / EDM' };
    }

    // 6. Tách tên ca sĩ (artist) nếu có cấu trúc "Bài hát | Ca sĩ" hoặc "Ca sĩ - Bài hát"
    const parts = title
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .split(/[|\-–—]/)
      .map(s => s.trim())
      .filter(Boolean);
      
    if (parts.length >= 2) {
      const cleanParts = parts.map(p => p.replace(/official|music video|lyrics?|audio|video|m\/v|\bmv\b|hd|4k|live|performance|topic/gi, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (cleanParts.length >= 2) {
        const artist = cleanParts[1];
        if (artist.length > 2 && artist.length < 30) {
          return { query: `${artist} bài hát tuyển tập hay nhất`, genreLabel: `Nhạc ${artist}` };
        }
      }
    }

    // 7. Mặc định
    return { query: 'nhạc trẻ hot nhất hiện nay vpop chill', genreLabel: 'Nhạc Trẻ V-Pop' };
  };

  // Khi hết danh sách phát → tìm bài cùng thể loại với bài cuối cùng
  const fetchRelatedSuggestions = async (title: string) => {
    const { query, genreLabel } = buildRelatedQuery(title);
    if (!query) return;
    setRelatedBasedOn(title);
    setRelatedGenre(genreLabel);
    setRelatedLoading(true);
    setRelatedSuggestions([]);
    try {
      const SEARCH_URL = `${getApiBaseCandidates()[0]}/api/search-music`;
      const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const existingIds = new Set(playlistRef.current.map(i => i.videoId));
      const results = (data.results || [])
        .filter((r: any) => r?.videoId && !existingIds.has(r.videoId))
        .slice(0, 6);
      setRelatedSuggestions(results);
    } catch {
      // im lặng - không có gợi ý thì thôi
    } finally {
      setRelatedLoading(false);
    }
  };

  // Thêm 1 gợi ý "nghe tiếp" vào playlist (và ẩn khỏi danh sách gợi ý)
  const addRelatedSuggestion = (result: any) => {
    addSongFromResult(result);
    setRelatedSuggestions(prev => prev.filter(r => r.videoId !== result.videoId));
  };


  const addSuggestedVideo = (suggestion: typeof trendingVideoSuggestions[number]) => {
    // Optimistic update: hiện ngay trong playlist
    const optimisticItem: PlaylistItem = {
      id: `optimistic-${Date.now()}`,
      videoId: suggestion.videoId,
      title: suggestion.title,
      duration: suggestion.duration || '00:00',
      votes: 1,
      votedUsers: [],
      addedBy: username,
      status: 'queued',
    };
    setPlaylist(prev => [...prev, optimisticItem]);
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

  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestTab, setAiSuggestTab] = useState<'vpop' | 'kpop' | 'vinahouse'>('vpop');
  const trendingCacheVpopRef = useRef<any[]>([]);
  const trendingCacheKpopRef = useRef<any[]>([]);
  const trendingCacheVinahouseRef = useRef<any[]>([]);
  const aiSuggestFallbackQueries = {
    vpop: 'nhạc việt vpop hot nhất hiện nay official mv',
    kpop: 'kpop trending music video official korean pop',
    vinahouse: 'vinahouse tik tok remix hot nhất',
  };

  const fetchAiSuggestionsBySearch = async (type: 'vpop' | 'kpop' | 'vinahouse') => {
    const SEARCH_URL = `${getApiBaseCandidates()[0]}/api/search-music`;
    const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(aiSuggestFallbackQueries[type])}`);
    const data = await res.json();
    return (data.results || []).filter((song: any) => song?.videoId).slice(0, 30);
  };

  const preloadTrendingMusic = async () => {
    const types: ('vpop' | 'kpop' | 'vinahouse')[] = ['vpop', 'kpop', 'vinahouse'];
    const apiBase = getApiBaseCandidates()[0];
    
    types.forEach(async (type) => {
      const cacheRef = type === 'kpop' ? trendingCacheKpopRef : type === 'vinahouse' ? trendingCacheVinahouseRef : trendingCacheVpopRef;
      if (cacheRef.current.length > 0) return;
      try {
        const TRENDING_URL = `${apiBase}/api/trending-music?type=${type}`;
        const res = await fetch(TRENDING_URL);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          cacheRef.current = data.results;
          console.log(`[PRELOAD] Loaded trending music for: ${type}`);
        }
      } catch (err) {
        console.warn(`[PRELOAD] Failed to pre-fetch trending music for: ${type}`, err);
      }
    });
  };

  const handleOpenAiSuggest = async (type: 'vpop' | 'kpop' | 'vinahouse' = 'vpop', forceRefresh = false) => {
    setShowAiSuggestModal(true);
    setAiSuggestTab(type);

    const cacheRef = type === 'kpop' ? trendingCacheKpopRef : type === 'vinahouse' ? trendingCacheVinahouseRef : trendingCacheVpopRef;

    // Hiển thị ngay lập tức dữ liệu đang có sẵn (0ms delay!)
    if (cacheRef.current.length > 0) {
      shuffleAndSetAiSuggestions(cacheRef.current);
    }

    if (!forceRefresh && cacheRef.current.length > 5) {
      return;
    }

    // Chỉ hiện spinner chính nếu chưa có bài nào để xem
    if (cacheRef.current.length === 0) {
      setAiLoading(true);
    }

    try {
      const TRENDING_URL = `${getApiBaseCandidates()[0]}/api/trending-music?type=${type}`;
      const res = await fetch(TRENDING_URL);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        cacheRef.current = data.results;
        shuffleAndSetAiSuggestions(data.results);
      } else {
        const searchResults = await fetchAiSuggestionsBySearch(type);
        cacheRef.current = searchResults;
        shuffleAndSetAiSuggestions(searchResults);
      }
    } catch (err) {
      console.error(`Failed to fetch AI trending suggestions for ${type}`, err);
    } finally {
      setAiLoading(false);
    }
  };

  const decodeHtmlEntities = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  const seenSongIdsRef = useRef<Set<string>>(new Set());

  const shuffleAndSetAiSuggestions = (list: any[]) => {
    const cleaned = list.map(item => ({
      ...item,
      title: decodeHtmlEntities(item.title),
      author: decodeHtmlEntities(item.author || '')
    }));

    // Lọc các bài chưa từng xuất hiện cho người dùng trong phiên làm việc
    let unseen = cleaned.filter(item => item?.videoId && !seenSongIdsRef.current.has(item.videoId));

    // Nếu số bài chưa xem < 5 (đã xem hết vòng 100 bài), reset bộ nhớ để bắt đầu vòng mới
    if (unseen.length < 5) {
      seenSongIdsRef.current.clear();
      unseen = cleaned;
    }

    const shuffled = [...unseen].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    // Đánh dấu 5 bài vừa chọn vào danh sách đã xem
    selected.forEach(item => {
      if (item?.videoId) seenSongIdsRef.current.add(item.videoId);
    });

    setAiSuggestions(selected);
  };

  const handleRandomizeSuggestions = () => {
    const cacheRef = aiSuggestTab === 'kpop' ? trendingCacheKpopRef : aiSuggestTab === 'vinahouse' ? trendingCacheVinahouseRef : trendingCacheVpopRef;
    if (cacheRef.current.length > 5) {
      shuffleAndSetAiSuggestions(cacheRef.current);
    } else {
      handleOpenAiSuggest(aiSuggestTab, true);
    }
  };


  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canReorderPlaylist) return;
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canReorderPlaylist) return;
    e.preventDefault();
    dragOverItemRef.current = index;
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!canReorderPlaylist) return;
    e.preventDefault();
    const dragIndex = dragItemRef.current;
    const hoverIndex = dragOverItemRef.current;
    if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex) return;

    const dragItem = playlist[dragIndex];
    const hoverItem = playlist[hoverIndex];
    if (!dragItem || !hoverItem || dragItem.status !== 'queued' || hoverItem.status !== 'queued') {
      return;
    }

    const newPlaylist = [...playlist];
    const [removed] = newPlaylist.splice(dragIndex, 1);
    newPlaylist.splice(hoverIndex, 0, removed);

    const orderedIds = newPlaylist.map(item => item.id);
    socket?.emit('reorder-playlist', { roomId, orderedIds });
    setPlaylist(newPlaylist);
  };

  const handleDragEnd = () => {
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const movePlaylistItem = (index: number, direction: 'up' | 'down') => {
    if (!canReorderPlaylist) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= playlist.length) return;

    const dragItem = playlist[index];
    const hoverItem = playlist[targetIndex];
    if (!dragItem || !hoverItem || dragItem.status !== 'queued' || hoverItem.status !== 'queued') {
      return;
    }

    const newPlaylist = [...playlist];
    const [removed] = newPlaylist.splice(index, 1);
    newPlaylist.splice(targetIndex, 0, removed);

    const orderedIds = newPlaylist.map(item => item.id);
    socket?.emit('reorder-playlist', { roomId, orderedIds });
    setPlaylist(newPlaylist);
  };

  const voteSong = (songId: string) => {
    socket.emit('vote-song', { roomId, songId });
  };

  const deletePlaylistItem = (songId: string) => {
    socket.emit('delete-playlist-item', { roomId, songId });
  };

  const playSong = (item: PlaylistItem) => {
    // Cập nhật state local ngay lập tức (không chờ server echo lại)
    const newVideoState = { id: item.videoId, time: 0, playing: true, playlistItemId: item.id };
    setCurrentVideo(newVideoState);

    // Nếu player đã tồn tại → loadVideoById trực tiếp
    if (playerRef.current && playerRef.current.loadVideoById) {
      const currentVideoIdInPlayer = playerRef.current.getVideoData?.()?.video_id;
      if (currentVideoIdInPlayer !== item.videoId) {
        loadingNewVideoRef.current = true;
        playerRef.current.loadVideoById(item.videoId, 0);
      }
    } else {
      // Player chưa sẵn sàng → destroy và re-init qua useEffect (trigger bởi currentVideo.id thay đổi)
      playerRef.current = null;
    }

    // Đồng bộ cho những người khác trong phòng
    socket.emit('video-action', { 
      roomId, 
      action: 'play', 
      time: 0, 
      videoId: item.videoId,
      playlistItemId: item.id
    });
    // Xóa bài đó ra khỏi hàng đợi
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

  useEffect(() => {
    if (sidebarTab === 'chat') {
      setTimeout(scrollToBottom, 50);
    }
  }, [chatMessages, sidebarTab]);

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
    {
      key: 'cream',
      label: t('theme.cream.label'),
      description: t('theme.cream.desc'),
      swatches: ['#faf6ef', '#d9a68d', '#4c3731'],
    },
    {
      key: 'midnight',
      label: t('theme.midnight.label'),
      description: t('theme.midnight.desc'),
      swatches: ['#101820', '#315b70', '#d6c7a1'],
    },
    {
      key: 'garden',
      label: t('theme.garden.label'),
      description: t('theme.garden.desc'),
      swatches: ['#f4f1e8', '#78936a', '#3f5641'],
    },
    {
      key: 'ocean',
      label: t('theme.ocean.label'),
      description: t('theme.ocean.desc'),
      swatches: ['#edf7f8', '#5aa6b2', '#1d4f62'],
    },
  ] as const;

  const activeVideoTitle = playlist.find(item => item.videoId === currentVideo.id)?.title || playerVideoTitle || (currentVideo.id ? `Video YouTube (${currentVideo.id})` : 'Lo-Fi Girl Study Beat');
  const miniPlayerTime = Math.max(0, Math.floor(playbackTime || currentVideo.time || 0));
  const miniPlayerDuration = Math.max(0, Math.floor(videoDuration || 0));
  const miniProgressPercent = miniPlayerDuration > 0
    ? Math.min(100, Math.max(0, (miniPlayerTime / miniPlayerDuration) * 100))
    : 0;

  React.useEffect(() => {
    if (roomId === '' || !currentVideo.id) {
      setPlaybackTime(0);
      setVideoDuration(0);
      return;
    }

    const updatePlaybackSnapshot = () => {
      const time = playerRef.current?.getCurrentTime?.();
      const duration = playerRef.current?.getDuration?.();
      if (typeof time === 'number' && Number.isFinite(time)) {
        setPlaybackTime(time);
      } else {
        setPlaybackTime(currentVideoRef.current?.time || 0);
      }
      if (typeof duration === 'number' && duration > 0 && Number.isFinite(duration)) {
        setVideoDuration(duration);
      }
    };

    updatePlaybackSnapshot();
    const timer = window.setInterval(updatePlaybackSnapshot, 500);
    return () => window.clearInterval(timer);
  }, [roomId, currentVideo.id]);

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

    const enableCaptions = () => {
      player.loadModule?.('captions');
      // Ưu tiên theo THỨ TỰ: tiếng Hàn trước (app học tiếng Hàn → muốn lời gốc),
      // rồi tới ngôn ngữ trình duyệt, cuối cùng vi/en. Chọn ngôn ngữ ưu tiên CAO NHẤT
      // mà video thực sự có phụ đề (trước đây dùng .find khớp bất kỳ → hay ra tiếng Anh).
      const preferredLanguages = [
        'ko',
        ...navigator.languages.map((lang) => lang.split('-')[0]),
        'vi',
        'en',
      ];
      const trackList = player.getOption?.('captions', 'tracklist') || [];
      let track: any = null;
      for (const lang of preferredLanguages) {
        track = trackList.find((item: any) => item.languageCode === lang);
        if (track) break;
      }
      if (!track) track = trackList[0];
      player.setOption?.('captions', 'fontSize', 1);
      player.setOption?.('captions', 'track', track || { languageCode: 'vi' });
    };

    try {
      if (showYoutubeCaptions) {
        enableCaptions();
        window.setTimeout(enableCaptions, 600);
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
    // Cuộn trong đúng container lyrics — không dùng scrollIntoView để tránh cuộn nhầm
    const scrollWithin = (container: HTMLDivElement | null, el: HTMLParagraphElement | null) => {
      if (!container || !el) return;
      const containerHeight = container.clientHeight;
      const elTop = el.offsetTop;
      const elHeight = el.clientHeight;
      const target = elTop - containerHeight / 2 + elHeight / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    };
    scrollWithin(lyricsScrollRef.current, activeLyricRef.current);
    scrollWithin(miniLyricsScrollRef.current, miniActiveLyricRef.current);
  }, [activeLyricIndex]);

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbf6ef] p-6 text-brand-brown-dark animate-custom-fade-in select-none"
        role="status"
        aria-live="polite"
      >
        <div className="flex w-full max-w-xs flex-col items-center rounded-[28px] border border-white/70 bg-white/70 px-6 py-8 text-center shadow-[0_24px_70px_rgba(76,55,49,0.10)] backdrop-blur">
          <div className="relative">
            <div className="absolute inset-0 rounded-[24px] bg-brand-terracotta/20 blur-xl animate-pulse" />
            <img
              src={duhocMateLogo}
              alt="Duhoc Mate"
              className="relative h-24 w-24 rounded-[24px] border-2 border-white object-cover shadow-md shadow-brand-terracotta/10"
            />
          </div>

          <div className="mt-6 space-y-1">
            <h1 className="font-display text-3xl font-black text-brand-brown-dark tracking-wide drop-shadow-sm">
              Duhoc Mate
            </h1>
            <p className="text-xs font-black uppercase text-brand-terracotta" style={{ letterSpacing: '0.08em' }}>
              Cùng nhau học · vững tương lai
            </p>
            <p className="pt-2 text-sm font-bold text-brand-brown-light">
              Đang chuẩn bị không gian học...
            </p>
          </div>

          <div className="mt-6 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-terracotta animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-terracotta/85 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-terracotta/60 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  const handleWidgetDragStart = (clientX: number, clientY: number) => {
    setIsWidgetDragging(true);
    widgetDragStartRef.current = { x: clientX, y: clientY };
    widgetDragOffsetRef.current = { x: widgetPosition.x, y: widgetPosition.y };
    widgetDragDistanceRef.current = 0;
  };

  const handleWidgetDragMove = (clientX: number, clientY: number) => {
    if (!isWidgetDragging) return;
    const dx = clientX - widgetDragStartRef.current.x;
    const dy = clientY - widgetDragStartRef.current.y;
    widgetDragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    setWidgetPosition({
      x: widgetDragOffsetRef.current.x + dx,
      y: widgetDragOffsetRef.current.y + dy
    });
  };

  const handleWidgetMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click drags
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    handleWidgetDragStart(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleWidgetDragMove(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      setIsWidgetDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleWidgetTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    const touch = e.touches[0];
    handleWidgetDragStart(touch.clientX, touch.clientY);
  };

  const handleWidgetTouchMove = (e: React.TouchEvent) => {
    if (!isWidgetDragging) return;
    const touch = e.touches[0];
    handleWidgetDragMove(touch.clientX, touch.clientY);
  };

  const handleWidgetTouchEnd = () => {
    setIsWidgetDragging(false);
  };

  const handleWidgetClick = (e: React.MouseEvent) => {
    if (widgetDragDistanceRef.current > 5) {
      // It was dragged, do not maximize
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    setView('room');
  };

  return (
    <div className={`min-h-screen bg-transparent text-brand-brown-dark font-sans selection:bg-brand-accent selection:text-white flex flex-col items-center ${view === 'room' ? 'lg:h-screen lg:overflow-hidden bg-brand-cream' : ''}`}>
      <style>{`
        @keyframes playlistEqualizer {
          0% { transform: scaleY(0.45); opacity: 0.65; }
          100% { transform: scaleY(1.25); opacity: 1; }
        }
      `}</style>

      {/* LANDING PAGE — LOBBY-FIRST DESIGN */}
      {view === 'landing' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <LandingPage
            username={username}
            setUsername={setUsername}
            roomId={roomInputId}
            setRoomId={setRoomInputId}
            onlineUsersCount={onlineUsers.length}
            user={user}
            profile={profile}
            signOut={signOut}
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
            setShowHelpBoard={handleSetShowHelpBoard}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onEnterAdmin={() => setView('admin')}
          />
        </Suspense>
      )}

      {view === 'admin' && (
        <Suspense fallback={<LazyPanelFallback />}>
          <AdminDashboard
            currentUserId={user?.id || ''}
            onClose={() => setView('landing')}
            socket={socket}
          />
        </Suspense>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      {showCreateTemplate && (
        <Suspense fallback={null}>
          <CreateTemplateModal
            open={showCreateTemplate}
            tasks={ideaTasks}
            creatorName={profile?.username || username || 'Duhoc Mate'}
            onClose={() => setShowCreateTemplate(false)}
            onSave={handleSaveTemplate}
          />
        </Suspense>
      )}

      {/* Guest Join Modal – nhập tên trước khi vào phòng (không cần đăng nhập) */}
      <GuestJoinModal
        open={showGuestJoinModal}
        onClose={() => setShowGuestJoinModal(false)}
        onSubmit={handleGuestJoinSubmitWithName}
        defaultName={guestNameInput}
        onOpenAuthModal={() => {
          setShowGuestJoinModal(false);
          setAuthMode('login');
          setShowAuthModal(true);
        }}
      />

      {/* Custom Alert Toast */}
      {customAlert && customAlert.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] max-w-sm w-full bg-white rounded-2xl shadow-xl border border-brand-terracotta-light/20 p-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-terracotta/10 flex items-center justify-center text-brand-terracotta">
              <Coffee size={16} />
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
              <p className="text-xs font-bold text-white">⏸ {t('room.hostPaused.title')}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{t('room.hostPaused.desc')}</p>
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
      <InviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
        qrCodeUrl={qrCodeUrl}
        onCopySuccess={() => setCustomAlert({ message: t('room.inviteCopied'), show: true })}
      />

      {/* Password Room Modal */}
      <PasswordRoomModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordModalSubmit}
        error={passwordModalError}
      />

      {/* Theme Selector Modal */}
      <ThemeModal
        open={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentTheme={roomTheme}
        themeOptions={roomThemeOptions}
        onSelectTheme={(themeKey) => {
          setRoomTheme(themeKey);
          setShowThemeModal(false);
        }}
      />

      {/* Room Settings Modal */}
      {showRoomSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="font-display text-xl font-black text-brand-brown-dark">{t('room.settings.title')}</h2>
            <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
              {t('room.settings.subtitle')}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); saveRoomSettings(); }} className="mt-5 flex flex-col gap-4">
              {!isHost && (
                <div className="p-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-2xl mb-2 border border-amber-200">
                  {t('room.settings.hostOnly')}
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-brand-brown-light uppercase block mb-1">{t('room.settings.roomName')}</label>
                <input
                  type="text"
                  placeholder={t('room.settings.roomNamePlaceholder')}
                  disabled={!isHost}
                  value={roomSettingsName}
                  onChange={e => setRoomSettingsName(e.target.value)}
                  className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Ảnh đại diện phòng — upload từ thiết bị */}
              <div>
                <p className="text-xs font-bold text-brand-brown-light uppercase block mb-2">{t('room.settings.avatar')}</p>
                <div className="flex items-center gap-4">
                  {/* Preview avatar */}
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-brand-terracotta-light/30 bg-brand-light shadow-sm">
                      {(roomAvatarPreview || currentRoomAvatarUrl) ? (
                        <img
                          src={roomAvatarPreview || currentRoomAvatarUrl}
                          alt="room avatar"
                          className="h-full w-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">🏠</div>
                      )}
                    </div>
                    {isHost && (
                      <label className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-brand-terracotta text-white shadow-md transition hover:bg-brand-brown-dark">
                        <Camera size={13} />
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const extension = file.name.split('.').pop()?.toLowerCase();
                            if (extension === 'heic' || extension === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
                              setCustomAlert({ message: 'Định dạng ảnh không hỗ trợ (ví dụ ảnh HEIC từ iPhone). Vui lòng chuyển sang JPG, PNG hoặc WEBP.', show: true });
                              return;
                            }
                            setRoomAvatarPreview(URL.createObjectURL(file));
                            downscaleImageToDataUrl(file, 256, 0.85).then(dataUrl => {
                              const compressedFile = dataURLtoFile(dataUrl, file.name);
                              setRoomAvatarFile(compressedFile);
                            }).catch(err => {
                              console.error('Lỗi nén ảnh:', err);
                              setCustomAlert({ message: 'Định dạng ảnh không hỗ trợ (ví dụ ảnh HEIC từ iPhone). Vui lòng chuyển sang JPG, PNG hoặc WEBP.', show: true });
                            });
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {/* Upload button */}
                  <div className="flex-1">
                    {isHost ? (
                      <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-terracotta-light bg-brand-light text-sm font-black text-brand-terracotta transition hover:bg-white hover:border-brand-terracotta">
                        <Plus size={16} />
                        {roomAvatarPreview ? t('room.settings.changeImage') : t('room.settings.uploadImage')}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const extension = file.name.split('.').pop()?.toLowerCase();
                            if (extension === 'heic' || extension === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
                              setCustomAlert({ message: 'Định dạng ảnh không hỗ trợ (ví dụ ảnh HEIC từ iPhone). Vui lòng chuyển sang JPG, PNG hoặc WEBP.', show: true });
                              return;
                            }
                            setRoomAvatarPreview(URL.createObjectURL(file));
                            downscaleImageToDataUrl(file, 256, 0.85).then(dataUrl => {
                              const compressedFile = dataURLtoFile(dataUrl, file.name);
                              setRoomAvatarFile(compressedFile);
                            }).catch(err => {
                              console.error('Lỗi nén ảnh:', err);
                              setCustomAlert({ message: 'Định dạng ảnh không hỗ trợ (ví dụ ảnh HEIC từ iPhone). Vui lòng chuyển sang JPG, PNG hoặc WEBP.', show: true });
                            });
                          }}
                        />
                      </label>
                    ) : (
                       <p className="text-xs text-brand-brown-light font-medium">{t('room.settings.hostOnlyAvatar')}</p>
                    )}
                    <p className="mt-1.5 text-[10px] text-brand-brown-light/70 font-medium">PNG, JPG, WEBP · Tối đa 3MB</p>
                  </div>
                </div>
              </div>

              {/* Hình nền phòng — upload từ thiết bị */}
              <div>
                <p className="text-xs font-bold text-brand-brown-light uppercase block mb-2">{t('room.settings.background')}</p>
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-brand-terracotta-light bg-brand-light" style={{ height: '100px' }}>
                  {(roomBgPreview || roomBackgroundUrl) && (
                    <img
                      src={roomBgPreview || roomBackgroundUrl}
                      alt="bg preview"
                      className="absolute inset-0 h-full w-full object-cover opacity-60"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  {isHost ? (
                    <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 text-brand-terracotta transition hover:bg-white/30">
                      <Plus size={20} />
                      <span className="text-xs font-black">{roomBgPreview || roomBackgroundUrl ? t('room.settings.changeBackground') : t('room.settings.uploadBackground')}</span>
                      <span className="text-[10px] font-medium text-brand-brown-light/70">PNG, JPG, WEBP · Tối đa 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const extension = file.name.split('.').pop()?.toLowerCase();
                          if (extension === 'heic' || extension === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
                            setCustomAlert({ message: 'Định dạng ảnh không hỗ trợ (ví dụ ảnh HEIC từ iPhone). Vui lòng chuyển sang JPG, PNG hoặc WEBP.', show: true });
                            return;
                          }
                          setRoomBgPreview(URL.createObjectURL(file));
                          downscaleImageToDataUrl(file, 1280, 0.85).then(dataUrl => {
                            const compressedFile = dataURLtoFile(dataUrl, file.name);
                            setRoomBgFile(compressedFile);
                          }).catch(err => {
                            console.error('Lỗi nén ảnh nền:', err);
                            setCustomAlert({ message: 'Định dạng ảnh không hỗ trợ (ví dụ ảnh HEIC từ iPhone). Vui lòng chuyển sang JPG, PNG hoặc WEBP.', show: true });
                          });
                        }}
                      />
                    </label>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-brown-light">
                      {roomBackgroundUrl ? t('room.settings.hasBackground') : t('room.settings.noBackground')}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-light/60 border border-brand-terracotta-light/10">
                <div>
                  <p className="text-sm font-bold text-brand-brown-dark">{t('room.settings.publicRoom')}</p>
                  <p className="text-xs text-brand-brown-light font-medium">{t('room.settings.publicRoomDesc')}</p>
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
                  <label className="text-xs font-bold text-brand-brown-light uppercase block mb-1">{t('room.settings.password')}</label>
                  <input
                    type="password"
                    placeholder={t('room.settings.passwordPlaceholder')}
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
                    {t('room.settings.close')}
                  </button>
                  {isHost && (
                    <button
                      type="submit"
                      disabled={roomAvatarUploading}
                      className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {roomAvatarUploading ? t('room.settings.uploading') : t('room.settings.save')}
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
                    {t('room.settings.closeRoom')}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-brand-terracotta to-brand-brown-dark px-6 pt-8 pb-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white" />
              </div>
              <div className="relative">
                <div className="text-5xl mb-3">🎧</div>
                <h2 className="font-display font-black text-white text-xl">{t('room.session.title')}</h2>
                <p className="text-white/70 text-sm mt-1">{username || t('members.member')}</p>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-brand-terracotta-light/20 -mt-5 mx-6 bg-white rounded-2xl shadow-lg shadow-brand-brown-dark/10 border border-brand-terracotta-light/20">
              <div className="flex flex-col items-center py-4 px-2">
                <span className="font-display font-black text-2xl text-brand-terracotta">{sessionStats.minutes}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown-light mt-0.5">{t('room.session.minutes')}</span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="font-display font-black text-2xl text-brand-terracotta">{sessionStats.songs}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown-light mt-0.5">{t('room.session.songs')}</span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="font-display font-black text-2xl text-brand-terracotta">{sessionStats.messages}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown-light mt-0.5">{t('room.session.messages')}</span>
              </div>
            </div>
            <div className="mx-6 mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-brand-terracotta-light/20 bg-brand-light/55 px-3 py-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-brown-light">
                  <Timer size={13} />
                  Pomodoro
                </div>
                <p className="mt-1 font-display text-xl font-black text-brand-brown-dark">{sessionStats.pomodoros}</p>
              </div>
              <div className="rounded-2xl border border-brand-terracotta-light/20 bg-brand-light/55 px-3 py-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-brown-light">
                  <ClipboardList size={13} />
                  Từ mới / ghi chú
                </div>
                <p className="mt-1 font-display text-xl font-black text-brand-brown-dark">{sessionStats.notes}</p>
              </div>
            </div>
            <div className="mx-6 mt-3 rounded-2xl border border-brand-terracotta-light/20 bg-white px-3 py-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-brown-light">
                <Users size={13} />
                Bạn học cùng
              </div>
              <p className="mt-1 truncate text-sm font-bold text-brand-brown-dark">
                {sessionStats.companions.length > 0 ? sessionStats.companions.join(', ') : 'Bạn đã tự học một mình'}
              </p>
            </div>
            {/* Motivational message */}
            <p className="text-center text-brand-brown-light text-sm px-6 mt-5">
              {sessionStats.minutes >= 60
                ? t('room.session.msgLong')
                : sessionStats.minutes >= 25
                ? t('room.session.msgMedium')
                : t('room.session.msgShort')}
            </p>
            {/* Buttons */}
            <div className="flex gap-3 p-6 pt-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-brand-terracotta-light/30 font-bold text-brand-brown-dark hover:bg-brand-light transition text-sm"
              >
                {t('room.session.stay')}
              </button>
              <button
                onClick={confirmLeaveRoom}
                className="flex-1 px-4 py-3 rounded-2xl bg-brand-terracotta hover:bg-brand-brown-dark text-white font-bold text-sm transition"
              >
                {t('room.leaveRoom')}
              </button>
            </div>
          </div>
        </div>
      )}

      {roomId !== '' && (
        <div className={`w-full flex-1 flex flex-col lg:h-full lg:max-h-full lg:overflow-hidden ${view !== 'room' ? 'pointer-events-none absolute -left-[9999px] -top-[9999px] h-1 w-1 overflow-hidden opacity-0' : ''} ${
          roomTheme === 'midnight' ? 'bg-slate-950 text-white' :
          roomTheme === 'garden' ? 'bg-[#f4f1e8]' :
          roomTheme === 'ocean' ? 'bg-[#edf7f8]' :
          ''
        }`} style={roomBackgroundUrl ? { backgroundImage: `linear-gradient(rgba(250,246,240,0.82), rgba(250,246,240,0.82)), url(${roomBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <RoomHeader
            roomId={roomId}
            copied={copied}
            members={members}
            currentSocketId={socketId}
            isHost={isHost}
            onCopyRoomId={copyRoomId}
            onLeaveRoom={handleLeaveRoom}
            onMinimizeRoom={() => { setView('landing'); }}
            onOpenMobileSettings={() => setShowMobileRoomMenu(true)}
            onAddFriend={addFriendFromMember}
            onTransferHost={transferHost}
          />

          {showMobileRoomMenu && (
            <div className="fixed inset-0 z-[260] bg-black/35 p-3 backdrop-blur-sm sm:hidden" onClick={() => setShowMobileRoomMenu(false)}>
              <div
                className="ml-auto mt-[74px] w-full max-w-[320px] overflow-hidden rounded-[28px] border border-brand-terracotta-light/20 bg-white shadow-2xl shadow-brand-brown-dark/20"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-brand-terracotta-light/15 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-brand-terracotta">{t('room.roomCode')} {roomId}</p>
                    <h2 className="font-display text-base font-black text-brand-brown-dark">{t('room.quickSettings')}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileRoomMenu(false)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-brand-light text-brand-brown-dark"
                    aria-label={t('room.quickSettingsClose')}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid gap-2 p-3">
                  {[
                    {
                      label: t('room.menu.hideRoom'),
                      hint: t('room.menu.hideRoomHint'),
                      Icon: Minimize2,
                      tone: 'neutral',
                      action: () => setView('landing'),
                    },
                    ...(stageMode === 'youtube' ? [{
                      label: roomCollapsed ? t('room.menu.openPlayer') : t('room.menu.collapsePlayer'),
                      hint: roomCollapsed ? t('room.menu.openPlayerHint') : t('room.menu.collapsePlayerHint'),
                      Icon: Minimize2,
                      tone: 'neutral',
                      action: () => setRoomCollapsed(prev => !prev),
                    }] : []),
                    {
                      label: t('room.menu.inviteLink'),
                      hint: t('room.menu.inviteLinkHint'),
                      Icon: Link2,
                      tone: 'primary',
                      action: copyRoomInvite,
                    },
                    {
                      label: t('room.menu.theme'),
                      hint: t('room.menu.themeHint'),
                      Icon: Palette,
                      tone: 'neutral',
                      action: () => setShowThemeModal(true),
                    },
                    {
                      label: t('room.menu.settings'),
                      hint: t('room.menu.settingsHint'),
                      Icon: Settings,
                      tone: 'neutral',
                      action: () => setShowRoomSettings(true),
                    },
                    ...(isHost ? [{
                      label: t('room.menu.transferHost'),
                      hint: t('room.menu.transferHostHint'),
                      Icon: Crown,
                      tone: 'neutral',
                      action: () => transferHost(),
                    }] : []),
                  ].map((item) => {
                    const Icon = item.Icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setShowMobileRoomMenu(false);
                          item.action();
                        }}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition active:scale-[0.99] ${
                          item.tone === 'primary'
                            ? 'border-brand-terracotta/25 bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/15'
                            : 'border-brand-terracotta-light/18 bg-brand-light/45 text-brand-brown-dark hover:bg-brand-light'
                        }`}
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                          item.tone === 'primary' ? 'bg-white/18 text-white' : 'bg-white text-brand-terracotta'
                        }`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black">{item.label}</span>
                          <span className={`mt-0.5 block text-[11px] font-bold leading-snug ${
                            item.tone === 'primary' ? 'text-white/78' : 'text-brand-brown-light'
                          }`}>
                            {item.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="hidden flex-wrap items-center gap-2 border-b border-brand-terracotta-light/15 bg-white/55 px-5 py-3 backdrop-blur sm:flex">
            {stageMode === 'youtube' && (
              <button onClick={() => setRoomCollapsed(prev => !prev)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
                <Minimize2 size={14} /> {roomCollapsed ? t('room.menu.backToRoom') : t('room.menu.minimize')}
              </button>
            )}
            <button onClick={copyRoomInvite} className="inline-flex items-center gap-2 rounded-full border border-brand-terracotta/20 bg-brand-terracotta px-4 py-2 text-xs font-black text-white shadow-md shadow-brand-terracotta/15 transition hover:bg-brand-brown-dark">
              <Link2 size={14} /> {t('room.menu.inviteLink')}
            </button>
            <button onClick={() => setShowThemeModal(true)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
              <Palette size={14} /> {t('room.menu.theme')}
            </button>
            <button onClick={() => setShowRoomSettings(true)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
              <Settings size={14} /> {t('room.menu.settings')}
            </button>
            {isHost && (
              <button onClick={() => transferHost()} className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light">
                <Crown size={14} /> {t('room.menu.transferHost')}
              </button>
            )}

          </div>

          {/* Core Content Grid — adaptive columns based on stageMode */}
          {(() => {
            const mainSpan = roomCollapsed ? 'lg:col-span-12' : 'lg:col-span-9';
            const sideSpan = roomCollapsed ? 'hidden' : 'lg:col-span-3';
            const mobileSidebarPanel = mobileCompactView === 'chat';
            const mobileYoutubeWithPlaylist = mobileCompactView === 'youtube';
            const mainMobileVisibility = mobileSidebarPanel ? 'hidden sm:flex' : 'flex';
            const sideMobileVisibility = (mobileSidebarPanel || mobileYoutubeWithPlaylist) ? 'flex' : 'hidden sm:flex';
            return (
          <div className="flex-1 grid grid-cols-1 gap-0 pb-24 sm:pb-0 lg:grid-cols-12 lg:overflow-hidden lg:max-h-[calc(100vh-108px)] xl:max-h-[calc(100vh-96px)]">

            {/* LEFT / CENTER: Stage workspace */}
            <main className={`${mainMobileVisibility} ${mainSpan} p-2 sm:p-4 xl:p-6 flex-col gap-3 sm:gap-4 lg:overflow-y-auto transition-all duration-300`}>

              {!roomCollapsed && (
                <div className="hidden sm:flex items-center justify-between gap-4 w-full">
                  <StageSelector stageMode={stageMode} onChange={(mode) => {
                    setStageMode(mode);
                    if (mode === 'youtube' || mode === 'video' || mode === 'topik' || mode === 'pdf' || mode === 'game') {
                      setMobileCompactView(mode);
                    }
                    // Tự động ngồi vào bàn khi chuyển sang tab Bàn học
                    if (mode === 'video' && !jitsiActive) {
                      setJitsiActive(true);
                      if (roomIdRef.current) {
                        socket.emit('study-table-action', { roomId: roomIdRef.current, type: 'presence', payload: { active: true } });
                      }
                    }
                  }} />
                  
                  {/* Desktop Activity Ticker */}
                  <div className={`transition-all duration-500 transform ${showDesktopTicker && activeActivity ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95 pointer-events-none'} flex items-center gap-2 max-w-sm bg-white/92 dark:bg-slate-900/90 backdrop-blur-md border border-brand-terracotta/20 rounded-full px-4 py-2 shadow-md shrink-0`}>
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-brand-terracotta text-white text-[10px] font-bold">
                      {activeActivity?.type === 'reaction' ? '⚡' : '💬'}
                    </span>
                    <span className="text-xs font-black text-brand-brown-dark truncate max-w-[120px]" title={activeActivity?.senderName}>
                      {activeActivity?.senderName}
                      {activeActivity?.type === 'chat' && ':'}
                    </span>
                    {activeActivity?.type === 'reaction' && (
                      <span className="text-[11px] text-brand-brown-light/80 whitespace-nowrap">
                        đã reaction:
                      </span>
                    )}
                    <span className="text-xs font-bold text-brand-terracotta truncate max-w-[150px]" title={activeActivity?.content}>
                      {activeActivity?.content}
                    </span>
                  </div>
                </div>
              )}

              {/* ── STAGE DISPLAY AREA – adapts per stageMode ── */}
              <div className={`${roomCollapsed ? 'flex-1 min-h-[520px] flex items-center justify-center p-5' : `glass-panel rounded-3xl p-2.5 sm:p-4 xl:p-5 shadow-xl border border-white min-h-[360px] xl:min-h-[420px] flex flex-col ${stageMode === 'topik' || stageMode === 'game' ? 'h-auto shrink-0' : 'flex-1'}`} relative ${stageMode === 'topik' || stageMode === 'game' ? 'overflow-visible' : 'overflow-hidden'}`}>

                {roomCollapsed && (
                  <div className="w-full max-w-xl space-y-5 text-center">
                    <h2 className="font-display text-lg font-black text-brand-brown-light">{activeVideoTitle}</h2>
                    <div className="rounded-3xl border border-brand-terracotta-light/25 bg-white/75 p-5 shadow-sm">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-brand-brown-light">
                        <span>{formatTime(miniPlayerTime)}</span>
                        <div className="relative h-1 flex-1 rounded-full bg-brand-terracotta-light/30">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-brand-terracotta/55"
                            style={{ width: `${miniProgressPercent}%` }}
                          />
                          <span
                            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-terracotta"
                            style={{ left: `${miniProgressPercent}%` }}
                          />
                        </div>
                        <span>{miniPlayerDuration > 0 ? formatTime(miniPlayerDuration) : '--:--'}</span>
                      </div>
                      <div className="mt-5 flex items-center justify-center gap-5">
                        <button
                          type="button"
                          onClick={() => setPlayerVolume(playerVolume === 0 ? 80 : 0)}
                          className="text-brand-brown-light transition hover:text-brand-terracotta"
                          aria-label={playerVolume === 0 ? 'Bật âm lượng' : 'Tắt tiếng'}
                        >
                          {playerVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        </button>
                        <div className="h-1 w-24 rounded-full bg-brand-terracotta-light/30">
                          <div className="h-full rounded-full bg-brand-terracotta" style={{ width: `${playerVolume}%` }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => playerRef.current?.seekTo?.(Math.max(0, (playerRef.current?.getCurrentTime?.() || miniPlayerTime) - 15), true)}
                          className="text-brand-brown-light transition hover:text-brand-terracotta"
                          aria-label="Tua lùi 15 giây"
                        >
                          <RotateCcw size={15} />
                        </button>
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
                    {(lyrics || lyricsLoading) && (
                      <div className="rounded-3xl border border-brand-terracotta-light/25 bg-white/80 p-4 text-left shadow-sm">
                        <button
                          type="button"
                          onClick={() => setShowLyrics(v => !v)}
                          className={`mx-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-sm transition ${showLyrics ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/30 bg-white text-brand-brown-dark hover:bg-brand-light'}`}
                        >
                          <Music2 size={12} /> {showLyrics ? 'Ẩn lời video' : 'Hiện lời video'}
                        </button>
                        {showLyrics && (
                          <div ref={miniLyricsScrollRef} className="relative mt-4 max-h-56 overflow-y-auto pr-2">
                            <p className="mb-3 text-center text-[11px] font-bold text-brand-brown-light/75">
                              Nhấn đúp vào một dòng để chỉnh lời bài hát khớp với video.
                            </p>
                            {lyricsLoading ? (
                              <p className="py-6 text-center text-xs font-bold text-brand-brown-light animate-pulse">Đang tải lời bài hát...</p>
                            ) : displayLyricLines.length > 0 ? (
                              <div className="space-y-1.5">
                                {displayLyricLines.map((line: LyricLine, index: number) => {
                                  const isActive = index === activeLyricIndex;
                                  return (
                                    <p
                                      key={`mini-${line.time}-${index}`}
                                      ref={isActive ? miniActiveLyricRef : undefined}
                                      onDoubleClick={() => syncLyricsToLine(line)}
                                      title="Nhấn đúp để đồng bộ dòng này với video"
                                      className={`rounded-xl px-3 py-2 text-sm leading-relaxed transition ${
                                        isActive
                                          ? 'bg-brand-terracotta/10 font-black text-brand-terracotta'
                                          : 'font-semibold text-brand-brown-light'
                                      }`}
                                    >
                                      {line.text}
                                    </p>
                                  );
                                })}
                              </div>
                            ) : (
                              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-brand-brown-dark">{lyrics}</pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
                    <div className={`mx-auto grid w-full max-w-[1180px] items-start gap-3 ${showLyrics && (lyrics || lyricsLoading) ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'}`}>
                    <div
                      className={`relative flex-none mx-auto rounded-2xl overflow-hidden border border-brand-terracotta-light/10 bg-black w-full ${
                        (!currentVideo.id && playlist.length === 0)
                          ? 'aspect-auto min-h-[340px] sm:aspect-video sm:min-h-[220px]'
                          : 'aspect-video min-h-[220px]'
                      }`}
                      style={{
                        width: showLyrics && (lyrics || lyricsLoading) ? '100%' : 'min(100%, 99.5vh, 1180px)',
                      }}
                    >
                      <div className="w-full h-full" ref={iframeContainerRef}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center pointer-events-none z-0">
                          <Clock className="text-white/20 animate-spin" size={32} />
                          <p className="text-xs text-white/40">{t('room.youtube.loadingPlayer')}</p>
                        </div>
                      </div>
                      {/* Man hinh cho khi chua co video — cũng hiện khi lỗi + playlist rỗng */}
                      {(!currentVideo.id && playlist.length === 0) && (
                        <div className="absolute inset-0 z-10 overflow-y-auto bg-[#FDF8F0] p-3 text-center text-brand-brown-dark sm:p-6">
                          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center gap-3 sm:gap-4">
                            <div className="rounded-2xl sm:rounded-[28px] border border-brand-terracotta-light/25 bg-white/85 p-3.5 sm:p-6 shadow-[0_24px_70px_rgba(76,55,49,0.10)] backdrop-blur">
                          <div className="flex flex-col items-center gap-2 sm:gap-3 px-2 sm:px-4">
                            <div className="grid h-10 w-10 sm:h-14 sm:w-14 place-items-center rounded-xl sm:rounded-2xl bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20">
                              <Music2 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="max-w-2xl">
                              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-brand-terracotta">{t('room.youtube.setup')}</p>
                              <h3 className="mt-0.5 sm:mt-1 font-display text-base sm:text-2xl font-black leading-tight text-brand-brown-dark">{t('room.youtube.emptyTitle')}</h3>
                              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-relaxed text-brand-brown-light max-w-md mx-auto">
                                {t('room.youtube.emptyDesc')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-5 overflow-x-visible pb-0.5">
                            <div className="relative grid grid-cols-5 items-start gap-1 px-1">
                              <div className="absolute left-[10%] right-[10%] top-4 sm:top-[22px] h-1 rounded-full bg-brand-terracotta-light/35" />
                              <div className="absolute left-[10%] top-4 sm:top-[22px] h-1 w-[20%] rounded-full bg-brand-terracotta" />
                              {[
                                { label: t('room.youtube.stepSearch'), Icon: Search, done: true },
                                { label: t('room.youtube.stepPick'), Icon: Play, done: false },
                                { label: t('room.youtube.stepAdd'), Icon: Plus, done: false },
                                { label: t('room.youtube.stepReady'), Icon: ListMusic, done: false },
                                { label: t('room.youtube.stepTogether'), Icon: Headphones, done: false },
                              ].map((step, stepIndex) => {
                                const StepIcon = step.Icon;
                                const isActive = stepIndex === 1;

                                return (
                                  <div key={step.label} className="relative z-10 flex flex-col items-center text-center">
                                    <span className={`grid h-8 w-8 sm:h-11 sm:w-11 place-items-center rounded-full border-[3px] sm:border-4 shadow-sm ${step.done ? 'border-brand-terracotta bg-brand-terracotta text-white' : isActive ? 'border-brand-terracotta-light bg-white text-brand-terracotta shadow-[0_0_0_4px_rgba(167,122,108,0.12)] sm:shadow-[0_0_0_6px_rgba(167,122,108,0.12)]' : 'border-brand-terracotta-light/45 bg-white text-brand-brown-light'}`}>
                                      <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </span>
                                    <span className={`mt-1.5 sm:mt-2 text-[9px] sm:text-[11px] font-black leading-tight ${isActive ? 'text-brand-terracotta' : 'text-brand-brown-light'}`}>
                                      {step.label}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {trendingVideoSuggestions.slice(0, 3).map(s => (
                              <button
                                key={s.videoId}
                                type="button"
                                onClick={() => addSuggestedVideo(s)}
                                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-brand-terracotta-light/20 bg-white/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-terracotta/35 hover:bg-white hover:shadow-md"
                                title="Thêm vào playlist"
                              >
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-light text-brand-terracotta transition group-hover:bg-brand-terracotta group-hover:text-white">
                                  <Play size={14} className="ml-0.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black text-brand-brown-dark">{s.title}</p>
                                  <p className="mt-0.5 text-[10px] font-bold text-brand-brown-light">{s.category} · {s.duration}</p>
                                </div>
                                <Plus size={14} className="shrink-0 text-brand-brown-light transition group-hover:text-brand-terracotta" />
                              </button>
                            ))}
                          </div>
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
                        className="flex flex-col w-full rounded-2xl border border-brand-terracotta-light/20 bg-white/90 shadow-sm backdrop-blur-sm overflow-hidden"
                        style={{ height: 'min(35vw, 560px)', maxHeight: 'min(56vh, 560px)', minHeight: '220px' }}
                      >
                        {/* Header — nằm ngoài vùng cuộn, luôn khít với viền */}
                        <div className="shrink-0 border-b border-brand-terracotta-light/15 bg-white/95 px-3.5 pb-2 pt-3 backdrop-blur sm:px-4">
                          {/* Tiêu đề + nút đóng — ẩn trên mobile để tiết kiệm chỗ */}
                          <div className="hidden sm:flex items-center justify-between gap-3 mb-1.5">
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
                          {/* Mobile: chỉ hiện hint + nút đóng nhỏ */}
                          <div className="flex items-center justify-between gap-2 sm:hidden">
                            <p className="text-[11px] font-bold text-brand-brown-light/75">
                              Nhấn đúp vào một dòng để chỉnh lời bài hát khớp với video.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowLyrics(false)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand-terracotta-light/20 bg-white text-brand-brown-light transition hover:text-brand-terracotta"
                              aria-label="Đóng lời bài hát"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          {/* Desktop: hint text bên dưới tiêu đề */}
                          <p className="hidden sm:block text-[11px] font-bold text-brand-brown-light/75">
                            Nhấn đúp vào một dòng để chỉnh lời bài hát khớp với video.
                          </p>
                        </div>

                        {/* Vùng cuộn lời bài hát */}
                        <div ref={lyricsScrollRef} className="relative flex-1 overflow-y-auto p-3.5 sm:p-4">
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
                        </div>
                      </aside>
                    )}
                    </div>
                    <div className={`mx-auto flex w-full max-w-[1180px] flex-col gap-2 rounded-2xl border border-brand-terracotta-light/20 bg-brand-light/40 px-4 py-3 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between ${!currentVideo.id ? 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden' : ''}`}>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="block truncate whitespace-nowrap text-[10px] font-bold uppercase text-brand-terracotta">
                          {isHost ? t('room.youtube.statusHostSync') : isHostPaused ? t('room.youtube.statusHostPaused') : localPaused ? t('room.youtube.statusLocalPaused') : t('room.youtube.statusSyncing')}
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
                            className="flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/30 bg-white px-3 py-1.5 text-[11px] font-bold text-brand-brown-dark shadow-sm transition hover:bg-brand-light whitespace-nowrap"
                          >
                            {localPaused
                              ? <><Play size={12} className="text-brand-terracotta" /><span>{t('room.youtube.resume')}</span></>
                              : <><Pause size={12} className="text-brand-brown-light" /><span>{t('room.youtube.pauseLocal')}</span></>
                            }
                          </button>
                        )}
                        {/* ── Volume Control (YouTube player volume) ── */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            title={playerVolume === 0 ? t('room.youtube.unmute') : t('room.youtube.mute')}
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
                            title={t('room.youtube.volume', { volume: playerVolume })}
                          />
                        </div>

                        {/* ── Voice Controls (Discord-style: Mic | Headphones | Hang-up) ── */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Mic button: chưa vào voice → join; đang voice → toggle mute */}
                          <button
                            type="button"
                            title={voiceChat.isInVoice
                              ? (voiceChat.isMuted ? t('room.voice.unmuteMic') : t('room.voice.muteMic'))
                              : t('room.voice.join')}
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
                                {voiceChat.isDeafened ? t('room.voice.deafened') : t('room.voice.listen')}
                              </span>
                            </button>
                          )}

                          {/* Hang-up button – rời voice */}
                          {voiceChat.isInVoice && (
                            <button
                              type="button"
                              title={t('room.voice.leave')}
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
                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition sm:px-3 ${showLyrics ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/30 bg-white text-brand-brown-dark hover:bg-brand-light'}`}
                          >
                            <Music2 size={12} />
                            <span className="sm:hidden">{t('room.lyrics.short')}</span>
                            <span className="hidden sm:inline">{t('room.lyrics.full')}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowYoutubeCaptions(v => !v)}
                          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition sm:px-3 ${showYoutubeCaptions ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/30 bg-white text-brand-brown-dark hover:bg-brand-light'}`}
                        >
                          <FileText size={12} />
                          <span className="sm:hidden">{t('room.captions.short')}</span>
                          <span className="hidden sm:inline">{t('room.captions.full')}</span>
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
                              animationName: 'ping',
                              animationDuration: `${1.2 + i * 0.5}s`,
                              animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
                              animationIterationCount: 'infinite',
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

                {/* ── 4. WHITEBOARD STAGE (Bảng vẽ chung real-time) ── */}
                {stageMode === 'pdf' && (
                  <Suspense fallback={<LazyPanelFallback />}>
                    <Whiteboard socket={socket} roomId={roomId} />
                  </Suspense>
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
                    {canControlPomodoro && (
                      <div className="flex gap-3 flex-wrap justify-center animate-fadeIn">
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
                    )}
                    <p className="text-xs text-brand-brown-light text-center max-w-sm">{t('pomodoro.desc')}</p>
                  </div>
                )}

                {/* ── 6. TOPIK STAGE ── */}
                {stageMode === 'topik' && (
                  <Suspense fallback={<LazyPanelFallback />}>
                    <TopikStudy roomId={roomId} socket={socket} isAdmin={!!profile?.is_admin} />
                  </Suspense>
                )}

                {stageMode === 'video' && (
                  <Suspense fallback={<LazyPanelFallback />}>
                    <StudyTableStage
                      members={members}
                      username={username}
                      currentSocketId={socketId}
                      studyTable={studyTable}
                      jitsiActive={jitsiActive}
                      pomodoro={pomodoro}
                      chatMessages={chatMessages}
                      voiceUsers={voiceChat.voiceUsers}
                      localVideoStream={voiceChat.localVideoStream}
                      remoteVideoStreams={voiceChat.remoteVideoStreams}
                      isInVoice={voiceChat.isInVoice}
                      isMuted={voiceChat.isMuted}
                      isCameraOn={voiceChat.isCameraOn}
                      cameraActiveCount={activeStudyCameraCount}
                      maxActiveCameras={MAX_ACTIVE_STUDY_CAMERAS}
                      roomCrowdedThreshold={STUDY_ROOM_CROWDED_THRESHOLD}
                      roomSoftLimit={STUDY_ROOM_SOFT_LIMIT}
                      canStartCamera={canStartStudyCamera}
                      cameraPolicyNotice={cameraPolicyNotice}
                      onToggleJitsi={toggleJitsi}
                      onJoinVoice={voiceChat.joinVoice}
                      onLeaveVoice={voiceChat.leaveVoice}
                      onToggleMic={voiceChat.isInVoice ? voiceChat.toggleMute : voiceChat.joinVoice}
                      onToggleCamera={handleStudyCameraToggle}
                      onControlPomodoro={controlPomodoro}
                      onStudyReaction={sendStudyReaction}
                      onPersonalPomodoro={controlPersonalPomodoro}
                      clockOffset={clockOffset}
                    />
                  </Suspense>
                )}

                {stageMode === 'ideas' && (
                  <Suspense fallback={<LazyPanelFallback />}>
                    <IdeaBoard
                      tasks={ideaTasks}
                      members={members}
                      onChange={handleIdeaTasksChange}
                      onCreateTemplate={() => setShowCreateTemplate(true)}
                    />
                  </Suspense>
                )}

                {stageMode === 'game' && (
                  <Suspense fallback={<LazyPanelFallback />}>
                    <VocabularyMatchGame
                      roomId={roomId}
                      socket={socket}
                      members={members}
                    />
                  </Suspense>
                )}
              </div>

            </main>

            {/* RIGHT SIDEBAR: Chat, Playlist, Members — width adapts with sideSpan */}
            <aside className={`${sideMobileVisibility} ${sideSpan} ${mobileSidebarPanel ? 'min-h-[calc(100dvh-148px)]' : ''} min-w-0 border-l border-brand-terracotta-light/20 bg-white/30 backdrop-blur-lg flex-col transition-all duration-300 sm:min-h-0 lg:max-h-full`}>
              
              {/* Mobile Real-time Activity Ticker */}
              <div className={`block sm:hidden transition-all duration-500 overflow-hidden shrink-0 ${showMobileTicker && activeActivity ? 'max-h-16 opacity-100 p-3 pb-0' : 'max-h-0 opacity-0'}`}>
                {activeActivity && (
                  <div className="flex items-center gap-2 bg-brand-terracotta/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                    <span className="shrink-0 text-yellow-300">
                      {activeActivity.type === 'reaction' ? '⚡' : '💬'}
                    </span>
                    <span className="font-black truncate max-w-[90px]">
                      {activeActivity.senderName}
                      {activeActivity.type === 'chat' && ':'}
                    </span>
                    {activeActivity.type === 'reaction' && (
                      <span className="opacity-80 font-medium">
                        đã reaction:
                      </span>
                    )}
                    <span className="truncate flex-1 font-semibold text-white/95">
                      {activeActivity.content}
                    </span>
                  </div>
                )}
              </div>

              {/* Tab Navigation in Sidebar */}
              <div className="p-3 pb-0 xl:p-4 xl:pb-0 shrink-0">
                <div className="rounded-[18px] border border-brand-terracotta-light/15 bg-white/40 dark:bg-black/35 p-1 grid grid-cols-3 gap-1.5 xl:gap-2">
                  <button
                    onClick={() => setSidebarTab('playlist')}
                    className={`h-10 min-w-0 rounded-[14px] px-1.5 font-bold text-xs xl:h-11 xl:px-2 xl:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      sidebarTab === 'playlist'
                        ? 'bg-brand-terracotta text-white shadow-sm'
                        : 'hover:bg-brand-light text-brand-brown-light'
                    }`}
                  >
                    <ListMusic size={16} className="shrink-0" /> <span className="truncate">Playlist ({playlist.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setSidebarTab('chat');
                      setUnreadChatCount(0); // Reset counter when viewing chat
                    }}
                    className={`relative h-10 min-w-0 rounded-[14px] px-1.5 font-bold text-xs xl:h-11 xl:px-2 xl:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      sidebarTab === 'chat'
                        ? 'bg-brand-terracotta text-white shadow-sm'
                        : unreadChatCount > 0
                          ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-300 chat-attention dark:bg-rose-950/30'
                          : 'hover:bg-brand-light text-brand-brown-light'
                    }`}
                  >
                    <MessageCircle size={16} className="shrink-0" />
                    <span className="truncate">Chat</span>
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-bounce dark:ring-brand-brown-dark">
                        {unreadChatCount > 9 ? '9+' : unreadChatCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setSidebarTab('members')}
                    className={`h-10 min-w-0 rounded-[14px] px-1.5 font-bold text-xs xl:h-11 xl:px-2 xl:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      sidebarTab === 'members'
                        ? 'bg-brand-terracotta text-white shadow-sm'
                        : 'hover:bg-brand-light text-brand-brown-light'
                    }`}
                  >
                    <Users size={16} /> <span className="truncate">{t('members.title')} ({members.length})</span>
                  </button>
                </div>
              </div>

              {/* Sidebar Content Panel */}
              <div className="flex-1 lg:overflow-hidden p-3 xl:p-4 flex flex-col min-h-0">
                
                {/* 1. PLAYLIST & JUKEBOX TAB */}
                {sidebarTab === 'playlist' && (
                  <div className="flex-1 flex flex-col gap-3 min-h-0">
                    
                    {/* Search / Add Song Form */}
                    <div className="space-y-3 relative shrink-0" id="search-container">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('playlist.search')}
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
                          {t('playlist.search.btn')}
                        </button>
                      </div>

                      {/* Quick Tags */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAiSuggest('vpop')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-terracotta to-brand-terracotta-dark text-white rounded-lg hover:shadow transition font-black text-xs cursor-pointer active:scale-95 shadow-sm border border-brand-terracotta/10"
                        >
                          <Sparkles size={13} className="text-amber-200" />
                          <span>{t('playlist.aiSuggest')}</span>
                        </button>
                        {[
                          { icon: <Coffee size={13} />, label: 'Lofi Girl', q: 'lofi girl study' },
                          { icon: <CloudRain size={13} />, label: t('playlist.tagRain'), q: 'rain cozy study music' },
                          { icon: <Music2 size={13} />, label: t('playlist.tagPiano'), q: 'piano soft study music' },
                          { icon: <Music2 size={13} />, label: 'K-Pop', q: 'kpop study playlist' },
                          { icon: <Headphones size={13} />, label: 'Vinahouse', q: 'vinahouse tik tok remix hot nhất' },
                        ].map(tag => (
                          <button
                            key={tag.label}
                            type="button"
                            onClick={() => {
                              if (tag.label === 'K-Pop') {
                                handleOpenAiSuggest('kpop');
                              } else if (tag.label === 'Vinahouse') {
                                handleOpenAiSuggest('vinahouse');
                              } else {
                                setSongSearch(tag.q);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/60 hover:bg-white rounded-lg border border-brand-terracotta-light/10 text-xs text-brand-brown-light transition font-medium cursor-pointer"
                          >
                            {tag.icon}
                            <span>{tag.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Search Results Dropdown */}
                      {showSearchResults && songSearch.trim() && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-md border border-brand-terracotta-light/15 rounded-2xl shadow-2xl p-2.5 max-h-[320px] overflow-y-auto custom-scrollbar space-y-2">
                          {musicSearchLoading && (
                            <div className="flex items-center justify-center py-6 gap-2 text-brand-brown-light">
                              <span className="w-4 h-4 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs">{t('playlist.searching')}</span>
                            </div>
                          )}

                          {musicSearchError && (
                            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[10px] text-amber-700 leading-relaxed">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                              <span>{musicSearchError}</span>
                            </div>
                          )}

                          {!musicSearchLoading && !musicSearchError && musicSearchResults.length === 0 && (
                            <div className="text-center py-6 text-brand-brown-light text-xs">
                              {t('playlist.noResults')}
                            </div>
                          )}

                          {!musicSearchLoading && musicSearchResults.map((result) => (
                            <div
                              key={result.videoId}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-brand-light/45 border border-transparent hover:border-brand-terracotta-light/10 transition group cursor-pointer"
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
                                  <Play className="text-white opacity-0 group-hover:opacity-100 transition" size={12} />
                                </div>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-brand-brown-dark truncate leading-tight">{result.title}</p>
                                <p className="text-[9px] text-brand-brown-light truncate mt-0.5">
                                  {result.author} · {result.duration}
                                </p>
                              </div>

                              {/* Add Button */}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); addSongFromResult(result); }}
                                className="flex-shrink-0 px-2 py-1 rounded-lg bg-brand-terracotta text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition"
                              >
                                + {t('playlist.add')}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Playlist Header + Reset Button */}
                    <div className="flex items-center justify-between px-1 py-1.5 shrink-0">
                      <span className="text-[11px] font-black uppercase tracking-wide text-brand-brown-light/60">
                        {t('playlist.title')} · {playlist.length} {t('playlist.songCount')}
                      </span>
                      {isHost && playlist.some(item => item.status === 'played') && (
                        <button
                          type="button"
                          onClick={() => socket.emit('reset-playlist', { roomId })}
                          title="Đưa tất cả bài đã phát về lại danh sách chờ"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300/60 text-[11px] font-bold text-amber-700 transition-all hover:shadow-sm active:scale-95 group"
                        >
                          <RotateCcw size={12} className="transition-transform duration-500 group-hover:rotate-[-180deg]" />
                          Reset DS
                        </button>
                      )}
                    </div>

                    {/* Playlist Queue */}
                    <div ref={playlistScrollRef} className="overflow-y-auto overscroll-y-contain space-y-3 pr-1 flex-1 min-h-0 max-h-[420px] lg:max-h-[calc(100vh-330px)] custom-scrollbar">
                      {playlist.length === 0 ? (
                        <div className="py-4 text-brand-brown-light space-y-3">
                          <div className="rounded-2xl border border-dashed border-brand-terracotta-light/40 bg-white/60 p-4 text-center">
                            <ListMusic className="mx-auto text-brand-terracotta-light/60" size={34} />
                            <p className="mt-2 text-sm font-black text-brand-brown-dark">{t('playlist.emptyTitle')}</p>
                            <p className="mt-1 text-xs leading-relaxed">{t('playlist.emptyRoomDesc')}</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-black text-brand-brown-dark">{t('playlist.todaySuggestions')}</p>
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
                                <span className="rounded-lg bg-brand-terracotta px-2 py-1 text-[10px] font-black text-white">{t('playlist.add')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        playlist.map((item, idx) => {
                          const isPlaying = currentVideo.playlistItemId
                            ? item.id === currentVideo.playlistItemId
                            : (item.status === 'playing' || item.videoId === currentVideo.id);
                          const isActivelyPlaying = isPlaying && currentVideo.playing;
                          const isPlayed = item.status === 'played';
                          const isQueued = item.status === 'queued';
                          return (
                          <div
                            key={item.id}
                            draggable={canReorderPlaylist && isQueued}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            className={`p-4 rounded-2xl bg-white/60 border border-brand-terracotta-light/10 flex justify-between items-center shadow-sm hover:shadow transition group ${
                              isPlaying
                                ? 'ring-2 ring-brand-terracotta/30 bg-brand-light/35 playing-item-container'
                                : isPlayed
                                  ? 'opacity-40 grayscale-[30%]'
                                  : idx === 0 ? 'ring-2 ring-brand-terracotta/20 bg-brand-light/30' : ''
                            } ${canReorderPlaylist && isQueued ? 'cursor-grab active:cursor-grabbing hover:border-brand-terracotta/30' : ''}`}
                          >
                            {canReorderPlaylist && isQueued && (
                              <div className="flex flex-col items-center gap-0.5 mr-2 shrink-0">
                                {idx > 0 && playlist[idx - 1]?.status === 'queued' && (
                                  <button
                                    onClick={() => movePlaylistItem(idx, 'up')}
                                    className="p-1 rounded-md text-brand-brown-light/40 hover:text-brand-terracotta hover:bg-brand-terracotta/5 transition active:scale-95 cursor-pointer md:opacity-0 md:group-hover:opacity-100 shrink-0"
                                    title="Di chuyển lên"
                                  >
                                    <ChevronRight size={12} className="-rotate-90" />
                                  </button>
                                )}
                                <GripVertical size={12} className="text-brand-brown-light/40 cursor-grab hidden md:block shrink-0" />
                                {idx < playlist.length - 1 && playlist[idx + 1]?.status === 'queued' && (
                                  <button
                                    onClick={() => movePlaylistItem(idx, 'down')}
                                    className="p-1 rounded-md text-brand-brown-light/40 hover:text-brand-terracotta hover:bg-brand-terracotta/5 transition active:scale-95 cursor-pointer md:opacity-0 md:group-hover:opacity-100 shrink-0"
                                    title="Di chuyển xuống"
                                  >
                                    <ChevronRight size={12} className="rotate-90" />
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="space-y-1.5 min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                {isPlaying ? (
                                  <span className="flex h-7 w-8 shrink-0 items-end justify-center gap-0.5 rounded-md bg-brand-light text-brand-terracotta" title="Đang phát">
                                    {[0.42, 0.68, 0.5, 0.6].map((duration, barIndex) => (
                                      <span
                                        key={barIndex}
                                        className="w-1 rounded-full bg-brand-terracotta/80"
                                        style={{
                                          height: `${8 + barIndex * 2}px`,
                                          animationName: isActivelyPlaying ? 'playlistEqualizer' : 'none',
                                          animationDuration: isActivelyPlaying ? `${duration}s` : '0s',
                                          animationTimingFunction: isActivelyPlaying ? 'ease-in-out' : 'ease',
                                          animationIterationCount: isActivelyPlaying ? 'infinite' : '1',
                                          animationDirection: isActivelyPlaying ? 'alternate' : 'normal',
                                          animationDelay: `${barIndex * 0.08}s`,
                                        }}
                                      />
                                    ))}
                                  </span>
                                ) : isPlayed ? (
                                  <span className="px-2 py-1 rounded-md text-xs font-black bg-brand-light text-brand-brown-light uppercase whitespace-nowrap shrink-0">Đã phát</span>
                                ) : idx === 0 && (
                                  <span className="px-2 py-1 rounded-md text-xs font-black bg-brand-terracotta text-white uppercase">TOP</span>
                                )}
                                <p className="font-display font-extrabold text-sm truncate text-brand-brown-dark">{item.title}</p>
                              </div>
                              <p className="text-xs text-brand-brown-light font-medium">Gợi ý bởi: <span className="font-bold">{item.addedBy}</span></p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Vote button */}
                              <button
                                onClick={() => voteSong(item.id)}
                                className={`flex items-center gap-1 py-2 px-3 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                  item.votedUsers.includes(socketId)
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
                              {canControlMusic && !isPlaying && (
                                <button
                                  onClick={() => deletePlaylistItem(item.id)}
                                  className="p-2 rounded-lg bg-white hover:bg-red-50 border border-brand-terracotta-light/10 transition cursor-pointer text-brand-brown-light hover:text-red-500"
                                  title="Xóa khỏi danh sách"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          );
                        })
                      )}

                      {/* Gợi ý "nghe tiếp" — cùng thể loại với bài vừa kết thúc */}
                      {(relatedLoading || relatedSuggestions.length > 0) && (
                        <div className="mt-2 rounded-2xl border border-brand-terracotta-light/20 bg-brand-light/30 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Sparkles size={13} className="text-brand-terracotta shrink-0" />
                              <span className="text-[11px] font-black uppercase tracking-wide text-brand-brown-dark truncate">
                                Nghe tiếp · {relatedGenre || 'cùng thể loại'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setRelatedSuggestions([])}
                              className="p-1 rounded-md text-brand-brown-light/50 hover:text-brand-brown-dark hover:bg-white/60 transition shrink-0"
                              title="Ẩn gợi ý"
                            >
                              <X size={13} />
                            </button>
                          </div>

                          {relatedBasedOn && (
                            <p className="mb-2 text-[10px] text-brand-brown-light truncate">
                              Dựa trên: <span className="font-bold">{relatedBasedOn}</span>
                            </p>
                          )}

                          {relatedLoading ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-brand-brown-light">
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-brand-terracotta/30 border-t-brand-terracotta animate-spin" />
                              Đang tìm bài cùng thể loại…
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {relatedSuggestions.map((s) => (
                                <button
                                  key={s.videoId}
                                  type="button"
                                  onClick={() => addRelatedSuggestion(s)}
                                  className="group flex w-full items-center gap-3 rounded-xl border border-brand-terracotta-light/10 bg-white/80 p-2 text-left transition hover:border-brand-terracotta/30 hover:shadow-sm"
                                >
                                  <div className="relative h-11 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-brand-light">
                                    <img
                                      src={s.thumbnail || `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`}
                                      alt={s.title}
                                      className="h-full w-full object-cover"
                                      onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition group-hover:opacity-100">
                                      <Play size={13} className="text-white" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-black text-brand-brown-dark">{s.title}</p>
                                    <p className="mt-0.5 text-[10px] font-bold text-brand-brown-light truncate">
                                      {s.author ? `${s.author} · ` : ''}{s.duration || ''}
                                    </p>
                                  </div>
                                  <span className="rounded-lg bg-brand-terracotta px-2 py-1 text-[10px] font-black text-white shrink-0">+ Thêm</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CHAT TAB */}
                {sidebarTab === 'chat' && (
                  <div className="flex h-[calc(100dvh-210px)] min-h-0 flex-1 flex-col gap-0 overflow-hidden sm:h-full sm:max-h-[calc(100vh-280px)] lg:min-h-0 lg:max-h-[calc(100vh-240px)]">
                    {/* Pinned Message Bar */}
                    {pinnedMessage && (
                      <div className="shrink-0 mx-3 my-2 px-3 py-2 bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-amber-500 text-sm">📌</span>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Tin nhắn ghim</p>
                            <p className="text-xs font-semibold text-brand-brown-dark truncate">{pinnedMessage.text}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              window.alert(`Tin nhắn ghim của ${pinnedMessage.sender}: \n"${pinnedMessage.text}"`);
                            }}
                            className="text-[10px] font-black text-brand-brown-dark hover:underline px-2 py-0.5 rounded-md bg-amber-100/50 hover:bg-amber-200/50 transition cursor-pointer"
                          >
                            Xem
                          </button>
                          {canModerateChat && (
                            <button
                              type="button"
                              onClick={unpinMessage}
                              className="text-amber-600 hover:text-amber-800 p-1 transition cursor-pointer"
                              title="Bỏ ghim"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Messages Area */}
                    <div
                      className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain space-y-4 pr-1 pb-3 custom-scrollbar"
                      onScroll={(event) => {
                        if (event.currentTarget.scrollTop < 24 && hasOlderChatMessages) {
                          loadOlderChatMessages();
                        }
                      }}
                    >
                      {hasOlderChatMessages && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={loadOlderChatMessages}
                            className="rounded-full border border-brand-terracotta-light/20 bg-white/80 px-3 py-1.5 text-[11px] font-black text-brand-brown-light shadow-sm transition hover:border-brand-terracotta/40 hover:text-brand-terracotta"
                          >
                            Tải thêm tin nhắn cũ · đang xem {visibleChatMessages.length}/{chatMessages.length}
                          </button>
                        </div>
                      )}
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-brand-brown-light space-y-2">
                          <MessageCircle className="mx-auto text-brand-terracotta-light/40" size={36} />
                          <p className="text-sm font-semibold">{t('chat.empty')}</p>
                          <p className="text-xs">{t('chat.emptyDesc')}</p>
                        </div>
                      ) : (
                        visibleChatMessages.map((msg) => {
                          const isMyMessage = msg.senderId === socketId;
                          const isSystem = msg.type === 'system';
                          const isHostMsg = msg.isHost;

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="flex justify-center my-2">
                                <div className="bg-brand-light/80 text-brand-brown-light/80 px-4 py-2 rounded-full text-xs font-bold border border-brand-terracotta-light/10 max-w-[90%] text-center shadow-sm select-none">
                                  <span>
                                    {msg.text}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex flex-col gap-1 group/msg ${isMyMessage ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 px-2">
                                {!isMyMessage && (
                                  <span className={`text-xs font-bold ${isHostMsg ? 'text-amber-600' : 'text-brand-terracotta'}`}>
                                    {msg.sender}
                                  </span>
                                )}
                                {isHostMsg && (
                                  <span className="px-2 rounded bg-amber-500/20 text-amber-700 text-[10px] font-black uppercaser">Host</span>
                                )}
                                {msg.role === 'cohost' && (
                                  <span className="px-1.5 rounded bg-brand-terracotta/20 text-brand-terracotta text-[9px] font-black">Co-host</span>
                                )}
                                {msg.role === 'moderator' && (
                                  <span className="px-1.5 rounded bg-blue-100 text-blue-700 text-[9px] font-black">Mod</span>
                                )}
                                <span className="text-xs text-brand-brown-light/70">{msg.timestamp}</span>
                              </div>

                              <div className="flex items-center gap-2 max-w-[85%] group">
                                {isMyMessage && (canModerateChat || isMyMessage) && (
                                  <div className="hidden group-hover/msg:flex items-center gap-1 shrink-0 animate-fadeIn">
                                    {canModerateChat && (
                                      <button
                                        type="button"
                                        onClick={() => pinMessage(msg.id)}
                                        className="p-1 rounded-full text-brand-brown-light/60 hover:text-amber-500 hover:bg-brand-light transition cursor-pointer"
                                        title="Ghim tin nhắn"
                                      >
                                        <Pin size={12} />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => deleteMessage(msg.id)}
                                      className="p-1 rounded-full text-brand-brown-light/60 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                                      title="Xóa tin nhắn"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                                  isMyMessage
                                    ? 'bg-brand-terracotta text-white border-brand-terracotta rounded-tr-none'
                                    : isHostMsg
                                      ? 'bg-amber-50/80 text-brand-brown-dark border-amber-200/50 rounded-tl-none'
                                      : 'bg-white text-brand-brown-dark border-brand-terracotta-light/10 rounded-tl-none'
                                }`}>
                                  {msg.text}
                                </div>
                                {!isMyMessage && (canModerateChat || isMyMessage) && (
                                  <div className="hidden group-hover/msg:flex items-center gap-1 shrink-0 animate-fadeIn">
                                    {canModerateChat && (
                                      <button
                                        type="button"
                                        onClick={() => pinMessage(msg.id)}
                                        className="p-1 rounded-full text-brand-brown-light/60 hover:text-amber-500 hover:bg-brand-light transition cursor-pointer"
                                        title="Ghim tin nhắn"
                                      >
                                        <Pin size={12} />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => deleteMessage(msg.id)}
                                      className="p-1 rounded-full text-brand-brown-light/60 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                                      title="Xóa tin nhắn"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="shrink-0 border-t border-brand-terracotta-light/10 bg-[#fbf7f2]/95 pt-3 backdrop-blur-xl sm:bg-transparent sm:backdrop-blur-0">
                    {/* Quick reactions */}
                    <div className="flex gap-2 overflow-x-auto pb-3 select-none animate-fadeIn">
                      {[
                        { value: '😄', label: 'Vui' },
                        { value: '🙂', label: 'Ổn' },
                        { value: '😉', label: 'Hiểu' },
                        { value: '😍', label: 'Thích' },
                        { value: '😛', label: 'Nghỉ' },
                        { value: '😁', label: 'Tốt' },
                        { value: '😂', label: 'Cười' },
                        { value: '😅', label: 'Cố' },
                      ].map(reaction => (
                        <button
                          key={reaction.value}
                          type="button"
                          onClick={() => { socket.emit('send-message', { roomId, message: reaction.value }); }}
                          className="group relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-yellow-200/80 bg-gradient-to-br from-[#FFE978] via-[#FFD63D] to-[#F8B923] text-xl shadow-[inset_0_2px_3px_rgba(255,255,255,0.65),0_6px_14px_rgba(167,122,108,0.14)] transition hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                          title={reaction.label}
                        >
                          <span className="pointer-events-none absolute left-2 top-1.5 h-2 w-4 rotate-[-28deg] rounded-full bg-white/55 blur-[1px]" />
                          <span className="relative z-10 leading-none">{reaction.value}</span>
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
                  <div className="flex-1 space-y-3 flex flex-col min-h-0">
                    <div className="flex justify-between items-center pb-3 border-b border-brand-terracotta-light/10 mb-2">
                      <span className="text-xs font-bold uppercase text-brand-brown-light">{t('members.title')}</span>
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

                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                      {members.map((m) => {
                        const vUser = voiceChat.voiceUsers.get(m.id);
                        const isInVoice = !!vUser;
                        const isSpeakingNow = vUser?.speaking ?? false;
                        const isMutedNow = vUser?.muted ?? false;
                        const isMe = m.id === socketId;

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
                                {/* Host crown badge on avatar */}
                                {m.isHost && (
                                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white shadow-sm ring-1 ring-white">
                                    👑
                                  </span>
                                )}
                              </div>

                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-display font-extrabold text-sm text-brand-brown-dark truncate">{m.username}</p>
                                  {m.isHost && (
                                    <Crown size={12} className="text-amber-500 shrink-0" />
                                  )}
                                  {m.role === 'cohost' && (
                                    <span className="px-1.5 py-0.5 rounded bg-brand-terracotta/20 text-brand-terracotta text-[9px] font-black uppercase shrink-0">Co-host</span>
                                  )}
                                  {m.role === 'moderator' && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-black uppercase shrink-0">Mod</span>
                                  )}
                                  {m.mutedUntil && new Date(m.mutedUntil).getTime() > Date.now() && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500 text-[9px] font-black uppercase border border-red-500/10 shrink-0">Bị Khóa chat</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-brand-brown-light font-medium">
                                    {isMe ? (m.isHost ? "Bạn (Host)" : m.role === 'cohost' ? "Bạn (Co-host)" : m.role === 'moderator' ? "Bạn (Mod)" : "Bạn") : (m.isHost ? "Host" : m.role === 'cohost' ? "Co-host" : m.role === 'moderator' ? "Mod" : "Bạn học")}
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

                              {/* Moderation Context Menu Trigger */}
                              {(() => {
                                const targetRole = m.role || (m.isHost ? 'host' : 'member');
                                const isTargetMuted = m.mutedUntil && new Date(m.mutedUntil).getTime() > Date.now();
                                const canModerateMember = !isMe && (
                                  myRole === 'host' ||
                                  (myRole === 'cohost' && targetRole !== 'host' && targetRole !== 'cohost') ||
                                  (myRole === 'moderator' && targetRole !== 'host' && targetRole !== 'cohost' && targetRole !== 'moderator')
                                );

                                if (!canModerateMember) return null;

                                return (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setActiveMemberMenuId(activeMemberMenuId === m.id ? null : m.id)}
                                      className={`rounded-full p-2 transition cursor-pointer ${activeMemberMenuId === m.id ? 'bg-brand-terracotta text-white' : 'bg-brand-light text-brand-brown-light hover:text-brand-terracotta hover:bg-brand-light'}`}
                                      title="Quản lý thành viên"
                                    >
                                      <MoreVertical size={16} />
                                    </button>
                                    {activeMemberMenuId === m.id && (
                                      <div className="absolute right-0 top-10 z-[1000] w-48 rounded-xl bg-white border border-brand-terracotta-light/20 shadow-xl p-1.5 animate-fadeIn text-left">
                                        {myRole === 'host' && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (window.confirm(`Bạn có chắc chắn muốn chuyển quyền Host cho ${m.username}?`)) {
                                                  socket.emit('transfer-host', { roomId, targetId: m.id });
                                                  setActiveMemberMenuId(null);
                                                }
                                              }}
                                              className="w-full text-left px-3 py-2 text-xs font-bold text-brand-brown-dark hover:bg-brand-light rounded-lg transition cursor-pointer"
                                            >
                                              👑 Chuyển Host
                                            </button>
                                            {m.role !== 'cohost' && (
                                              <button
                                                type="button"
                                                onClick={() => updateMemberRole(m.id, 'cohost')}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-brand-brown-dark hover:bg-brand-light rounded-lg transition cursor-pointer"
                                              >
                                                ⭐ Thăng chức Co-host
                                              </button>
                                            )}
                                            {m.role !== 'moderator' && (
                                              <button
                                                type="button"
                                                onClick={() => updateMemberRole(m.id, 'moderator')}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-brand-brown-dark hover:bg-brand-light rounded-lg transition cursor-pointer"
                                              >
                                                🛡️ Bổ nhiệm Moderator
                                              </button>
                                            )}
                                            {m.role !== 'member' && m.role !== 'host' && (
                                              <button
                                                type="button"
                                                onClick={() => updateMemberRole(m.id, 'member')}
                                                className="w-full text-left px-3 py-2 text-xs font-bold text-brand-brown-dark hover:bg-brand-light rounded-lg transition cursor-pointer"
                                              >
                                                👤 Hạ xuống Thành viên
                                              </button>
                                            )}
                                            <div className="h-px bg-brand-terracotta-light/10 my-1" />
                                          </>
                                        )}
                                        
                                        {isTargetMuted ? (
                                          <button
                                            type="button"
                                            onClick={() => unmuteUser(m.id)}
                                            className="w-full text-left px-3 py-2 text-xs font-bold text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
                                          >
                                            🔊 Mở khóa chat
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const mins = parseInt(prompt("Nhập thời gian khóa chat (phút):", "5") || "0");
                                              if (mins > 0) muteUser(m.id, mins);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                          >
                                            🔇 Khóa chat tạm thời
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
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
                        Bật mic để nói chuyện
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
          ); // end IIFE return
          })()} {/* end adaptive grid IIFE */}
          <nav className="fixed inset-x-3 bottom-3 z-[120] overflow-visible rounded-[24px] border border-brand-terracotta-light/25 bg-white/92 p-1.5 shadow-[0_18px_55px_rgba(76,55,49,0.18)] backdrop-blur-xl sm:hidden">
            <div className="grid grid-cols-6 gap-1">
              {[
                { key: 'youtube', label: 'YouTube', Icon: Play },
                { key: 'video', label: t('room.stage.studyTable'), Icon: Coffee },
                { key: 'topik', label: 'TOPIK', Icon: BookOpen },
                { key: 'game', label: 'Game', Icon: Gamepad2 },
                { key: 'chat', label: 'Chat', Icon: MessageCircle, badge: unreadChatCount },
                { key: 'pdf', label: t('room.stage.whiteboard'), Icon: ClipboardList },
              ].map(item => {
                const Icon = item.Icon;
                const key = item.key as typeof mobileCompactView;
                const active = mobileCompactView === key;
                const showBadge = typeof item.badge === 'number' && item.badge > 0;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openMobileCompactView(key)}
                    className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-visible rounded-[18px] px-1 py-2 text-[10px] font-black transition ${
                      active
                        ? 'bg-brand-terracotta text-white shadow-sm'
                        : 'text-brand-brown-light hover:bg-brand-light'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="max-w-full truncate">{item.label}</span>
                    {showBadge && (
                      <span className={`pointer-events-none absolute -top-1 right-2 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white px-1 text-[10px] font-black leading-none shadow-sm ${
                        active ? 'bg-white text-brand-terracotta' : 'bg-brand-terracotta text-white'
                      }`}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* GLOBAL IN-APP FLOATING PLAYER WIDGET */}
      {roomId !== '' && view !== 'room' && (
        <div 
          onMouseDown={handleWidgetMouseDown}
          onTouchStart={handleWidgetTouchStart}
          onTouchMove={handleWidgetTouchMove}
          onTouchEnd={handleWidgetTouchEnd}
          style={{
            transform: `translate(${widgetPosition.x}px, ${widgetPosition.y}px)`,
            cursor: isWidgetDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-[#FAF6F0]/90 dark:bg-slate-900/90 backdrop-blur-md border border-brand-terracotta/20 rounded-2xl p-3 shadow-[0_12px_40px_rgba(76,55,49,0.15)] animate-custom-fade-in w-72 sm:w-80 group transition-all duration-300 hover:border-brand-terracotta/40"
        >
          {/* Drag Handle indicator inside the widget (shows up on hover) */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-brand-terracotta text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm pointer-events-none select-none">
            kéo để di chuyển
          </div>

          {/* Animated vinyl / CD visualizer */}
          <div 
            onClick={handleWidgetClick}
            className="relative w-12 h-12 rounded-full bg-brand-brown-dark flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 shadow-md ring-2 ring-brand-terracotta/20 group-hover:ring-brand-terracotta/40 transition"
          >
            {currentVideo.id ? (
              <img 
                src={`https://img.youtube.com/vi/${currentVideo.id}/0.jpg`} 
                alt="Thumbnail" 
                className={`w-full h-full object-cover rounded-full ${currentVideo.playing ? 'animate-[spin_10s_linear_infinite]' : ''}`}
              />
            ) : (
              <Music2 size={20} className="text-brand-cream animate-pulse" />
            )}
            <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Headphones size={16} className="text-white" />
            </div>
          </div>

          {/* Song text area */}
          <div 
            onClick={handleWidgetClick}
            className="flex-1 min-w-0 cursor-pointer space-y-0.5"
          >
            <p className="text-xs font-bold text-brand-terracotta uppercase tracking-wider select-none">Đang học nhóm</p>
            <p className="text-sm font-black text-brand-brown-dark dark:text-white truncate select-none">
              {activeVideoTitle || "Chưa phát nhạc"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Play / Pause button */}
            {currentVideo.id && (
              <button
                onClick={() => {
                  if (playerRef.current) {
                    if (currentVideo.playing) {
                      playerRef.current.pauseVideo();
                    } else {
                      playerRef.current.playVideo();
                    }
                  }
                }}
                className="w-8 h-8 rounded-full bg-brand-terracotta text-white flex items-center justify-center hover:bg-brand-brown-dark transition cursor-pointer active:scale-90 shadow-sm"
                title={currentVideo.playing ? "Tạm dừng" : "Phát tiếp"}
              >
                {currentVideo.playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
            )}

            {/* Expand / Maximize button */}
            <button
              onClick={handleWidgetClick}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-brand-brown-dark dark:text-white border border-brand-terracotta/20 flex items-center justify-center hover:bg-brand-light transition cursor-pointer active:scale-90 shadow-sm"
              title="Quay lại phòng"
            >
              <Minimize2 className="rotate-180" size={14} />
            </button>

            {/* Direct close button (leaves the room completely) */}
            <button
              onClick={handleLeaveRoom}
              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition cursor-pointer active:scale-90 shadow-sm"
              title="Rời phòng"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog (shared across App.tsx) */}
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={() => {
          confirmDialog.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />

      {showAiSuggestModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-brand-terracotta-light/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background soft mesh decoration */}
            <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-brand-terracotta/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-brand-terracotta-light/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="text-brand-terracotta animate-pulse" size={18} />
                <h3 className="text-sm font-black text-brand-brown-dark dark:text-white uppercase tracking-wider">
                  AI Đề xuất nhạc xu hướng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiSuggestModal(false)}
                className="p-1.5 rounded-xl hover:bg-brand-light dark:hover:bg-zinc-800 text-brand-brown-light transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-brand-brown-light dark:text-zinc-400 mb-4 leading-relaxed">
              AI đã lọc các bài hát đang có lượt nghe cao nhất trên YouTube để đề xuất cho bạn. Bấm "Thêm" để đưa vào danh sách phát.
            </p>

            {/* Category Tabs */}
            <div className="flex gap-2 p-1 bg-brand-light dark:bg-zinc-800 rounded-2xl mb-4 relative z-10">
              {[
                { type: 'vpop', label: 'V-Pop (Việt)' },
                { type: 'kpop', label: 'K-Pop (Hàn)' },
                { type: 'vinahouse', label: 'Vinahouse' }
              ].map(tab => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => handleOpenAiSuggest(tab.type as any)}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer active:scale-95 ${
                    aiSuggestTab === tab.type
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'text-brand-brown-light dark:text-zinc-400 hover:text-brand-brown-dark dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {aiLoading && aiSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="h-6 w-6 rounded-full border-2 border-brand-terracotta/30 border-t-brand-terracotta animate-spin" />
                <span className="text-xs text-brand-brown-light dark:text-zinc-500">Đang phân tích xu hướng...</span>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <Music2 size={22} className="text-brand-terracotta/70" />
                <span className="text-xs font-bold text-brand-brown-light dark:text-zinc-400">
                  Chưa tìm được bài phù hợp. Bấm Random bài khác để thử lại.
                </span>
              </div>
            ) : (
              <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1 relative z-10">
                {aiLoading && (
                  <div className="text-[10px] font-bold text-brand-terracotta flex items-center gap-1.5 pb-1 animate-pulse">
                    <Sparkles size={12} />
                    <span>Đang tải danh sách mới nhất từ YouTube...</span>
                  </div>
                )}
                {aiSuggestions.map((song) => (
                  <div
                    key={song.videoId}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-brand-terracotta-light/10 bg-white/50 dark:bg-zinc-800/40 hover:border-brand-terracotta/30 transition group"
                  >
                    <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-brand-light dark:bg-zinc-800">
                      <img
                        src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`}
                        alt={song.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const videoId = song.videoId;
                          if (!target.dataset.tried1) {
                            target.dataset.tried1 = 'true';
                            target.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                          } else if (!target.dataset.tried2) {
                            target.dataset.tried2 = 'true';
                            target.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
                          } else {
                            target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48" fill="%2327272a"><rect width="80" height="48" fill="%2327272a"/><circle cx="40" cy="24" r="12" fill="%233f3f46"/><circle cx="40" cy="24" r="4" fill="%23e4e4e7"/><path d="M37 19v10l7-5z" fill="%23c2410c"/></svg>`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition group-hover:opacity-100">
                        <Play size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-black text-brand-brown-dark dark:text-white leading-tight">
                        {song.title}
                      </h4>
                      <p className="mt-1 text-[10px] font-bold text-brand-brown-light dark:text-zinc-400 truncate">
                        {song.author ? `${song.author} · ` : ''}{song.duration || '0:00'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addSuggestedVideo(song);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-brand-terracotta hover:bg-brand-terracotta-dark text-white text-[10px] font-black transition shrink-0 active:scale-95 cursor-pointer shadow-sm hover:shadow"
                    >
                      Thêm
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 relative z-10">
              <button
                type="button"
                onClick={handleRandomizeSuggestions}
                disabled={aiLoading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-terracotta/30 bg-white dark:bg-zinc-800 text-brand-terracotta hover:bg-brand-light dark:hover:bg-zinc-800/80 text-xs font-black transition active:scale-[0.97] cursor-pointer disabled:opacity-50"
              >
                <Shuffle size={14} />
                <span>Random bài khác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
