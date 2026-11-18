// ============================================================
// Main Entry Point — Cloudflare Worker (Hono.js)
// ============================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, JWTPayload, Todo, User } from './types';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
  setSessionCookie,
  clearSessionCookie,
  parseCookies,
  generateId,
} from './auth';
import { renderHTML } from './frontend';
import { getIconPNGBytes } from './icon';
import { renderServiceWorker } from './sw';
import { generateIOSMobileConfig } from './iosProfile';
import { calculateStreak } from './utils';
import { generateIcs, exportTodosJson, validateAndParseImportJson } from './export';

// ─── Helper: Đọc khóa bảo mật JWT an toàn ───
export function getJwtSecret(env: Env): string {
  if (env.JWT_SECRET && env.JWT_SECRET.trim()) {
    return env.JWT_SECRET.trim();
  }
  console.warn('[AUTH WARNING] Biến bí mật JWT_SECRET chưa được thiết lập, đang dùng khóa fallback an toàn.');
  return 'todolist-jwt-secret-production-fallback-key-2026';
}

// ─── Helper: Lấy thông tin thời gian theo múi giờ Việt Nam (UTC+7) ───
export function getVnDateParts(date: Date) {
  const vnTime = new Date(date.getTime() + 7 * 3600 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = vnTime.getUTCMonth(); // 0-11
  const day = vnTime.getUTCDate();
  const dayOfWeek = vnTime.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const hours = vnTime.getUTCHours();
  const minutes = vnTime.getUTCMinutes();
  const seconds = vnTime.getUTCSeconds();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayMs = vnTime.getTime() - diffToMonday * 24 * 3600 * 1000;
  const mondayVn = new Date(mondayMs);
  const mondayStr = `${mondayVn.getUTCFullYear()}-${String(mondayVn.getUTCMonth() + 1).padStart(2, '0')}-${String(mondayVn.getUTCDate()).padStart(2, '0')}`;
  return { year, month, day, dayOfWeek, hours, minutes, seconds, dateStr, mondayStr, mondayMs };
}

// ─── Helper: Tự động reset các công việc lặp lại Hàng ngày & Hàng tuần ───
export async function resetRecurringTasks(db: D1Database, userId?: string): Promise<number> {
  try {
    const now = new Date();
    const nowVn = getVnDateParts(now);
    const nowIso = now.toISOString();

    let query = "SELECT id, user_id, title, priority, due_date, is_completed, repeat_mode, updated_at FROM todos WHERE deleted_at IS NULL AND repeat_mode IN ('daily', 'weekly')";
    const params: any[] = [];
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const tasksRes = await db.prepare(query).bind(...params).all<Todo>();
    const tasks = tasksRes.results || [];
    let resetCount = 0;

    for (const task of tasks) {
      const mode = task.repeat_mode;
      let shouldReset = false;
      let newDueDate: string | null = task.due_date;

      if (mode === 'daily') {
        if (task.due_date) {
          const dueVn = getVnDateParts(new Date(task.due_date));
          if (dueVn.dateStr < nowVn.dateStr) {
            shouldReset = true;
            const newVnMs = Date.UTC(nowVn.year, nowVn.month, nowVn.day, dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
            newDueDate = new Date(newVnMs).toISOString();
          }
        } else if (task.is_completed === 1 && task.updated_at) {
          const updatedVn = getVnDateParts(new Date(task.updated_at));
          if (updatedVn.dateStr < nowVn.dateStr) {
            shouldReset = true;
          }
        }
      } else if (mode === 'weekly') {
        if (task.due_date) {
          const dueVn = getVnDateParts(new Date(task.due_date));
          if (dueVn.mondayStr < nowVn.mondayStr) {
            shouldReset = true;
            const dayOffsetFromMonday = dueVn.dayOfWeek === 0 ? 6 : dueVn.dayOfWeek - 1;
            const targetDayVn = new Date(nowVn.mondayMs + dayOffsetFromMonday * 24 * 3600 * 1000);
            const newWkMs = Date.UTC(targetDayVn.getUTCFullYear(), targetDayVn.getUTCMonth(), targetDayVn.getUTCDate(), dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
            newDueDate = new Date(newWkMs).toISOString();
          }
        } else if (task.is_completed === 1 && task.updated_at) {
          const updatedVn = getVnDateParts(new Date(task.updated_at));
          if (updatedVn.mondayStr < nowVn.mondayStr) {
            shouldReset = true;
          }
        }
      }

      if (shouldReset) {
        await db.prepare(
          'UPDATE todos SET is_completed = 0, due_date = ?, updated_at = ? WHERE id = ?'
        ).bind(newDueDate, nowIso, task.id).run();
        resetCount++;
      }
    }

    return resetCount;
  } catch (err) {
    console.error('[resetRecurringTasks] Error:', err);
    return 0;
  }
}

// ─── Hono App ───

type Variables = {
  user: JWTPayload;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── CORS & Security Headers Middleware ───
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'microphone=(self)');
});

const ALLOWED_ORIGINS = [
  'https://app.todolists.workers.dev',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://127.0.0.1'
];

app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return 'https://app.todolists.workers.dev';
    const isAllowed =
      ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('ionic://') ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin === 'https://app.todolists.workers.dev';
    return isAllowed ? origin : 'https://app.todolists.workers.dev';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
  maxAge: 86400,
}));

