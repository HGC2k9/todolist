// ============================================================
// Main Entry Point — Cloudflare Worker (Hono.js)
// ============================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, JWTPayload, Todo } from './types';
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
import {
  sendTelegramTaskReminder,
  sendTelegramTestMessage,
  deleteTelegramMessage,
  answerCallbackQuery
} from './telegram';

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

    let query = "SELECT id, user_id, title, priority, due_date, is_completed, repeat_mode, updated_at FROM todos WHERE repeat_mode IN ('daily', 'weekly')";
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

// ─── Helper: Quét và gửi thông báo nhắc việc sắp đến hạn qua Telegram Bot ───
export async function checkAndSendReminders(env: Env): Promise<{ checked: number; sent: number }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { checked: 0, sent: 0 };
  }

  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  try {
    await ensureDbColumns(env.DB);
    const todosRes = await env.DB.prepare(
      `SELECT id, user_id, title, description, category, priority, due_date, repeat_mode, is_completed, telegram_message_id, created_at, updated_at
       FROM todos WHERE is_completed = 0 AND due_date IS NOT NULL`
    ).all<Todo>();

    const todos = todosRes.results || [];
    let sentCount = 0;

    for (const task of todos) {
      if (!task.due_date) continue;
      const normalizedDate = task.due_date.includes('T') ? task.due_date : task.due_date.replace(' ', 'T');
      const dueTime = new Date(normalizedDate).getTime();
      if (isNaN(dueTime)) continue;

      const diffMs = dueTime - now;
      const minLeft = Math.ceil(diffMs / 60000);

      let windowMin = 15;
      if (task.priority === 'High') windowMin = 30;
      else if (task.priority === 'Low') windowMin = 5;

      // Nằm trong khung thông báo (từ 0 đến windowMin phút trước hạn)
      if (minLeft >= 0 && minLeft <= windowMin) {
        // Kiểm tra xem đã gửi nhắc nhở gần đây chưa
        const logRes = await env.DB.prepare(
          `SELECT MAX(notified_at) as last_notified, COUNT(*) as total_count FROM reminder_logs WHERE todo_id = ?`
        ).bind(task.id).first<{ last_notified: number | null; total_count: number }>();

        const lastNotified = logRes?.last_notified || 0;
        const totalCount = logRes?.total_count || 0;

        // High và Medium: lặp lại mỗi 5 phút một lần; Low: chỉ thông báo 1 lần duy nhất
        const isRecurring = (task.priority === 'High' || task.priority === 'Medium');
        const shouldNotify = isRecurring ? (now - lastNotified >= FIVE_MINUTES_MS) : (totalCount === 0);

        if (shouldNotify) {
          const res = await sendTelegramTaskReminder(env, task, minLeft);
          if (res.success) {
            sentCount++;
            // Ghi nhật ký vào reminder_logs để không bị gửi lặp lại
            const logId = crypto.randomUUID();
            await env.DB.prepare(
              `INSERT INTO reminder_logs (id, todo_id, notified_at) VALUES (?, ?, ?)`
            ).bind(logId, task.id, now).run();

            // Cập nhật ID tin nhắn Telegram mới nhất vào bảng todos để đồng bộ
            if (res.messageId) {
              await env.DB.prepare(
                `UPDATE todos SET telegram_message_id = ? WHERE id = ?`
              ).bind(res.messageId, task.id).run();
            }
          }
        }
      }
    }

    return { checked: todos.length, sent: sentCount };
  } catch (err) {
    console.error('[checkAndSendReminders] Error:', err);
    return { checked: 0, sent: 0 };
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
});

