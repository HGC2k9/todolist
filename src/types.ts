// ============================================================
// Type Definitions — Cloudflare To-Do List
// ============================================================

export interface Env {
  DB: D1Database;
  AI?: any;
  JWT_SECRET: string;
  COOKIE_NAME: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  title: string;
  is_completed: number;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  due_date: string | null;
  is_completed: number;
  is_pinned?: number;
  repeat_mode?: 'none' | 'daily' | 'weekly';
  telegram_message_id?: number | null;
  subtasks?: Subtask[] | string;
  tags?: string[] | string;
  reminder_offset?: number;
  status?: 'todo' | 'in_progress' | 'completed';
  position?: number;
  deleted_at?: string | null;
  estimated_minutes?: number;
  actual_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface TodoImage {
  id: string;
  todo_id: string;
  image_data: string;
  created_at: string;
}

export interface JWTPayload {
  sub: string;       // user id
  email: string;
  username: string;
  iat: number;
  exp: number;
}