// ─── Helper: Đảm bảo tương thích DB (Safe Migration) ───
let dbMigrated = false;
async function ensureDbColumns(db: D1Database) {
  if (dbMigrated) return;
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN is_pinned INTEGER DEFAULT 0').run();
  } catch { }
  try {
    await db.prepare("ALTER TABLE todos ADD COLUMN repeat_mode TEXT DEFAULT 'none'").run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN telegram_message_id INTEGER DEFAULT NULL').run();
  } catch { }
  try {
    await db.prepare("ALTER TABLE todos ADD COLUMN subtasks TEXT DEFAULT '[]'").run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN reminder_offset INTEGER DEFAULT 0').run();
  } catch { }
  try {
    await db.prepare("ALTER TABLE todos ADD COLUMN tags TEXT DEFAULT '[]'").run();
  } catch { }
  try {
    await db.prepare("ALTER TABLE todos ADD COLUMN status TEXT DEFAULT 'todo'").run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN position INTEGER DEFAULT 0').run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN deleted_at TEXT DEFAULT NULL').run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN estimated_minutes INTEGER DEFAULT 0').run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN actual_minutes INTEGER DEFAULT 0').run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE todos ADD COLUMN pomodoro_mode INTEGER DEFAULT 0').run();
  } catch { }
  try {
    await db.prepare('ALTER TABLE users ADD COLUMN telegram_chat_id TEXT DEFAULT NULL').run();
  } catch { }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS telegram_link_codes (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `).run();
  } catch { }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS todo_images (
        id TEXT PRIMARY KEY,
        todo_id TEXT NOT NULL,
        image_data TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).run();
  } catch { }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS briefing_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        date_str TEXT NOT NULL,
        sent_at TEXT NOT NULL,
        UNIQUE(type, date_str)
      )
    `).run();
  } catch { }
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS completion_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        todo_id TEXT,
        task_title TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        date_str TEXT NOT NULL,
        category TEXT,
        priority TEXT,
        actual_minutes INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_completion_history_user_date ON completion_history(user_id, date_str)').run();
  } catch { }
  try {
    // Tự động sao lưu các công việc đã hoàn thành vào completion_history (bảo toàn dữ liệu chuỗi & thống kê)
    await db.prepare(`
      INSERT OR IGNORE INTO completion_history (id, user_id, todo_id, task_title, completed_at, date_str, category, priority, actual_minutes, created_at)
      SELECT
        'hist_' || id,
        user_id,
        id,
        title,
        updated_at,
        substr(datetime(updated_at, '+7 hours'), 1, 10),
        category,
        priority,
        actual_minutes,
        created_at
      FROM todos
      WHERE is_completed = 1 AND updated_at IS NOT NULL
    `).run();
  } catch { }
  dbMigrated = true;
}