app.use('/api/*', cors({
  origin: '*',
  credentials: true,
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
  dbMigrated = true;
}

// ─── Helper: Chuẩn hóa ngày ISO ───
function normalizeDate(dateVal: any): string | null {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ─── Auth Middleware (cho /api/todos/*) ───
app.use('/api/todos/*', async (c, next) => {
  const cookieHeader = c.req.header('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];

  if (!token) {
    return c.json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập.' }, 401);
  }

  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }, 401);
  }

  c.set('user', payload);
  await ensureDbColumns(c.env.DB);
  await next();
});

// ─── Auth Middleware (cho /api/categories) ───
app.use('/api/categories', async (c, next) => {
  const cookieHeader = c.req.header('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];

  if (!token) {
    return c.json({ error: 'Chưa đăng nhập.' }, 401);
  }

  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Phiên hết hạn.' }, 401);
  }

  c.set('user', payload);
  await next();
});

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
      c.env.JWT_SECRET
    );

    return new Response(
      JSON.stringify({
        success: true,
        user: { id, email: email.toLowerCase(), username: username.trim() },
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
      c.env.JWT_SECRET
    );

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, email: user.email, username: user.username },
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
  const cookieHeader = c.req.header('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];

  if (!token) {
    return c.json({ authenticated: false }, 200);
  }

  const payload = await verifyJWT(token, c.env.JWT_SECRET);
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

  let query = "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE user_id = ?";
  const params: any[] = [user.sub];

  // Filter by status
  if (status === 'completed') {
    query += ' AND is_completed = 1';
  } else if (status === 'pending') {
    query += ' AND is_completed = 0';
  } else if (status === 'recurring') {
    query += " AND repeat_mode IN ('daily', 'weekly')";
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

// POST /api/todos — Tạo todo mới (có hỗ trợ repeat_mode)
app.post('/api/todos', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      title: string;
      description?: string;
      category?: string;
      priority?: string;
      due_date?: string | null;
      is_pinned?: number;
      repeat_mode?: string;
    }>();

    if (!body.title || !body.title.trim()) {
      return c.json({ error: 'Tiêu đề không được để trống.' }, 400);
    }

    const id = generateId();
    const now = new Date().toISOString();
    const normalizedDueDate = normalizeDate(body.due_date);
    const repeatMode = (body.repeat_mode === 'daily' || body.repeat_mode === 'weekly') ? body.repeat_mode : 'none';

    await c.env.DB.prepare(
      `INSERT INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, repeat_mode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
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
      priority: string;
      due_date: string | null;
      is_completed: number;
      is_pinned: number;
      repeat_mode: string;
    }>>();

    const now = new Date().toISOString();
    const normalizedDueDate = body.due_date !== undefined ? normalizeDate(body.due_date) : existing.due_date;
    const repeatMode = body.repeat_mode !== undefined ? body.repeat_mode : existing.repeat_mode;

    // Kiểm tra nếu thời hạn (due_date) có thay đổi so với giá trị cũ trong D1
    const dueDateChanged = body.due_date !== undefined && normalizedDueDate !== existing.due_date;
    let newTelegramMessageId = existing.telegram_message_id;

    if (dueDateChanged) {
      // 1. Xóa lời nhắc cũ trên Telegram nếu có
      if (existing.telegram_message_id && c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
        await deleteTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, existing.telegram_message_id);
      }
      newTelegramMessageId = null;

      // 2. Đặt lại cờ trạng thái nhắc nhở để đến đúng hạn mới sẽ tự động gửi lời nhắc mới
      try {
        await c.env.DB.prepare('DELETE FROM reminder_logs WHERE todo_id = ?').bind(todoId).run();
      } catch { }
    }

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
        telegram_message_id = ?,
        updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).bind(
      body.title?.trim() ?? existing.title,
      body.description?.trim() ?? existing.description,
      body.category?.trim() ?? existing.category,
      body.priority ?? existing.priority,
      normalizedDueDate,
      body.is_completed !== undefined ? body.is_completed : existing.is_completed,
      body.is_pinned !== undefined ? body.is_pinned : existing.is_pinned,
      repeatMode,
      newTelegramMessageId,
      now,
      todoId,
      user.sub
    ).run();

    const updated = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ?"
    ).bind(todoId).first<Todo>();

    return c.json({ success: true, todo: updated });
  } catch (err: any) {
    console.error('Update todo error:', err);
    return c.json({ error: 'Lỗi cập nhật công việc.' }, 500);
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

    // Khi hoàn thành: Xóa tin nhắn nhắc nhở cũ trên Telegram nếu có
    if (newStatus === 1 && existing.telegram_message_id && c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
      await deleteTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, existing.telegram_message_id);
    }

    await c.env.DB.prepare(
      'UPDATE todos SET is_completed = ?, due_date = ?, telegram_message_id = CASE WHEN ? = 1 THEN NULL ELSE telegram_message_id END, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(newStatus, nextDueDate, newStatus, now, todoId, user.sub).run();

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

// DELETE /api/todos/:id — Xoá todo
app.delete('/api/todos/:id', async (c) => {
  try {
    const user = c.get('user');
    const todoId = c.req.param('id');

    const existing = await c.env.DB.prepare(
      'SELECT id, telegram_message_id FROM todos WHERE id = ? AND user_id = ?'
    ).bind(todoId, user.sub).first<{ id: string; telegram_message_id?: number | null }>();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

    // Xóa tin nhắn nhắc nhở trên Telegram nếu có
    if (existing.telegram_message_id && c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
      await deleteTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, existing.telegram_message_id);
    }

    // Xóa nhật ký nhắc nhở
    try {
      await c.env.DB.prepare('DELETE FROM reminder_logs WHERE todo_id = ?').bind(todoId).run();
    } catch { }

    await c.env.DB.prepare(
      'DELETE FROM todos WHERE id = ? AND user_id = ?'
    ).bind(todoId, user.sub).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete todo error:', err);
    return c.json({ error: 'Lỗi xoá công việc.' }, 500);
  }
});

// POST /api/todos/clear-completed — Xoá tất cả việc đã hoàn thành
app.post('/api/todos/clear-completed', async (c) => {
  try {
    const user = c.get('user');

    await c.env.DB.prepare(
      'DELETE FROM todos WHERE user_id = ? AND is_completed = 1'
    ).bind(user.sub).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Clear completed error:', err);
    return c.json({ error: 'Lỗi dọn dẹp công việc.' }, 500);
  }
});

// GET /api/categories — Lấy danh sách categories của user
app.get('/api/categories', async (c) => {
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    'SELECT DISTINCT category FROM todos WHERE user_id = ? AND category IS NOT NULL AND category != "" ORDER BY category'
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

// GET /manifest.json — Web App Manifest định danh tên "To-Do List"
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

// ════════════════════════════════════════════════════════════
//  TELEGRAM NOTIFICATIONS
// ════════════════════════════════════════════════════════════

// POST /api/test-telegram — Gửi tin nhắn thử nghiệm tới Telegram Bot
app.post('/api/test-telegram', async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies[c.env.COOKIE_NAME];
    let username = 'Chung';

    if (token) {
      const user = await verifyJWT(token, c.env.JWT_SECRET);
      if (user?.username) {
        username = user.username;
      }
    }

    if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) {
      return c.json({
        success: false,
        error: 'Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong Cloudflare Secrets. Hãy thiết lập bằng lệnh: npx wrangler secret put TELEGRAM_BOT_TOKEN và npx wrangler secret put TELEGRAM_CHAT_ID'
      }, 400);
    }

    const res = await sendTelegramTestMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, username);
    if (res.success) {
      // Tự động xóa tin nhắn thử nghiệm sau 15 giây qua ctx.waitUntil
      if (res.messageId) {
        const botToken = c.env.TELEGRAM_BOT_TOKEN;
        const chatId = c.env.TELEGRAM_CHAT_ID;
        const msgId = res.messageId;
        const autoDeletePromise = (async () => {
          await new Promise((resolve) => setTimeout(resolve, 15000));
          await deleteTelegramMessage(botToken, chatId, msgId);
        })();
        try {
          c.executionCtx.waitUntil(autoDeletePromise);
        } catch {
          autoDeletePromise.catch(() => {});
        }
      }
      return c.json({
        success: true,
        message: 'Đã gửi tin nhắn thử nghiệm tới Telegram Bot thành công! (Tin nhắn sẽ tự động xóa sau 15 giây) 🎉'
      });
    } else {
      return c.json({
        success: false,
        error: `Lỗi gửi Telegram: ${res.error || 'Không xác định'}`
      }, 500);
    }
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi xử lý test Telegram' }, 500);
  }
});

// GET /api/test-telegram — Cho phép kiểm tra nhanh qua URL trình duyệt
app.get('/api/test-telegram', async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) {
    return c.json({
      success: false,
      error: 'Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong Cloudflare Secrets.'
    }, 400);
  }
  const res = await sendTelegramTestMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, 'Chung');
  if (res.success && res.messageId) {
    const botToken = c.env.TELEGRAM_BOT_TOKEN;
    const chatId = c.env.TELEGRAM_CHAT_ID;
    const msgId = res.messageId;
    const autoDeletePromise = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 15000));
      await deleteTelegramMessage(botToken, chatId, msgId);
    })();
    try {
      c.executionCtx.waitUntil(autoDeletePromise);
    } catch {
      autoDeletePromise.catch(() => {});
    }
  }
  return c.json(res);
});

// POST /api/telegram-webhook — Tiếp nhận phản hồi từ Inline Keyboard của Telegram
app.post('/api/telegram-webhook', async (c) => {
  try {
    const update: any = await c.req.json();
    const callbackQuery = update?.callback_query;
    if (!callbackQuery) {
      return c.json({ ok: true, message: 'No callback_query' });
    }

    const callbackQueryId = callbackQuery.id;
    const messageId = callbackQuery.message?.message_id;
    const chatId = String(callbackQuery.message?.chat?.id || '');
    const data = String(callbackQuery.data || '');

    // Xác thực chat.id khớp với env.TELEGRAM_CHAT_ID để bảo mật
    if (c.env.TELEGRAM_CHAT_ID && chatId !== String(c.env.TELEGRAM_CHAT_ID).trim()) {
      console.warn('[Telegram Webhook] Unauthorized chat ID:', chatId);
      if (c.env.TELEGRAM_BOT_TOKEN) {
        await answerCallbackQuery(c.env.TELEGRAM_BOT_TOKEN, callbackQueryId, 'Bạn không có quyền thực hiện thao tác này!', true);
      }
      return c.json({ ok: false, error: 'Unauthorized chat ID' }, 403);
    }

    await ensureDbColumns(c.env.DB);

    // 1. Hoàn thành công việc: complete_<task_id>
    if (data.startsWith('complete_')) {
      const taskId = data.replace('complete_', '');
      const task = await c.env.DB.prepare(
        "SELECT *, COALESCE(repeat_mode, 'none') as repeat_mode FROM todos WHERE id = ?"
      ).bind(taskId).first<Todo>();

      if (!task) {
        if (c.env.TELEGRAM_BOT_TOKEN) {
          await answerCallbackQuery(c.env.TELEGRAM_BOT_TOKEN, callbackQueryId, 'Không tìm thấy công việc tương ứng!');
        }
        return c.json({ ok: true, message: 'Task not found' });
      }

      let nextDueDate = task.due_date;
      if (task.repeat_mode && task.repeat_mode !== 'none' && task.due_date) {
        const d = new Date(task.due_date);
        if (!isNaN(d.getTime())) {
          const increment = task.repeat_mode === 'daily' ? 1 : 7;
          d.setDate(d.getDate() + increment);
          while (d.getTime() < Date.now()) {
            d.setDate(d.getDate() + increment);
          }
          nextDueDate = d.toISOString();
        }
      }

      const now = new Date().toISOString();
      await c.env.DB.prepare(
        'UPDATE todos SET is_completed = 1, due_date = ?, telegram_message_id = NULL, updated_at = ? WHERE id = ?'
      ).bind(nextDueDate, now, taskId).run();

      // Xóa tin nhắn nhắc nhở trên Telegram
      if (messageId && c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
        await deleteTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, messageId);
      }

      if (c.env.TELEGRAM_BOT_TOKEN) {
        await answerCallbackQuery(c.env.TELEGRAM_BOT_TOKEN, callbackQueryId, 'Đã hoàn thành công việc! 🎉');
      }
      return c.json({ ok: true, action: 'completed', taskId });
    }

    // 2. Hoãn 15 phút: snooze_<task_id>
    if (data.startsWith('snooze_')) {
      const taskId = data.replace('snooze_', '');
      const task = await c.env.DB.prepare(
        'SELECT * FROM todos WHERE id = ?'
      ).bind(taskId).first<Todo>();

      if (!task) {
        if (c.env.TELEGRAM_BOT_TOKEN) {
          await answerCallbackQuery(c.env.TELEGRAM_BOT_TOKEN, callbackQueryId, 'Không tìm thấy công việc tương ứng!');
        }
        return c.json({ ok: true, message: 'Task not found' });
      }

      // Cộng thêm 15 phút vào due_date
      const currentDue = task.due_date ? new Date(task.due_date).getTime() : Date.now();
      const baseTime = (isNaN(currentDue) || currentDue < Date.now()) ? Date.now() : currentDue;
      const newDueTime = baseTime + 15 * 60 * 1000;
      const newDueDate = new Date(newDueTime).toISOString();
      const now = new Date().toISOString();

      await c.env.DB.prepare(
        'UPDATE todos SET due_date = ?, is_completed = 0, telegram_message_id = NULL, updated_at = ? WHERE id = ?'
      ).bind(newDueDate, now, taskId).run();

      // Đặt lại trạng thái chưa gửi nhắc nhở (xóa reminder_logs của việc này)
      await c.env.DB.prepare(
        'DELETE FROM reminder_logs WHERE todo_id = ?'
      ).bind(taskId).run();

      // Xóa tin nhắn Telegram cũ
      if (messageId && c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
        await deleteTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, c.env.TELEGRAM_CHAT_ID, messageId);
      }

      if (c.env.TELEGRAM_BOT_TOKEN) {
        await answerCallbackQuery(c.env.TELEGRAM_BOT_TOKEN, callbackQueryId, 'Đã hoãn 15 phút (Hạn chót đã lùi +15p) ⏰');
      }
      return c.json({ ok: true, action: 'snoozed', taskId, new_due_date: newDueDate });
    }

    return c.json({ ok: true, message: 'Unknown action' });
  } catch (err: any) {
    console.error('[Telegram Webhook] Error:', err);
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// GET /api/setup-telegram-webhook — Kích hoạt Webhook 1-Click
app.get('/api/setup-telegram-webhook', async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) {
    return c.json({ success: false, error: 'Chưa cấu hình TELEGRAM_BOT_TOKEN trong Cloudflare Secrets.' }, 400);
  }

  const host = new URL(c.req.url).host;
  const webhookUrl = `https://${host}/api/telegram-webhook`;

  try {
    const url = `https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;
    const res = await fetch(url);
    const data: any = await res.json();
    return c.json({
      success: res.ok && data?.ok,
      webhook_url: webhookUrl,
      telegram_response: data
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi gọi Telegram setWebhook' }, 500);
  }
});

// GET /api/version — Kiểm tra phiên bản mới nhất để App iOS / PWA tự cập nhật ngầm
export const APP_VERSION = '1.8.2';
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
      // 2. Quét và gửi thông báo nhắc việc đến hạn qua Telegram Bot
      await checkAndSendReminders(env);
    } catch (err) {
      console.error('[Cloudflare Cron] Scheduled error:', err);
    }
  }
};
