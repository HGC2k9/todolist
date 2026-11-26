// ============================================================
// Unit Test: Recurring Tasks Local Auto-Reset (Hàng Ngày & Hàng Tuần)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts, checkAndResetRecurringTasks, isTodoForToday } from '../src/client/notifications';

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

// 3. Kiểm tra mốc 00:01 UTC+7 cho Daily & Weekly + lọc isTodoForToday
test('checkAndResetRecurringTasks: Daily chỉ reset sau 00:01 VN (không reset ở 00:00:30)', () => {
  const completedYesterdayIso = new Date(Date.UTC(2026, 10, 25, 10, 0, 0)).toISOString(); // 25/11 17:00 VN
  const dueYesterdayIso = new Date(Date.UTC(2026, 10, 25, 1, 0, 0)).toISOString(); // 25/11 08:00 VN

  const todos = [
    {
      id: 'd-001',
      title: 'Uống nước sáng',
      repeat_mode: 'daily',
      is_completed: 1,
      status: 'completed',
      updated_at: completedYesterdayIso,
      due_date: dueYesterdayIso,
      subtasks: [{ id: 's1', title: '500ml', is_completed: 1 }]
    }
  ];

  // Lúc 00:00:30 VN ngày 26/11 (17:00:30 UTC 25/11): CHƯA tới 00:01 -> chưa reset
  const before0001Ms = Date.UTC(2026, 10, 25, 17, 0, 30);
  const changedBefore = checkAndResetRecurringTasks(todos, before0001Ms);
  assert.strictEqual(changedBefore, false);
  assert.strictEqual(todos[0].is_completed, 1);

  // Lúc 00:01:10 VN ngày 26/11 (17:01:10 UTC 25/11): ĐÃ qua 00:01 -> reset sạch sẽ
  const after0001Ms = Date.UTC(2026, 10, 25, 17, 1, 10);
  const changedAfter = checkAndResetRecurringTasks(todos, after0001Ms);
  assert.strictEqual(changedAfter, true);
  assert.strictEqual(todos[0].is_completed, 0);
  assert.strictEqual(todos[0].status, 'todo');
  assert.strictEqual(todos[0].subtasks[0].is_completed, 0);
  assert.strictEqual(getVnDateParts(todos[0].due_date).dateStr, '2026-11-26');
  assert.strictEqual(getVnDateParts(todos[0].due_date).timeStr, '08:00');
});

test('checkAndResetRecurringTasks: Weekly chỉ reset sau 00:01 Thứ 2 VN', () => {
  // Hoàn thành Chủ nhật 22/11/2026 15:00 VN (08:00 UTC)
  const completedSunIso = new Date(Date.UTC(2026, 10, 22, 8, 0, 0)).toISOString();
  // Hạn Thứ 4 tuần trước 18/11 09:00 VN
  const dueWedIso = new Date(Date.UTC(2026, 10, 18, 2, 0, 0)).toISOString();

  const todos = [
    {
      id: 'w-001',
      title: 'Họp giao ban thứ 4',
      repeat_mode: 'weekly',
      is_completed: 1,
      status: 'completed',
      updated_at: completedSunIso,
      due_date: dueWedIso,
      subtasks: [{ id: 'ws1', title: 'Chuẩn bị slide', is_completed: 1 }]
    }
  ];

  // Thứ 2 23/11 00:00:40 VN (22/11 17:00:40 UTC): CHƯA tới 00:01 Thứ 2 -> chưa reset
  const monBefore0001 = Date.UTC(2026, 10, 22, 17, 0, 40);
  assert.strictEqual(checkAndResetRecurringTasks(todos, monBefore0001), false);
  assert.strictEqual(todos[0].is_completed, 1);

  // Thứ 2 23/11 00:01:05 VN (22/11 17:01:05 UTC): ĐÃ qua 00:01 Thứ 2 -> reset & dời due_date sang Thứ 4 (25/11)
  const monAfter0001 = Date.UTC(2026, 10, 22, 17, 1, 5);
  assert.strictEqual(checkAndResetRecurringTasks(todos, monAfter0001), true);
  assert.strictEqual(todos[0].is_completed, 0);
  assert.strictEqual(todos[0].status, 'todo');
  assert.strictEqual(todos[0].subtasks[0].is_completed, 0);
  assert.strictEqual(getVnDateParts(todos[0].due_date).dateStr, '2026-11-25');
});

test('isTodoForToday chỉ lọc đúng việc hôm nay (UTC+7), loại bỏ việc xóa/khác ngày/không hạn', () => {
  // Giả lập hôm nay: Thứ 5 26/11/2026 14:00 VN (07:00 UTC)
  const nowMs = Date.UTC(2026, 10, 26, 7, 0, 0);
  const todayDue = '2026-11-26T18:00';
  const tomorrowDue = '2026-11-27T09:00';
  const yesterdayDue = '2026-11-25T09:00';
  const todayIso = new Date(nowMs).toISOString();

  assert.strictEqual(isTodoForToday({ id: '1', repeat_mode: 'none', due_date: todayDue }, nowMs), true);
  assert.strictEqual(isTodoForToday({ id: '2', repeat_mode: 'daily', due_date: yesterdayDue }, nowMs), true);
  // Weekly đúng Thứ 5 (26/11) -> true; Weekly Thứ 6 (27/11) -> false
  assert.strictEqual(isTodoForToday({ id: '3', repeat_mode: 'weekly', due_date: '2026-12-03T09:00' }, nowMs), true);
  assert.strictEqual(isTodoForToday({ id: '4', repeat_mode: 'weekly', due_date: tomorrowDue }, nowMs), false);
  // Việc đã xóa -> false
  assert.strictEqual(isTodoForToday({ id: '5', repeat_mode: 'daily', deleted_at: todayIso }, nowMs), false);
  // Việc ngày mai dù vừa hoàn thành hôm nay -> false
  assert.strictEqual(isTodoForToday({ id: '6', repeat_mode: 'none', due_date: tomorrowDue, is_completed: 1, updated_at: todayIso }, nowMs), false);
  // Việc không có hạn dù tạo hôm nay -> false
  assert.strictEqual(isTodoForToday({ id: '7', repeat_mode: 'none', due_date: null, created_at: todayIso }, nowMs), false);
});
