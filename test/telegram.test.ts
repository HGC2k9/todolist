// ============================================================
// Unit Test: Telegram Bot Module & Reminder Formatting
// ============================================================

import assert from 'node:assert';
import { escapeHtml, formatVnDateTime, sendTelegramMessage, sendTelegramTaskReminder, sendTelegramTestMessage } from '../src/telegram';
import type { Todo, Env } from '../src/types';

console.log('🧪 Bắt đầu chạy kiểm thử Telegram Bot Module...');

async function runTests() {
  const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];

  function test(name: string, fn: () => void | Promise<void>) {
    tests.push({ name, fn });
  }

  // 1. escapeHtml
  test('escapeHtml mã hóa chuẩn HTML <, >, &', () => {
    assert.strictEqual(escapeHtml('<script>alert("hello & bye")</script>'), '&lt;script&gt;alert("hello &amp; bye")&lt;/script&gt;');
    assert.strictEqual(escapeHtml(''), '');
  });

  // 2. formatVnDateTime
  test('formatVnDateTime định dạng đúng giờ ngày theo múi giờ Việt Nam (UTC+7)', () => {
    const str = formatVnDateTime('2026-11-13T05:30:00.000Z');
    assert.strictEqual(str, '12:30 (13/11/2026)');
  });

  // 3. sendTelegramMessage khi thiếu token / chat_id
  test('sendTelegramMessage trả về lỗi an toàn khi thiếu token hoặc chat_id', async () => {
    const r1 = await sendTelegramMessage('', '12345', 'Hello');
    assert.strictEqual(r1.success, false);
    assert.ok(r1.error?.includes('TELEGRAM_BOT_TOKEN'));

    const r2 = await sendTelegramMessage('token', '', 'Hello');
    assert.strictEqual(r2.success, false);
    assert.ok(r2.error?.includes('TELEGRAM_CHAT_ID'));
  });

  // 4. sendTelegramTaskReminder khi mock fetch
  test('sendTelegramTaskReminder tạo nội dung và gọi fetch chuẩn Telegram API', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any, init?: any) => {
      capturedUrl = String(url);
      capturedBody = JSON.parse(init?.body || '{}');
      return new Response(JSON.stringify({ ok: true, result: { message_id: 999 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    try {
      const mockEnv: Env = {
        DB: {} as any,
        JWT_SECRET: 'test',
        COOKIE_NAME: 'test',
        TELEGRAM_BOT_TOKEN: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        TELEGRAM_CHAT_ID: '987654321'
      };

      const mockTodo: Todo = {
        id: 'todo-1',
        user_id: 'user-1',
        title: 'Họp ban quản lý dự án',
        description: 'Mang theo tài liệu báo cáo',
        category: 'Công việc',
        priority: 'High',
        due_date: '2026-11-13T05:00:00.000Z',
        is_completed: 0,
        repeat_mode: 'weekly',
        created_at: '2026-11-13T00:00:00.000Z',
        updated_at: '2026-11-13T00:00:00.000Z'
      };

      const res = await sendTelegramTaskReminder(mockEnv, mockTodo, 15);
      assert.strictEqual(res.success, true);
      assert.ok(capturedUrl.includes('123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage'));
      assert.strictEqual(capturedBody.chat_id, '987654321');
      assert.strictEqual(capturedBody.parse_mode, 'HTML');
      assert.ok(capturedBody.text.includes('Họp ban quản lý dự án'));
      assert.ok(capturedBody.text.includes('Cao (High)'));
      assert.ok(capturedBody.text.includes('15 phút'));
      assert.ok(capturedBody.text.includes('Hàng tuần'));
      assert.ok(capturedBody.text.includes('https://app.todolists.workers.dev'));
      assert.ok(capturedBody.reply_markup?.inline_keyboard);
      const buttons = capturedBody.reply_markup.inline_keyboard[0];
      assert.strictEqual(buttons[0].callback_data, 'complete_todo-1');
      assert.strictEqual(buttons[1].callback_data, 'snooze_todo-1');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 5. deleteTelegramMessage
  test('deleteTelegramMessage gọi đúng API deleteMessage', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    try {
      const { deleteTelegramMessage } = await import('../src/telegram');
      const ok = await deleteTelegramMessage('dummy_token', '12345', 777);
      assert.strictEqual(ok, true);
      assert.ok(capturedUrl.includes('dummy_token/deleteMessage'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 6. answerCallbackQuery
  test('answerCallbackQuery gọi đúng API answerCallbackQuery', async () => {
    let capturedBody: any = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url: any, init?: any) => {
      capturedBody = JSON.parse(init?.body || '{}');
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };
    try {
      const { answerCallbackQuery } = await import('../src/telegram');
      const ok = await answerCallbackQuery('dummy_token', 'cq_999', 'Thành công!', false);
      assert.strictEqual(ok, true);
      assert.strictEqual(capturedBody.callback_query_id, 'cq_999');
      assert.strictEqual(capturedBody.text, 'Thành công!');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 7. sendTelegramTestMessage khi mock fetch
  test('sendTelegramTestMessage gửi tin nhắn test đúng định dạng', async () => {
    let capturedBody: any = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url: any, init?: any) => {
      capturedBody = JSON.parse(init?.body || '{}');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    try {
      const res = await sendTelegramTestMessage('dummy_token', 'dummy_chat', 'Chung');
      assert.strictEqual(res.success, true);
      assert.ok(capturedBody.text.includes('KIỂM TRA KẾT NỐI TELEGRAM BOT THÀNH CÔNG'));
      assert.ok(capturedBody.text.includes('Chung'));
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

  console.log('🎉 Toàn bộ kiểm thử Telegram Bot đã hoàn thành!');
}

runTests();

