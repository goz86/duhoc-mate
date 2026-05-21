import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Coffee, MessageCircle, ListMusic,
  Users, ThumbsUp, Play, Pause, RotateCcw, Send,
  Clock, FileText, Video,
  Headphones, Music2, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import TopikStudy from './components/TopikStudy';
import IdeaBoard from './components/IdeaBoard';
import CreateTemplateModal from './components/CreateTemplateModal';
import LandingPage from './components/LandingPage';
import { getTemplateRoomId } from './components/TemplateMarketplace';
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

// Kết nối tới Socket Server (cục bộ hoặc tự động nhận theo host)
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin.replace('3000', '3001');

let socket: Socket;


interface Member {
  id: string;
  username: string;
  isHost: boolean;
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
];

export default function App() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();

  // Navigation & Auth states
  const [view, setView] = useState<'landing' | 'room'>('landing');
  const [roomId, setRoomId] = useState('');
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
    id: '5qap5aO4i9A',
    time: 0,
    playing: false
  });
  const playerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

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
      setPomodoro(pomodoro);
      setChatMessages(chatMessages || []);
      setIdeaTasks(ideaTasks || []);
      setIsHost(isHost);
      if (tiktokVideoId) {
        setTiktokVideoId(tiktokVideoId);
        setStageMode('tiktok');
      }
    });

    socket.on('assigned-host', (val: boolean) => {
      setIsHost(val);
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

    socket.on('video-sync', ({ action, time, videoId, videoState }) => {
      setCurrentVideo(videoState);
      if (!playerRef.current) return;

      if (videoId && playerRef.current.getVideoData?.().video_id !== videoId) {
        playerRef.current.loadVideoById(videoId, time || 0);
      }

      if (action === 'play') {
        playerRef.current.playVideo();
      } else if (action === 'pause') {
        playerRef.current.pauseVideo();
      }

      if (time !== undefined && Math.abs(playerRef.current.getCurrentTime() - time) > 2) {
        playerRef.current.seekTo(time, true);
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
      setStageMode('tiktok');
    });

    // Nhận danh sách user online để xem bạn bè có online không
    socket.on('online-users-changed', (users: any[]) => {
      setOnlineUsers(users);
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

  // === YouTube IFrame API – Khởi tạo Player ===
  // Dùng ref để tránh stale closure trong các callback
  const currentVideoRef = useRef(currentVideo);
  useEffect(() => { currentVideoRef.current = currentVideo; }, [currentVideo]);
  const roomIdRef = useRef(roomId);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  // Init player một lần khi vào room + stage youtube/music
  useEffect(() => {
    if (view !== 'room' || (stageMode !== 'youtube' && stageMode !== 'music')) return;

    const initPlayer = () => {
      if (!iframeContainerRef.current) return;

      // Reset container
      iframeContainerRef.current.innerHTML = '<div id="yt-player-iframe"></div>';

      playerRef.current = new (window as any).YT.Player('yt-player-iframe', {
        height: '100%',
        width: '100%',
        videoId: currentVideoRef.current.id,
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
            event.target.playVideo();
          },
          onError: (event: any) => {
            // Lỗi 100, 101, 150 = video bị chặn embed/yêu cầu xác minh
            if ([100, 101, 150].includes(event.data)) {
              setVideoError(true);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data; // 1=playing, 2=paused, 0=ended
            const curTime = event.target.getCurrentTime();
            const cvr = currentVideoRef.current;
            setVideoError(false);

            if (state === 1 && !cvr.playing) {
              socket.emit('video-action', { roomId: roomIdRef.current, action: 'play', time: curTime });
            } else if (state === 2 && cvr.playing) {
              socket.emit('video-action', { roomId: roomIdRef.current, action: 'pause', time: curTime });
            }
          }
        }
      });
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      setTimeout(initPlayer, 100);
    }

    // Interval đồng bộ thời gian (chỉ host gửi)
    const interval = setInterval(() => {
      if (isHostRef.current && playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        socket.emit('video-action', {
          roomId: roomIdRef.current,
          action: currentVideoRef.current.playing ? 'play' : 'pause',
          time
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [view, stageMode]);

  // Load video mới khi currentVideo.id thay đổi (nhưng player đã tồn tại)
  useEffect(() => {
    if (!playerRef.current) return;
    if (!currentVideo.id) return;

    if (playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(currentVideo.id, currentVideo.time || 0);
    }
  }, [currentVideo.id]);

  // Toggle only the study-table presence state. A polished call layer can be
  // added later without leaking the default Jitsi prejoin UI into the room.
  const toggleJitsi = () => {
    setJitsiActive(prev => !prev);
  };

  // 2. Chức năng Phòng (Tạo/Tham Gia)
  const handleCreateRoom = (seedTasks: IdeaTask[] = []) => {
    if (!username.trim()) return alert("Vui lòng nhập tên của bạn trước!");
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(generatedId);
    setIdeaTasks(seedTasks);
    
    // Lưu vào phòng gần đây
    const newRecent = [
      { id: generatedId, hostName: username, currentSong: 'Phòng mới tạo' },
      ...recentRooms.filter(r => r.id !== generatedId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));

    if (seedTasks.length) saveRoomTasks(generatedId, seedTasks);
    socket.emit('join-room', { roomId: generatedId, username, ideaTasks: seedTasks });
    setView('room');
  };

  const handleJoinRoom = (e?: React.FormEvent | string) => {
    let targetRoomId = roomId;
    if (typeof e === 'string') {
      targetRoomId = e;
    } else if (e) {
      e.preventDefault();
    }

    if (!username.trim()) return alert("Vui lòng nhập tên của bạn trước!");
    if (!targetRoomId.trim()) return alert("Vui lòng nhập mã phòng!");
    
    const formattedId = targetRoomId.trim().toUpperCase();
    setRoomId(formattedId);

    // Lưu vào phòng gần đây
    const newRecent = [
      { id: formattedId, hostName: 'Bạn học', currentSong: 'Phòng học tập' },
      ...recentRooms.filter(r => r.id !== formattedId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));

    socket.emit('join-room', { roomId: formattedId, username });
    setView('room');
  };

  const handleJoinTemplateRoom = async (template: RoomTemplate) => {
    if (!username.trim()) return alert("Vui lòng nhập tên của bạn trước!");

    const fixedRoomId = getTemplateRoomId(template);
    const storedTasks = await loadRoomTasks(fixedRoomId);
    const seedTasks = storedTasks.length ? storedTasks : cloneTasks(template.tasks);

    if (!storedTasks.length) {
      await saveRoomTasks(fixedRoomId, seedTasks);
    }

    setRoomId(fixedRoomId);
    setIdeaTasks(seedTasks);
    setStageMode('ideas');

    const newRecent = [
      { id: fixedRoomId, hostName: template.title, currentSong: 'Phòng mở 24/24' },
      ...recentRooms.filter(r => r.id !== fixedRoomId)
    ].slice(0, 5);
    setRecentRooms(newRecent);
    localStorage.setItem('duhocmate_recent_rooms', JSON.stringify(newRecent));

    socket.emit('join-room', { roomId: fixedRoomId, username, ideaTasks: seedTasks });
    setView('room');
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
    window.location.reload();
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3. Chức năng Chat
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('send-message', { roomId, message: chatInput });
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
      const SEARCH_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api/search-music'
        : `${window.location.origin.replace('3000', '3001')}/api/search-music`;

      const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(songSearch.trim())}`);
      const data = await res.json();

      if (data.error && !data.results?.length) {
        setMusicSearchError(data.error);
      } else {
        setMusicSearchResults(data.results || []);
      }
    } catch {
      setMusicSearchError('Không thể kết nối server tìm kiếm. Hãy thử paste link YouTube trực tiếp.');
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
      const viewport = page.getViewport({ scale: 1.5 });
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
          handleCreateRoom={() => handleCreateRoom()}
          handleJoinRoom={(targetRoomId?: string) => targetRoomId ? handleJoinRoom(targetRoomId) : handleJoinRoom()}
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

      {/* ROOM WORKSPACE */}
      {view === 'room' && (
        <div className="w-full flex-1 flex flex-col">
          <RoomHeader
            roomId={roomId}
            copied={copied}
            stageMode={stageMode}
            onCopyRoomId={copyRoomId}
            onToggleAudioMode={() => setStageMode(stageMode === 'music' ? 'youtube' : 'music')}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Core Content Grid — adaptive columns based on stageMode */}
          {(() => {
            const mainSpan = { youtube: 'lg:col-span-8', tiktok: 'lg:col-span-5', music: 'lg:col-span-7', pdf: 'lg:col-span-9', pomodoro: 'lg:col-span-6', topik: 'lg:col-span-8', video: 'lg:col-span-9', ideas: 'lg:col-span-9' }[stageMode] || 'lg:col-span-8';
            const sideSpan = { youtube: 'lg:col-span-4', tiktok: 'lg:col-span-7', music: 'lg:col-span-5', pdf: 'lg:col-span-3', pomodoro: 'lg:col-span-6', topik: 'lg:col-span-4', video: 'lg:col-span-3', ideas: 'lg:col-span-3' }[stageMode] || 'lg:col-span-4';
            return (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden max-h-[calc(100vh-73px)]">

            {/* LEFT / CENTER: Stage workspace */}
            <main className={`${mainSpan} p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto min-h-[500px] transition-all duration-300`}>

              <StageSelector stageMode={stageMode} onChange={setStageMode} />

              {/* ── STAGE DISPLAY AREA – adapts per stageMode ── */}
              <div className="flex-1 glass-panel rounded-3xl p-5 shadow-xl border border-white min-h-[420px] flex flex-col relative overflow-hidden">

                {/* ── 1. YOUTUBE STAGE (16:9) ── */}
                {stageMode === 'youtube' && (
                  <div className="flex-1 flex flex-col gap-4 h-full justify-between">
                    <div className="relative flex-1 rounded-2xl overflow-hidden border border-brand-terracotta-light/10 bg-black" style={{ minHeight: '300px' }}>
                      <div className="w-full h-full" ref={iframeContainerRef}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center pointer-events-none z-0">
                          <Clock className="text-white/20 animate-spin" size={32} />
                          <p className="text-xs text-white/40">Đang tải YouTube Player...</p>
                        </div>
                      </div>
                      {videoError && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 p-8 text-center">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
                            <Video size={28} className="text-white/60" />
                          </div>
                          <h3 className="font-display font-black text-white text-lg">YouTube cần xác minh</h3>
                          <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                            Video này bị giới hạn embed. Mở YouTube để xác minh, sau đó quay lại.
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
                    <div className="flex items-center justify-between px-4 py-3 bg-brand-light/40 border border-brand-terracotta-light/20 rounded-2xl">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] font-bold text-brand-terracotta uppercase">16:9 · Đang đồng bộ</span>
                        <h4 className="font-display font-extrabold text-sm truncate text-brand-brown-dark">
                          {playlist.find(item => item.videoId === currentVideo.id)?.title || "Lo-Fi Girl Study Beat (Mặc định)"}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                        <span className="text-[10px] font-bold text-brand-brown-light uppercase hidden sm:block">Live Sync</span>
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className="flex-1 flex flex-col gap-4 justify-between h-full items-center">
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
                    <div className="flex-1 w-full flex items-center justify-center min-h-[300px] border border-dashed border-brand-terracotta-light/30 rounded-2xl p-4 bg-white/30 overflow-auto">
                      {pdfDocRef.current ? (
                        <canvas ref={canvasRef} className="shadow-lg rounded-xl max-w-full h-auto bg-white" />
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
                    onToggleJitsi={toggleJitsi}
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
            <aside className={`${sideSpan} border-l border-brand-terracotta-light/20 bg-white/30 backdrop-blur-lg flex flex-col max-h-full transition-all duration-300`}>
              
              {/* Tab Navigation in Sidebar */}
              <div className="p-4 border-b border-brand-terracotta-light/10 grid grid-cols-3 gap-1 bg-white/40">
                <button
                  onClick={() => setSidebarTab('playlist')}
                  className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'playlist'
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'hover:bg-brand-light text-brand-brown-light'
                  }`}
                >
                  <ListMusic size={16} /> Playlist ({playlist.length})
                </button>
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'chat'
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'hover:bg-brand-light text-brand-brown-light'
                  }`}
                >
                  <MessageCircle size={16} /> Chat ({chatMessages.length})
                </button>
                <button
                  onClick={() => setSidebarTab('members')}
                  className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    sidebarTab === 'members'
                      ? 'bg-brand-terracotta text-white shadow-sm'
                      : 'hover:bg-brand-light text-brand-brown-light'
                  }`}
                >
                  <Users size={16} /> Bạn học ({members.length})
                </button>
              </div>

              {/* Sidebar Content Panel */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
                
                {/* 1. PLAYLIST & JUKEBOX TAB */}
                {sidebarTab === 'playlist' && (
                  <div className="flex-1 flex flex-col gap-3 min-h-0">
                    
                    {/* Search / Add Song Form */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="🔍 Tên bài hát, nghệ sĩ hoặc link YouTube..."
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
                          ) : '🔍'}
                          Tìm
                        </button>
                      </div>

                      {/* Quick Tags */}
                      {!showSearchResults && (
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: '✨ Lofi Girl', q: 'lofi girl study' },
                            { label: '☕ K-Pop Học Bài', q: 'kpop study playlist 2024' },
                            { label: '🌧️ Tiếng Mưa Cozy', q: 'rain cozy study music' },
                            { label: '🎹 Piano Nhẹ', q: 'piano soft study music' },
                          ].map(tag => (
                            <button
                              key={tag.label}
                              type="button"
                              onClick={() => { setSongSearch(tag.q); }}
                              className="px-3 py-2 bg-white/60 hover:bg-white rounded-lg border border-brand-terracotta-light/10 text-xs text-brand-brown-light transition font-medium"
                            >
                              {tag.label}
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
                            className="text-[9px] text-brand-brown-light hover:text-brand-terracotta font-bold cursor-pointer mb-1.5 block"
                          >
                            ← Quay về playlist
                          </button>

                          {musicSearchLoading && (
                            <div className="flex items-center justify-center py-8 gap-2 text-brand-brown-light">
                              <span className="w-4 h-4 border-2 border-brand-terracotta border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs">Đang tìm kiếm...</span>
                            </div>
                          )}

                          {musicSearchError && (
                            <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-[10px] text-amber-700 leading-relaxed">
                              ⚠️ {musicSearchError}
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
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[250px]">
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

                              {/* Play directly (Only host or simple play) */}
                              <button
                                onClick={() => playSong(item)}
                                className="p-2 rounded-lg bg-brand-light hover:bg-brand-terracotta hover:text-white border border-brand-terracotta-light/10 transition cursor-pointer text-brand-terracotta"
                                title="Phát bài này ngay"
                              >
                                <Play size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CHAT TAB */}
                {sidebarTab === 'chat' && (
                  <div className="flex-1 flex flex-col justify-between min-h-[300px]">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2 max-h-[360px] custom-scrollbar">
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
                                  ✨ {msg.text}
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

                    {/* Quick Emojis Bar */}
                    <div className="flex gap-2 pb-3 overflow-x-auto select-none border-t border-brand-terracotta-light/10 pt-3 shrink-0 animate-fadeIn">
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
                    <form onSubmit={sendChatMessage} className="flex gap-2 pt-2 border-t border-brand-terracotta-light/10 shrink-0">
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
                )}

                {/* 3. MEMBERS TAB */}
                {sidebarTab === 'members' && (
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-brand-terracotta-light/10 mb-2">
                      <span className="text-xs font-bold uppercase text-brand-brown-light">Danh sách bạn học</span>
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-brand-terracotta-light/30 text-brand-terracotta">{members.length} đang online</span>
                    </div>

                    <div className="space-y-2">
                      {members.map((m) => (
                        <div key={m.id} className="p-3 rounded-2xl bg-white/60 border border-brand-terracotta-light/10 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-terracotta-light/40 flex items-center justify-center font-display font-extrabold text-sm text-brand-brown-dark uppercase">
                              {m.username.substring(0, 2)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-display font-extrabold text-sm text-brand-brown-dark">{m.username}</p>
                              <span className="text-xs text-brand-brown-light font-medium">{m.id === socket.id ? "Bạn" : "Bạn học"}</span>
                            </div>
                          </div>
                          {m.isHost && (
                            <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-700 uppercase border border-amber-500/10">Host</span>
                          )}
                        </div>
                      ))}
                    </div>
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
