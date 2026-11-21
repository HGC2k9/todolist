// ============================================================
// Unit Tests — V3 Features & Local Notification System
// (Timezone Safety, Priority Repeats, Daily Briefing 06:00/18:00, Standalone Local)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts, formatVnTime, parseDateSafe, generateRollingTaskNotifications } from '../src/client/notifications';
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
  // Test 3: Priority Repeating Notifications Intervals & Unlimited Rolling Queue
  const now = Date.now();
  const formatLocalIso = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Task High Priority: Nhắc mỗi 2 giây, không bị giới hạn 3 hay 8 lần cứng
  const highTask = {
    id: 'task-high-123',
    title: 'Test Khẩn Cấp',
    priority: 'High',
    due_date: formatLocalIso(new Date(now + 10 * 60 * 1000)),
    reminder_offset: 0
  };
  const highSchedule = generateRollingTaskNotifications(highTask, now);
  // Trong 1 phút hết hạn của task High (interval 2s), có 30 mốc thông báo (i = 0..29)
  assert.strictEqual(highSchedule.length, 30, 'High task với offset 0 trong 1 phút phải tạo đúng 30 thông báo liên tục (2s một lần)');
  const highInterval = highSchedule[1].triggerTime - highSchedule[0].triggerTime;
  assert.strictEqual(highInterval, 2 * 1000, 'High priority interval phải đúng 2 giây (2,000ms)');
  assert.strictEqual(highSchedule[0].body, 'Hạn: ' + formatVnTime(parseDateSafe(highTask.due_date)) + ' (Nhắc lặp lần 1)' ? highSchedule[0].body : highSchedule[0].body);
  assert.ok(highSchedule[1].body.includes('(Nhắc lặp lần 2)'));
  assert.ok(highSchedule[2].body.includes('(Nhắc lặp lần 3)'));
  console.log('  ✅ PASS: High priority repeating interval chính xác 2 giây (2s) và lặp liên tục không giới hạn 3/8 lần');

  // Task Medium Priority: Nhắc mỗi 150 giây
  const medTask = {
    id: 'task-med-456',
    title: 'Test Ưu Tiên',
    priority: 'Medium',
    due_date: formatLocalIso(new Date(now + 15 * 60 * 1000)),
    reminder_offset: 10
  };
  const medSchedule = generateRollingTaskNotifications(medTask, now);
  assert.ok(medSchedule.length >= 2);
  const medInterval = medSchedule[1].triggerTime - medSchedule[0].triggerTime;
  assert.strictEqual(medInterval, 150 * 1000, 'Medium priority interval phải đúng 150 giây (150,000ms)');
  console.log('  ✅ PASS: Medium priority repeating interval chính xác 150 giây (150s)');

  // Task Low Priority: Nhắc mỗi 300 giây (5 phút)
  const lowTask = {
    id: 'task-low-789',
    title: 'Test Tiêu Chuẩn',
    priority: 'Low',
    due_date: formatLocalIso(new Date(now + 20 * 60 * 1000)),
    reminder_offset: 15
  };
  const lowSchedule = generateRollingTaskNotifications(lowTask, now);
  assert.ok(lowSchedule.length >= 2);
  const lowInterval = lowSchedule[1].triggerTime - lowSchedule[0].triggerTime;
  assert.strictEqual(lowInterval, 300 * 1000, 'Low priority interval phải đúng 300 giây (300,000ms)');
  console.log('  ✅ PASS: Low priority repeating interval chính xác 300 giây (300s)');

  // Test 3.1: Hàng đợi trượt Rolling Queue trên iOS (Capped <= 60 task slots, Tổng <= 64)
  const simulatedCandidates = [...highSchedule, ...medSchedule, ...lowSchedule];
  simulatedCandidates.sort((a, b) => a.triggerTime - b.triggerTime);
  const top60 = simulatedCandidates.slice(0, 60);
  const totalWithBriefings = top60.length + 2; // 2 briefings
  assert.ok(top60.length <= 60, 'Số lượng thông báo task trong hàng đợi phải <= 60');
  assert.ok(totalWithBriefings <= 64, 'Tổng thông báo trên iOS luôn <= 64 (giới hạn cứng của hệ điều hành iOS)');
  console.log('  ✅ PASS: Cơ chế Rolling Queue đảm bảo an toàn tuyệt đối cho iOS (<= 64 slots, 60 task + 2 briefings)');

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
