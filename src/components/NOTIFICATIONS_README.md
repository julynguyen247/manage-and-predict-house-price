## Notifications - Tổng quan

Tài liệu mô tả chuông thông báo, dropdown, và trình quản lý thông báo toàn cục trong ứng dụng.

### Tính năng
- Hiển thị badge số lượng chưa đọc trên biểu tượng chuông
- Dropdown danh sách thông báo, hỗ trợ tải thêm (infinite load)
- Đánh dấu đã đọc (gửi PUT theo lô, debounce)
- Cache ngắn hạn trong LocalStorage (danh sách + meta phân trang)
- Long-polling để nhận thông báo mới
- Hiển thị Browser Notification (khi người dùng cấp quyền)

### File chính
- `src/contexts/NotificationContext.js`
  - Cung cấp state thông báo, `unreadCount`, API fetch/refresh, khởi động/dừng long-polling, mark-as-read theo lô, và các helper cache.
- `src/components/NotificationBell.js`
  - Nút chuông đọc `unreadCount` từ context, hiển thị badge, có `aria-label` và `title` thân thiện a11y.
- `src/components/NotificationDropdown.js`
  - Giao diện dropdown: fetch khi mở, hiển thị danh sách, tải thêm, đánh dấu đã đọc, điều hướng tới chi tiết.
- `src/components/NotificationManager.js`
  - Thành phần headless: xin quyền, hiển thị Browser Notification cho thông báo mới, log trạng thái ở môi trường dev.

### Cách hoạt động của số chưa đọc
- Context cung cấp `unreadCount` và `fetchUnreadCount()`.
- `NotificationBell` đọc `unreadCount` và hiển thị badge (giới hạn hiển thị 99+).

### Luồng lấy dữ liệu
- `fetchNotifications(page, append)` qua `apiService.authenticatedGet('notifications/')`.
- Trang đầu thử đọc từ LocalStorage để tránh UI trắng.
- `loadMoreNotifications()` phân tích `next` để xác định trang tiếp theo.
- Long-polling kích hoạt `fetchNotifications(1)` khi phát hiện dữ liệu mới.

### Đánh dấu đã đọc (debounced)
- `markAsRead(id)` cập nhật lạc quan, cập nhật cache, đưa id vào hàng đợi.
- Timer debounce flush hàng đợi: gửi lần lượt PUT `notifications/{id}/` với `{ action: 'readed' }`.
- Sau khi flush, gọi `fetchUnreadCount()` một lần để cập nhật badge.

### Sử dụng tối thiểu
```jsx
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';

// Trong header
<NotificationBell onClick={() => setOpen(v => !v)} />
<NotificationDropdown />
```

### Ghi chú
- Hạn chế log ở production; chỉ bật log chi tiết khi `process.env.NODE_ENV === 'development'`.
- `NotificationDropdown` dùng trực tiếp dữ liệu từ context; tránh nhân bản state cục bộ.
