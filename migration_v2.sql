-- Migration V2: Subtasks, Reminder Offsets, Tags, Status, Position
ALTER TABLE todos ADD COLUMN subtasks TEXT DEFAULT '[]';
ALTER TABLE todos ADD COLUMN reminder_offset INTEGER DEFAULT 0;
ALTER TABLE todos ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE todos ADD COLUMN status TEXT DEFAULT 'todo';
ALTER TABLE todos ADD COLUMN position INTEGER DEFAULT 0;
