import app from '../src/index';
import assert from 'node:assert';

async function run() {
  console.log('Testing /api/test-telegram endpoint...');

  // 1. Missing secrets
  const res1 = await app.fetch(new Request('http://localhost/api/test-telegram', { method: 'POST' }), {
    DB: {} as any,
    JWT_SECRET: 'test',
    COOKIE_NAME: 'todo_session'
  });
  assert.strictEqual(res1.status, 400);
  const json1 = await res1.json() as any;
  assert.strictEqual(json1.success, false);
  assert.ok(json1.error.includes('TELEGRAM_BOT_TOKEN'));
  console.log('  ✅ PASS: 400 when secrets missing');

  // 2. GET method also works
  const res2 = await app.fetch(new Request('http://localhost/api/test-telegram', { method: 'GET' }), {
    DB: {} as any,
    JWT_SECRET: 'test',
    COOKIE_NAME: 'todo_session'
  });
  assert.strictEqual(res2.status, 400);
  console.log('  ✅ PASS: GET handles missing secrets gracefully');

  // 3. Mock fetch success
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    const res3 = await app.fetch(new Request('http://localhost/api/test-telegram', { method: 'POST' }), {
      DB: {} as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'todo_session',
      TELEGRAM_BOT_TOKEN: 'valid_token',
      TELEGRAM_CHAT_ID: 'valid_chat'
    });
    assert.strictEqual(res3.status, 200);
    const json3 = await res3.json() as any;
    assert.strictEqual(json3.success, true);
    console.log('  ✅ PASS: 200 and success:true when message sent');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // 4. PUT /api/todos/:id with changed due_date deletes old Telegram message and resets reminder_logs
  console.log('Testing PUT /api/todos/:id with changed due_date...');
  const { createJWT } = await import('../src/auth');
  const validToken = await createJWT({ sub: 'user-123', email: 'test@example.com', username: 'TestUser' }, 'test');

  let deleteCalled = false;
  let executedSqls: string[] = [];

  const mockDb = {
    prepare: (sql: string) => {
      executedSqls.push(sql);
      return {
        bind: (...args: any[]) => ({
          run: async () => ({ success: true }),
          first: async () => {
            if (sql.includes('SELECT *, COALESCE(is_pinned, 0)')) {
              return {
                id: 'todo-999',
                user_id: 'user-123',
                title: 'Họp khẩn',
                due_date: '2026-11-13T10:00:00.000Z',
                telegram_message_id: 55555,
                is_completed: 0,
                is_pinned: 0,
                repeat_mode: 'none'
              };
            }
            return null;
          },
          all: async () => ({ results: [] })
        }),
        run: async () => ({ success: true })
      };
    }
  };

  const fetchMock = async (url: any) => {
    if (String(url).includes('deleteMessage')) {
      deleteCalled = true;
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  const oldFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as any;

  try {
    const res4 = await app.fetch(
      new Request('http://localhost/api/todos/todo-999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `todo_session=${validToken}`
        },
        body: JSON.stringify({
          title: 'Họp khẩn',
          due_date: '2026-11-13T15:00:00.000Z' // Đổi sang giờ mới
        })
      }),
      {
        DB: mockDb as any,
        JWT_SECRET: 'test',
        COOKIE_NAME: 'todo_session',
        TELEGRAM_BOT_TOKEN: 'valid_token',
        TELEGRAM_CHAT_ID: 'valid_chat'
      }
    );

    assert.strictEqual(res4.status, 200);
    assert.strictEqual(deleteCalled, true);
    assert.ok(executedSqls.some(sql => sql.includes('DELETE FROM reminder_logs WHERE todo_id = ?')));
    assert.ok(executedSqls.some(sql => sql.includes('telegram_message_id = ?')));
    console.log('  ✅ PASS: PUT /api/todos/:id with changed due_date deletes old Telegram reminder and resets logs');
  } finally {
    globalThis.fetch = oldFetch;
  }

  // 5. PATCH /api/todos/:id/toggle blocks with 400 when subtasks are incomplete
  console.log('Testing PATCH /api/todos/:id/toggle blocks when subtasks incomplete...');
  const mockDbSubtasks = {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        first: async () => {
          if (sql.includes('SELECT *, COALESCE(is_pinned, 0)')) {
            return {
              id: 'todo-sub-1',
              user_id: 'user-123',
              title: 'Làm đồ án',
              is_completed: 0,
              repeat_mode: 'none',
              subtasks: JSON.stringify([
                { id: 'st1', title: 'Viết báo cáo', is_completed: 1 },
                { id: 'st2', title: 'Thuyết trình slide', is_completed: 0 } // chưa hoàn thành
              ])
            };
          }
          return null;
        },
        run: async () => ({ success: true })
      })
    })
  };

  const res5 = await app.fetch(
    new Request('http://localhost/api/todos/todo-sub-1/toggle', {
      method: 'PATCH',
      headers: {
        'Cookie': `todo_session=${validToken}`
      }
    }),
    {
      DB: mockDbSubtasks as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'todo_session'
    }
  );

  assert.strictEqual(res5.status, 400);
  const json5 = await res5.json() as any;
  assert.ok(json5.error.includes('việc con chưa xong'));
  console.log('  ✅ PASS: PATCH /api/todos/:id/toggle rejects completion when subtasks are incomplete');

  console.log('🎉 All endpoint tests passed!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