// ─── Helpers: Ghi nhận và bảo toàn lịch sử hoàn thành (Streak & Stats) ───
async function recordCompletionHistory(
  db: D1Database,
  userId: string,
  todoId: string,
  title: string,
  category?: string,
  priority?: string,
  actualMinutes: number = 0
) {
  try {
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 3600 * 1000);
    const dateStr = `${vnTime.getUTCFullYear()}-${String(vnTime.getUTCMonth() + 1).padStart(2, '0')}-${String(vnTime.getUTCDate()).padStart(2, '0')}`;
    const id = 'ch_' + generateId();
    await db.prepare(`
      INSERT INTO completion_history (id, user_id, todo_id, task_title, completed_at, date_str, category, priority, actual_minutes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      todoId,
      title || 'Công việc',
      now.toISOString(),
      dateStr,
      category || 'Khác',
      priority || 'Medium',
      actualMinutes || 0,
      now.toISOString()
    ).run();
  } catch (err) {
    console.warn('[recordCompletionHistory] Error:', err);
  }
}

async function removeCompletionHistory(db: D1Database, userId: string, todoId: string) {
  try {
    await db.prepare('DELETE FROM completion_history WHERE user_id = ? AND todo_id = ?').bind(userId, todoId).run();
  } catch (err) {
    console.warn('[removeCompletionHistory] Error:', err);
  }
}

// ─── Helper: Chuẩn hóa ngày ISO (Chỉ tính theo HH:mm, không tính theo giây) ───
function normalizeDate(dateVal: any): string | null {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

// ─── Auth Middleware ───
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization') || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  if (!token) {
    const cookieHeader = c.req.header('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    token = cookies[c.env.COOKIE_NAME];
  }

  if (!token) {
    return c.json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập.' }, 401);
  }

  const secret = getJwtSecret(c.env);
  const payload = await verifyJWT(token, secret);
  if (!payload) {
    return c.json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }, 401);
  }

  c.set('user', payload);
  await ensureDbColumns(c.env.DB);
  await next();
};

app.use('/api/todos', requireAuth);
app.use('/api/todos/*', requireAuth);
app.use('/api/categories', requireAuth);
app.use('/api/export/*', requireAuth);
app.use('/api/import/*', requireAuth);
app.use('/api/trash', requireAuth);
app.use('/api/trash/*', requireAuth);
app.use('/api/sync/*', requireAuth);
app.use('/api/analytics', requireAuth);
app.use('/api/ai/*', requireAuth);

// ════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (c) => {
  try {
    const { email, username, password } = await c.req.json<{
      email: string;
      username: string;
      password: string;
    }>();

    // Validate
    if (!email || !username || !password) {
      return c.json({ error: 'Vui lòng điền đầy đủ thông tin.' }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: 'Mật khẩu phải ít nhất 6 ký tự.' }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Email không hợp lệ.' }, 400);
    }

    // Check existing
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existing) {
      return c.json({ error: 'Email đã được sử dụng.' }, 409);
    }

    // Hash password
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const id = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, email.toLowerCase(), username.trim(), passwordHash, salt, now).run();

    // Auto-login after register
    const token = await createJWT(
      { sub: id, email: email.toLowerCase(), username: username.trim() },
      getJwtSecret(c.env)
    );

    return new Response(
      JSON.stringify({
        success: true,
        user: { id, email: email.toLowerCase(), username: username.trim() },
        token,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': setSessionCookie(c.env.COOKIE_NAME, token),
        },
      }
    );
  } catch (err: any) {
    console.error('Register error:', err);
    return c.json({ error: 'Lỗi server. Vui lòng thử lại.' }, 500);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{
      email: string;
      password: string;
    }>();

    if (!email || !password) {
      return c.json({ error: 'Vui lòng nhập email và mật khẩu.' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first<{
      id: string;
      email: string;
      username: string;
      password_hash: string;
      salt: string;
    }>();

    if (!user) {
      return c.json({ error: 'Email hoặc mật khẩu không đúng.' }, 401);
    }

    const valid = await verifyPassword(password, user.salt, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Email hoặc mật khẩu không đúng.' }, 401);
    }

    const token = await createJWT(
      { sub: user.id, email: user.email, username: user.username },
      getJwtSecret(c.env)
    );

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, email: user.email, username: user.username },
        token,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': setSessionCookie(c.env.COOKIE_NAME, token),
        },
      }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return c.json({ error: 'Lỗi server. Vui lòng thử lại.' }, 500);
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (c) => {
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearSessionCookie(c.env.COOKIE_NAME),
      },
    }
  );
});

// GET /api/auth/me — Kiểm tra trạng thái đăng nhập
app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization') || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  if (!token) {
    const cookieHeader = c.req.header('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    token = cookies[c.env.COOKIE_NAME];
  }

  if (!token) {
    return c.json({ authenticated: false }, 200);
  }

  const payload = await verifyJWT(token, getJwtSecret(c.env));
  if (!payload) {
    return c.json({ authenticated: false }, 200);
  }

  return c.json({
    authenticated: true,
    user: {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    },
  });
});

// GET /api/app-status — Trạng thái bảo trì, kiểm tra kết nối & OTA Bundle cho iOS Native App
app.get('/api/app-status', async (c) => {
  return c.json({
    status: 'online',
    maintenance: false,
    maintenance_message: '',
    app_version: '2.1.0',
    min_supported_version: '1.0.0',
    latest_bundle: {
      version: '2.1.0',
      url: 'https://app.todolists.workers.dev/dist.zip',
    },
    server_time: new Date().toISOString()
  });
});

// ════════════════════════════════════════════════════════════
//  TODO ROUTES (protected by auth middleware)
// ════════════════════════════════════════════════════════════

// GET /api/todos — Lấy danh sách todos (hỗ trợ filter, search, sort, repeat_mode)
app.get('/api/todos', async (c) => {
  const user = c.get('user');

  // Tự động reset các công việc lặp lại (Hàng ngày & Hàng tuần) nếu đã qua ngày/tuần mới
  await resetRecurringTasks(c.env.DB, user.sub);

  const url = new URL(c.req.url);

  const status = url.searchParams.get('status'); // all | pending | completed | overdue | recurring
  const category = url.searchParams.get('category');
  const priority = url.searchParams.get('priority');
  const search = url.searchParams.get('search');
  const sort = url.searchParams.get('sort') || 'due_date'; // due_date | created_at
  const order = url.searchParams.get('order') || 'asc';     // asc | desc

  let query = "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE user_id = ? AND deleted_at IS NULL";
  const params: any[] = [user.sub];

  // Filter by status
  if (status === 'completed') {
    query += ' AND is_completed = 1';
  } else if (status === 'pending') {
    query += ' AND is_completed = 0';
  } else if (status === 'recurring') {
    query += " AND repeat_mode IN ('daily', 'weekly')";
  } else if (status === 'pomodoro') {
    query += ' AND pomodoro_mode = 1';
  } else if (status === 'overdue') {
    query += ' AND is_completed = 0 AND due_date IS NOT NULL AND due_date < ?';
    params.push(new Date().toISOString());
  }

  // Filter by category
  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    query += ' AND priority = ?';
    params.push(priority);
  }

  // Search by keyword
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Luôn ưu tiên Ghim (is_pinned DESC) lên đầu
  const sortCol = sort === 'created_at' ? 'created_at' : 'due_date';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  if (sortCol === 'due_date') {
    query += ` ORDER BY is_pinned DESC, (due_date IS NULL) ASC, due_date ${sortOrder}, created_at DESC`;
  } else {
    query += ` ORDER BY is_pinned DESC, ${sortCol} ${sortOrder}`;
  }

  const result = await c.env.DB.prepare(query).bind(...params).all<Todo>();

  return c.json({ todos: result.results || [] });
});

// POST /api/todos — Tạo todo mới (có hỗ trợ repeat_mode, subtasks, tags, reminder_offset, status, position)
app.post('/api/todos', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      title: string;
      description?: string;
      category?: string;
      priority?: 'Low' | 'Medium' | 'High';
      due_date?: string | null;
      is_pinned?: number;
      repeat_mode?: string;
      subtasks?: any;
      tags?: any;
      reminder_offset?: number;
      status?: 'todo' | 'in_progress' | 'completed';
      position?: number;
      estimated_minutes?: number;
      actual_minutes?: number;
      pomodoro_mode?: number | boolean;
    }>();

    if (!body.title || !body.title.trim()) {
      return c.json({ error: 'Tiêu đề không được để trống.' }, 400);
    }

    const id = generateId();
    const now = new Date().toISOString();
    const normalizedDueDate = normalizeDate(body.due_date);
    const repeatMode = (body.repeat_mode === 'daily' || body.repeat_mode === 'weekly') ? body.repeat_mode : 'none';
    const subtasks = Array.isArray(body.subtasks) ? JSON.stringify(body.subtasks) : (typeof body.subtasks === 'string' ? body.subtasks : '[]');
    const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : (typeof body.tags === 'string' ? body.tags : '[]');
    const reminderOffset = typeof body.reminder_offset === 'number' ? body.reminder_offset : 0;
    const status = (body.status === 'in_progress' || body.status === 'completed') ? body.status : 'todo';
    const position = typeof body.position === 'number' ? body.position : 0;
    const estimatedMinutes = typeof body.estimated_minutes === 'number' ? body.estimated_minutes : 0;
    const actualMinutes = typeof body.actual_minutes === 'number' ? body.actual_minutes : 0;
    const pomodoroMode = body.pomodoro_mode ? 1 : 0;

    await c.env.DB.prepare(
      `INSERT INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, repeat_mode, subtasks, tags, reminder_offset, status, position, estimated_minutes, actual_minutes, pomodoro_mode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      user.sub,
      body.title.trim(),
      body.description?.trim() || '',
      body.category?.trim() || 'Personal',
      body.priority || 'Medium',
      normalizedDueDate,
      body.is_pinned ? 1 : 0,
      repeatMode,
      subtasks,
      tags,
      reminderOffset,
      status,
      position,
      estimatedMinutes,
      actualMinutes,
      pomodoroMode,
      now,
      now
    ).run();

    const todo = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ?"
    ).bind(id).first<Todo>();

    return c.json({ success: true, todo }, 201);
  } catch (err: any) {
    console.error('Create todo error:', err);
    return c.json({ error: 'Lỗi tạo công việc.' }, 500);
  }
});

