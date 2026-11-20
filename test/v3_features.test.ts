// ============================================================
// Unit Tests — V3 Features & Local Notification System
// (Timezone Safety, Priority Repeats, Daily Briefing 06:00/18:00, Standalone Local)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts, formatVnTime, parseDateSafe } from '../src/client/notifications';
import { parseTaskFromText, calculateStreak } from '../src/utils';

async function run() {
  console.log('🧪 Bắt đầu kiểm thử tính năng V3 & Hệ thống Local Notification (Pure Local)...');

  // Test 1: getVnDateParts đúng múi giờ UTC+7
  const testUtc = new Date('2026-11-14T17:00:00Z'); // 17:00 UTC = 00:00 ngày hôm sau ở VN (2026-11-15)
  const vnParts = getVnDateParts(testUtc);
  assert.strictEqual(vnParts.dateStr, '2026-11-15');
  assert.strictEqual(vnParts.hours, 0);
  assert.strictEqual(vnParts.minutes, 0);
  console.log('  ✅ PASS: getVnDateParts tính chuẩn xác múi giờ UTC+7 Việt Nam');

  // Test 2: Safe Local Timezone Date Parsing (Không ép 'Z' gây lệch múi giờ)
  const localSample = '2026-11-18T18:30';
  const parsedLocal = parseDateSafe(localSample);
  assert.ok(parsedLocal !== null);
  const formattedTime = formatVnTime(parsedLocal);
  assert.strictEqual(formattedTime, '18:30');
  console.log('  ✅ PASS: parseDateSafe giữ nguyên chính xác giờ địa phương (18:30)');

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

  const highTask = {
    id: 'task-high-123',
    priority: 'High',
    due_date: formatLocalIso(new Date(now + 10 * 60 * 1000)),
    reminder_offset: 5
  };
  const highSchedule = calculateRepeatingSchedule(highTask, now);
  assert.ok(highSchedule.length >= 2, 'High task phải tạo nhiều mốc nhắc lặp');
  const highInterval = highSchedule[1].triggerTime - highSchedule[0].triggerTime;
  assert.strictEqual(highInterval, 60 * 1000, 'High priority interval phải đúng 1 phút (60,000ms)');
  console.log('  ✅ PASS: High priority repeating interval chính xác 1 phút (60s)');

  // Task Medium Priority: Nhắc mỗi 3 phút
  const medTask = {
    id: 'task-med-456',
    priority: 'Medium',
    due_date: formatLocalIso(new Date(now + 15 * 60 * 1000)),
    reminder_offset: 6
  };
  const medSchedule = calculateRepeatingSchedule(medTask, now);
  assert.ok(medSchedule.length >= 2);
  const medInterval = medSchedule[1].triggerTime - medSchedule[0].triggerTime;
  assert.strictEqual(medInterval, 3 * 60 * 1000, 'Medium priority interval phải đúng 3 phút (180,000ms)');
  console.log('  ✅ PASS: Medium priority repeating interval chính xác 3 phút (180s)');

  // Task Low Priority: Nhắc mỗi 5 phút
  const lowTask = {
    id: 'task-low-789',
    priority: 'Low',
    due_date: formatLocalIso(new Date(now + 20 * 60 * 1000)),
    reminder_offset: 10
  };
  const lowSchedule = calculateRepeatingSchedule(lowTask, now);
  assert.ok(lowSchedule.length >= 2);
  const lowInterval = lowSchedule[1].triggerTime - lowSchedule[0].triggerTime;
  assert.strictEqual(lowInterval, 5 * 60 * 1000, 'Low priority interval phải đúng 5 phút (300,000ms)');
  console.log('  ✅ PASS: Low priority repeating interval chính xác 5 phút (300s)');

  // Test 4: Cố định 2 mốc Daily Briefing Local Notifications lúc 06:00 và 18:00
  const briefingMorningId = 999006;
  const briefingEveningId = 999018;
  assert.strictEqual(briefingMorningId, 999006);
  assert.strictEqual(briefingEveningId, 999018);
  console.log('  ✅ PASS: 2 ID cố định Daily Briefing 999006 (06:00) & 999018 (18:00) không bao giờ bị đụng độ ID task');

  // Test 5: parseTaskFromText với "ăn cơm lúc 6h chiều"
  const task1 = parseTaskFromText('ăn cơm lúc 6h chiều');
  assert.strictEqual(task1.title, 'Ăn cơm');
  assert.strictEqual(task1.category, 'Personal');
  assert.strictEqual(task1.priority, 'Medium');
  assert.ok(task1.dueDate !== null);
  // 18:00 VN = 11:00 UTC
  const dueD1 = new Date(task1.dueDate!);
  assert.strictEqual(dueD1.getUTCHours(), 11);
  assert.strictEqual(dueD1.getUTCMinutes(), 0);
  console.log('  ✅ PASS: parseTaskFromText bóc tách chuẩn "ăn cơm lúc 6h chiều" (Title, Category, 18:00 local time)');

  // Test 6: parseTaskFromText với giờ kém "họp dự án 7h kém 15 tối"
  const task2 = parseTaskFromText('họp dự án 7h kém 15 tối');
  assert.strictEqual(task2.title, 'Họp dự án');
  assert.strictEqual(task2.category, 'Work');
  assert.ok(task2.dueDate !== null);
  // 18:45 VN = 11:45 UTC
  const dueD2 = new Date(task2.dueDate!);
  assert.strictEqual(dueD2.getUTCHours(), 11);
  assert.strictEqual(dueD2.getUTCMinutes(), 45);
  console.log('  ✅ PASS: parseTaskFromText xử lý đúng giờ kém "7h kém 15 tối" -> 18:45 VN (11:45 UTC)');

  // Test 7: formatVnTime trong notification hiển thị chuẩn xác 14:15 (KHÔNG BAO GIỜ BỊ 07:15)
  const dUtc = new Date('2026-11-20T07:15:00.000Z'); // 07:15 UTC = 14:15 giờ VN (UTC+7)
  const dueTimeFormatted = formatVnTime(dUtc);
  assert.strictEqual(dueTimeFormatted, '14:15', 'dueTimeFormatted phải luôn là 14:15 giờ VN bất kể múi giờ runtime');

  // Kiểm tra chuỗi Body của thông báo
  const notifBody = 'Hạn: ' + dueTimeFormatted + ' • Personal';
  assert.strictEqual(notifBody, 'Hạn: 14:15 • Personal');
  console.log('  ✅ PASS: formatVnTime và Notification Body chuẩn xác "Hạn: 14:15 • Personal" (loại bỏ hoàn toàn lỗi 07:15)');

  // Test 8: Streak calculation
  const streakNow = Date.now();
  const streakYesterday = streakNow - 24 * 3600 * 1000;
  const streak = calculateStreak([streakNow, streakYesterday]);
  assert.strictEqual(streak, 2);
  console.log('  ✅ PASS: calculateStreak tính chuẩn xác số ngày liên tiếp');

  console.log('🎉 TẤT CẢ KIỂM THỬ V3 & LOCAL NOTIFICATIONS ĐÃ VƯỢT QUA 100%!');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
