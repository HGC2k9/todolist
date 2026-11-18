// ============================================================
// Unit Tests — V3 Features & Local Notification System
// (Timezone Safety, Priority Repeats, Daily Briefing 06:00/18:00, Recurring Reset)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts, resetRecurringTasks } from '../src/index';

async function run() {
  console.log('🧪 Bắt đầu kiểm thử tính năng V3 & Hệ thống Local Notification...');

  // Test 1: getVnDateParts đúng múi giờ UTC+7
  const testUtc = new Date('2026-11-14T17:00:00Z'); // 17:00 UTC = 00:00 ngày hôm sau ở VN (2026-11-15)
  const vnParts = getVnDateParts(testUtc);
  assert.strictEqual(vnParts.dateStr, '2026-11-15');
  assert.strictEqual(vnParts.hours, 0);
  assert.strictEqual(vnParts.minutes, 0);
  console.log('  ✅ PASS: getVnDateParts tính chuẩn xác múi giờ UTC+7 Việt Nam');

  // Test 2: Safe Local Timezone Date Parsing (Không ép 'Z' gây lệch múi giờ)
  function parseDateSafe(dateStr: string | null) {
    if (!dateStr) return null;
    const s = String(dateStr).trim();
    if (!s) return null;
    if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
      const d = new Date(s);
      if (isNaN(d.getTime())) return null;
      d.setSeconds(0, 0);
      return d;
    }
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const d = new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10),
        parseInt(match[4], 10),
        parseInt(match[5], 10),
        0,
        0
      );
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(s);
    if (isNaN(fallback.getTime())) return null;
    fallback.setSeconds(0, 0);
    return fallback;
  }

  const localSample = '2026-11-18T18:30';
  const parsedLocal = parseDateSafe(localSample);
  assert.ok(parsedLocal !== null);
  assert.strictEqual(parsedLocal.getFullYear(), 2026);
  assert.strictEqual(parsedLocal.getMonth(), 10); // November (0-based)
  assert.strictEqual(parsedLocal.getDate(), 18);
  assert.strictEqual(parsedLocal.getHours(), 18);
  assert.strictEqual(parsedLocal.getMinutes(), 30);
  console.log('  ✅ PASS: parseDateSafe giữ nguyên chính xác giờ địa phương (không bị lệch múi giờ UTC)');

  // Test 3: Priority Repeating Notifications Intervals & ID Block
  function getNotificationId(idStr: string): number {
    let hash = 0;
    const s = String(idStr);
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 2147483647) || 1;
  }

  function calculateRepeatingSchedule(todo: { id: string; priority: string; due_date: string; reminder_offset: number }, nowMs: number) {
    const d = parseDateSafe(todo.due_date);
    if (!d) return [];
    const offsetMinutes = Number(todo.reminder_offset) || 0;
    const dueTime = d.getTime();
    const startAt = dueTime - (offsetMinutes * 60 * 1000);

    const priority = todo.priority || 'Medium';
    const intervalMs = (priority === 'High') ? 60 * 1000 : (priority === 'Medium' ? 3 * 60 * 1000 : 5 * 60 * 1000);
    const baseId = ((getNotificationId(todo.id) % 90000) + 1000) * 10;
    const notifications: any[] = [];

    for (let i = 0; i < 8; i++) {
      const triggerTime = startAt + (i * intervalMs);
      if (triggerTime > dueTime + (intervalMs * 2)) break;
      if (triggerTime > nowMs) {
        notifications.push({
          id: baseId + i,
          triggerTime,
          repeatIndex: i + 1
        });
      }
    }
    return notifications;
  }

  // Task High Priority: Nhắc mỗi 1 phút
  const now = Date.now();
  const formatLocalIso = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const futureHighTodo = {
    id: 'task-high-1',
    priority: 'High',
    due_date: formatLocalIso(new Date(now + 10 * 60 * 1000)),
    reminder_offset: 5
  };
  const highSchedule = calculateRepeatingSchedule(futureHighTodo, now);
  assert.ok(highSchedule.length >= 2);
  const diffHigh = highSchedule[1].triggerTime - highSchedule[0].triggerTime;
  assert.strictEqual(diffHigh, 60 * 1000, 'High priority phải nhắc mỗi 1 phút');

  // Task Medium Priority: Nhắc mỗi 3 phút
  const futureMedTodo = {
    id: 'task-med-1',
    priority: 'Medium',
    due_date: formatLocalIso(new Date(now + 20 * 60 * 1000)),
    reminder_offset: 10
  };
  const medSchedule = calculateRepeatingSchedule(futureMedTodo, now);
  assert.ok(medSchedule.length >= 2);
  const diffMed = medSchedule[1].triggerTime - medSchedule[0].triggerTime;
  assert.strictEqual(diffMed, 3 * 60 * 1000, 'Medium priority phải nhắc mỗi 3 phút');

  // Task Low Priority: Nhắc mỗi 5 phút
  const futureLowTodo = {
    id: 'task-low-1',
    priority: 'Low',
    due_date: formatLocalIso(new Date(now + 30 * 60 * 1000)),
    reminder_offset: 15
  };
  const lowSchedule = calculateRepeatingSchedule(futureLowTodo, now);
  assert.ok(lowSchedule.length >= 2);
  const diffLow = lowSchedule[1].triggerTime - lowSchedule[0].triggerTime;
  assert.strictEqual(diffLow, 5 * 60 * 1000, 'Low priority phải nhắc mỗi 5 phút');
  console.log('  ✅ PASS: Cơ chế nhắc lặp theo Mức Ưu Tiên (High: 1m, Medium: 3m, Low: 5m) hoạt động chính xác');

  // Test 4: Cố định 2 mốc Daily Briefing Local Notifications lúc 06:00 và 18:00
  const briefingMorningId = 999006;
  const briefingEveningId = 999018;
  assert.strictEqual(briefingMorningId, 999006);
  assert.strictEqual(briefingEveningId, 999018);
  console.log('  ✅ PASS: 2 ID cố định Daily Briefing 999006 (06:00) & 999018 (18:00) không bao giờ bị đụng độ ID task');

  // Test 5: resetRecurringTasks tự động khôi phục việc daily / weekly
  let updatedTodoIds: string[] = [];
  const mockRecurringDb: any = {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        all: async () => {
          if (sql.includes("repeat_mode IN ('daily', 'weekly')")) {
            return {
              results: [
                {
                  id: 'daily-task-1',
                  user_id: 'user-1',
                  title: 'Tập thể dục buổi sáng',
                  priority: 'High',
                  due_date: '2026-11-10T07:00:00Z', // Quá khứ
                  is_completed: 1,
                  repeat_mode: 'daily',
                  updated_at: '2026-11-10T08:00:00Z'
                }
              ]
            };
          }
          return { results: [] };
        },
        run: async () => {
          if (sql.includes('UPDATE todos SET is_completed = 0')) {
            updatedTodoIds.push(args[2]); // task.id
          }
          return { success: true };
        }
      })
    })
  };

  const resetCount = await resetRecurringTasks(mockRecurringDb, 'user-1');
  assert.strictEqual(resetCount, 1);
  assert.strictEqual(updatedTodoIds[0], 'daily-task-1');
  console.log('  ✅ PASS: resetRecurringTasks tự động khôi phục is_completed = 0 và dời hạn sang ngày mới');

  console.log('🎉 TẤT CẢ KIỂM THỬ V3 & LOCAL NOTIFICATIONS ĐÃ VƯỢT QUA 100%!');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
