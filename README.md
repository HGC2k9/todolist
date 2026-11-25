# ✅ To-Do List — 100% Offline-first Local & Capacitor iOS

Ứng dụng quản lý công việc cá nhân **100% Offline-first (Pure-Local)** không phụ thuộc máy chủ, đóng gói trực tiếp cho **iOS (Capacitor WKWebView)** và **Web/PWA**, hỗ trợ cập nhật giao diện **OTA tự động qua GitHub Pages**.

---

## 🌟 Tính năng nổi bật

- 📱 **100% Cục bộ & Tức thì (0ms)**: Mở ứng dụng ngay lập tức không cần đăng nhập hay chờ mạng; toàn bộ công việc, danh mục, ảnh minh chứng và lịch sử hoàn thành được lưu bền vững trên thiết bị qua `@capacitor/preferences` kết hợp `localStorage`.
- 🔔 **Thông báo Native iOS thông minh (Rolling Queue)**:
  - Nhắc lặp liên tục theo mức độ ưu tiên (**High**: 2 giây/lần, **Medium**: 150 giây/lần, **Low**: 300 giây/lần) cho đến đúng mốc hết hạn hoặc khi hoàn thành/xóa việc.
  - Cơ chế **Hàng đợi trượt (Rolling Queue)** tự động nạp lại trong giới hạn 64 thông báo của iOS (60 slot việc sắp đến hạn + 2 điểm tin cố định lúc **06:00** và **18:00**).
  - **Actionable Notification ("Đã xong")**: Nhấn giữ thông báo trên màn hình khóa iOS để đánh dấu hoàn thành ngầm ngay lập tức (`MARK_DONE`), hủy chuỗi nhắc lặp còn lại và tự nạp tiếp hàng đợi.
  - Âm thanh thông báo tùy chỉnh **`pop_ding.wav`** sắc nét, tích hợp sẵn trong bundle iOS.
  - Bộ đếm thời gian động chính xác (`"Còn X phút nữa đến hạn"` / `"Đã đến hạn"`).
- 📋 **Quản lý công việc toàn diện**:
  - Việc con (Subtasks/Checklist), thẻ `#tags`, ghim việc, nhân bản, kéo thả sắp xếp tùy chỉnh, thùng rác & khôi phục.
  - Tự động reset công việc lặp lại **Hàng ngày** & **Hàng tuần** theo múi giờ Việt Nam (UTC+7).
  - Chế độ **Tập trung Pomodoro**, đồng hồ bấm giờ/hẹn giờ và âm thanh nền Web Audio API (Mưa, Quán cà phê, Ồn trắng).
  - Bóc tách ngôn ngữ tự nhiên tiếng Việt (`parseTaskFromText`) & chụp/đính kèm ảnh minh chứng (`@capacitor/camera`).
  - Thống kê năng suất sâu, chuỗi Streak, xem dạng **Danh sách** hoặc **Lịch (Calendar)**.
- 💾 **Sao lưu & Khôi phục chuẩn iOS**:
  - Xuất/Nhập dữ liệu JSON (dùng Web Share API cho iPhone Share Sheet, kèm sao chép Clipboard dự phòng) và xuất lịch `.ics` (RFC 5545).
- 🚀 **Cập nhật OTA tự động & Auto-Rollback**:
  - Kiểm tra `version.json` trên GitHub Pages ở chế độ nền; tự động tải và áp dụng bản web mới vào bộ nhớ cục bộ qua `@capacitor/filesystem`, kèm cơ chế tự phục hồi về bundle gốc nếu phát hiện lỗi khởi chạy.

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Giao diện (SPA)** | [Alpine.js](https://alpinejs.dev/) v3 + [Tailwind CSS](https://tailwindcss.com/) (đóng gói offline trong `dist/vendor/`) |
| **Native Runtime** | [Capacitor](https://capacitorjs.com/) v8 (iOS WKWebView) |
| **Lưu trữ cục bộ** | `@capacitor/preferences` + `localStorage` |
| **Thông báo hệ thống** | `@capacitor/local-notifications` + custom `pop_ding.wav` |
| **OTA Update** | `@capacitor/filesystem` + GitHub Pages (`version.json`) |
| **Build & Test** | TypeScript + `tsx` + Node `assert` |

---

## 📁 Cấu trúc thư mục

```text
ToDoList/
├── .github/workflows/     # CI/CD: Build .ipa iOS & Deploy OTA lên GitHub Pages
├── ios/App/               # Xcode project & tài nguyên native iOS (pop_ding.wav, AppIcon)
├── public/sounds/         # Âm thanh thông báo tùy chỉnh (pop_ding.wav)
├── scripts/
│   ├── build.ts           # Đóng gói dist/ offline-first & sinh version.json cho OTA
│   ├── serve.ts           # Dev server cục bộ (http://localhost:5173) với watch mode
│   └── generate-all-icons.ts
├── src/
│   ├── client/
│   │   ├── storage.ts         # Lưu trữ cục bộ, CRUD, Backup/Restore JSON & .ics
│   │   ├── notifications.ts   # Rolling Queue, Actionable Notification (MARK_DONE), UTC+7
│   │   ├── audio-timer.ts     # Pomodoro, Đồng hồ đếm ngược & Web Audio API
│   │   └── ota-updater.ts     # Cơ chế OTA qua GitHub Pages & Auto-Rollback
│   ├── frontend.ts        # Giao diện SPA (HTML/Tailwind/Alpine)
│   ├── sw.ts              # Service Worker cache offline
│   ├── export.ts          # Xuất/nhập JSON & tạo file lịch .ics
│   ├── utils.ts           # Streak & bóc tách công việc tiếng Việt
│   ├── types.ts           # TypeScript types
│   └── version.ts         # Nguồn chân lý duy nhất cho SemVer (APP_VERSION)
├── test/                  # Bộ Unit Tests (recurring, v2, v3/notifications, ota)
├── capacitor.config.ts    # Cấu hình Capacitor iOS (capacitor://localhost)
└── package.json
```

---

## 🚀 Phát triển & Kiểm thử cục bộ

### 1. Cài đặt dependencies
```powershell
npm.cmd install
```

### 2. Chạy môi trường Dev (tự động rebuild khi sửa `src/`)
```powershell
npm.cmd run dev
```
Mở trình duyệt tại: **`http://localhost:5173`**

### 3. Kiểm thử & Đóng gói
```powershell
npx.cmd tsc --noEmit
npm.cmd test
npm.cmd run build
npx.cmd cap sync ios
```

### 4. Phát hành
- Push lên nhánh `main` sẽ tự động kích hoạt workflow **Deploy OTA Update to GitHub Pages** để cập nhật bản web mới cho ứng dụng iOS.
- Khi có thay đổi ở tầng native (`ios/` hoặc plugin Capacitor), chạy workflow build `.ipa` trên GitHub Actions để đóng gói lại bản cài đặt iOS.
