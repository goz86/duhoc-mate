import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import yts from 'yt-search';
import { readFileSync, writeFileSync } from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============================================================
// REST API: Tìm kiếm nhạc YouTube qua yt-search (không cần API key)
// ============================================================
app.get('/api/search-music', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });

  try {
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
    console.error('yt-search error:', err.message);
    return res.json({ results: [], error: 'Không tìm được kết quả. Hãy thử lại hoặc dán link YouTube trực tiếp.' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Hỗ trợ mọi nguồn kết nối cục bộ và deploy
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000
});

// Lưu trữ dữ liệu các phòng trong memory
// Cấu trúc room: { roomId, members: [], playlist: [], videoState: { id, time, playing }, pomodoro: {} }
const rooms = new Map();

// Persist roomDirectory sang file JSON để không mất dữ liệu sau restart
const ROOM_DIR_FILE = './room-directory.json';
let _savedDir = {};
try { _savedDir = JSON.parse(readFileSync(ROOM_DIR_FILE, 'utf8')); } catch {}
const roomDirectory = new Map(Object.entries(_savedDir));

const saveRoomDirectory = () => {
  try {
    const obj = {};
    for (const [k, v] of roomDirectory.entries()) obj[k] = v;
    writeFileSync(ROOM_DIR_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('saveRoomDirectory error:', e.message); }
};
const onlineUsers = new Map(); // socket.id -> { socketId, friendCode, username, currentRoomId, currentSong }

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
  socket.on('join-room', ({ roomId, username, ideaTasks = [], roomTitle, isPrivate, password, hostAvatarUrl, friendCode }) => {
    const rememberedRoom = roomDirectory.get(roomId);
    // Khởi tạo phòng nếu chưa tồn tại
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        members: [],
        playlist: [],
        videoState: {
          id: '', // Không có video mặc định — chờ người dùng chọn
          time: 0,
          playing: false,
          pausedByHost: false, // Host đã tạm dừng toàn phòng
          lastUpdated: Date.now()
        },
        pomodoro: createDefaultPomodoro(),
        chatMessages: [],
        ideaTasks: Array.isArray(ideaTasks) ? ideaTasks : [],
        roomTitle: roomTitle || `Phòng của ${username}`,
        isPrivate: isPrivate !== undefined ? !!isPrivate : !!rememberedRoom?.isPrivate,
        password: password || rememberedRoom?.password || '',
        hostAvatarUrl: hostAvatarUrl || rememberedRoom?.hostAvatarUrl || '',
        voiceUsers: {}  // { [socketId]: { muted, speaking } }
      });
    }

    const room = rooms.get(roomId);
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
    
    // Kiểm tra xem user có phải host đầu tiên của phòng không
    const isHost = room.members.length === 0;

    const newMember = {
      id: socket.id,
      username: username || `Bạn học #${Math.floor(1000 + Math.random() * 9000)}`,
      isHost,
      friendCode: friendCode || onlineUsers.get(socket.id)?.friendCode || ''
    };

    room.members.push(newMember);
    if (isHost && hostAvatarUrl) {
      room.hostAvatarUrl = hostAvatarUrl;
    }
    rememberRoom(room, room.members.find(m => m.isHost)?.username || newMember.username);

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
      voiceUsers: room.voiceUsers || {}
    });

    // Nếu phòng đang có TikTok video, gửi sync cho member mới
    if (room.tiktokVideoId) {
      socket.emit('tiktok-sync', { videoId: room.tiktokVideoId });
    }

    broadcastRoomDirectory();
    
    // Thông báo hệ thống khi có thành viên mới
    sendSystemMessage(roomId, `Bạn học ${newMember.username} đã tham gia phòng.`);

    console.log(`${newMember.username} joined room: ${roomId} (Host: ${isHost})`);
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
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }

    io.to(roomId).emit('receive-message', chatMsg);
  });

  // 3. Đồng bộ Video YouTube
  socket.on('video-action', ({ roomId, action, time, videoId, userInitiated }) => {
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

    // Cập nhật trạng thái video của phòng
    if (videoId) room.videoState.id = videoId;
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

    // Gửi lại trạng thái video mới cho các thành viên khác trong phòng (ngoại trừ người gửi)
    socket.to(roomId).emit('video-sync', {
      action,
      time,
      videoId,
      videoState: room.videoState
    });

    if (videoId) {
      const activeItem = room.playlist.find(item => item.videoId === videoId);
      updateRoomMembersSongs(roomId, activeItem ? activeItem.title : `Đang phát video (${videoId})`);
    }
  });

  // 4. Playlist & Upvote Jukebox
  socket.on('add-to-playlist', ({ roomId, videoId, title, duration }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    const addedBy = sender ? sender.username : 'Ẩn danh';

    // Kiểm tra xem bài hát đã tồn tại trong hàng đợi chưa
    const exists = room.playlist.some(item => item.videoId === videoId);
    if (exists) return;

    const newItem = {
      id: `${Date.now()}-${Math.random()}`,
      videoId,
      title,
      duration: duration || '00:00',
      votes: 1, // Bắt đầu bằng 1 vote từ người thêm
      votedUsers: [socket.id],
      addedBy
    };

    // wasEmpty: playlist trống VÀ không có video nào đang phát (kể cả video mặc định cũ đang lỗi)
    const wasEmpty = room.playlist.length === 0 && !room.videoState.playing;

    room.playlist.push(newItem);

    // Sắp xếp playlist theo số vote giảm dần
    room.playlist.sort((a, b) => b.votes - a.votes);

    sendSystemMessage(roomId, `Bạn học ${addedBy} đã thêm bài: "${title}".`);

    // Nếu phòng chưa có video nào đang phát → tự động phát bài vừa thêm
    if (wasEmpty) {
      room.videoState.id = newItem.videoId;
      room.videoState.time = 0;
      room.videoState.playing = true;
      room.videoState.lastUpdated = Date.now();
      room.playlist = room.playlist.filter(item => item.id !== newItem.id);
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
    room.playlist.sort((a, b) => b.votes - a.votes);

    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
  });

  // Xóa bài hát khỏi playlist (khi phát xong)
  socket.on('remove-song', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.playlist = room.playlist.filter(item => item.id !== songId);
    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
  });

  // 5. Đồng bộ đếm ngược Pomodoro
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
    socket.to(roomId).emit('idea-board-sync', room.ideaTasks);
  });

  socket.on('tiktok-sync', ({ roomId, videoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    // Lưu state TikTok vào room để members join sau cũng nhận được
    room.tiktokVideoId = videoId;
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
    io.to(roomId).emit('room-users', room.members);
    sendSystemMessage(roomId, `${target.username} đã trở thành host của phòng.`);
    rememberRoom(room, target.username);
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
    roomDirectory.delete(roomId);
    saveRoomDirectory();
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

        if (room.members.length === 0) {
          // Xóa phòng nếu không còn ai
          rememberRoom(room, removedMember.username);
          rooms.delete(roomId);
          console.log(`Deleted empty room: ${roomId}`);
        } else {
          sendSystemMessage(roomId, `Bạn học ${removedMember.username} đã rời phòng.`);
          
          // Nếu người rời đi là host, chuyển quyền host cho người kế tiếp
          if (removedMember.isHost) {
            room.members[0].isHost = true;
            // Gửi thông báo cho người được làm host mới
            io.to(room.members[0].id).emit('assigned-host', true);
            sendSystemMessage(roomId, `Bạn học ${room.members[0].username} đã trở thành chủ phòng.`);
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

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`Socket.io Server is running on ${HOST}:${PORT}`);
});
