import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import yts from 'yt-search';
import ytsr from 'ytsr';
import { readFileSync, writeFileSync } from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://imqrvssxfrhivlumhoze.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_d-szvo4evO2V69FCNc__IQ_xc8OqFPV';
const ROOM_STATES_ENDPOINT = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/room_states`;
const supabaseHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============================================================
// REST API: Tìm kiếm nhạc YouTube qua yt-search / ytsr / Invidious / YouTube API
// ============================================================
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// 1. Tìm kiếm bằng official YouTube API v3 (nếu có Key)
const searchWithOfficialApi = async (query) => {
  if (!YOUTUBE_API_KEY) throw new Error('No YOUTUBE_API_KEY configured');
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${errorText}`);
  }
  const data = await response.json();
  return (data.items || []).map(v => ({
    videoId: v.id.videoId,
    title: v.snippet.title,
    author: v.snippet.channelTitle || '',
    duration: '0:00',
    thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${v.id.videoId}/mqdefault.jpg`,
    views: 0,
  }));
};

// 2. Tìm kiếm bằng các instance Invidious healthy
const searchWithInvidious = async (query) => {
  try {
    const listRes = await fetch("https://api.invidious.io/instances.json?sort_by=type,health", { signal: AbortSignal.timeout(3000) });
    if (!listRes.ok) throw new Error("Failed to fetch Invidious list");
    const list = await listRes.json();
    
    const healthyInstances = list
      .map(item => item[1])
      .filter(details => {
        return details.type === 'https' && 
               details.api === true &&
               details.monitor &&
               details.monitor.down === false;
      })
      .map(details => details.uri)
      .filter(Boolean);

    const fallbacks = [
      'https://inv.thepixora.com',
      'https://yewtu.be',
      'https://invidious.projectsegfau.lt',
      'https://invidious.privacydev.net'
    ];
    const targetInstances = [...new Set([...healthyInstances, ...fallbacks])];

    for (const uri of targetInstances.slice(0, 5)) {
      try {
        const url = `${uri}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            return items.map(v => ({
              videoId: v.videoId,
              title: v.title,
              author: v.author || '',
              duration: typeof v.lengthSeconds === 'number' 
                ? `${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, '0')}`
                : '0:00',
              thumbnail: v.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
              views: v.viewCount || 0,
            }));
          }
        }
      } catch (e) {
        console.warn(`Invidious instance ${uri} failed:`, e.message);
      }
    }
  } catch (err) {
    console.warn("Invidious fetching failed:", err.message);
  }
  throw new Error("All Invidious searches failed or no instances available");
};

app.get('/api/search-music', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });

  // Tầng 1: Official YouTube API v3
  if (YOUTUBE_API_KEY) {
    try {
      console.log('Searching via Official YouTube API...');
      const results = await searchWithOfficialApi(query);
      return res.json({ results });
    } catch (err) {
      console.warn('Official YouTube API failed:', err.message);
    }
  }

  // Tầng 2: Invidious Proxy instances
  try {
    console.log('Searching via Invidious instances...');
    const results = await searchWithInvidious(query);
    return res.json({ results });
  } catch (err) {
    console.warn('Invidious search failed:', err.message);
  }

  // Tầng 3: yt-search
  try {
    console.log('Searching via yt-search...');
    const searchResult = await yts(String(query));
    const results = (searchResult.videos || []).slice(0, 10).map(v => ({
      videoId: v.videoId,
      title: v.title,
      author: v.author?.name || String(v.author) || '',
      duration: v.duration?.timestamp || v.timestamp || '0:00',
      thumbnail: v.image || v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
      views: v.views || 0,
    }));
    return res.json({ results });
  } catch (err) {
    console.warn('yt-search failed, trying ytsr fallback...', err.message);
    // Tầng 4: ytsr với Chrome User-Agent
    try {
      console.log('Searching via ytsr with custom User-Agent...');
      const searchResult = await ytsr(String(query), {
        limit: 10,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }
      });
      
      const results = (searchResult.items || [])
        .filter(item => item.type === 'video')
        .map(v => ({
          videoId: v.id,
          title: v.title,
          author: v.author?.name || '',
          duration: v.duration || '0:00',
          thumbnail: v.bestThumbnail?.url || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
          views: v.views || 0,
        }));
      return res.json({ results });
    } catch (fallbackErr) {
      console.error('All YouTube search methods failed on this server:', fallbackErr.message);
      return res.json({ results: [], error: 'Không tìm được kết quả do server bị chặn kết nối YouTube. Bạn có thể tự dán link video trực tiếp để phát.' });
    }
  }
});

