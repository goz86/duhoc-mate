# Design: Hiệu ứng chuyển động danh sách phòng học (Tab Transition Animation)

Thiết kế này bổ sung hiệu ứng chuyển động mượt mà (staggered fade-in & slide-down) cho danh sách phòng học trong `TemplateMarketplace` mỗi khi người dùng chuyển đổi giữa các tab "Gần đây", "Khám phá", "Bạn bè". Layout ngang của tab vẫn được giữ nguyên như ảnh chụp của người dùng.

## Chi tiết thiết kế

### 1. CSS Keyframes & Utility Class
Chúng ta sẽ thêm một hiệu ứng animation tùy chỉnh vào `client/src/index.css`:
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
  opacity: 0; /* Đảm bảo không bị giật nhấp nháy trước khi chạy animation */
  animation: fadeSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### 2. Kích hoạt Animation khi chuyển đổi Tab trong React
Để trình duyệt chạy lại hiệu ứng mỗi khi chuyển tab, chúng ta sẽ gán thuộc tính `key={activeTab}` lên thẻ div chứa danh sách phòng học trong `TemplateMarketplace.tsx`:
```tsx
<div key={activeTab} className="h-[260px] flex-1 space-y-3 overflow-y-auto pr-1">
  ...
</div>
```
Khi `activeTab` thay đổi, React sẽ coi component này là hoàn toàn mới và render lại từ đầu, kích hoạt hiệu ứng CSS animation.

### 3. Hiệu ứng hiển thị tuần tự từ trên xuống dưới (Staggered Animation)
Đối với mỗi phần tử trong danh sách phòng, chúng ta thêm class `.animate-fade-slide-down` và thuộc tính `style={{ animationDelay: `${index * 50}ms` }}`. Việc này giúp phần tử thứ nhất xuất hiện ngay lập tức, phần tử thứ hai trễ hơn 50ms, phần tử thứ ba trễ hơn 100ms,... tạo cảm giác hiển thị tuần tự cực kỳ mượt mà.

Áp dụng cho các danh sách:
- Danh sách phòng gần đây (Recent Rooms)
- Phòng TOPIK 24/24 và phòng người dùng tạo ở tab Khám phá (Explore Rooms)
- Danh sách bạn bè ở tab Bạn bè (Friends List)

### 4. Cố định chiều cao của thẻ Marketplace
Để ngăn hiện tượng co giãn chiều cao của giao diện (Layout Shift) khi chuyển giữa các tab có số lượng phần tử khác nhau, chúng ta sẽ cố định chiều cao của thẻ `TemplateMarketplace` bằng class `h-[540px]` thay vì `min-h-[500px]`:
```tsx
<section className="flex h-[540px] flex-col gap-5 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
```
Phần danh sách phòng có class `flex-1 overflow-y-auto` sẽ tự động chiếm trọn phần chiều cao còn lại của thẻ và hiện thanh cuộn khi danh sách quá dài, đảm bảo chiều cao tổng thể của trang Landing Page luôn cố định và cân đối.

