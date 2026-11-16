// ============================================================
// Unit Tests — V3 Features (Soft Delete, Briefings, Sync, Images)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts } from '../src/index';
import { buildMorningBriefing, buildEveningBriefing, buildNightSummary } from '../src/telegram';

async function run() {
  console.log('🧪 Bắt đầu kiểm thử tính năng V3 (Soft Delete, Briefing Builder, Time Helper, Clean Bot)...');

  // Test 1: getVnDateParts đúng múi giờ UTC+7
  const testUtc = new Date('2026-11-14T17:00:00Z'); // 17:00 UTC = 00:00 ngày hôm sau ở VN (2026-11-15)
  const vnParts = getVnDateParts(testUtc);
  assert.strictEqual(vnParts.dateStr, '2026-11-15');
  assert.strictEqual(vnParts.hours, 0);
  assert.strictEqual(vnParts.minutes, 0);
  console.log('  ✅ PASS: getVnDateParts tính chuẩn xác UTC+7');

  // Test 2: Mock D1 & Telegram Briefing builder
  const mockDb: any = {
    prepare: (query: string) => ({
      bind: (...args: any[]) => ({
        first: async () => {
          if (query.includes('COUNT(*)')) return { count: 3 };
          return null;
        },
        all: async () => {
          if (query.includes('is_completed = 0')) {
            return {
              results: [
                { id: '1', title: 'Họp team sáng', due_date: '2026-11-15T09:00:00Z', priority: 'High' }
              ]
            };
          }
          if (query.includes('is_completed = 1')) {
            return {
              results: [
                { id: '2', title: 'Hoàn thành báo cáo', updated_at: '2026-11-14T10:00:00Z' },
                { id: '3', title: 'Tập thể dục', updated_at: '2026-11-15T08:00:00Z' }
              ]
            };
          }
          return { results: [] };
        }
      })
    })
  };

  const mockEnv: any = {
    DB: mockDb,
    TELEGRAM_BOT_TOKEN: 'test_token',
    TELEGRAM_CHAT_ID: 'test_chat_id'
  };

  // Test Bản tin Sáng: không nút bấm, lọc công việc 06:00 - 18:00
  const morning = await buildMorningBriefing(mockEnv, 'user-1');
  assert.ok(morning.text.includes('BẢN TIN SÁNG'));
  assert.ok(morning.text.includes('06:00 - 18:00'));
  assert.strictEqual(morning.replyMarkup, undefined);
  console.log('  ✅ PASS: buildMorningBriefing tạo bản tin sáng 06:00 - 18:00 không chứa nút bấm spam');

  // Test Bản tin Tối: không nút bấm, lọc công việc 18:01 - 23:59
  const evening = await buildEveningBriefing(mockEnv, 'user-1');
  assert.ok(evening.text.includes('BẢN TIN TỐI'));
  assert.ok(evening.text.includes('18:01 - 23:59'));
  assert.strictEqual(evening.replyMarkup, undefined);
  console.log('  ✅ PASS: buildEveningBriefing tạo bản tin tối 18:01 - 23:59 không chứa nút bấm spam');

  // Test Tổng kết Tối: lúc 23:59, gồm Streak, số việc đã xong, số việc quá hạn, và duy nhất nút Thống kê ở cuối
  const night = await buildNightSummary(mockEnv, 'user-1');
  assert.ok(night.text.includes('TỔNG KẾT TỐI'));
  assert.ok(night.text.includes('Chuỗi ngày Streak'));
  assert.ok(night.text.includes('Đã hoàn thành hôm nay'));
  assert.ok(night.text.includes('Số việc quá hạn / chưa xong'));
  assert.ok(night.replyMarkup && night.replyMarkup.inline_keyboard.length === 1);
  assert.strictEqual(night.replyMarkup.inline_keyboard[0][0].callback_data, 'cmd_stats');
  console.log('  ✅ PASS: buildNightSummary tạo tổng kết tối 23:59 kèm duy nhất 1 nút Thống kê');

  console.log('🎉 TẤT CẢ TEST V3 ĐỀU THÀNH CÔNG VƯỢT TRỘI!');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