const socketOptions = {
  cors: {
    origin: '*', // Hỗ trợ mọi nguồn kết nối cục bộ và deploy
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000
};

const httpServer = createServer(app);
const io = new Server(httpServer, socketOptions);

// Lưu trữ dữ liệu các phòng trong memory
// Cấu trúc room: { roomId, members: [], playlist: [], videoState: { id, time, playing }, pomodoro: {} }
const rooms = new Map();
const emptyRoomCleanupTimers = new Map();
const EMPTY_ROOM_TTL_MS = 30 * 60 * 1000;

// Persist roomDirectory sang file JSON để không mất dữ liệu sau restart
const ROOM_DIR_FILE = './room-directory.json';
let _savedDir = {};
try { _savedDir = JSON.parse(readFileSync(ROOM_DIR_FILE, 'utf8')); } catch {}
const roomDirectory = new Map(Object.entries(_savedDir));
const ROOM_STATE_FILE = './room-state.json';
let _savedRoomState = {};
try { _savedRoomState = JSON.parse(readFileSync(ROOM_STATE_FILE, 'utf8')); } catch {}
const savedRoomState = new Map(Object.entries(_savedRoomState));

const normalizePlaylist = (playlist = [], currentVideoId = '', playlistItemId = '') => playlist.map((item) => {
  let status = item.status;
  if (!status) {
    if (playlistItemId && item.id === playlistItemId) {
      status = 'playing';
    } else if (!playlistItemId && currentVideoId && item.videoId === currentVideoId) {
      status = 'playing';
    } else {
      status = 'queued';
    }
  }
  return { ...item, status };
});

const setPlaylistPlaying = (room, playlistItemId, videoId, prevItemId, prevVideoId) => {
  const now = new Date().toISOString();
  room.playlist = room.playlist.map((item) => {
    if (playlistItemId) {
      // Mark bài mới là 'playing'
      if (item.id === playlistItemId) {
        return { ...item, status: 'playing', playedAt: undefined };
      }
      // Mark bài cũ là 'played': theo status hoặc theo prevItemId/prevVideoId
      const isOldItem = (item.status === 'playing') ||
        (prevItemId && item.id === prevItemId) ||
        (prevVideoId && item.videoId === prevVideoId && item.id !== playlistItemId);
      if (isOldItem) {
        return { ...item, status: 'played', playedAt: item.playedAt || now };
      }
    } else if (videoId) {
      if (item.videoId === videoId) {
        return { ...item, status: 'playing', playedAt: undefined };
      }
      const isOldItem = (item.status === 'playing') ||
        (prevVideoId && item.videoId === prevVideoId && item.videoId !== videoId);
      if (isOldItem) {
        return { ...item, status: 'played', playedAt: item.playedAt || now };
      }
    }
    return item;
  });
};

const sortPlaylist = (playlist = []) => {
  const rank = { playing: 0, queued: 1, played: 2 };
  return [...playlist].sort((a, b) => {
    const statusA = a.status || 'queued';
    const statusB = b.status || 'queued';
    if (rank[statusA] !== rank[statusB]) return rank[statusA] - rank[statusB];
    
    if (statusA === 'queued') {
      if (a.queueOrder !== undefined && b.queueOrder !== undefined) {
        return a.queueOrder - b.queueOrder;
      }
      if (a.queueOrder !== undefined) return -1;
      if (b.queueOrder !== undefined) return 1;
      
      if ((b.votes || 0) !== (a.votes || 0)) {
        return (b.votes || 0) - (a.votes || 0);
      }
      return (a.id || '').localeCompare(b.id || '');
    }
    
    if (statusA === 'played') {
      return (a.playedAt || '').localeCompare(b.playedAt || '');
    }
    return 0;
  });
};

const saveRoomDirectory = () => {
  try {
    const obj = {};
    for (const [k, v] of roomDirectory.entries()) obj[k] = v;
    writeFileSync(ROOM_DIR_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('saveRoomDirectory error:', e.message); }
};
const onlineUsers = new Map(); // socket.id -> { socketId, friendCode, username, currentRoomId, currentSong }
const HOST_RECONNECT_TTL_MS = 5 * 60 * 1000;
const hostTransferTimers = new Map();

const normalizeStr = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const clearHostTransferTimer = (roomId) => {
  const timer = hostTransferTimers.get(roomId);
  if (timer) clearTimeout(timer);
  hostTransferTimers.delete(roomId);
};

const setRoomHost = (room, targetId) => {
  const target = room.members.find(member => member.id === targetId);
  if (!target) return null;
  room.members.forEach(member => {
    member.isHost = member.id === targetId;
  });
  room.hostFriendCode = target.friendCode || '';
  room.hostUsername = target.username || '';
  room.hostReconnectUntil = null;
  return target;
};

const scheduleHostTransfer = (roomId) => {
  clearHostTransferTimer(roomId);
  const timer = setTimeout(() => {
    hostTransferTimers.delete(roomId);
    const room = rooms.get(roomId);
    if (!room || room.members.length === 0 || room.members.some(member => member.isHost)) return;
    const nextHost = setRoomHost(room, room.members[0].id);
    if (!nextHost) return;
    io.to(nextHost.id).emit('assigned-host', true);
    io.to(roomId).emit('room-users', room.members);
    sendSystemMessage(roomId, `Bạn học ${nextHost.username} đã trở thành chủ phòng.`);
    rememberRoom(room, nextHost.username);
    rememberRoomState(room);
    broadcastRoomDirectory();
  }, HOST_RECONNECT_TTL_MS);
  hostTransferTimers.set(roomId, timer);
};

const createDefaultStudyTable = () => ({
  seats: {},
  reactions: [],
});

const createPersonalPomodoro = () => ({
  timeLeft: 25 * 60,
  duration: 25 * 60,
  isRunning: false,
  isBreak: false,
  lastUpdated: Date.now(),
});

const getStudyTable = (room) => {
  if (!room.studyTable || typeof room.studyTable !== 'object') {
    room.studyTable = createDefaultStudyTable();
  }
  if (!room.studyTable.seats || typeof room.studyTable.seats !== 'object') {
    room.studyTable.seats = {};
  }
  if (!Array.isArray(room.studyTable.reactions)) {
    room.studyTable.reactions = [];
  }
  return room.studyTable;
};

const ensureStudySeat = (room, member) => {
  const studyTable = getStudyTable(room);
  const existing = studyTable.seats[member.id] || {};
  studyTable.seats[member.id] = {
    memberId: member.id,
    username: member.username,
    isHost: !!member.isHost,
    joinedAt: existing.joinedAt || Date.now(),
    active: existing.active !== false,
    status: existing.status || 'focus',
    personalPomodoro: existing.personalPomodoro || createPersonalPomodoro(),
  };
  return studyTable.seats[member.id];
};

const syncStudyMembers = (room) => {
  const studyTable = getStudyTable(room);
  const memberIds = new Set(room.members.map(member => member.id));
  for (const key of Object.keys(studyTable.seats)) {
    if (!memberIds.has(key)) delete studyTable.seats[key];
  }
  room.members.forEach(member => ensureStudySeat(room, member));
  return studyTable;
};

const emitStudyTable = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('study-table-sync', syncStudyMembers(room));
};

const serializeRoomState = (room) => ({
  roomId: room.roomId,
  playlist: room.playlist || [],
  videoState: room.videoState || { id: '', time: 0, playing: false, pausedByHost: false, lastUpdated: Date.now() },
  pomodoro: room.pomodoro || createDefaultPomodoro(),
  chatMessages: room.chatMessages || [],
  ideaTasks: room.ideaTasks || [],
  roomTitle: room.roomTitle || '',
  isPrivate: !!room.isPrivate,
  password: room.password || '',
  hostAvatarUrl: room.hostAvatarUrl || '',
  tiktokVideoId: room.tiktokVideoId || '',
  hostFriendCode: room.hostFriendCode || '',
  hostUsername: room.hostUsername || '',
  hostReconnectUntil: room.hostReconnectUntil || null,
  studyTable: room.studyTable || createDefaultStudyTable(),
});

const saveRoomState = () => {
  try {
    const obj = {};
    for (const [k, v] of savedRoomState.entries()) obj[k] = v;
    writeFileSync(ROOM_STATE_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('saveRoomState error:', e.message); }
};

const rememberRoomState = (room) => {
  if (!room?.roomId) return;
  const state = serializeRoomState(room);
  savedRoomState.set(room.roomId, state);
  saveRoomState();
  void saveRoomStateToSupabase(state);
};

const saveRoomStateToSupabase = async (state) => {
  if (!SUPABASE_KEY) return;
  try {
    const response = await fetch(`${ROOM_STATES_ENDPOINT}?on_conflict=room_id`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        room_id: state.roomId,
        playlist: state.playlist,
        current_video: state.videoState,
        chat_messages: state.chatMessages,
        pomodoro: state.pomodoro,
        idea_tasks: state.ideaTasks,
        room_title: state.roomTitle,
        is_private: state.isPrivate,
        host_avatar_url: state.hostAvatarUrl,
        tiktok_video_id: state.tiktokVideoId,
        host_friend_code: state.hostFriendCode,
        host_username: state.hostUsername,
        host_reconnect_until: state.hostReconnectUntil,
        study_table: state.studyTable,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      console.error('saveRoomStateToSupabase error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('saveRoomStateToSupabase error:', error.message);
  }
};

const loadRoomStateFromSupabase = async (roomId) => {
  if (!SUPABASE_KEY) return null;
  try {
    const response = await fetch(`${ROOM_STATES_ENDPOINT}?room_id=eq.${encodeURIComponent(roomId)}&select=*`, {
      headers: supabaseHeaders(),
    });
    if (!response.ok) {
      console.error('loadRoomStateFromSupabase error:', response.status, await response.text());
      return null;
    }
    const rows = await response.json();
    const row = rows?.[0];
    if (!row) return null;
    return {
      playlist: row.playlist || [],
      videoState: row.current_video || {},
      chatMessages: row.chat_messages || [],
      pomodoro: row.pomodoro || createDefaultPomodoro(),
      ideaTasks: row.idea_tasks || [],
      roomTitle: row.room_title || '',
      isPrivate: !!row.is_private,
      hostAvatarUrl: row.host_avatar_url || '',
      tiktokVideoId: row.tiktok_video_id || '',
      hostFriendCode: row.host_friend_code || '',
      hostUsername: row.host_username || '',
      hostReconnectUntil: row.host_reconnect_until || null,
      studyTable: row.study_table || createDefaultStudyTable(),
    };
  } catch (error) {
    console.error('loadRoomStateFromSupabase error:', error.message);
    return null;
  }
};

const deleteRoomStateFromSupabase = async (roomId) => {
  savedRoomState.delete(roomId);
  saveRoomState();
  if (!SUPABASE_KEY) return;
  try {
    const response = await fetch(`${ROOM_STATES_ENDPOINT}?room_id=eq.${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
      headers: supabaseHeaders(),
    });
    if (!response.ok) {
      console.error('deleteRoomStateFromSupabase error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('deleteRoomStateFromSupabase error:', error.message);
  }
};

const cancelEmptyRoomCleanup = (roomId) => {
  const timer = emptyRoomCleanupTimers.get(roomId);
  if (!timer) return;
  clearTimeout(timer);
  emptyRoomCleanupTimers.delete(roomId);
};

const scheduleEmptyRoomCleanup = (roomId) => {
  cancelEmptyRoomCleanup(roomId);
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.members.length === 0) {
      rememberRoom(room);
      rooms.delete(roomId);
      console.log(`Deleted inactive empty room after TTL: ${roomId}`);
      broadcastRoomDirectory();
    }
    emptyRoomCleanupTimers.delete(roomId);
  }, EMPTY_ROOM_TTL_MS);
  emptyRoomCleanupTimers.set(roomId, timer);
};

// Trạng thái mặc định của đồng hồ Pomodoro
const createDefaultPomodoro = () => ({
  timeLeft: 25 * 60,
  duration: 25 * 60,
  isRunning: false,
  isBreak: false
});

// Helper phát sóng danh sách phòng đang hoạt động
const broadcastActiveRooms = () => {
  const activeRooms = Array.from(rooms.values()).map(r => ({
    id: r.roomId,
    hostName: r.members.find(m => m.isHost)?.username || 'Ẩn danh',
    memberCount: r.members.length,
    currentSong: r.playlist[0]?.title || 'Đang nghe nhạc Lofi',
    roomTitle: r.roomTitle || `Phòng học tập`,
    isPrivate: !!r.isPrivate,
    hostAvatarUrl: r.hostAvatarUrl || ''
  }));
  io.emit('active-rooms-list', activeRooms);
};

const getRoomDirectoryList = () => {
  return Array.from(roomDirectory.values())
    .map(entry => {
      const liveRoom = rooms.get(entry.id);
      const host = liveRoom?.members.find(m => m.isHost);
      const { password, ...publicEntry } = entry;
      void password;

      return {
        ...publicEntry,
        hostName: host?.username || entry.hostName || 'An danh',
        memberCount: liveRoom?.members.length || 0,
        currentSong: liveRoom?.playlist[0]?.title || entry.currentSong || 'Dang nghe nhac Lofi',
        roomTitle: liveRoom?.roomTitle || entry.roomTitle || 'Phong hoc tap',
        isPrivate: liveRoom ? !!liveRoom.isPrivate : !!entry.isPrivate,
        hostAvatarUrl: liveRoom?.hostAvatarUrl || entry.hostAvatarUrl || '',
        lastActiveAt: liveRoom ? new Date().toISOString() : entry.lastActiveAt
      };
    })
    .sort((a, b) => {
      const memberDiff = (b.memberCount || 0) - (a.memberCount || 0);
      if (memberDiff !== 0) return memberDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .slice(0, 50);
};

const rememberRoom = (room, hostName) => {
  const existing = roomDirectory.get(room.roomId);
  const now = new Date().toISOString();

  roomDirectory.set(room.roomId, {
    id: room.roomId,
    hostName: hostName || existing?.hostName || 'An danh',
    memberCount: room.members.length,
    currentSong: room.playlist[0]?.title || existing?.currentSong || 'Dang nghe nhac Lofi',
    roomTitle: room.roomTitle || existing?.roomTitle || 'Phong hoc tap',
    isPrivate: !!room.isPrivate,
    password: room.password || existing?.password || '',
    hostAvatarUrl: room.hostAvatarUrl || existing?.hostAvatarUrl || '',
    createdAt: existing?.createdAt || now,
    lastActiveAt: now
  });
  saveRoomDirectory();
};

const broadcastRoomDirectory = () => {
  io.emit('active-rooms-list', getRoomDirectoryList());
};

// Helper phát sóng danh sách user online (để filter tìm bạn bè)
const broadcastFriendsStatus = () => {
  io.emit('online-users-changed', Array.from(onlineUsers.values()));
};

// Helper cập nhật bài hát đang nghe cho tất cả thành viên trong phòng
const updateRoomMembersSongs = (roomId, songTitle) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.members.forEach(member => {
    const user = onlineUsers.get(member.id);
    if (user) {
      user.currentSong = songTitle;
    }
  });
  broadcastFriendsStatus();
};

// Helper phát sóng tin nhắn hệ thống vào phòng
const sendSystemMessage = (roomId, text) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const systemMsg = {
    id: `${Date.now()}-${Math.random()}`,
    sender: 'Hệ thống',
    senderId: 'system',
    isHost: false,
    text,
    type: 'system',
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  if (!room.chatMessages) room.chatMessages = [];
  room.chatMessages.push(systemMsg);
  rememberRoomState(room);
  if (room.chatMessages.length > 100) {
    room.chatMessages.shift();
  }

  io.to(roomId).emit('receive-message', systemMsg);
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Đăng ký thông tin user khi kết nối
  socket.on('register-user', ({ friendCode, username }) => {
    onlineUsers.set(socket.id, {
      socketId: socket.id,
      friendCode,
      username: username || 'Bạn học',
      currentRoomId: null,
      currentSong: 'Đang ở trang chủ KST'
    });
    broadcastFriendsStatus();
  });

  // Yêu cầu danh sách phòng
  socket.on('request-active-rooms', () => {
    const activeRooms = Array.from(rooms.values()).map(r => ({
      id: r.roomId,
      hostName: r.members.find(m => m.isHost)?.username || 'Ẩn danh',
      memberCount: r.members.length,
      currentSong: r.playlist[0]?.title || 'Đang nghe nhạc Lofi',
      roomTitle: r.roomTitle || `Phòng học tập`,
      isPrivate: !!r.isPrivate,
      hostAvatarUrl: r.hostAvatarUrl || ''
    }));
    socket.emit('active-rooms-list', getRoomDirectoryList());
  });

  // 1. Tham gia phòng
  socket.on('join-room', async ({ roomId, username, ideaTasks = [], roomTitle, isPrivate, password, hostAvatarUrl, friendCode }) => {
    const rememberedRoom = roomDirectory.get(roomId);
    const restoredState = savedRoomState.get(roomId) || await loadRoomStateFromSupabase(roomId) || {};
    // Khởi tạo phòng nếu chưa tồn tại
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        members: [],
        playlist: sortPlaylist(normalizePlaylist(
          Array.isArray(restoredState.playlist) ? restoredState.playlist : [],
          restoredState.videoState?.id,
          restoredState.videoState?.playlistItemId
        )),
        videoState: restoredState.videoState || {
          id: '', // Không có video mặc định — chờ người dùng chọn
          time: 0,
          playing: false,
          pausedByHost: false, // Host đã tạm dừng toàn phòng
          lastUpdated: Date.now()
        },
        pomodoro: restoredState.pomodoro || createDefaultPomodoro(),
        chatMessages: Array.isArray(restoredState.chatMessages) ? restoredState.chatMessages : [],
        ideaTasks: Array.isArray(restoredState.ideaTasks) ? restoredState.ideaTasks : (Array.isArray(ideaTasks) ? ideaTasks : []),
        roomTitle: roomTitle || `Phòng của ${username}`,
        isPrivate: isPrivate !== undefined ? !!isPrivate : !!restoredState.isPrivate || !!rememberedRoom?.isPrivate,
        password: password || restoredState.password || rememberedRoom?.password || '',
        hostAvatarUrl: hostAvatarUrl || restoredState.hostAvatarUrl || rememberedRoom?.hostAvatarUrl || '',
        tiktokVideoId: restoredState.tiktokVideoId || '',
        hostFriendCode: restoredState.hostFriendCode || '',
        hostUsername: restoredState.hostUsername || rememberedRoom?.hostName || '',
        hostReconnectUntil: restoredState.hostReconnectUntil || null,
        studyTable: restoredState.studyTable || createDefaultStudyTable(),
        voiceUsers: {}  // { [socketId]: { muted, speaking } }
      });
    }

    const room = rooms.get(roomId);
    cancelEmptyRoomCleanup(roomId);
    if (rememberedRoom && !roomTitle) {
      room.roomTitle = rememberedRoom.roomTitle || room.roomTitle;
    }

    // Kiểm tra mật khẩu nếu phòng riêng tư và không phải là chủ phòng (members.length > 0)
    if (room.isPrivate && room.members.length > 0) {
      if (room.password && room.password !== password) {
        socket.emit('join-room-error', 'Sai mật khẩu phòng!');
        return;
      }
    }

    socket.join(roomId);
    if (Array.isArray(ideaTasks) && ideaTasks.length && (!room.ideaTasks || room.ideaTasks.length === 0)) {
      room.ideaTasks = ideaTasks;
    }
    
    // Kiểm tra xem user đã tồn tại trong phòng chưa (qua friendCode hoặc username đã chuẩn hóa)
    const memberFriendCode = friendCode || onlineUsers.get(socket.id)?.friendCode || '';
    const normalizedNewUsername = normalizeStr(username);
    const existingMembers = room.members.filter(member => {
      // Nếu cả hai đều có friendCode, chỉ match nếu friendCode giống nhau
      if (memberFriendCode && member.friendCode) {
        return member.friendCode === memberFriendCode;
      }
      // Nếu một trong hai không có friendCode, match bằng username đã chuẩn hóa để tránh lỗi do gõ sai dấu tiếng Việt
      return normalizeStr(member.username) === normalizedNewUsername;
    });

    if (existingMembers.length) {
      const existingIds = new Set(existingMembers.map(m => m.id));
      existingMembers.forEach((existingMember) => {
        const oldSocket = io.sockets.sockets.get(existingMember.id);
        oldSocket?.leave(roomId);
        if (room.voiceUsers?.[existingMember.id]) {
          delete room.voiceUsers[existingMember.id];
          io.to(roomId).emit('voice-user-left', { userId: existingMember.id });
        }
      });
      room.members = room.members.filter(member => !existingIds.has(member.id));
    }

    const reconnectDeadline = room.hostReconnectUntil ? new Date(room.hostReconnectUntil).getTime() : 0;
    const returningHost = (room.hostFriendCode && memberFriendCode && room.hostFriendCode === memberFriendCode) ||
                          (!room.hostFriendCode && room.hostUsername && username && normalizeStr(room.hostUsername) === normalizedNewUsername);
    const waitingForHost = !!room.hostFriendCode && reconnectDeadline > Date.now();
    const isHost = room.members.length === 0 || returningHost || (!room.members.some(member => member.isHost) && !waitingForHost);

    const newMember = {
      id: socket.id,
      username: username || `Bạn học #${Math.floor(1000 + Math.random() * 9000)}`,
      isHost: false,
      friendCode: memberFriendCode
    };

    room.members.push(newMember);
    if (isHost) {
      if (returningHost) clearHostTransferTimer(roomId);
      setRoomHost(room, socket.id);
    }
    if (newMember.isHost && hostAvatarUrl) {
      room.hostAvatarUrl = hostAvatarUrl;
    }
    ensureStudySeat(room, newMember);
    rememberRoom(room, room.members.find(m => m.isHost)?.username || newMember.username);
    rememberRoomState(room);

    // Cập nhật thông tin phòng & bài hát của user trong onlineUsers
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.currentRoomId = roomId;
      if (friendCode) user.friendCode = friendCode;
      user.currentSong = room.playlist[0]?.title || 'Đang nghe nhạc Lofi';
    } else {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        friendCode: friendCode || '',
        username: newMember.username,
        currentRoomId: roomId,
        currentSong: room.playlist[0]?.title || 'Đang nghe nhạc Lofi'
      });
    }
    broadcastFriendsStatus();

    // Gửi thông báo cho mọi người trong phòng
    io.to(roomId).emit('room-users', room.members);
    
    // Gửi dữ liệu phòng hiện tại cho người mới vào (bao gồm lịch sử chat)
    socket.emit('init-room-state', {
      playlist: room.playlist,
      videoState: room.videoState,
      pomodoro: room.pomodoro,
      chatMessages: room.chatMessages || [],
      isHost,
      tiktokVideoId: room.tiktokVideoId || null,
      ideaTasks: room.ideaTasks || [],
      voiceUsers: room.voiceUsers || {},
      slideUrl: room.slideUrl || '',
      studyTable: syncStudyMembers(room)
    });
    emitStudyTable(roomId);

    // Nếu phòng đang có TikTok video, gửi sync cho member mới
    if (room.tiktokVideoId) {
      socket.emit('tiktok-sync', { videoId: room.tiktokVideoId });
    }

    broadcastRoomDirectory();
    
    // Thông báo hệ thống khi có thành viên mới
    sendSystemMessage(roomId, `Bạn học ${newMember.username} đã tham gia phòng.`);

    console.log(`${newMember.username} joined room: ${roomId} (Host: ${isHost})`);
  });

  // 1b. Rời phòng chủ động (client navigate về landing mà không reload)
  socket.on('leave-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const index = room.members.findIndex(m => m.id === socket.id);
    if (index === -1) return;

    const removedMember = room.members.splice(index, 1)[0];
    socket.leave(roomId);

    // Cleanup voice chat
    if (room.voiceUsers && room.voiceUsers[socket.id]) {
      delete room.voiceUsers[socket.id];
      io.to(roomId).emit('voice-user-left', { userId: socket.id });
    }
    if (room.studyTable?.seats) {
      delete room.studyTable.seats[socket.id];
      emitStudyTable(roomId);
    }

    // Cập nhật online user
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.currentRoomId = null;
      user.currentSong = 'Đang ở trang chủ KST';
    }

    if (room.members.length === 0) {
      rememberRoom(room, removedMember.username);
      rooms.delete(roomId);
      console.log(`Deleted empty room after leave-room: ${roomId}`);
    } else {
      sendSystemMessage(roomId, `Bạn học ${removedMember.username} đã rời phòng.`);
      if (removedMember.isHost) {
        const nextHost = setRoomHost(room, room.members[0].id);
        io.to(nextHost.id).emit('assigned-host', true);
        sendSystemMessage(roomId, `Bạn học ${nextHost.username} đã trở thành chủ phòng.`);
      }
      io.to(roomId).emit('room-users', room.members);
      rememberRoomState(room);
    }

    broadcastFriendsStatus();
    broadcastRoomDirectory();
    console.log(`${removedMember.username} left room (leave-room event): ${roomId}`);
  });

  // 2. Chat thời gian thực
  socket.on('send-message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    if (!sender) return;

    const chatMsg = {
      id: `${Date.now()}-${Math.random()}`,
      sender: sender.username,
      senderId: socket.id,
      isHost: sender.isHost,
      text: message,
      type: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push(chatMsg);
    rememberRoomState(room);
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }

    io.to(roomId).emit('receive-message', chatMsg);
  });

  // 3. Đồng bộ Video YouTube
  socket.on('video-action', ({ roomId, action, time, videoId, playlistItemId, userInitiated }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // GUARD 1: chặn pause liên tục khi đã pausedByHost (host onStateChange spam state=2)
    // → không re-broadcast, không update lastUpdated (để guard 2 hoạt động đúng)
    if (action === 'pause' && room.videoState.pausedByHost && !userInitiated) {
      // Đã pause rồi, bỏ qua spurious pause repeat
      return;
    }

    // GUARD 2: chặn MỌI play (kể cả từ sync interval) khi pausedByHost trừ khi:
    // - userInitiated=true → user thực sự click play UI button
    // - có videoId → đổi bài mới (auto-play bài tiếp theo trong playlist)
    // Lý do: sync interval của host emit play mỗi 5s với cùng cvr.playing cũ
    // → nếu không chặn, sẽ tự reset pausedByHost và unpause toàn phòng
    if (action === 'play' && room.videoState.pausedByHost && !userInitiated && !videoId) {
      console.log(`[GUARD] Block play from ${socket.id} while pausedByHost=true (no userInit, no videoId)`);
      return;
    }

    // Lưu video/item cũ TRƯỚC KHI cập nhật để truyền vào setPlaylistPlaying
    const prevVideoId = room.videoState.id;
    const prevItemId = room.videoState.playlistItemId;

    // Cập nhật trạng thái video của phòng
    if (videoId) room.videoState.id = videoId;
    if (playlistItemId) room.videoState.playlistItemId = playlistItemId;
    if (time !== undefined) room.videoState.time = time;
    if (action === 'play') {
      room.videoState.playing = true;
      // Chỉ unset pausedByHost khi là user explicit action (UI click) hoặc đổi bài mới
      if (userInitiated || videoId) {
        room.videoState.pausedByHost = false;
      }
    }
    if (action === 'pause') {
      room.videoState.playing = false;
      room.videoState.pausedByHost = true; // Host dừng → đánh dấu toàn phòng
    }
    room.videoState.lastUpdated = Date.now();
    if (videoId) {
      setPlaylistPlaying(room, playlistItemId, videoId, prevItemId, prevVideoId);
      room.playlist = sortPlaylist(room.playlist);
    }
    rememberRoomState(room);

    // Gửi lại trạng thái video mới cho các thành viên khác trong phòng (ngoại trừ người gửi)
    socket.to(roomId).emit('video-sync', {
      action,
      time,
      videoId,
      userInitiated,
      videoState: room.videoState
    });

    if (videoId) {
      const activeItem = room.playlist.find(item => item.videoId === videoId);
      io.to(roomId).emit('update-playlist', room.playlist);
      updateRoomMembersSongs(roomId, activeItem ? activeItem.title : `Đang phát video (${videoId})`);
    }
  });

  // 4b. Slide URL Sync (Google Slides / Canva embed)
  socket.on('slide-url-set', ({ roomId, url }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.slideUrl = url || '';
    // Broadcast tới tất cả người trong phòng (kể cả người gửi để confirm)
    io.to(roomId).emit('slide-url-sync', { url: room.slideUrl });
  });

  // 4. Playlist & Upvote Jukebox
  socket.on('add-to-playlist', ({ roomId, videoId, title, duration }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    const addedBy = sender ? sender.username : 'Ẩn danh';

    const queuedItems = room.playlist.filter(item => item.status === 'queued' && item.queueOrder !== undefined);
    let nextQueueOrder = undefined;
    if (queuedItems.length > 0) {
      const maxOrder = Math.max(...queuedItems.map(item => item.queueOrder));
      nextQueueOrder = maxOrder + 1;
    }

    const newItem = {
      id: `${Date.now()}-${Math.random()}`,
      videoId,
      title,
      duration: duration || '00:00',
      votes: 1, // Bắt đầu bằng 1 vote từ người thêm
      votedUsers: [socket.id],
      addedBy,
      status: 'queued',
      queueOrder: nextQueueOrder
    };

    // wasEmpty: playlist trống VÀ không có video nào đang phát (kể cả video mặc định cũ đang lỗi)
    const wasEmpty = room.playlist.length === 0 && !room.videoState.playing;

    room.playlist.push(newItem);

    // Sắp xếp playlist theo số vote giảm dần
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);

    sendSystemMessage(roomId, `Bạn học ${addedBy} đã thêm bài: "${title}".`);

    // Nếu phòng chưa có video nào đang phát → tự động phát bài vừa thêm
    if (wasEmpty) {
      room.videoState.id = newItem.videoId;
      room.videoState.playlistItemId = newItem.id;
      room.videoState.time = 0;
      room.videoState.playing = true;
      room.videoState.lastUpdated = Date.now();
      setPlaylistPlaying(room, newItem.id, newItem.videoId);
      room.playlist = sortPlaylist(room.playlist);
      rememberRoomState(room);
      // Emit playlist và video-sync cùng lúc để tránh race condition
      io.to(roomId).emit('update-playlist', room.playlist);
      io.to(roomId).emit('video-sync', {
        action: 'play',
        time: 0,
        videoId: newItem.videoId,
        videoState: room.videoState
      });
      updateRoomMembersSongs(roomId, newItem.title);
    } else {
      // Chỉ emit update-playlist một lần nếu không phải auto-play
      io.to(roomId).emit('update-playlist', room.playlist);
      updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
    }
  });

  socket.on('vote-song', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const song = room.playlist.find(item => item.id === songId);
    if (!song) return;

    const userIndex = song.votedUsers.indexOf(socket.id);
    if (userIndex === -1) {
      // User chưa vote -> Thêm vote
      song.votes += 1;
      song.votedUsers.push(socket.id);
    } else {
      // User đã vote rồi -> Hủy vote (toggle)
      song.votes = Math.max(0, song.votes - 1);
      song.votedUsers.splice(userIndex, 1);
    }

    // Sắp xếp lại playlist
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);

    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
  });

  // Xóa bài hát khỏi playlist (khi phát xong)
  socket.on('remove-song', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.playlist = room.playlist.map(item =>
      item.id === songId ? { ...item, status: 'played', playedAt: item.playedAt || new Date().toISOString() } : item
    );
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
  });

  // 5. Đồng bộ đếm ngược Pomodoro
  socket.on('delete-playlist-item', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    const item = room.playlist.find(song => song.id === songId);
    if (!item || item.status === 'playing' || item.videoId === room.videoState.id) return;

    room.playlist = room.playlist.filter(song => song.id !== songId);
    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist.find(song => song.status === 'playing')?.title || room.playlist[0]?.title || 'Dang nghe nhac Lofi');
  });

  // Reset playlist: đưa tất cả bài 'played' về 'queued' để phát lại
  socket.on('reset-playlist', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    const now = Date.now();
    room.playlist = room.playlist.map((item, idx) => {
      if (item.status === 'played') {
        return {
          ...item,
          status: 'queued',
          playedAt: undefined,
          votes: 0,
          votedUsers: [],
          queueOrder: 1000 + idx, // đặt sau các bài queued hiện tại
        };
      }
      return item;
    });
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
    sendSystemMessage(roomId, `${sender.username} đã reset danh sách phát. Tất cả bài hát có thể phát lại!`);
  });

  socket.on('reorder-playlist', ({ roomId, orderedIds }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    const playlistMap = new Map(room.playlist.map(item => [item.id, item]));
    const newPlaylist = [];

    orderedIds.forEach(id => {
      const item = playlistMap.get(id);
      if (item) {
        newPlaylist.push(item);
        playlistMap.delete(id);
      }
    });

    playlistMap.forEach(item => {
      newPlaylist.push(item);
    });

    let queuedIndex = 0;
    room.playlist = newPlaylist.map(item => {
      if (item.status === 'queued') {
        return { ...item, queueOrder: queuedIndex++ };
      }
      return { ...item, queueOrder: undefined };
    });

    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
  });

  socket.on('pomodoro-control', ({ roomId, action, duration, isBreak }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const p = room.pomodoro;
    const sender = room.members.find(m => m.id === socket.id);
    const username = sender ? sender.username : 'Chủ phòng';

    if (action === 'start') {
      p.isRunning = true;
      sendSystemMessage(roomId, `${username} đã bắt đầu đếm ngược Pomodoro.`);
    } else if (action === 'pause') {
      p.isRunning = false;
      sendSystemMessage(roomId, `${username} đã tạm dừng đồng hồ Pomodoro.`);
    } else if (action === 'reset') {
      p.isRunning = false;
      p.isBreak = isBreak !== undefined ? isBreak : false;
      p.duration = duration || (p.isBreak ? 5 * 60 : 25 * 60);
      p.timeLeft = p.duration;
      sendSystemMessage(roomId, `${username} đã đặt lại thời gian ${p.isBreak ? 'giải lao (5 phút)' : 'học tập (25 phút)'}.`);
    }

    io.to(roomId).emit('pomodoro-sync', p);
    rememberRoomState(room);
  });

  socket.on('study-table-action', ({ roomId, type, payload = {} }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;

    const studyTable = syncStudyMembers(room);
    const seat = ensureStudySeat(room, member);

    if (type === 'presence') {
      const isActive = payload.active !== false;
      if (isActive && !seat.active) {
        // Quay lại bàn: cộng dồn thời gian nghỉ
        if (seat.pausedSince) {
          seat.totalPausedMs = (seat.totalPausedMs || 0) + (Date.now() - seat.pausedSince);
          seat.pausedSince = null;
        }
      } else if (!isActive && seat.active) {
        // Rời bàn: đánh dấu thời điểm bắt đầu nghỉ
        seat.pausedSince = Date.now();
      }
      seat.active = isActive;
    }

    if (type === 'status' && typeof payload.status === 'string') {
      seat.status = payload.status.slice(0, 40);
    }

    if (type === 'personal-pomodoro') {
      const pomo = seat.personalPomodoro || createPersonalPomodoro();
      if (payload.action === 'start') {
        pomo.isRunning = true;
      } else if (payload.action === 'pause') {
        pomo.isRunning = false;
      } else if (payload.action === 'reset') {
        pomo.isRunning = false;
        pomo.isBreak = !!payload.isBreak;
        pomo.duration = pomo.isBreak ? 5 * 60 : 25 * 60;
        pomo.timeLeft = pomo.duration;
      }
      pomo.lastUpdated = Date.now();
      seat.personalPomodoro = pomo;
    }

    if (type === 'reaction') {
      const label = typeof payload.label === 'string' ? payload.label.slice(0, 24) : '';
      // targetMemberId = người NHẬN reaction; nếu không truyền thì về người gửi
      const targetMemberId = typeof payload.targetMemberId === 'string' && payload.targetMemberId
        ? payload.targetMemberId
        : socket.id;
      if (label) {
        studyTable.reactions = [
          ...studyTable.reactions.slice(-20),
          {
            id: `${socket.id}-${Date.now()}`,
            memberId: targetMemberId,   // hiển thị trên card của người NHẬN
            senderId: socket.id,        // ai gửi
            label,
            createdAt: Date.now(),
          }
        ];
      }
    }

    rememberRoomState(room);
    emitStudyTable(roomId);
  });

  // 7. Đồng bộ TOPIK Study giữa thành viên phòng
  socket.on('topik-action', ({ roomId, level, index }) => {
    socket.to(roomId).emit('topik-sync', { level, index });
  });

  // Phase B: TikTok sync — host tải video → broadcast cho cả phòng
  socket.on('idea-board-update', ({ roomId, tasks }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.ideaTasks = Array.isArray(tasks) ? tasks : [];
    rememberRoomState(room);
    socket.to(roomId).emit('idea-board-sync', room.ideaTasks);
  });

  socket.on('tiktok-sync', ({ roomId, videoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    // Lưu state TikTok vào room để members join sau cũng nhận được
    room.tiktokVideoId = videoId;
    rememberRoomState(room);
    socket.to(roomId).emit('tiktok-sync', { videoId });
  });

  // 6. Ngắt kết nối
  socket.on('room-settings-update', ({ roomId, roomTitle, isPrivate, password }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    if (roomTitle) room.roomTitle = roomTitle;
    if (typeof isPrivate === 'boolean') room.isPrivate = isPrivate;
    if (password !== undefined) room.password = password || '';
    rememberRoom(room, room.members.find(m => m.isHost)?.username || sender.username);
    rememberRoomState(room);

    io.to(roomId).emit('room-settings-updated', {
      roomTitle: room.roomTitle,
      isPrivate: room.isPrivate
    });
    broadcastRoomDirectory();
  });

  socket.on('transfer-host', ({ roomId, targetId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    const target = room.members.find(m => m.id === targetId);
    if (!sender?.isHost || !target) return;

    room.members.forEach(member => {
      member.isHost = member.id === targetId;
      io.to(member.id).emit('assigned-host', member.id === targetId);
    });
    room.hostFriendCode = target.friendCode || '';
    room.hostUsername = target.username || '';
    room.hostReconnectUntil = null;
    clearHostTransferTimer(roomId);
    io.to(roomId).emit('room-users', room.members);
    sendSystemMessage(roomId, `${target.username} đã trở thành host của phòng.`);
    rememberRoom(room, target.username);
    rememberRoomState(room);
    broadcastRoomDirectory();
  });

  socket.on('close-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    io.to(roomId).emit('room-closed', { roomId });
    room.members.forEach(member => {
      const memberSocket = io.sockets.sockets.get(member.id);
      memberSocket?.leave(roomId);
    });
    rooms.delete(roomId);
    clearHostTransferTimer(roomId);
    roomDirectory.delete(roomId);
    saveRoomDirectory();
    void deleteRoomStateFromSupabase(roomId);
    broadcastRoomDirectory();
  });

  // ─── VOICE CHAT SIGNALING (WebRTC P2P) ─────────────────────────────────────

  // User bật mic → join voice channel
  socket.on('voice-join', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!room.voiceUsers) room.voiceUsers = {};
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;

    room.voiceUsers[socket.id] = { muted: false, speaking: false };

    // Gửi danh sách voice users hiện tại cho người vừa join (để biết ai đang ở đây)
    socket.emit('voice-users', { users: room.voiceUsers });

    // Thông báo cho các người còn lại → họ sẽ khởi tạo kết nối WebRTC đến user mới
    socket.to(roomId).emit('voice-user-joined', { userId: socket.id, username: member.username });
  });

  // User tắt mic / rời voice channel
  socket.on('voice-leave', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    delete room.voiceUsers[socket.id];
    socket.to(roomId).emit('voice-user-left', { userId: socket.id });
  });

  // Relay WebRTC SDP Offer (initiator → target)
  socket.on('voice-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('voice-offer', { fromId: socket.id, offer });
  });

  // Relay WebRTC SDP Answer (target → initiator)
  socket.on('voice-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice-answer', { fromId: socket.id, answer });
  });

  // Relay ICE Candidate
  socket.on('voice-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('voice-ice-candidate', { fromId: socket.id, candidate });
  });

  // User thay đổi trạng thái mute (tự mute/unmute)
  socket.on('voice-mute-changed', ({ roomId, muted }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    if (room.voiceUsers[socket.id]) room.voiceUsers[socket.id].muted = muted;
    socket.to(roomId).emit('voice-mute-changed', { userId: socket.id, muted });
  });

  // Host mute/unmute một user khác
  socket.on('voice-host-mute', ({ roomId, targetId, muted }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const requester = room.members.find(m => m.id === socket.id);
    if (!requester?.isHost) return;
    if (room.voiceUsers && room.voiceUsers[targetId]) {
      room.voiceUsers[targetId].muted = muted;
    }
    io.to(targetId).emit('voice-host-muted', { muted });
    socket.to(roomId).emit('voice-mute-changed', { userId: targetId, muted });
  });

  // VAD: User đang nói / ngừng nói
  socket.on('voice-speaking', ({ roomId, speaking }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    if (room.voiceUsers[socket.id]) room.voiceUsers[socket.id].speaking = speaking;
    socket.to(roomId).emit('voice-speaking', { userId: socket.id, speaking });
  });

  // ────────────────────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    onlineUsers.delete(socket.id);
    broadcastFriendsStatus();

    // Duyệt qua tất cả các phòng để xóa member ngắt kết nối
    for (const [roomId, room] of rooms.entries()) {
      const index = room.members.findIndex(m => m.id === socket.id);
      
      if (index !== -1) {
        const removedMember = room.members.splice(index, 1)[0];
        console.log(`${removedMember.username} left room: ${roomId}`);

        // Cleanup voice chat khi user rời phòng
        if (room.voiceUsers && room.voiceUsers[socket.id]) {
          delete room.voiceUsers[socket.id];
          io.to(roomId).emit('voice-user-left', { userId: socket.id });
        }
        if (room.studyTable?.seats) {
          delete room.studyTable.seats[socket.id];
          emitStudyTable(roomId);
        }

        if (room.members.length === 0) {
          // Keep state briefly so browser refresh/reconnect does not reset the room.
          rememberRoom(room, removedMember.username);
          scheduleEmptyRoomCleanup(roomId);
          console.log(`Room ${roomId} is empty; keeping state for quick reconnect.`);
        } else {
          sendSystemMessage(roomId, `Bạn học ${removedMember.username} đã rời phòng.`);
          
          // Nếu người rời đi là host, chuyển quyền host cho người kế tiếp
          if (removedMember.isHost) {
            room.hostFriendCode = removedMember.friendCode || room.hostFriendCode || '';
            room.hostUsername = removedMember.username || room.hostUsername || '';
            room.hostReconnectUntil = new Date(Date.now() + HOST_RECONNECT_TTL_MS).toISOString();
            scheduleHostTransfer(roomId);
            rememberRoomState(room);
          }
          // Cập nhật lại danh sách user cho những người còn lại
          io.to(roomId).emit('room-users', room.members);
        }
        broadcastRoomDirectory();
        break;
      }
    }
  });
});

