// ============================================================
// Type Definitions — Cloudflare To-Do List
// ============================================================

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  COOKIE_NAME: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  sub: string;       // user id
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
