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
import { sendWebPush, VAPID_PUBLIC_KEY, PushSubscriptionData } from './push';

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

    await c.env.DB.prepare(
      'UPDATE todos SET is_completed = ?, due_date = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(newStatus, nextDueDate, now, todoId, user.sub).run();

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
      'SELECT id FROM todos WHERE id = ? AND user_id = ?'
    ).bind(todoId, user.sub).first();

    if (!existing) {
      return c.json({ error: 'Không tìm thấy công việc.' }, 404);
    }

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
//  PUSH NOTIFICATIONS — Web Push (APNs cho iOS & FCM cho Chrome/Android)
// ════════════════════════════════════════════════════════════

// GET /api/push/vapid-public-key — Lấy VAPID Public Key để client đăng ký push
app.get('/api/push/vapid-public-key', (c) => {
  return c.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — Lưu thông tin push subscription của thiết bị vào D1
app.post('/api/push/subscribe', async (c) => {
  const cookieHeader = c.req.header('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];
  if (!token) return c.json({ error: 'Chưa đăng nhập' }, 401);

  const user = await verifyJWT(token, c.env.JWT_SECRET);
  if (!user) return c.json({ error: 'Phiên đăng nhập hết hạn' }, 401);

  try {
    const body = await c.req.json<any>();
    if (!body || !body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return c.json({ error: 'Dữ liệu đăng ký không hợp lệ' }, 400);
    }

    const subId = generateId();
    await c.env.DB.prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`
    ).bind(subId, user.sub, body.endpoint, body.keys.p256dh, body.keys.auth).run();

    return c.json({ success: true, message: 'Đăng ký thông báo đẩy thành công!' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Lỗi đăng ký push' }, 500);
  }
});

// POST /api/push/test — Bắn thông báo đẩy thử nghiệm đến các thiết bị của user
app.post('/api/push/test', async (c) => {
  const cookieHeader = c.req.header('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];
  if (!token) return c.json({ error: 'Chưa đăng nhập' }, 401);

  const user = await verifyJWT(token, c.env.JWT_SECRET);
  if (!user) return c.json({ error: 'Phiên đăng nhập hết hạn' }, 401);

  const subsRes = await c.env.DB.prepare(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`
  ).bind(user.sub).all<{ id: string; endpoint: string; p256dh: string; auth: string }>();

  const subs = subsRes.results || [];
  if (subs.length === 0) {
    return c.json({ success: false, message: 'Chưa tìm thấy thiết bị đăng ký nhận thông báo đẩy. Hãy bấm Bật thông báo trên thiết bị!' });
  }

  const payload = {
    title: 'To-Do List (Designed by Chung)',
    body: '🎉 Thông báo đẩy chạy ngầm đang hoạt động hoàn hảo ngay cả khi tắt toàn bộ ứng dụng!',
    url: '/'
  };

  let sentCount = 0;
  for (const sub of subs) {
    const res = await sendWebPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );
    if (res.success) sentCount++;
    if (res.expired) {
      await c.env.DB.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).bind(sub.id).run();
    }
  }

  return c.json({ success: true, sentCount, total: subs.length });
});

// GET /api/version — Kiểm tra phiên bản mới nhất để App iOS / PWA tự cập nhật ngầm
export const APP_VERSION = '1.5.5';
app.get('/api/version', (c) => {
  return c.json({
    version: APP_VERSION,
    name: 'To-Do List',
    author: 'Designed by Chung',
    updated_at: '2026-11-12T15:00:00Z',
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
    const now = Date.now();
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    try {
      // 1. Lấy tất cả công việc chưa hoàn thành và có thời hạn
      const todosRes = await env.DB.prepare(
        `SELECT id, user_id, title, priority, due_date FROM todos WHERE is_completed = 0 AND due_date IS NOT NULL`
      ).all<Todo>();

      const todos = todosRes.results || [];
      if (todos.length === 0) return;

      // 2. Lọc các công việc đang trong khung cảnh báo
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

        // Nếu công việc nằm trong khoảng từ 0 phút đến windowMin phút trước hạn
        if (minLeft >= 0 && minLeft <= windowMin) {
          // Kiểm tra xem đã gửi nhắc nhở gần đây chưa
          const logRes = await env.DB.prepare(
            `SELECT MAX(notified_at) as last_notified, COUNT(*) as total_count FROM reminder_logs WHERE todo_id = ?`
          ).bind(task.id).first<{ last_notified: number | null; total_count: number }>();

          const lastNotified = logRes?.last_notified || 0;
          const totalCount = logRes?.total_count || 0;

          // High và Medium: lặp lại mỗi 5 phút một lần; Low: chỉ thông báo đúng 1 lần duy nhất
          const isRecurring = (task.priority === 'High' || task.priority === 'Medium');
          const shouldNotify = isRecurring ? (now - lastNotified >= FIVE_MINUTES_MS) : (totalCount === 0);

          if (shouldNotify) {
            // Lấy tất cả subscription của người dùng sở hữu công việc này
            const subsRes = await env.DB.prepare(
              `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`
            ).bind(task.user_id).all<{ id: string; endpoint: string; p256dh: string; auth: string }>();

            const subs = subsRes.results || [];
            if (subs.length > 0) {
              const d = new Date(dueTime);
              const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

              const payload = {
                title: `Sắp hết hạn trong ${minLeft} phút`,
                body: `Công việc "${task.title}" cần hoàn thành trước ${timeStr}`,
                tag: `rem-${task.id}-${Math.floor(now / FIVE_MINUTES_MS)}`,
                url: '/'
              };

              for (const sub of subs) {
                const res = await sendWebPush(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload
                );

                // Nếu user đã hủy quyền hoặc gỡ app (404/410), xóa khỏi DB
                if (res.expired) {
                  await env.DB.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).bind(sub.id).run();
                }
              }
            }

            // Ghi nhật ký vào reminder_logs
            const logId = crypto.randomUUID();
            await env.DB.prepare(
              `INSERT INTO reminder_logs (id, todo_id, notified_at) VALUES (?, ?, ?)`
            ).bind(logId, task.id, now).run();
          }
        }
      }
    } catch (err) {
      console.error('[Cloudflare Cron] Reminder check error:', err);
    }
  }
};
