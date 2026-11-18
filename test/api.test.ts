import app from '../src/index';
import assert from 'node:assert';
import { createJWT } from '../src/auth';

async function run() {
  console.log('🧪 Bắt đầu kiểm thử To-Do API endpoints...');

  const validToken = await createJWT({ sub: 'user-123', email: 'test@example.com', username: 'TestUser' }, 'test');

  // 1. GET /api/todos không có token trả về 401
  const res1 = await app.fetch(new Request('http://localhost/api/todos'), {
    DB: {} as any,
    JWT_SECRET: 'test',
    COOKIE_NAME: 'todo_session'
  });
  assert.strictEqual(res1.status, 401);
  console.log('  ✅ PASS: 401 Unauthorized khi truy cập /api/todos không có token');

  // 2. GET /api/todos có token hợp lệ
  let executedSqls: string[] = [];
  const mockDb = {
    prepare: (sql: string) => {
      executedSqls.push(sql);
      return {
        bind: (...args: any[]) => ({
          run: async () => ({ success: true }),
          first: async () => null,
          all: async () => {
            if (sql.includes('FROM todos WHERE user_id = ?')) {
              return {
                results: [
                  { id: 'todo-1', user_id: 'user-123', title: 'Task 1', is_completed: 0, is_pinned: 0, repeat_mode: 'none' }
                ]
              };
            }
            if (sql.includes("repeat_mode IN ('daily', 'weekly')")) {
              return { results: [] };
            }
            return { results: [] };
          }
        }),
        run: async () => ({ success: true })
      };
    }
  };

  const res2 = await app.fetch(
    new Request('http://localhost/api/todos', {
      headers: {
        'Cookie': `todo_session=${validToken}`
      }
    }),
    {
      DB: mockDb as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'todo_session'
    }
  );
  assert.strictEqual(res2.status, 200);
  const data2 = await res2.json() as any;
  assert.strictEqual(data2.todos.length, 1);
  assert.strictEqual(data2.todos[0].title, 'Task 1');
  console.log('  ✅ PASS: GET /api/todos trả về danh sách công việc đúng format');

  // 3. PUT /api/todos/:id cập nhật công việc
  let currentTitle = 'Họp khẩn';
  const mockDbPut = {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        first: async () => {
          return {
            id: 'todo-999',
            user_id: 'user-123',
            title: currentTitle,
            due_date: '2026-11-13T10:00:00.000Z',
            is_completed: 0,
            is_pinned: 0,
            repeat_mode: 'none'
          };
        },
        run: async () => {
          if (sql.includes('UPDATE todos SET')) {
            currentTitle = 'Họp khẩn mới';
          }
          return { success: true };
        }
      })
    })
  };

  const res3 = await app.fetch(
    new Request('http://localhost/api/todos/todo-999', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `todo_session=${validToken}`
      },
      body: JSON.stringify({
        title: 'Họp khẩn mới',
        due_date: '2026-11-13T15:00:00.000Z'
      })
    }),
    {
      DB: mockDbPut as any,
      JWT_SECRET: 'test',
      COOKIE_NAME: 'todo_session'
    }
  );
  assert.strictEqual(res3.status, 200);
  const data3 = await res3.json() as any;
  assert.strictEqual(data3.todo.title, 'Họp khẩn mới');
  console.log('  ✅ PASS: PUT /api/todos/:id cập nhật thông tin công việc thành công');

  // 4. PATCH /api/todos/:id/toggle chặn hoàn thành nếu việc con chưa xong
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
                { id: 'st2', title: 'Thuyết trình slide', is_completed: 0 } // việc con chưa xong
              ])
            };
          }
          return null;
        },
        run: async () => ({ success: true })
      })
    })
  };

  const res4 = await app.fetch(
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
  assert.strictEqual(res4.status, 400);
  const json4 = await res4.json() as any;
  assert.ok(json4.error.includes('việc con chưa xong'));
  console.log('  ✅ PASS: PATCH /api/todos/:id/toggle từ chối hoàn thành khi việc con chưa xong');

  console.log('🎉 Toàn bộ kiểm thử API endpoints đã hoàn thành xuất sắc!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
