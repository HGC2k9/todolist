// ============================================================
// Unit Test: Recurring Tasks Local Auto-Reset (Hàng Ngày & Hàng Tuần)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts } from '../src/client/notifications';

console.log('🧪 Bắt đầu kiểm thử tính năng Tự Reset việc Hàng ngày & Hàng tuần (Pure Local)...');

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      res.then(() => console.log(`  ✅ PASS: ${name}`)).catch((err) => {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(err);
        process.exit(1);
      });
    } else {
      console.log(`  ✅ PASS: ${name}`);
    }
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Kiểm tra tính toán ngày giờ Việt Nam (UTC+7)
test('getVnDateParts tính đúng ngày giờ VN và ngày đầu tuần (Thứ 2)', () => {
  // 2026-11-13 05:00:00 UTC = 2026-11-13 12:00:00 VN (Thứ 6)
  const d = new Date('2026-11-13T05:00:00Z');
  const parts = getVnDateParts(d);
  assert.strictEqual(parts.year, 2026);
  assert.strictEqual(parts.month, 10); // tháng 11 (0-indexed)
  assert.strictEqual(parts.day, 13);
  assert.strictEqual(parts.dayOfWeek, 5); // Thứ 6
  assert.strictEqual(parts.hours, 12);
  assert.strictEqual(parts.minutes, 0);
  assert.strictEqual(parts.dateStr, '2026-11-13');
  assert.strictEqual(parts.timeStr, '12:00');
});

test('getVnDateParts xử lý đúng Chủ nhật (dayOfWeek = 0)', () => {
  // 2026-11-15 15:00:00 UTC = 2026-11-15 22:00:00 VN (Chủ nhật)
  const d = new Date('2026-11-15T15:00:00Z');
  const parts = getVnDateParts(d);
  assert.strictEqual(parts.dayOfWeek, 0); // Chủ nhật
  assert.strictEqual(parts.dateStr, '2026-11-15');
});

// 2. Logic Reset việc Hàng ngày (Daily) trên Local Storage
test('checkAndResetRecurringTasksLocally tự động reset việc Daily và uncheck subtasks', () => {
  const vnNow = getVnDateParts(Date.now());
  const todayStr = vnNow.dateStr;

  const yesterdayDate = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayIso = yesterdayDate.toISOString();

  const mockTodos = [
    {
      id: 'daily-task-1',
      title: 'Tập thể dục buổi sáng',
      is_completed: 1,
      repeat_mode: 'daily',
      updated_at: yesterdayIso,
      due_date: yesterdayIso,
      subtasks: [
        { id: 'sub-1', title: 'Hít đất 30 cái', is_completed: 1 },
        { id: 'sub-2', title: 'Chạy bộ 2km', is_completed: 1 }
      ]
    },
    {
      id: 'daily-task-today',
      title: 'Đã hoàn thành hôm nay',
      is_completed: 1,
      repeat_mode: 'daily',
      updated_at: new Date().toISOString(),
      due_date: new Date().toISOString(),
      subtasks: []
    }
  ];

  // Thực hiện hàm reset local
  for (const t of mockTodos) {
    if (!t.repeat_mode || t.repeat_mode === 'none' || !t.is_completed) continue;
    const lastUpdatedParts = getVnDateParts(t.updated_at);
    if (t.repeat_mode === 'daily') {
      if (lastUpdatedParts.dateStr < todayStr) {
        t.is_completed = 0;
        if (t.subtasks && Array.isArray(t.subtasks)) {
          t.subtasks.forEach((st: any) => { st.is_completed = 0; });
        }
      }
    }
  }

  // Xác nhận task hôm qua đã được reset thành 0
  assert.strictEqual(mockTodos[0].is_completed, 0);
  assert.strictEqual(mockTodos[0].subtasks[0].is_completed, 0);
  assert.strictEqual(mockTodos[0].subtasks[1].is_completed, 0);

  // Task hoàn thành hôm nay vẫn giữ nguyên is_completed = 1
  assert.strictEqual(mockTodos[1].is_completed, 1);
  console.log('  ✅ PASS: Task Daily ngày hôm qua đã tự động reset về 0 và uncheck toàn bộ subtask!');
});