// PUT /api/todos/:id — Cập nhật todo
app.put('/api/todos/:id', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');

    // Kiểm tra quyền sở hữu
    const existing = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).first<Todo>();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

    const body = await c.req.json<Partial<{
      title: string;
      description: string;
      category: string;
      priority: 'Low' | 'Medium' | 'High';
      due_date: string | null;
      is_completed: number;
      is_pinned: number;
      repeat_mode: string;
      subtasks: any;
      tags: any;
      reminder_offset: number;
      status: 'todo' | 'in_progress' | 'completed';
      position: number;
      estimated_minutes: number;
      actual_minutes: number;
      pomodoro_mode: number | boolean;
    }>>();

    const now = new Date().toISOString();
    const normalizedDueDate = body.due_date !== undefined ? normalizeDate(body.due_date) : existing.due_date;
    const repeatMode = body.repeat_mode !== undefined ? body.repeat_mode : existing.repeat_mode;

    // Kiểm tra nếu thời hạn (due_date) có thay đổi so với giá trị cũ trong D1
    const dueDateChanged = body.due_date !== undefined && normalizedDueDate !== existing.due_date;
    if (dueDateChanged) {
      try {
        await c.env.DB.prepare('DELETE FROM reminder_logs WHERE todo_id = ?').bind(todoId).run();
      } catch { }
    }

    let isCompleted = body.is_completed !== undefined ? body.is_completed : existing.is_completed;
    let status = body.status !== undefined ? body.status : (existing.status || (isCompleted ? 'completed' : 'todo'));
    if (body.status !== undefined && body.is_completed === undefined) {
      isCompleted = body.status === 'completed' ? 1 : 0;
    } else if (body.is_completed !== undefined && body.status === undefined) {
      status = body.is_completed ? 'completed' : 'todo';
    }

    const subtasks = body.subtasks !== undefined
      ? (Array.isArray(body.subtasks) ? JSON.stringify(body.subtasks) : String(body.subtasks))
      : (typeof existing.subtasks === 'string' ? existing.subtasks : JSON.stringify(existing.subtasks || []));

    const tags = body.tags !== undefined
      ? (Array.isArray(body.tags) ? JSON.stringify(body.tags) : String(body.tags))
      : (typeof existing.tags === 'string' ? existing.tags : JSON.stringify(existing.tags || []));

    const reminderOffset = body.reminder_offset !== undefined ? body.reminder_offset : (existing.reminder_offset || 0);
    const position = body.position !== undefined ? body.position : (existing.position || 0);
    const estimatedMinutes = body.estimated_minutes !== undefined ? body.estimated_minutes : (existing.estimated_minutes || 0);
    const actualMinutes = body.actual_minutes !== undefined ? body.actual_minutes : (existing.actual_minutes || 0);
    const pomodoroMode = body.pomodoro_mode !== undefined ? (body.pomodoro_mode ? 1 : 0) : ((existing as any).pomodoro_mode || 0);

    await c.env.DB.prepare(
      `UPDATE todos SET
        title = ?,
        description = ?,
        category = ?,
        priority = ?,
        due_date = ?,
        is_completed = ?,
        is_pinned = ?,
        repeat_mode = ?,
        subtasks = ?,
        tags = ?,
        reminder_offset = ?,
        status = ?,
        position = ?,
        estimated_minutes = ?,
        actual_minutes = ?,
        pomodoro_mode = ?,
        telegram_message_id = ?,
        updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).bind(
      body.title?.trim() ?? existing.title,
      body.description?.trim() ?? existing.description,
      body.category?.trim() ?? existing.category,
      body.priority ?? existing.priority,
      normalizedDueDate,
      isCompleted,
      body.is_pinned !== undefined ? body.is_pinned : existing.is_pinned,
      repeatMode,
      subtasks,
      tags,
      reminderOffset,
      status,
      position,
      estimatedMinutes,
      actualMinutes,
      pomodoroMode,
      null,
      now,
      todoId,
      user.sub
    ).run();

    // Đồng bộ lịch sử hoàn thành để bảo toàn Streak & Thống kê
    if (isCompleted === 1 && existing.is_completed !== 1) {
      await recordCompletionHistory(c.env.DB, user.sub, todoId, body.title || existing.title, body.category || existing.category, body.priority || existing.priority, actualMinutes);
    } else if (isCompleted === 0 && existing.is_completed === 1) {
      await removeCompletionHistory(c.env.DB, user.sub, todoId);
    }

    const updated = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ?"
    ).bind(todoId).first<Todo>();

    return c.json({ success: true, todo: updated });
  } catch (err: any) {
    console.error('Update todo error:', err);
    return c.json({ error: 'Lỗi cập nhật công việc.' }, 500);
  }
});

// PATCH /api/todos/:id/subtasks/:subtaskId/toggle — Tick/untick từng việc con
app.patch('/api/todos/:id/subtasks/:subtaskId/toggle', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');
    const subtaskId = c.req.param('subtaskId');

    const existing = await c.env.DB.prepare(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?'
    ).bind(todoId, user.sub).first<Todo>();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

    let subtasks: any[] = [];
    try {
      subtasks = typeof existing.subtasks === 'string' ? JSON.parse(existing.subtasks || '[]') : (existing.subtasks || []);
    } catch {
      subtasks = [];
    }

    const targetSubtask = subtasks.find((st: any) => String(st.id) === subtaskId);
    if (!targetSubtask) {
      return c.json({ error: 'Không tìm thấy việc con.' }, 404);
    }

    targetSubtask.is_completed = targetSubtask.is_completed ? 0 : 1;
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'UPDATE todos SET subtasks = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(JSON.stringify(subtasks), now, todoId, user.sub).run();

    const updated = await c.env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(todoId).first<Todo>();
    return c.json({ success: true, todo: updated });
  } catch (err: any) {
    console.error('Toggle subtask error:', err);
    return c.json({ error: 'Lỗi cập nhật việc con.' }, 500);
  }
});

// PUT /api/todos/reorder — Sắp xếp vị trí kéo thả / chuyển cột Kanban
app.put('/api/todos/reorder', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      items: Array<{ id: string; position: number; status?: 'todo' | 'in_progress' | 'completed' }>;
    }>();

    if (!body.items || !Array.isArray(body.items)) {
      return c.json({ error: 'Dữ liệu sắp xếp không hợp lệ.' }, 400);
    }

    const now = new Date().toISOString();
    const statements = body.items.map((item) => {
      const isCompleted = item.status === 'completed' ? 1 : (item.status ? 0 : undefined);
      if (item.status && isCompleted !== undefined) {
        return c.env.DB.prepare(
          'UPDATE todos SET position = ?, status = ?, is_completed = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(item.position, item.status, isCompleted, now, item.id, user.sub);
      } else {
        return c.env.DB.prepare(
          'UPDATE todos SET position = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(item.position, now, item.id, user.sub);
      }
    });

    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({ success: true, count: statements.length });
  } catch (err: any) {
    console.error('Reorder error:', err);
    return c.json({ error: 'Lỗi sắp xếp công việc.' }, 500);
  }
});

// GET /api/export/ics — Xuất file iCalendar (.ics RFC 5545) đồng bộ Google/Apple Calendar
app.get('/api/export/ics', async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY due_date ASC'
  ).bind(user.sub).all<Todo>();

  const icsContent = generateIcs(result.results || []);
  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="todolist.ics"',
      'Cache-Control': 'no-cache',
    },
  });
});

// GET /api/export/json — Sao lưu file JSON dữ liệu công việc
app.get('/api/export/json', async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.sub).all<Todo>();

  const jsonContent = exportTodosJson(result.results || []);
  const dateStr = new Date().toISOString().split('T')[0];
  return new Response(jsonContent, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="todolist_backup_${dateStr}.json"`,
      'Cache-Control': 'no-cache',
    },
  });
});

