# Study & Stream Together - Cozy Space for Students in Korea 🇰🇷🎓

Chào mừng bạn học! Đây là không gian học tập trực tuyến đồng bộ giúp các bạn du học sinh (đặc biệt là du học sinh Hàn Quốc) xóa tan cô đơn, cùng nhau học bài, giải trí và gắn kết.

Dự án được xây dựng lấy cảm hứng từ giao diện **Cozy Cream** (Tone kem tối giản siêu dễ thương) giống Lissenly kết hợp các chức năng học tập nhóm chuyên sâu.

## 🌟 Tính năng chính

1. **Giao diện Cozy Cream**: Tone màu kem ấm áp, bo góc tròn, đồ họa Claymorphism thân thiện đem lại sự "chữa lành" tâm hồn sau một ngày đi học/làm thêm mệt mỏi.
2. **YouTube Jukebox Upvote**: Thêm link nhạc và vote bài hát yêu thích. Hệ thống tự động đẩy bài nhiều vote nhất lên đầu hàng đợi phát nhạc.
3. **Đồng bộ PDF Slide**: Trình chiếu Slide học tập tập thể. Chỉ cần Host chuyển trang, tất cả thành viên trong phòng đều được đồng bộ chuyển trang tức thì.
4. **Đồng hồ Pomodoro toàn phòng**: Đồng bộ giờ học tập tập trung (25 phút) và nghỉ giải lao (5 phút). Chuông báo tự động reo cho mọi người trong phòng khi hết giờ.
5. **gọi Video/Voice Jitsi**: Gọi điện nhóm, bật cam chia sẻ góc học tập trực tiếp ngay trên Sidebar.
6. **Real-time Chat**: Hộp trò chuyện nhanh cho các bạn du học sinh nhắn tin, hỏi han.

## 🛠️ Công nghệ sử dụng

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Jitsi External API, YouTube Iframe API.
*   **Backend**: Node.js, Express, Socket.io (đồng bộ thời gian thực).

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ

Dự án được cấu trúc dạng monorepo đơn giản với cấu hình chạy cực kỳ tiện lợi:

### 1. Cài đặt các gói thư viện
Mở terminal tại thư mục dự án `study-stream-together` và chạy:
```bash
npm run install:all
```
Lệnh này sẽ tự động cài đặt đầy đủ node_modules cho cả phần Client và Server.

### 2. Chạy chế độ Phát triển (Dev Mode)
Chạy lệnh sau ở thư mục gốc:
```bash
npm run dev
```
Hệ thống sẽ khởi động song song cả:
*   **Frontend Client**: `http://localhost:5173` (hoặc cổng trống tiếp theo)
*   **Socket Backend Server**: `http://localhost:3001`

Hãy mở 2 hoặc nhiều tab trình duyệt truy cập `http://localhost:5173`, nhập tên của bạn và tạo/tham gia phòng chung để tận hưởng tính năng đồng bộ thời gian thực nhé!

Chúc dự án kết nối cộng đồng của chúng ta thành công tốt đẹp! 🎉
