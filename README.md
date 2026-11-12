# 🚀 Cloudflare Serverless To-Do List Application

Ứng dụng web quản lý công việc hiện đại (**Single Page Application**) chạy trực tiếp trên nền tảng **Cloudflare Workers** kết hợp cơ sở dữ liệu phân tán **Cloudflare D1 (Serverless SQLite)**.

---

## 🌟 Tính năng nổi bật

- ⚡ **Siêu nhanh & Toàn cầu**: Chạy trực tiếp trên mạng Edge của Cloudflare tại hơn 300+ thành phố trên toàn cầu với độ trễ cực thấp (< 50ms).
- 🔒 **Bảo mật chuẩn OWASP**:
  - Mật khẩu được băm (hash) bằng thuật toán **PBKDF2-SHA256** với 100.000 vòng lặp thông qua chuẩn **Web Crypto API**.
  - Phiên làm việc (Session) sử dụng **JWT (HMAC-SHA256)** lưu trữ trong **HttpOnly Cookie** (`SameSite=Strict`, `Secure`), chống hoàn toàn tấn công XSS và trộm cắp token.
  - Phân quyền đa người dùng (**Multi-tenant data isolation**): Người dùng chỉ đọc, sửa, xóa công việc của chính mình.
  - Tích hợp sẵn các HTTP Security Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- 📋 **Quản lý To-Do toàn diện**:
  - Thêm, sửa, xoá công việc với hộp thoại xác nhận.
  - Phân loại theo Danh mục (**Work, Personal, Shopping, Health, Study**).
  - Đánh dấu mức độ ưu tiên trực quan (**🔴 High, 🟡 Medium, 🟢 Low**).
  - Thiết lập ngày giờ hết hạn (Due Date) với cảnh báo việc quá hạn theo thời gian thực.
  - 🔔 **Thông báo thông minh trước khi hết hạn 30 phút**: Tích hợp chuông Web Notification của trình duyệt + Banner cảnh báo nhấp nháy + Âm thanh Chime nhẹ nhàng (Web Audio API) trên cả Desktop và Điện thoại.
  - 📱 **Giao diện tối ưu Mobile & PWA App Web**: Thiết kế Bottom Sheet khi thêm/sửa việc, thanh cuộn ngang bộ lọc không che khuất, nút nổi FAB (+) góc dưới ngón cái, hỗ trợ "Thêm vào màn hình chính" (Add to Home Screen) cài đặt như App thực thụ.
  - 🎨 **Bộ Icon Vector hiện đại (Phong cách Icons8 Clean Glyphs)**: Toàn bộ biểu tượng trong app được thay thế bằng hệ thống vector SVG sắc nét chuẩn 24x24, hỗ trợ Dark/Light mode tự động và siêu nhẹ (< 1KB).
  - Bộ lọc thông minh: Lọc theo trạng thái (*Tất cả, Đang chờ, Đã xong, Quá hạn*), Danh mục, Mức độ ưu tiên.
  - Tìm kiếm công việc theo từ khóa tức thì (*Realtime Debounced Search*).
  - Sắp xếp linh hoạt: Theo hạn chót (gần nhất/xa nhất) hoặc ngày tạo (mới nhất/cũ nhất).
- 🎨 **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế tinh gọn, đẹp mắt, tối ưu responsive trên Mobile, Tablet và Desktop.
  - Hỗ trợ chế độ **Dark mode / Light mode** có lưu trạng thái trong `localStorage`.
  - Phản hồi trực quan: Loading spinner khi gọi API, Toast notifications khi thêm/sửa/xoá/hoàn thành tác vụ.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Backend Runtime** | [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Serverless) |
