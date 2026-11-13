// ============================================================
// Unit Test: Recurring Tasks Auto-Reset (Tự Reset Hàng Ngày / Hàng Tuần)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts, resetRecurringTasks } from '../src/index';

console.log('🧪 Bắt đầu kiểm thử tính năng Tự Reset việc Hàng ngày & Hàng tuần...');

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
  // Thứ 2 của tuần đó phải là 2026-11-09
  assert.strictEqual(parts.mondayStr, '2026-11-09');
});

test('getVnDateParts xử lý đúng Chủ nhật thuộc về tuần bắt đầu từ Thứ 2 trước đó', () => {
  // 2026-11-15 15:00:00 UTC = 2026-11-15 22:00:00 VN (Chủ nhật)
  const d = new Date('2026-11-15T15:00:00Z');
  const parts = getVnDateParts(d);
  assert.strictEqual(parts.dayOfWeek, 0); // Chủ nhật
  assert.strictEqual(parts.mondayStr, '2026-11-09'); // Tuần bắt đầu từ 09/11
});

// 2. Mock D1 Database để test resetRecurringTasks
test('resetRecurringTasks tự reset việc Hàng ngày khi qua ngày mới', async () => {
  const updatedRecords: any[] = [];
  const mockDb: any = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async all() {
              if (sql.includes('SELECT')) {
                return {
                  results: [
                    {
                      id: 'task-daily-yesterday',
                      user_id: 'user-1',
                      title: 'Uống thuốc',
                      priority: 'High',
                      // Hạn hôm qua: 2026-11-12 18:00 VN
                      due_date: '2026-11-12T11:00:00.000Z',
                      is_completed: 1,
                      repeat_mode: 'daily',
                      updated_at: '2026-11-12T11:00:00.000Z'
                    },
                    {
                      id: 'task-daily-today',
                      user_id: 'user-1',
                      title: 'Học bài',
                      priority: 'Medium',
                      // Hạn hôm nay: 2026-11-13 18:00 VN (giả sử hôm nay là 13/11)
                      due_date: new Date().toISOString(),
                      is_completed: 1,
                      repeat_mode: 'daily',
                      updated_at: new Date().toISOString()
                    }
                  ]
                };
              }
              return { results: [] };
            },
            async run() {
              if (sql.includes('UPDATE')) {
                updatedRecords.push({ sql, args });
              }
              return { success: true };
            }
          };
        }
      };
    }
  };

  const count = await resetRecurringTasks(mockDb);
  assert.strictEqual(count, 1, 'Chỉ 1 việc ngày hôm qua được reset');
  assert.strictEqual(updatedRecords.length, 1);
  assert.strictEqual(updatedRecords[0].args[2], 'task-daily-yesterday');
});

test('resetRecurringTasks tự reset việc Hàng tuần khi qua tuần mới', async () => {
  const updatedRecords: any[] = [];
  const mockDb: any = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async all() {
              if (sql.includes('SELECT')) {
                return {
                  results: [
                    {
                      id: 'task-weekly-last-week',
                      user_id: 'user-1',
                      title: 'Dọn phòng Thứ 4 hàng tuần',
                      priority: 'Medium',
                      // Hạn thứ 4 tuần trước: 2026-11-04 15:00 VN
                      due_date: '2026-11-04T08:00:00.000Z',
                      is_completed: 1,
                      repeat_mode: 'weekly',
                      updated_at: '2026-11-04T08:00:00.000Z'
                    }
                  ]
                };
              }
              return { results: [] };
            },
            async run() {
              if (sql.includes('UPDATE')) {
                updatedRecords.push({ sql, args });
              }
              return { success: true };
            }
          };
        }
      };
    }
  };

  const count = await resetRecurringTasks(mockDb);
  assert.strictEqual(count, 1, 'Việc tuần trước phải được reset');
  assert.strictEqual(updatedRecords.length, 1);
  assert.strictEqual(updatedRecords[0].args[2], 'task-weekly-last-week');
  // Hạn mới phải rơi vào Thứ 4 của tuần hiện tại
  const newDue = new Date(updatedRecords[0].args[0]);
  const newDueVn = getVnDateParts(newDue);
  assert.strictEqual(newDueVn.dayOfWeek, 3, 'Hạn mới vẫn giữ đúng Thứ 4');
  assert.strictEqual(newDueVn.hours, 15, 'Hạn mới vẫn giữ đúng 15:00');
});

console.log('🎉 Toàn bộ kiểm thử tính năng Tự Reset đã hoàn thành!');