// Chạy một tiến trình ticker đếm ngược Pomodoro ở server cứ mỗi 1 giây
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    const studyTable = room.studyTable;
    if (studyTable?.seats) {
      let changed = false;
      for (const seat of Object.values(studyTable.seats)) {
        const personal = seat.personalPomodoro;
        if (personal?.isRunning && personal.timeLeft > 0) {
          personal.timeLeft -= 1;
          personal.lastUpdated = Date.now();
          changed = true;
          if (personal.timeLeft === 0) {
            personal.isRunning = false;
            personal.isBreak = !personal.isBreak;
            personal.duration = personal.isBreak ? 5 * 60 : 25 * 60;
            personal.timeLeft = personal.duration;
          }
        }
      }
      if (changed) io.to(roomId).emit('study-table-sync', studyTable);
    }

    const p = room.pomodoro;
    if (p.isRunning && p.timeLeft > 0) {
      p.timeLeft -= 1;
      
      // Khi đếm ngược hết giờ
      if (p.timeLeft === 0) {
        p.isRunning = false;
        p.isBreak = !p.isBreak;
        p.duration = p.isBreak ? 5 * 60 : 25 * 60;
        p.timeLeft = p.duration;
        io.to(roomId).emit('pomodoro-done', { isBreak: p.isBreak });
        sendSystemMessage(roomId, p.isBreak ? "⏰ Hết giờ học tập! Hãy nghỉ giải lao 5 phút." : "💪 Đã hết giờ giải lao! Tập trung học tiếp thôi.");
      }

      io.to(roomId).emit('pomodoro-sync', p);
    }
  }
}, 1000);

const DEFAULT_PORT = 3001;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = '0.0.0.0';

const listen = (server, port, label) => {
  server.listen(port, HOST, () => {
    console.log(`Socket.io Server is running on ${HOST}:${port} (${label})`);
  });
  server.on('error', (err) => {
    console.error(`Server failed on ${HOST}:${port} (${label}):`, err.message);
    if (label === 'primary') process.exit(1);
  });
};

listen(httpServer, PORT, 'primary');

if (PORT !== DEFAULT_PORT) {
  const fallbackServer = createServer(app);
  io.attach(fallbackServer, socketOptions);
  listen(fallbackServer, DEFAULT_PORT, 'fallback');
}
