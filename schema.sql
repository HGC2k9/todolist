-- ============================================================
-- Cloudflare D1 Schema — To-Do List Application
-- ============================================================

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  username    TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bảng công việc
CREATE TABLE IF NOT EXISTS todos (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  category     TEXT DEFAULT 'Personal',
  priority     TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date     TEXT,
  is_completed INTEGER DEFAULT 0,
  is_pinned    INTEGER DEFAULT 0,
  repeat_mode  TEXT DEFAULT 'none',
  telegram_message_id INTEGER DEFAULT NULL,
  subtasks     TEXT DEFAULT '[]',
  reminder_offset INTEGER DEFAULT 0,
  tags         TEXT DEFAULT '[]',
  status       TEXT DEFAULT 'todo',
  position     INTEGER DEFAULT 0,
  pomodoro_mode INTEGER DEFAULT 0,
  deleted_at   TEXT DEFAULT NULL,
  estimated_minutes INTEGER DEFAULT 0,
  actual_minutes INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(is_completed);
CREATE INDEX IF NOT EXISTS idx_todos_pinned ON todos(is_pinned);
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- Bảng lưu subscription thông báo đẩy Web Push (iOS, Android, PC)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT DEFAULT '',
  auth TEXT DEFAULT '',
  device_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_platform ON push_subscriptions(platform);

-- Bảng nhật ký nhắc việc chạy ngầm trên server
CREATE TABLE IF NOT EXISTS reminder_logs (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL,
  notified_at INTEGER NOT NULL,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rem_todo ON reminder_logs(todo_id);

-- Bảng đính kèm hình ảnh (Lưu Base64 trong D1, không cần R2)
CREATE TABLE IF NOT EXISTS todo_images (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL,
  image_data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_todo_images_todo_id ON todo_images(todo_id);

-- Bảng ghi nhận bản tin sáng & tối đã gửi (tránh gửi lặp lại nhiều lần trong cùng 1 ngày)
CREATE TABLE IF NOT EXISTS briefing_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'morning' hoặc 'evening'
  date_str TEXT NOT NULL, -- YYYY-MM-DD theo giờ VN
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(type, date_str)
);
