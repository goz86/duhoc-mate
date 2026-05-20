import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import yts from 'yt-search';

const app = express();
app.use(cors());
app.use(express.json());

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
    methods: ['GET', 'POST']
  }
});

// Lưu trữ dữ liệu các phòng trong memory
// Cấu trúc room: { roomId, members: [], playlist: [], videoState: { id, time, playing }, pomodoro: {} }
const rooms = new Map();
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
    currentSong: r.playlist[0]?.title || 'Đang nghe nhạc Lofi'
  }));
  io.emit('active-rooms-list', activeRooms);
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
      currentSong: r.playlist[0]?.title || 'Đang nghe nhạc Lofi'
    }));
    socket.emit('active-rooms-list', activeRooms);
  });

  // 1. Tham gia phòng
  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    
    // Khởi tạo phòng nếu chưa tồn tại
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        members: [],
        playlist: [],
        videoState: {
          id: '5qap5aO4i9A', // Video mặc định (Lofi Girl)
          time: 0,
          playing: false,
          lastUpdated: Date.now()
        },
        pomodoro: createDefaultPomodoro(),
        chatMessages: []
      });
    }

    const room = rooms.get(roomId);
    
    // Kiểm tra xem user có phải host đầu tiên của phòng không
    const isHost = room.members.length === 0;

    const newMember = {
      id: socket.id,
      username: username || `Bạn học #${Math.floor(1000 + Math.random() * 9000)}`,
      isHost
    };

    room.members.push(newMember);

    // Cập nhật thông tin phòng & bài hát của user trong onlineUsers
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.currentRoomId = roomId;
      user.currentSong = room.playlist[0]?.title || 'Đang nghe nhạc Lofi';
    } else {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        friendCode: '',
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
      isHost
    });

    broadcastActiveRooms();
    
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
  socket.on('video-action', ({ roomId, action, time, videoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Cập nhật trạng thái video của phòng
    if (videoId) room.videoState.id = videoId;
    if (time !== undefined) room.videoState.time = time;
    if (action === 'play') room.videoState.playing = true;
    if (action === 'pause') room.videoState.playing = false;
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

    room.playlist.push(newItem);
    
    // Sắp xếp playlist theo số vote giảm dần
    room.playlist.sort((a, b) => b.votes - a.votes);

    io.to(roomId).emit('update-playlist', room.playlist);
    sendSystemMessage(roomId, `Bạn học ${addedBy} đã thêm bài: "${title}".`);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
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

  // 6. Ngắt kết nối
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

        if (room.members.length === 0) {
          // Xóa phòng nếu không còn ai
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
        broadcastActiveRooms();
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
httpServer.listen(PORT, () => {
  console.log(`Socket.io Server is running on port ${PORT}`);
});
