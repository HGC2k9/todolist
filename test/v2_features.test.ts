// ============================================================
// Unit & Integration Tests — V2 Roadmap Features
// ============================================================

import assert from 'node:assert';
import { generateIcs, exportTodosJson, validateAndParseImportJson, escapeIcs, formatIcsDate } from '../src/export';
import { calculateStreak, parseTaskFromText } from '../src/telegram';
import type { Todo } from '../src/types';

async function run() {
  console.log('🧪 Bắt đầu kiểm thử tính năng V2 (Export, Streak, Checklist & NLP)...');

  // Test 1: escapeIcs & formatIcsDate
  assert.strictEqual(escapeIcs('Họp; dự án, quan trọng\nChi tiết'), 'Họp\\; dự án\\, quan trọng\\nChi tiết');
  const d = new Date('2026-11-14T10:30:00Z');
  assert.strictEqual(formatIcsDate(d), '20261114T103000Z');
  console.log('  ✅ PASS: escapeIcs và formatIcsDate định dạng chuẩn RFC 5545');

  // Test 2: generateIcs
  const mockTodos: Todo[] = [
    {
      id: 'task-101',
      user_id: 'user-1',
      title: 'Báo cáo tài chính',
      description: 'Gửi cho ban giám đốc',
      category: 'Work',
      priority: 'High',
      due_date: '2026-11-15T09:00:00Z',
      is_completed: 0,
      reminder_offset: 15,
      created_at: '2026-11-14T00:00:00Z',
      updated_at: '2026-11-14T00:00:00Z',
    },
    {
      id: 'task-102',
      user_id: 'user-1',
      title: 'Đi mua sắm',
      description: '',
      category: 'Personal',
      priority: 'Low',
      due_date: null, // Không có hạn -> không xuất event
      is_completed: 1,
      created_at: '2026-11-14T00:00:00Z',
      updated_at: '2026-11-14T00:00:00Z',
    }
  ];

  const ics = generateIcs(mockTodos);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:Báo cáo tài chính'));
  assert.ok(ics.includes('TRIGGER:-PT15M'));
  assert.ok(ics.includes('END:VCALENDAR'));
  assert.ok(!ics.includes('SUMMARY:Đi mua sắm')); // không có due_date nên được bỏ qua
  console.log('  ✅ PASS: generateIcs tạo chuỗi iCalendar .ics hợp lệ');

  // Test 3: Export & Import JSON
  const jsonExport = exportTodosJson(mockTodos);
  assert.ok(jsonExport.includes('"total_count": 2'));
  const imported = validateAndParseImportJson(jsonExport);
  assert.strictEqual(imported.length, 2);
  assert.strictEqual(imported[0].title, 'Báo cáo tài chính');
  assert.strictEqual(imported[0].priority, 'High');
  console.log('  ✅ PASS: exportTodosJson và validateAndParseImportJson hoạt động chính xác');

  // Test 4: calculateStreak
  const now = Date.now();
  const ONE_DAY = 24 * 3600 * 1000;
  // Hoàn thành hôm nay và hôm qua -> 2 ngày streak
  const streak2 = calculateStreak([now, now - ONE_DAY]);
  assert.strictEqual(streak2, 2);

  // Hoàn thành hôm nay, hôm qua, hôm kia -> 3 ngày streak
  const streak3 = calculateStreak([now, now - ONE_DAY, now - 2 * ONE_DAY]);
  assert.strictEqual(streak3, 3);

  // Không có việc nào gần đây -> 0 ngày streak
  const streak0 = calculateStreak([now - 10 * ONE_DAY]);
  assert.strictEqual(streak0, 0);
  console.log('  ✅ PASS: calculateStreak tính đúng số ngày liên tục');

  // Test 5: parseTaskFromText
  const parsed1 = parseTaskFromText('Họp chiến lược 15h mai #gap #congty');
  assert.strictEqual(parsed1.priority, 'High');
  assert.deepStrictEqual(parsed1.tags, ['gap', 'congty']);
  assert.ok(parsed1.dueDate !== null);

  const parsed2 = parseTaskFromText('/add Đi dạo công viên thong thả');
  assert.strictEqual(parsed2.title, 'Đi dạo công viên thong thả');
  assert.strictEqual(parsed2.priority, 'Low');
  assert.strictEqual(parsed2.dueDate, null);
  console.log('  ✅ PASS: parseTaskFromText bóc tách tiếng Việt, #tags, giờ, mức độ ưu tiên');

  console.log('🎉 Toàn bộ kiểm thử tính năng V2 đã hoàn thành xuất sắc!');
}

run().catch((err) => {
  console.error('❌ Lỗi kiểm thử:', err);
  process.exit(1);
});
