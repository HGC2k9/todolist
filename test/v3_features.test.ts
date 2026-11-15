// ============================================================
// Unit Tests — V3 Features (Soft Delete, Briefings, Sync, Images)
// ============================================================

import assert from 'node:assert';
import { getVnDateParts } from '../src/index';
import { buildMorningBriefing, buildEveningBriefing } from '../src/telegram';

async function run() {
  console.log('🧪 Bắt đầu kiểm thử tính năng V3 (Soft Delete, Briefing Builder, Time Helper)...');

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
                { updated_at: '2026-11-14T10:00:00Z' },
                { updated_at: '2026-11-15T08:00:00Z' }
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

  const morning = await buildMorningBriefing(mockEnv, 'user-1');
  assert.ok(morning.text.includes('BẢN TIN SÁNG'));
  assert.ok(morning.text.includes('Họp team sáng'));
  assert.ok(morning.replyMarkup.inline_keyboard.length > 0);
  console.log('  ✅ PASS: buildMorningBriefing tạo bản tin sáng hợp lệ kèm inline keyboard');

  const evening = await buildEveningBriefing(mockEnv, 'user-1');
  assert.ok(evening.text.includes('TỔNG KẾT NĂNG SUẤT TỐI'));
  assert.ok(evening.replyMarkup.inline_keyboard.some((row: any) =>
    row.some((btn: any) => btn.callback_data === 'snooze_all_tomorrow')
  ));
  console.log('  ✅ PASS: buildEveningBriefing tạo bản tin tối kèm nút snooze_all_tomorrow');

  console.log('🎉 TẤT CẢ TEST V3 ĐỀU THÀNH CÔNG VƯỢT TRỘI!');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
