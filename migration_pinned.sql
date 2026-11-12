-- Migration: Add is_pinned column
ALTER TABLE todos ADD COLUMN is_pinned INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_todos_pinned ON todos(is_pinned);