// POST /api/import/json — Khôi phục từ file sao lưu JSON
app.post('/api/import/json', async (c) => {
  try {
    const user = c.get('user');
    const rawText = await c.req.text();
    const importedTodos = validateAndParseImportJson(rawText);

    if (importedTodos.length === 0) {
      return c.json({ error: 'Không tìm thấy công việc hợp lệ trong file sao lưu.' }, 400);
    }

    const now = new Date().toISOString();
    const statements = importedTodos.map((t) => {
      const id = generateId();
      return c.env.DB.prepare(
        `INSERT INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, repeat_mode, subtasks, tags, reminder_offset, status, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        user.sub,
        t.title,
        t.description || '',
        t.category || 'Personal',
        t.priority || 'Medium',
        t.due_date || null,
        t.is_completed || 0,
        t.is_pinned || 0,
        t.repeat_mode || 'none',
        JSON.stringify(t.subtasks || []),
        JSON.stringify(t.tags || []),
        t.reminder_offset || 0,
        t.status || 'todo',
        t.position || 0,
        now,
        now
      );
    });

    await c.env.DB.batch(statements);
    return c.json({ success: true, count: statements.length });
  } catch (err: any) {
    return c.json({ error: `Lỗi nhập dữ liệu: ${err.message || 'File không đúng cấu trúc'}` }, 400);
  }
});

// PATCH /api/todos/:id/toggle — Toggle hoàn thành (tự động tính chu kỳ hàng ngày / hàng tuần)
app.patch('/api/todos/:id/toggle', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');

    const existing = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).first<Todo>();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

    const newStatus = existing.is_completed ? 0 : 1;
    const now = new Date().toISOString();
    let nextDueDate = existing.due_date;

    // Nếu đánh dấu hoàn thành: Kiểm tra việc con (subtasks) chưa xong thì chặn
    if (newStatus === 1) {
      let subtasks: any[] = [];
      try {
        subtasks = typeof existing.subtasks === 'string' ? JSON.parse(existing.subtasks || '[]') : (existing.subtasks || []);
      } catch {
        subtasks = [];
      }
      const uncompletedSubtasks = subtasks.filter((st: any) => !st.is_completed);
      if (uncompletedSubtasks.length > 0) {
        return c.json({ error: `Chưa thể hoàn thành: còn ${uncompletedSubtasks.length} việc con chưa xong!` }, 400);
      }
    }

    // Nếu công việc là hàng ngày hoặc hàng tuần và đang được đánh dấu hoàn thành:
    // Tự động đẩy due_date sang chu kỳ kế tiếp (+1 ngày hoặc +7 ngày)
    if (newStatus === 1 && existing.repeat_mode && existing.repeat_mode !== 'none' && existing.due_date) {
      const d = new Date(existing.due_date);
      if (!isNaN(d.getTime())) {
        const increment = existing.repeat_mode === 'daily' ? 1 : 7;
        d.setDate(d.getDate() + increment);
        while (d.getTime() < Date.now()) {
          d.setDate(d.getDate() + increment);
        }
        nextDueDate = d.toISOString();
      }
    }

    await c.env.DB.prepare(
      'UPDATE todos SET is_completed = ?, due_date = ?, telegram_message_id = CASE WHEN ? = 1 THEN NULL ELSE telegram_message_id END, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(newStatus, nextDueDate, newStatus, now, todoId, user.sub).run();

    // Đồng bộ vào completion_history để bảo toàn Chuỗi Streak & Thống kê
    if (newStatus === 1) {
      await recordCompletionHistory(c.env.DB, user.sub, todoId, existing.title, existing.category, existing.priority, existing.actual_minutes || 0);
    } else {
      await removeCompletionHistory(c.env.DB, user.sub, todoId);
    }

    const updated = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ?"
    ).bind(todoId).first<Todo>();

    return c.json({ success: true, todo: updated });
  } catch (err: any) {
    console.error('Toggle todo error:', err);
    return c.json({ error: 'Lỗi cập nhật trạng thái.' }, 500);
  }
});

// PATCH /api/todos/:id/pin — Toggle Ghim công việc (Pin to Top)
app.patch('/api/todos/:id/pin', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');

    const existing = await c.env.DB.prepare(
      'SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ? AND user_id = ?'
    ).bind(todoId, user.sub).first<Todo>();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

    const newPinned = existing.is_pinned ? 0 : 1;
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'UPDATE todos SET is_pinned = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(newPinned, now, todoId, user.sub).run();

    const updated = await c.env.DB.prepare(
      'SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ?'
    ).bind(todoId).first<Todo>();

    return c.json({ success: true, todo: updated });
  } catch (err: any) {
    console.error('Pin todo error:', err);
    return c.json({ error: 'Lỗi ghim công việc.' }, 500);
  }
});

// DELETE /api/todos/:id — Xoá todo (mặc định xóa mềm vào thùng rác, permanent=true xóa vĩnh viễn)
app.delete('/api/todos/:id', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');
    const url = new URL(c.req.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    const existing = await c.env.DB.prepare(
      'SELECT id, telegram_message_id FROM todos WHERE id = ? AND user_id = ?'
    ).bind(todoId, user.sub).first<{ id: string; telegram_message_id?: number | null }>();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

    if (permanent) {
      try {
        await c.env.DB.prepare('DELETE FROM reminder_logs WHERE todo_id = ?').bind(todoId).run();
        await c.env.DB.prepare('DELETE FROM todo_images WHERE todo_id = ?').bind(todoId).run();
      } catch { }

      await c.env.DB.prepare(
        'DELETE FROM todos WHERE id = ? AND user_id = ?'
      ).bind(todoId, user.sub).run();

      return c.json({ success: true, permanent: true });
    } else {
      const now = new Date().toISOString();
      await c.env.DB.prepare(
        'UPDATE todos SET deleted_at = ?, telegram_message_id = NULL, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(now, now, todoId, user.sub).run();

      return c.json({ success: true, soft_deleted: true });
    }
  } catch (err: any) {
    console.error('Delete todo error:', err);
    return c.json({ error: 'Lỗi xoá công việc.' }, 500);
  }
});

// POST /api/todos/clear-completed — Xoá tất cả việc đã hoàn thành (chuyển vào thùng rác)
app.post('/api/todos/clear-completed', async (c) => {
  try {
    const user = c.get('user');
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'UPDATE todos SET deleted_at = ?, telegram_message_id = NULL, updated_at = ? WHERE user_id = ? AND is_completed = 1 AND deleted_at IS NULL'
    ).bind(now, now, user.sub).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Clear completed error:', err);
    return c.json({ error: 'Lỗi dọn dẹp công việc.' }, 500);
  }
});

// GET /api/trash — Danh sách công việc trong thùng rác
app.get('/api/trash', async (c) => {
  const user = c.get('user');
  const result = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  ).bind(user.sub).all<Todo>();

  return c.json({ todos: result.results || [] });
});

// POST /api/todos/:id/restore — Khôi phục công việc từ thùng rác
app.post('/api/todos/:id/restore', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');
    const now = new Date().toISOString();

    const res = await c.env.DB.prepare(
      'UPDATE todos SET deleted_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(now, todoId, user.sub).run();

    if (!res.success) {
      return c.json({ error: 'Không thể khôi phục công việc.' }, 400);
    }

    const todo = await c.env.DB.prepare('SELECT * FROM todos WHERE id = ?').bind(todoId).first<Todo>();
    return c.json({ success: true, todo });
  } catch (err: any) {
    return c.json({ error: 'Lỗi khôi phục: ' + err.message }, 500);
  }
});

// DELETE /api/trash/empty — Dọn sạch toàn bộ thùng rác (xóa vĩnh viễn)
app.delete('/api/trash/empty', async (c) => {
  try {
    const user = c.get('user');
    await c.env.DB.prepare(
      'DELETE FROM todos WHERE user_id = ? AND deleted_at IS NOT NULL'
    ).bind(user.sub).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Lỗi dọn sạch thùng rác: ' + err.message }, 500);
  }
});

// POST /api/trash/restore-all — Khôi phục tất cả công việc trong thùng rác
app.post('/api/trash/restore-all', async (c) => {
  try {
    const user = c.get('user');
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'UPDATE todos SET deleted_at = NULL, updated_at = ? WHERE user_id = ? AND deleted_at IS NOT NULL'
    ).bind(now, user.sub).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Lỗi khôi phục tất cả: ' + err.message }, 500);
  }
});

// GET /api/sync/version — Kiểm tra phiên bản dữ liệu mới nhất (Real-time Live Sync)
app.get('/api/sync/version', async (c) => {
  const user = c.get('user');
  const row = await c.env.DB.prepare(
    'SELECT MAX(updated_at) as max_updated, COUNT(*) as count FROM todos WHERE user_id = ?'
  ).bind(user.sub).first<{ max_updated: string | null; count: number }>();

  return c.json({
    version: row?.max_updated || '0',
    count: row?.count || 0,
    server_time: new Date().toISOString()
  });
});

// GET /api/analytics — Thống kê năng suất sâu (Bảo toàn dữ liệu Streak & Thống kê khi xóa việc)
app.get('/api/analytics', async (c) => {
  const user = c.get('user');
  const now = new Date();
  const vn = getVnDateParts(now);

  // 1. Lấy dữ liệu từ completion_history (bảo toàn lịch sử vĩnh viễn)
  let histRows: any[] = [];
  try {
    histRows = (await c.env.DB.prepare(
      'SELECT id, todo_id, task_title, completed_at, date_str, category, priority, actual_minutes FROM completion_history WHERE user_id = ?'
    ).bind(user.sub).all()).results || [];
  } catch { }

  const allRes = await c.env.DB.prepare(
    'SELECT id, category, priority, due_date, is_completed, estimated_minutes, actual_minutes, created_at, updated_at FROM todos WHERE user_id = ? AND deleted_at IS NULL'
  ).bind(user.sub).all<Todo>();

  const todos = allRes.results || [];
  const total = todos.length;
  const currentCompleted = todos.filter(t => t.is_completed === 1).length;
  const pending = total - currentCompleted;

  // Tổng số lần hoàn thành bảo toàn (kể cả khi đã xóa công việc trong danh sách hiện tại)
  const totalCompletedLifetime = Math.max(histRows.length, currentCompleted);
  const totalTasksLifetime = totalCompletedLifetime + pending;

  // Tính Streak từ mốc thời gian hoàn thành của cả completion_history và todos
  const histTimestamps = histRows.map(r => new Date(r.completed_at).getTime()).filter(t => !isNaN(t));
  const activeTimestamps = todos.filter(t => t.is_completed === 1 && t.updated_at).map(t => new Date(t.updated_at).getTime()).filter(t => !isNaN(t));
  const streak = calculateStreak([...histTimestamps, ...activeTimestamps]);

  let onTime = 0;
  let overdueCompleted = 0;
  for (const t of todos) {
    if (t.is_completed === 1) {
      if (t.due_date && t.updated_at && new Date(t.updated_at).getTime() > new Date(t.due_date).getTime() + 60000) {
        overdueCompleted++;
      } else {
        onTime++;
      }
    }
  }

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekCounts = [0, 0, 0, 0, 0, 0, 0];
  const mondayStart = vn.mondayMs;
  const sundayEnd = mondayStart + 7 * 24 * 3600 * 1000;

  // Đếm số công việc hoàn thành trong tuần này từ cả lịch sử và danh sách hiện hành
  const weeklyTrackedKeys = new Set<string>();
  for (const h of histRows) {
    if (h.completed_at) {
      const uTime = new Date(h.completed_at).getTime() + 7 * 3600 * 1000;
      if (uTime >= mondayStart && uTime < sundayEnd) {
        const dIdx = Math.floor((uTime - mondayStart) / (24 * 3600 * 1000));
        if (dIdx >= 0 && dIdx < 7) {
          const key = `${h.todo_id || h.id}_${dIdx}`;
          if (!weeklyTrackedKeys.has(key)) {
            weeklyTrackedKeys.add(key);
            weekCounts[dIdx]++;
          }
        }
      }
    }
  }
  for (const t of todos) {
    if (t.is_completed === 1 && t.updated_at) {
      const uTime = new Date(t.updated_at).getTime() + 7 * 3600 * 1000;
      if (uTime >= mondayStart && uTime < sundayEnd) {
        const dIdx = Math.floor((uTime - mondayStart) / (24 * 3600 * 1000));
        if (dIdx >= 0 && dIdx < 7) {
          const key = `${t.id}_${dIdx}`;
          if (!weeklyTrackedKeys.has(key)) {
            weeklyTrackedKeys.add(key);
            weekCounts[dIdx]++;
          }
        }
      }
    }
  }

  const catMap: Record<string, number> = {};
  for (const t of todos) {
    const cat = t.category || 'Khác';
    catMap[cat] = (catMap[cat] || 0) + 1;
  }

  let totalEstimatedMin = 0;
  let totalActualMin = 0;
  for (const t of todos) {
    totalEstimatedMin += (t.estimated_minutes || 0);
    totalActualMin += (t.actual_minutes || 0);
  }

  return c.json({
    total,
    completed: currentCompleted,
    pending,
    total_completed_lifetime: totalCompletedLifetime,
    streak,
    completion_rate: totalTasksLifetime > 0 ? Math.round((totalCompletedLifetime / totalTasksLifetime) * 100) : 0,
    on_time: onTime,
    overdue_completed: overdueCompleted,
    week_stats: daysOfWeek.map((day, idx) => ({ day, count: weekCounts[idx] })),
    category_distribution: Object.entries(catMap).map(([cat, count]) => ({ category: cat, count })),
    total_estimated_minutes: totalEstimatedMin,
    total_actual_minutes: totalActualMin
  });
});

// POST /api/ai/transcribe — Nhận diện giọng nói tiếng Việt bằng Cloudflare Workers AI Whisper
app.post('/api/ai/transcribe', async (c) => {
  try {
    if (!c.env.AI) {
      return c.json({ error: 'Workers AI chưa được cấu hình.' }, 500);
    }
    const contentType = c.req.header('Content-Type') || '';
    let audioBytes: Uint8Array;
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return c.json({ error: 'Không tìm thấy file âm thanh.' }, 400);
      const arrayBuffer = await file.arrayBuffer();
      audioBytes = new Uint8Array(arrayBuffer);
    } else {
      const arrayBuffer = await c.req.arrayBuffer();
      audioBytes = new Uint8Array(arrayBuffer);
    }

    if (!audioBytes || audioBytes.length === 0) {
      return c.json({ error: 'Dữ liệu âm thanh trống.' }, 400);
    }

    const audioArray = new Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes[i];
    }

    const whisperRes: any = await c.env.AI.run('@cf/openai/whisper', {
      audio: audioArray
    });

    return c.json({ success: true, text: whisperRes?.text || '' });
  } catch (err: any) {
    console.error('Whisper transcribe error:', err);
    return c.json({ error: 'Lỗi nhận diện giọng nói: ' + (err.message || 'Không thể giải mã file âm thanh') }, 500);
  }
});

// GET /api/todos/:id/images — Lấy danh sách ảnh đính kèm của việc
app.get('/api/todos/:id/images', async (c) => {
  const user = c.get('user');
  const todoId = c.req.param('id');
  const todo = await c.env.DB.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').bind(todoId, user.sub).first();
  if (!todo) return c.json({ error: 'Không tìm thấy công việc.' }, 404);

  const imagesRes = await c.env.DB.prepare(
    'SELECT id, todo_id, image_data, created_at FROM todo_images WHERE todo_id = ? ORDER BY created_at ASC'
  ).bind(todoId).all();

  return c.json({ images: imagesRes.results || [] });
});

// POST /api/todos/:id/images — Thêm ảnh đính kèm (đã nén base64)
app.post('/api/todos/:id/images', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');
    const todo = await c.env.DB.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').bind(todoId, user.sub).first();
    if (!todo) return c.json({ error: 'Không tìm thấy công việc.' }, 404);

    const { image_data } = await c.req.json<{ image_data: string }>();
    if (!image_data || typeof image_data !== 'string' || !image_data.startsWith('data:image/')) {
      return c.json({ error: 'Định dạng hình ảnh không hợp lệ.' }, 400);
    }

    if (image_data.length > 350000) {
      return c.json({ error: 'Kích thước ảnh vượt quá giới hạn 250KB.' }, 400);
    }

    const imageId = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO todo_images (id, todo_id, image_data, created_at) VALUES (?, ?, ?, ?)'
    ).bind(imageId, todoId, image_data, now).run();

    return c.json({ success: true, image: { id: imageId, todo_id: todoId, image_data, created_at: now } }, 201);
  } catch (err: any) {
    return c.json({ error: 'Lỗi tải ảnh lên: ' + err.message }, 500);
  }
});

// DELETE /api/todos/:id/images/:imageId — Xoá ảnh đính kèm
app.delete('/api/todos/:id/images/:imageId', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');
    const imageId = c.req.param('imageId');
    const todo = await c.env.DB.prepare('SELECT id FROM todos WHERE id = ? AND user_id = ?').bind(todoId, user.sub).first();
    if (!todo) return c.json({ error: 'Không tìm thấy công việc.' }, 404);

    await c.env.DB.prepare('DELETE FROM todo_images WHERE id = ? AND todo_id = ?').bind(imageId, todoId).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Lỗi xóa ảnh: ' + err.message }, 500);
  }
});

// GET /api/categories — Lấy danh sách categories của user
app.get('/api/categories', async (c) => {
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    'SELECT DISTINCT category FROM todos WHERE user_id = ? AND deleted_at IS NULL AND category IS NOT NULL AND category != "" ORDER BY category'
  ).bind(user.sub).all<{ category: string }>();

  const categories = (result.results || []).map((r) => r.category);
  // Luôn bao gồm các categories mặc định
  const defaults = ['Personal', 'Work', 'Shopping', 'Health', 'Study'];
  const merged = [...new Set([...defaults, ...categories])].sort();

  return c.json({ categories: merged });
});

// ════════════════════════════════════════════════════════════
//  PWA ASSETS & NOTIFICATION LOGO
// ════════════════════════════════════════════════════════════

// GET /icon-192.png, /apple-touch-icon.png, /favicon.ico — Trả về ảnh PNG 192x192 thật sắc nét
app.get('/icon-192.png', async () => {
  const bytes = getIconPNGBytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

app.get('/apple-touch-icon.png', async () => {
  const bytes = getIconPNGBytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

app.get('/favicon.ico', async () => {
  const bytes = getIconPNGBytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

// GET /manifest.json — Web App Manifest định danh tên "To-Do List" & PWA Quick Shortcuts
app.get('/manifest.json', async () => {
  const manifest = {
    name: 'To-Do List',
    short_name: 'To-Do List',
    description: 'Ứng dụng quản lý công việc hiện đại trên Cloudflare Workers',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Thêm việc mới',
        short_name: 'Thêm việc',
        description: 'Tạo công việc mới ngay',
        url: '/?action=new',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Việc hôm nay',
        short_name: 'Hôm nay',
        description: 'Xem các việc cần làm hôm nay',
        url: '/?filter=today',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Nói để tạo việc',
        short_name: 'Giọng nói',
        description: 'Nhập công việc bằng giọng nói',
        url: '/?action=voice',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

// GET /sw.js — Service Worker cho Background Notifications & PWA
app.get('/sw.js', async () => {
  return new Response(renderServiceWorker(), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
});

// GET /api/version — Kiểm tra phiên bản mới nhất để App iOS / PWA tự cập nhật ngầm
const APP_VERSION = '2.4.0';
app.get('/api/version', (c) => {
  return c.json({
    version: APP_VERSION,
    name: 'To-Do List',
    author: 'Designed by Chung',
    updated_at: '2026-11-13T12:00:00Z',
  }, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
});

// GET /api/download/ios-profile — Tải file cấu hình .mobileconfig cho iPhone
app.get('/api/download/ios-profile', async (c) => {
  const url = new URL(c.req.url);
  const appOrigin = `${url.protocol}//${url.host}`;
  const mobileConfigContent = generateIOSMobileConfig(appOrigin);

  return new Response(mobileConfigContent, {
    headers: {
      'Content-Type': 'application/x-apple-aspen-config; charset=utf-8',
      'Content-Disposition': 'attachment; filename="todolist.mobileconfig"',
      'Cache-Control': 'no-cache',
    },
  });
});

// ════════════════════════════════════════════════════════════
//  FRONTEND — Serve SPA (Luôn cấm trình duyệt lưu đệm trang HTML)
// ════════════════════════════════════════════════════════════

app.get('*', async (c) => {
  return new Response(renderHTML(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
});

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Env, ctx: ExecutionContext) {
    try {
      // 1. Quét tự động reset các công việc lặp lại Hàng ngày & Hàng tuần khi qua ngày/tuần mới
      await resetRecurringTasks(env.DB);
      // 2. Tự động dọn dẹp các mục trong thùng rác đã xóa quá 30 ngày
      try {
        await env.DB.prepare(
          "DELETE FROM todos WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-30 days')"
        ).run();
      } catch (err) {
        console.error('[Scheduled trash cleanup error]:', err);
      }
    } catch (err) {
      console.error('[Cloudflare Cron] Scheduled error:', err);
    }
  }
};
