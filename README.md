# Trang Web Bất Động Sản RealEstate

Một trang web bất động sản hiện đại và chuyên nghiệp được xây dựng với React, bao gồm các tính năng đăng tin bán/thuê, tin tức bất động sản và giao diện người dùng đẹp mắt.

## ✨ Tính Năng Chính

- 🏠 **Đăng tin bán/thuê** - Hệ thống đăng tin bất động sản chuyên nghiệp
- 🔍 **Tìm kiếm thông minh** - Bộ lọc đa tiêu chí (địa điểm, loại nhà, giá, diện tích)
- 📰 **Tin tức bất động sản** - Cập nhật tin tức và thông tin thị trường
- 🎨 **Giao diện hiện đại** - Thiết kế responsive với animations mượt mà
- 📱 **Tương thích đa thiết bị** - Hoạt động hoàn hảo trên desktop, tablet và mobile
- ⚡ **Hiệu suất cao** - Tối ưu hóa với React 18 và các công nghệ hiện đại

## 🛠️ Công Nghệ Sử Dụng

- **React 18** - Framework JavaScript hiện đại với hooks
- **Tailwind CSS** - Framework CSS utility-first cho thiết kế nhanh
- **Framer Motion** - Thư viện animation chuyên nghiệp
- **Lucide React** - Bộ icon đẹp và nhất quán
- **Responsive Design** - Thiết kế thích ứng mọi thiết bị

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống

Đảm bảo bạn đã cài đặt Node.js trên hệ thống (phiên bản 14 trở lên).

### Cài Đặt

1. Clone repository hoặc di chuyển đến thư mục dự án
2. Cài đặt dependencies:
   ```bash
   npm install
   ```

### Phát Triển

Khởi động server phát triển:
```bash
npm start
```

Ứng dụng sẽ mở trong trình duyệt tại `http://localhost:3000`.

### Build Production

Tạo bản build production:
```bash
npm run build
```

## 📁 Cấu Trúc Dự Án

```
src/
├── App.js              # Component chính của ứng dụng
├── index.js            # Điểm khởi đầu React
├── index.css           # Styles toàn cục và Tailwind imports
public/
├── index.html          # Template HTML
├── package.json        # Dependencies và scripts
├── tailwind.config.js  # Cấu hình Tailwind CSS
└── postcss.config.js   # Cấu hình PostCSS
```

## ⚙️ Cấu Hình Môi Trường (.env.local)

Ứng dụng frontend (Create React App) hỗ trợ cấu hình qua file `.env.local`. Các biến môi trường phải bắt đầu bằng tiền tố `REACT_APP_`.

### Tạo `.env.local`
1. Tại thư mục gốc của frontend (cùng cấp với `package.json`), tạo file tên `.env.local`.
2. Thêm các biến sau (điều chỉnh theo môi trường của bạn):

```sh
REACT_APP_MAPBOX_TOKEN={API MAPBOX}
REACT_APP_FIREBASE_API_KEY=AI{API KEY FIREBASE}
REACT_APP_FIREBASE_AUTH_DOMAIN={FIREBASE AUTH DOMAIN}
REACT_APP_FIREBASE_PROJECT_ID={FIREBASE PROJECT ID}
REACT_APP_FIREBASE_STORAGE_BUCKET={FIREBASE STORAGE BUCKET}
REACT_APP_FIREBASE_MESSAGING_SENDING_ID={FIREBASE MESSAGING SENDING ID}
REACT_APP_FIREBASE_APP_ID={FIREBASE APP ID}
REACT_APP_FIREBASE_MEASUREMENT_ID={FIREBASE MEASUREMENT ID}
REACT_APP_URL_HTTP=http://localhost:8000
REACT_APP_URL_WEBSOCKET=ws://localhost:8000
<!-- thông tin có khi tạo project trên firebase -->
```

3. Cài đặt thư viện 
```sh
npm install
```

4. Lưu file và khởi động lại server phát triển:
```bash
npm start
```

Lưu ý: Hiện tại các URL trong `src/base.js` đang được gán cứng. Để sử dụng `.env.local`, có thể thay bằng `process.env.REACT_APP_*` (ví dụ `process.env.REACT_APP_BASE_URL`). Nếu bạn muốn, mình có thể cập nhật mã nguồn để đọc các biến này và giữ giá trị mặc định khi biến không tồn tại.

## 🎯 Các Thành Phần Chính

### Header & Navigation
- **Logo và branding** - Logo RealEstate với thiết kế chuyên nghiệp
- **Menu điều hướng** - Nhà đất bán, Nhà đất thuê, Tin tức
- **Nút đăng tin** - Truy cập nhanh để đăng tin bất động sản
- **Đăng nhập/Đăng ký** - Hệ thống tài khoản người dùng

### Tìm Kiếm Bất Động Sản
- **Bộ lọc đa tiêu chí** - Địa điểm, loại nhà đất, mức giá, diện tích
- **Tab chuyển đổi** - Chuyển đổi giữa bán và thuê
- **Nút tìm kiếm** - Tìm kiếm nhanh với giao diện đẹp

### Banner Hero
- **Thiết kế gradient** - Background gradient với hiệu ứng đẹp mắt
- **Nội dung marketing** - Giới thiệu về PropertyGuru Vietnam Property Awards
- **Call-to-action** - Nút đăng ký nổi bật
- **Carousel navigation** - Điều hướng banner với dots

### Tin Tức Nổi Bật
- **Card tin tức** - Hiển thị tin tức với hình ảnh và thời gian
- **Category tags** - Phân loại tin tức rõ ràng
- **Responsive layout** - Hiển thị tốt trên mọi thiết bị

### Danh Sách Bất Động Sản
- **Property cards** - Thẻ bất động sản với thông tin chi tiết
- **Brand overlay** - Logo thương hiệu và thông tin dự án
- **Feature highlights** - Các ưu đãi và đặc điểm nổi bật
- **Interactive elements** - Nút yêu thích và tương tác

### Footer
- **Thông tin liên hệ** - Địa chỉ, số điện thoại, email
- **Social media** - Liên kết mạng xã hội
- **Menu dịch vụ** - Danh sách các dịch vụ cung cấp
- **Hỗ trợ khách hàng** - Thông tin hỗ trợ và chính sách

## 🎨 Tùy Chỉnh

### Màu Sắc
Ứng dụng sử dụng bảng màu tùy chỉnh được định nghĩa trong `tailwind.config.js`. Bạn có thể thay đổi màu sắc chính và phụ để phù hợp với thương hiệu.

### Components
Tất cả components đều modular và có thể dễ dàng tùy chỉnh. Styling chính được thực hiện thông qua Tailwind CSS classes.

### Icons
Ứng dụng sử dụng Lucide React icons. Bạn có thể thay thế bất kỳ icon nào bằng cách import icon khác từ thư viện Lucide.

## 📱 Hỗ Trợ Trình Duyệt

- Chrome (phiên bản mới nhất)
- Firefox (phiên bản mới nhất)
- Safari (phiên bản mới nhất)
- Edge (phiên bản mới nhất)

## 🔧 Tính Năng Nâng Cao

### Responsive Design
- Mobile-first approach
- Breakpoints tối ưu cho mọi thiết bị
- Touch-friendly interactions

### Performance
- Lazy loading cho hình ảnh
- Optimized animations
- Efficient state management

### Accessibility
- Semantic HTML
- Keyboard navigation
- Screen reader support

## 📞 Hỗ Trợ

Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ với ứng dụng, vui lòng liên hệ!

## 📄 Giấy Phép

Dự án này được phát hành dưới [MIT License](LICENSE).
