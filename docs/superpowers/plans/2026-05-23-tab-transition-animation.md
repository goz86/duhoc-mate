# Tab Transition Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hiệu ứng trượt và mờ dần (staggered fade-in & slide-down) cho danh sách phòng học khi chuyển tab, và cố định chiều cao của thẻ Marketplace để tránh hiện tượng co giãn giao diện (Layout Shift).

**Architecture:** Định nghĩa một CSS keyframe animation trong `index.css`. Sử dụng `key={activeTab}` trên thẻ wrapper danh sách để ép React re-mount phần tử và kích hoạt lại animation mỗi khi đổi tab. Thêm thuộc tính `animationDelay` dựa trên chỉ số `index` của các phần tử con để tạo hiệu ứng hiển thị tuần tự từ trên xuống dưới.

**Tech Stack:** React, Tailwind CSS, Vanilla CSS Keyframes.

---

### Task 1: Thêm CSS Entry Animation vào index.css

**Files:**
- Modify: [index.css](file:///c:/Users/Hhung/Desktop/du%20hoc%20mate%20video/duhoc-mate/client/src/index.css)

- [ ] **Step 1: Thêm keyframes và utility class cho hiệu ứng fadeSlideDown**

Thêm đoạn CSS dưới đây vào cuối file `client/src/index.css`:

```css
@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-slide-down {
  opacity: 0;
  animation: fadeSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

- [ ] **Step 2: Commit thay đổi**

```bash
git add client/src/index.css
git commit -m "style: add fade-slide-down animation utility class"
```

---

### Task 2: Cố định chiều cao của thẻ Marketplace

**Files:**
- Modify: [TemplateMarketplace.tsx](file:///c:/Users/Hhung/Desktop/du%20hoc%20mate%20video/duhoc-mate/client/src/components/TemplateMarketplace.tsx)

- [ ] **Step 1: Thay đổi min-height thành fixed height**

Trong `client/src/components/TemplateMarketplace.tsx`, sửa class của thẻ `section` ở đầu phương thức render (dòng 86) từ `min-h-[500px]` thành `h-[540px]`:

```diff
-    <section className="flex min-h-[500px] flex-col gap-5 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
+    <section className="flex h-[540px] flex-col gap-5 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
```

- [ ] **Step 2: Commit thay đổi**

```bash
git add client/src/components/TemplateMarketplace.tsx
git commit -m "style: fix TemplateMarketplace card height to 540px"
```

---

### Task 3: Áp dụng Key và Staggered Delay trong TemplateMarketplace.tsx

**Files:**
- Modify: [TemplateMarketplace.tsx](file:///c:/Users/Hhung/Desktop/du%20hoc%20mate%20video/duhoc-mate/client/src/components/TemplateMarketplace.tsx)

- [ ] **Step 1: Thêm key={activeTab} vào div chứa danh sách phòng**

Tìm thẻ `div` bọc danh sách phòng ở dòng 111:
```tsx
      <div className="h-[260px] flex-1 space-y-3 overflow-y-auto pr-1">
```
Thay thế bằng:
```tsx
      <div key={activeTab} className="h-[260px] flex-1 space-y-3 overflow-y-auto pr-1">
```

- [ ] **Step 2: Áp dụng class animation và staggered delay cho tab 'recent'**

Tìm phần hiển thị danh sách phòng gần đây (dòng 122):
```tsx
        {activeTab === 'recent' && visibleRecentRooms.map(room => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
          >
```
Thay thế bằng (thêm class `animate-fade-slide-down` và inline style `animationDelay`):
```tsx
        {activeTab === 'recent' && visibleRecentRooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id)}
            style={{ animationDelay: `${index * 50}ms` }}
            className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
          >
```

- [ ] **Step 3: Áp dụng class animation và staggered delay cho tab 'explore'**

Ở tab 'explore', có phòng hạt giống (seed-topik-30) ở đầu (dòng 139) và danh sách các phòng khác (dòng 164).
Sửa phòng hạt giống:
```tsx
        {activeTab === 'explore' && topikTemplate && (
          <article className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md">
```
Thay thế bằng (phần tử đầu tiên có delay 0ms):
```tsx
        {activeTab === 'explore' && topikTemplate && (
          <article 
            style={{ animationDelay: '0ms' }}
            className="group animate-fade-slide-down flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
          >
```

Sửa danh sách phòng người dùng hoạt động (dòng 164):
```tsx
        {activeTab === 'explore' && visibleUserRooms.map(room => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id)}
            className="group flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
          >
```
Thay thế bằng (độ trễ bắt đầu cộng dồn từ index + 1 nếu topikTemplate có hiển thị, hoặc đơn giản là `(index + 1) * 50` để tạo khoảng trống nhịp điệu cho mượt):
```tsx
        {activeTab === 'explore' && visibleUserRooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id)}
            style={{ animationDelay: `${(index + (topikTemplate ? 1 : 0)) * 50}ms` }}
            className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
          >
```

- [ ] **Step 4: Áp dụng class animation và staggered delay cho tab 'friends'**

Tại tab 'friends', có box hiển thị mã bạn bè, form thêm bạn bè, sau đó là danh sách bạn bè (dòng 211):
Chúng ta có thể tạo hiệu ứng động cho toàn bộ cụm mã bạn bè + form hoặc chỉ riêng danh sách bạn bè bên dưới. Để có hiệu ứng cuộn mượt mà nhất, chúng ta áp dụng animation và trễ động cho từng dòng hiển thị của bạn bè.
Tìm dòng hiển thị bạn bè:
```tsx
              visibleFriends.map(friend => (
                <button
                  key={friend.code}
                  onClick={() => friend.online && friend.currentRoomId && onJoinRoom(friend.currentRoomId)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
                >
```
Thay thế bằng (thêm animation và delay):
```tsx
              visibleFriends.map((friend, index) => (
                <button
                  key={friend.code}
                  onClick={() => friend.online && friend.currentRoomId && onJoinRoom(friend.currentRoomId)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-md"
                >
```

- [ ] **Step 5: Commit thay đổi**

```bash
git add client/src/components/TemplateMarketplace.tsx
git commit -m "feat: implement staggered fade-slide-down animation for room lists on tab switch"
```

---

### Task 4: Kiểm tra và xác thực

**Files:**
- Test: Chạy dev server và kiểm tra trực tiếp trên trình duyệt.

- [ ] **Step 1: Xác nhận không có lỗi biên dịch**

Kiểm tra terminal của Vite dev server đang chạy xem có xuất hiện bất kỳ parse error hoặc build error nào không.

- [ ] **Step 2: Kiểm tra chức năng chuyển tab trên trình duyệt**

Mở `http://localhost:5173/`, thử bấm chuyển đổi giữa các tab:
1. Chiều cao của thẻ trắng chứa Marketplace bên phải phải cố định (không bị co giãn lồi lõm khi chuyển tab).
2. Danh sách phòng học hiển thị lần lượt từ trên xuống dưới bằng hiệu ứng trượt dọc mượt mà.
3. Việc cuộn chuột (scroll) bên trong danh sách phòng hoạt động bình thường.