| **Web Framework** | [Hono.js](https://hono.dev/) v4 (Siêu nhẹ, tối ưu cho Cloudflare) |
| **Cơ sở dữ liệu** | [Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQLite) |
| **Authentication** | Web Crypto API (PBKDF2 + JWT HMAC-SHA256 + HttpOnly Cookies) |
| **Frontend SPA** | [Alpine.js](https://alpinejs.dev/) v3 + [Tailwind CSS](https://tailwindcss.com/) (Embedded HTML Stream) |
| **Build & Deploy** | [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) |

---

## 📁 Cấu trúc thư mục

```text
ToDoList/
├── wrangler.toml          # Cấu hình Cloudflare Worker, tên ứng dụng và D1 Database Binding
├── schema.sql             # SQL Schema tạo bảng users, todos và các index tối ưu
├── seed.sql               # Dữ liệu mẫu (Demo user & 5 tasks mẫu đủ trạng thái)
├── package.json           # Các dependencies và scripts tiện ích
├── tsconfig.json          # Cấu hình TypeScript
├── src/
│   ├── index.ts           # Hono App, Routing API, Auth Middleware, Security Headers
│   ├── auth.ts            # Xử lý PBKDF2 hash, JWT HMAC-SHA256, Cookie Parser/Builder
│   ├── types.ts           # Type definitions (User, Todo, JWTPayload, Env)
│   └── frontend.ts        # Toàn bộ mã nguồn Single Page Application (HTML/Alpine/Tailwind)
└── test/
    └── auth.test.ts       # Bộ 12 Unit Tests kiểm thử bảo mật Web Crypto API
```

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Chuẩn bị môi trường
- Đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18+ trở lên).
- Cài đặt các gói phụ thuộc:
```powershell
npm.cmd install
```

### 2. Kiểm thử hệ thống Auth & Crypto
Chạy bộ kiểm thử tự động:
```powershell
npm.cmd test
```

### 3. Đăng nhập Cloudflare
```powershell
npx.cmd wrangler login
```

### 4. Khởi tạo Cơ sở dữ liệu Cloudflare D1
```powershell
# Tạo database D1
npx.cmd wrangler d1 create todo-db
```
*Lưu ý: Copy `database_id` được hiển thị trên terminal và dán vào file `wrangler.toml`.*

### 5. Khởi tạo bảng dữ liệu trên máy (Local)
```powershell
# Chạy schema tạo bảng local
npx.cmd wrangler d1 execute todo-db --local --file=./schema.sql

# (Tùy chọn) Nạp dữ liệu mẫu để test ngay
npx.cmd wrangler d1 execute todo-db --local --file=./seed.sql
```

> **Tài khoản test nạp sẵn:**
> - Email: `demo@example.com`
> - Mật khẩu: `password123`

### 6. Khởi động môi trường phát triển (Local Dev)
```powershell
npx.cmd wrangler dev
```
Truy cập trình duyệt tại địa chỉ: **`http://localhost:8787`**

---

## 🌐 Triển khai lên Cloudflare (Deploy to Production)

### 1. Khởi tạo Schema trên D1 Remote
```powershell
npx.cmd wrangler d1 execute todo-db --remote --file=./schema.sql

# (Tùy chọn) Nạp dữ liệu mẫu lên Remote
npx.cmd wrangler d1 execute todo-db --remote --file=./seed.sql
```

### 2. Deploy Worker
```powershell
npx.cmd wrangler deploy
```

Worker sẽ được đóng gói (~130 KiB) và triển khai trên toàn bộ hệ thống Edge của Cloudflare. Đường dẫn URL chính thức của bạn sẽ hiển thị tại đầu ra terminal!

---

## 📡 Danh sách API Endpoints

| Method | Endpoint | Mô tả chức năng | Yêu cầu Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới & tự động tạo session | ❌ |
| `POST` | `/api/auth/login` | Đăng nhập tài khoản & cấp HttpOnly Cookie | ❌ |
| `POST` | `/api/auth/logout` | Đăng xuất & xóa Cookie phiên làm việc | ❌ |
| `GET` | `/api/auth/me` | Kiểm tra trạng thái xác thực hiện tại | ❌ |
| `GET` | `/api/todos` | Lấy danh sách việc (hỗ trợ filter, search, sort) | ✅ |
| `POST` | `/api/todos` | Tạo công việc mới | ✅ |
| `PUT` | `/api/todos/:id` | Cập nhật toàn bộ thông tin công việc | ✅ |
| `PATCH` | `/api/todos/:id/toggle` | Đảo trạng thái hoàn thành (Completed / Pending) | ✅ |
| `DELETE` | `/api/todos/:id` | Xóa công việc | ✅ |
| `GET` | `/api/categories` | Lấy danh sách danh mục của người dùng | ✅ |

