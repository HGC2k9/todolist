// ============================================================
// Unit Test: Telegram Webhook & 2-Way Interaction
// ============================================================

import assert from 'node:assert';
import app from '../src/index';

console.log('🧪 Bắt đầu kiểm thử Telegram Webhook...');

const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

async function run() {

// 1. Từ chối Chat ID lạ (Bảo mật Webhook)
test('Webhook từ chối khi chat.id không khớp TELEGRAM_CHAT_ID', async () => {
  const req = new Request('http://localhost/api/telegram-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query: {
        id: 'cq_unauth',
        data: 'complete_task-123',
        message: {
          chat: { id: 999999999 }, // ID lạ
          message_id: 111
        }
      }
    })
  });

  const res = await app.fetch(req, {
    DB: {} as any,
    JWT_SECRET: 'test',
    COOKIE_NAME: 'test',
    TELEGRAM_BOT_TOKEN: 'test_token',
    TELEGRAM_CHAT_ID: '123456789' // ID chính chủ
  });

  assert.strictEqual(res.status, 403);
  const data: any = await res.json();
  assert.strictEqual(data.ok, false);
});

// 2. Xử lý complete_<taskId> thành công
test('Webhook xử lý complete_<taskId> đánh dấu hoàn thành & xóa tin nhắn', async () => {
  let executedSqls: string[] = [];
  let answerCalled = false;
  let deleteCalled = false;

  const mockDb = {
    prepare: (sql: string) => {
      executedSqls.push(sql);
      return {
        bind: (..._args: any[]) => ({
          run: async () => ({ success: true }),
          first: async () => ({
            id: 'task-1',
            title: 'Họp nhóm',
            is_completed: 0,
            repeat_mode: 'none',
            due_date: '2026-11-13T10:00:00.000Z'
          }),
          all: async () => ({ results: [] })
        }),
        run: async () => ({ success: true })
      };
    }
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any) => {
    const s = String(url);
    if (s.includes('deleteMessage')) deleteCalled = true;
    if (s.includes('answerCallbackQuery')) answerCalled = true;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    const req = new Request('http://localhost/api/telegram-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query: {
          id: 'cq_complete',
          data: 'complete_task-1',
          message: {
            chat: { id: 123456789 },
            message_id: 888
          }
        }
      })
    });

    const res = await app.fetch(req, {
      DB: mockDb as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'test',
      TELEGRAM_BOT_TOKEN: 'test_token',
      TELEGRAM_CHAT_ID: '123456789'
    });

    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.action, 'completed');
    assert.strictEqual(deleteCalled, true);
    assert.strictEqual(answerCalled, true);
    assert.ok(executedSqls.some(sql => sql.includes('UPDATE todos SET is_completed = 1')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// 3. Xử lý snooze_<taskId> thành công (+15 phút & reset logs)
test('Webhook xử lý snooze_<taskId> cộng 15 phút vào due_date và xóa reminder_logs', async () => {
  let executedSqls: string[] = [];
  let answerCalled = false;
  let deleteCalled = false;

  const mockDb = {
    prepare: (sql: string) => {
      executedSqls.push(sql);
      return {
        bind: (..._args: any[]) => ({
          run: async () => ({ success: true }),
          first: async () => ({
            id: 'task-2',
            title: 'Nộp báo cáo',
            is_completed: 0,
            due_date: '2026-11-13T10:00:00.000Z'
          }),
          all: async () => ({ results: [] })
        }),
        run: async () => ({ success: true })
      };
    }
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any) => {
    const s = String(url);
    if (s.includes('deleteMessage')) deleteCalled = true;
    if (s.includes('answerCallbackQuery')) answerCalled = true;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    const req = new Request('http://localhost/api/telegram-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query: {
          id: 'cq_snooze',
          data: 'snooze_task-2',
          message: {
            chat: { id: 123456789 },
            message_id: 888
          }
        }
      })
    });

    const res = await app.fetch(req, {
      DB: mockDb as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'test',
      TELEGRAM_BOT_TOKEN: 'test_token',
      TELEGRAM_CHAT_ID: '123456789'
    });

    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.action, 'snoozed');
    assert.strictEqual(deleteCalled, true);
    assert.strictEqual(answerCalled, true);
    assert.ok(executedSqls.some(sql => sql.includes('UPDATE todos SET due_date = ?')));
    assert.ok(executedSqls.some(sql => sql.includes('DELETE FROM reminder_logs WHERE todo_id = ?')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// 4. Kích hoạt Webhook 1-Click: /api/setup-telegram-webhook
test('GET /api/setup-telegram-webhook gọi đúng API setWebhook của Telegram', async () => {
  let capturedUrl = '';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({ ok: true, description: 'Webhook was set' }), { status: 200 });
  };

  try {
    const req = new Request('http://app.todolists.workers.dev/api/setup-telegram-webhook');
    const res = await app.fetch(req, {
      DB: {} as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'test',
      TELEGRAM_BOT_TOKEN: 'my_bot_token',
      TELEGRAM_CHAT_ID: '123456789'
    });

    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(capturedUrl.includes('my_bot_token/setWebhook'));
    assert.ok(capturedUrl.includes('https%3A%2F%2Fapp.todolists.workers.dev%2Fapi%2Ftelegram-webhook'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// 5. Kiểm thử lệnh /link <code> kết nối Telegram đa người dùng
test('Webhook xử lý /link <code> liên kết tài khoản user thành công', async () => {
  let updatedChatId = '';
  let updatedUserId = '';
  let deletedCode = '';
  let sentMessage = '';

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any, opts: any) => {
    if (String(url).includes('sendMessage')) {
      const body = JSON.parse(opts.body);
      sentMessage = body.text;
      return new Response(JSON.stringify({ ok: true, result: { message_id: 999 } }));
    }
    return originalFetch(url, opts);
  };

  const mockDb = {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        run: async () => {
          if (sql.includes('UPDATE users SET telegram_chat_id')) {
            updatedChatId = args[0];
            updatedUserId = args[1];
          }
          if (sql.includes('DELETE FROM telegram_link_codes')) {
            deletedCode = args[0];
          }
          return { success: true };
        },
        first: async () => {
          if (sql.includes('SELECT user_id FROM telegram_link_codes')) {
            return { user_id: 'user-chung-123' };
          }
          if (sql.includes('SELECT username FROM users')) {
            return { username: 'Chung' };
          }
          return null;
        }
      })
    })
  };

  try {
    const req = new Request('http://localhost/api/telegram-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          chat: { id: 777888999 },
          text: '/link 849201'
        }
      })
    });

    const res = await app.fetch(req, {
      DB: mockDb as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'test',
      TELEGRAM_BOT_TOKEN: 'mock_token',
      TELEGRAM_CHAT_ID: 'admin_id'
    });

    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.linked, true);
    assert.strictEqual(updatedChatId, '777888999');
    assert.strictEqual(updatedUserId, 'user-chung-123');
    assert.strictEqual(deletedCode, '849201');
    assert.ok(sentMessage.includes('Liên kết thành công'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✅ PASS: ${t.name}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${t.name}`);
      console.error(err);
      process.exit(1);
    }
  }

  console.log('🎉 Toàn bộ kiểm thử Telegram Webhook đã thành công!');
}

run();
