-- ============================================================
-- Migration V3: Soft Delete (Trash), Time Tracking, Images, Briefing Logs
-- ============================================================

ALTER TABLE todos ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE todos ADD COLUMN estimated_minutes INTEGER DEFAULT 0;
ALTER TABLE todos ADD COLUMN actual_minutes INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos(deleted_at);

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
