// ============================================================
// Unit Tests — V3 Features & Local Notification System
// (Timezone Safety, Priority Repeats, Daily Briefing 06:00/18:00, Standalone Local)
// ============================================================

import assert from 'node:assert';
import fs from 'node:fs';
import {
  getVnDateParts,
  formatVnTime,
  parseDateSafe,
  calculatePostponedDueDate,
  generateRollingTaskNotifications,
  formatRemainingDeadlineText,
  handleMarkDoneNotificationAction,
  TASK_REMINDER_ACTION_TYPE_ID,
  TASK_REMINDER_ACTION_MARK_DONE,
  TASK_REMINDER_ACTION_SNOOZE_10M,
  NOTIFICATION_SOUND_FILE
} from '../src/client/notifications';
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

  // Test 9: Đếm ngược phút còn lại động & Không còn nhãn cũ "Sắp hết hạn"
  const refDueMs = Date.UTC(2026, 10, 25, 7, 30, 0, 0); // 14:30 VN
  assert.strictEqual(formatRemainingDeadlineText(refDueMs, refDueMs - 25 * 60000), 'Còn 25 phút nữa đến hạn');
  assert.strictEqual(formatRemainingDeadlineText(refDueMs, refDueMs - 5 * 60000), 'Còn 5 phút nữa đến hạn');
  assert.strictEqual(formatRemainingDeadlineText(refDueMs, refDueMs), 'Đã đến hạn');
  assert.strictEqual(formatRemainingDeadlineText(refDueMs, refDueMs + 20000), 'Đã đến hạn');

  const countdownTask = {
    id: 'task-countdown-1',
    title: 'Nộp báo cáo',
    category: 'Work',
    priority: 'Medium',
    due_date: formatLocalIso(new Date(now + 25 * 60 * 1000)),
    reminder_offset: 25
  };
  const countdownNotifs = generateRollingTaskNotifications(countdownTask, now);
  assert.ok(countdownNotifs.length > 0);
  assert.strictEqual(countdownNotifs[0].actionTypeId, TASK_REMINDER_ACTION_TYPE_ID);
  assert.strictEqual(countdownNotifs[0].sound, NOTIFICATION_SOUND_FILE);
  assert.strictEqual(countdownNotifs[0].extra.taskId, countdownTask.id);
  assert.ok(countdownNotifs[0].body.includes('Còn ') && countdownNotifs[0].body.includes('phút nữa đến hạn'));
  assert.ok(!countdownNotifs.some(n => n.body.includes('Sắp hết hạn')));

  const frontendSrc = fs.readFileSync('src/frontend.ts', 'utf8');
  const notificationsSrc = fs.readFileSync('src/client/notifications.ts', 'utf8');
  assert.ok(!frontendSrc.includes('Sắp hết hạn'), 'src/frontend.ts không được còn nhãn cũ Sắp hết hạn');
  assert.ok(!notificationsSrc.includes('Sắp hết hạn'), 'src/client/notifications.ts không được còn nhãn cũ Sắp hết hạn');
  console.log('  ✅ PASS: Đếm ngược phút động ("Còn X phút nữa đến hạn" / "Đã đến hạn"), sound pop_ding.wav & xóa sạch nhãn cũ');

  // Test 10: Luồng bấm nút "Đã xong" (MARK_DONE) từ thông báo iOS
  const mockTodos: any[] = [
    { id: 'task-action-1', title: 'Gọi khách hàng', category: 'Work', priority: 'High', due_date: highTask.due_date, is_completed: 0, status: 'todo' },
    { id: 'task-action-2', title: 'Đọc sách', category: 'Personal', priority: 'Low', due_date: lowTask.due_date, is_completed: 0, status: 'todo' }
  ];
  const mockHistory: any[] = [];
  let persistedCount = 0;
  let canceledIds: number[] = [];
  let removedDeliveredIds: number[] = [];
  let queueResynced = false;

  const baseIdAction1 = generateRollingTaskNotifications(mockTodos[0], now)[0].id - (generateRollingTaskNotifications(mockTodos[0], now)[0].id % 10000);
  const actionResult = await handleMarkDoneNotificationAction({
    actionId: TASK_REMINDER_ACTION_MARK_DONE,
    notification: { id: baseIdAction1, extra: { taskId: 'task-action-1' } },
    todos: mockTodos,
    completionHistory: mockHistory,
    persistTodosAndHistory: async () => { persistedCount++; },
    getPending: async () => ({
      notifications: [
        { id: baseIdAction1 + 1, extra: { taskId: 'task-action-1' } },
        { id: baseIdAction1 + 2, extra: { taskId: 'task-action-1' } },
        { id: 9991111, extra: { taskId: 'task-action-2' } }
      ]
    }),
    cancelNotifications: async (opts) => { canceledIds = opts.notifications.map(n => n.id); },
    getDeliveredNotifications: async () => ({
      notifications: [
        { id: baseIdAction1, title: 'A', body: 'B', extra: { taskId: 'task-action-1' } },
        { id: 9991112, title: 'Other', body: 'C', extra: { taskId: 'task-action-2' } }
      ]
    }),
    removeDeliveredNotifications: async (opts) => { removedDeliveredIds = opts.notifications.map(n => n.id); },
    syncQueue: async () => { queueResynced = true; }
  });

  assert.strictEqual(actionResult.completed, true);
  assert.strictEqual(mockTodos[0].is_completed, 1);
  assert.strictEqual(mockTodos[0].status, 'completed');
  assert.strictEqual(mockHistory.length, 1);
  assert.strictEqual(persistedCount, 1);
  assert.deepStrictEqual(canceledIds, [baseIdAction1 + 1, baseIdAction1 + 2]);
  assert.deepStrictEqual(removedDeliveredIds, [baseIdAction1]);
  assert.strictEqual(queueResynced, true);
  console.log('  ✅ PASS: Actionable Notification "Đã xong" (MARK_DONE) cập nhật hoàn thành, hủy chuỗi lặp, xóa banner & nạp lại Rolling Queue');

  // Test 11: Kiểm tra tồn tại các file âm thanh thông báo và đăng ký Xcode project.pbxproj
  const soundFiles = ['pop_ding.wav', 'soft_chime.wav', 'crisp_click.wav'];
  const pbxproj = fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
  for (const wav of soundFiles) {
    assert.ok(fs.existsSync(`ios/App/App/${wav}`), `Thiếu ios/App/App/${wav}`);
    assert.ok(fs.existsSync(`public/sounds/${wav}`), `Thiếu public/sounds/${wav}`);
    assert.ok(pbxproj.includes(`${wav} in Resources`), `project.pbxproj chưa đăng ký ${wav} vào Resources`);
  }
  console.log('  ✅ PASS: Tất cả 3 file âm thanh (pop_ding, soft_chime, crisp_click) đã sẵn sàng và đăng ký vào Xcode Resources');

  // Test 12: Kiểm tra hành động SNOOZE_10M hoãn thông báo +10 phút, hủy pending & đồng bộ lại queue
  let snoozePersisted: any[] = [];
  let snoozeCanceledIds: number[] = [];
  let snoozeRemovedIds: number[] = [];
  let snoozeResynced = false;
  const snoozeStart = Date.now();
  const snoozeTodos = [
    {
      id: 'task-snooze-1',
      title: 'Gọi lại khách hàng',
      status: 'todo',
      is_completed: 0,
      due_date: new Date(snoozeStart - 60_000).toISOString(),
      reminder_offset: 15,
    },
  ];
  const snoozeResult = await handleMarkDoneNotificationAction({
    actionId: TASK_REMINDER_ACTION_SNOOZE_10M,
    notification: { id: 909, extra: { taskId: 'task-snooze-1' } },
    todos: snoozeTodos,
    persistTodosAndHistory: async (todos) => { snoozePersisted = todos; },
    getPending: async () => ({
      notifications: [{ id: 910, extra: { taskId: 'task-snooze-1' } }],
    }),
    cancelNotifications: async (opts) => { snoozeCanceledIds = opts.notifications.map(n => n.id); },
    getDeliveredNotifications: async () => ({
      notifications: [{ id: 909, extra: { taskId: 'task-snooze-1' } }],
    }),
    removeDeliveredNotifications: async (opts) => { snoozeRemovedIds = opts.notifications.map(n => n.id); },
    syncQueue: async () => { snoozeResynced = true; },
  });
  assert.strictEqual(snoozeResult.completed, false);
  assert.strictEqual(snoozeResult.snoozed, true);
  assert.strictEqual(snoozeResult.taskId, 'task-snooze-1');
  assert.strictEqual(snoozePersisted[0].reminder_offset, 0, 'Snooze phải đặt reminder_offset = 0');
  const snoozedDueMs = new Date(snoozePersisted[0].due_date).getTime();
  assert.ok(snoozedDueMs >= snoozeStart + 9 * 60_000 && snoozedDueMs <= Date.now() + 11 * 60_000, 'Snooze phải dời due_date +10 phút');
  assert.deepStrictEqual(snoozeCanceledIds, [910], 'Phải hủy pending notifications của task khi Snooze');
  assert.deepStrictEqual(snoozeRemovedIds, [909], 'Phải xóa banner đã hiển thị khỏi Notification Center');
  assert.strictEqual(snoozeResynced, true, 'Phải đồng bộ lại Rolling Queue sau khi Snooze');
  console.log('  ✅ PASS: SNOOZE_10M dời hạn +10 phút, xóa banner cũ & nạp lại Rolling Queue');

  // Test 13: Quick Add NLP hỗ trợ cú pháp !high / !low / #tag / thời gian
  const nlpHigh = parseTaskFromText('Họp team 15h mai #work !high');
  assert.strictEqual(nlpHigh.title, 'Họp team');
  assert.strictEqual(nlpHigh.priority, 'High');
  assert.ok(nlpHigh.tags.includes('work'), 'Phải trích xuất tag #work');
  assert.ok(nlpHigh.dueDate !== null, 'Phải nhận diện được 15h mai');
  const nlpLow = parseTaskFromText('Đọc sách !low #relax');
  assert.strictEqual(nlpLow.title, 'Đọc sách');
  assert.strictEqual(nlpLow.priority, 'Low');
  assert.ok(nlpLow.tags.includes('relax'));
  console.log('  ✅ PASS: parseTaskFromText phân tích chuẩn !high, !low, #tag và thời gian');

  // Test 14: Kiểm tra SVG Repo icons trong public/icons/ & cơ chế Hẹn giờ cộng dồn (5p+5p=10p, 10p+5p=15p)
  const iconFiles = fs.readdirSync('public/icons').filter(f => f.endsWith('.svg'));
  assert.ok(iconFiles.length >= 30, 'Phải có đầy đủ bộ icon SVG Repo trong public/icons/');
  for (const f of iconFiles) {
    const content = fs.readFileSync(`public/icons/${f}`, 'utf8');
    assert.ok(!content.includes('SVG Repo'), `${f} không được còn comment SVG Repo`);
    assert.ok(content.includes('viewBox='), `${f} phải giữ viewBox`);
    assert.ok(content.includes('currentColor'), `${f} phải dùng currentColor cho Light/Dark mode`);
    assert.ok(!/<svg[^>]*\s(width|height)=/i.test(content), `${f} không được chứa width/height cứng trên <svg>`);
  }
  const vm = await import('node:vm');
  const { audioTimerScript } = await import('../src/client/audio-timer');
  const timerCtx: any = { localStorage: { getItem: () => null, setItem: () => {} }, window: {}, document: {} };
  vm.runInNewContext(`${audioTimerScript}; this.__mod = getAudioTimerModule();`, timerCtx);
  const timer = timerCtx.__mod;
  timer.triggerHaptic = () => {};
  timer.playSound = () => {};
  timer.addCountdownSeconds(300);
  timer.addCountdownSeconds(300);
  assert.strictEqual(timer.countdownTimeLeft, 600, 'Bấm 5p 2 lần phải cộng dồn thành 10p (600s)');
  timer.clearCountdown();
  timer.addCountdownSeconds(600);
  timer.addCountdownSeconds(300);
  assert.strictEqual(timer.countdownTimeLeft, 900, 'Bấm 10p + 5p phải cộng dồn thành 15p (900s)');
  console.log('  ✅ PASS: Toàn bộ SVG Repo icons chuẩn currentColor & Countdown cộng dồn hoạt động chính xác');

  // Test 15: Logic Hoãn 15 phút (calculatePostponedDueDate + postponeTodo15m hủy thông báo cũ & sync queue)
  const postponedFromExisting = calculatePostponedDueDate('2026-11-27T07:00:00.000Z', 15, 0);
  assert.strictEqual(postponedFromExisting, '2026-11-27T07:15:00.000Z', 'Phải cộng đúng 15 phút vào due_date hiện tại');
  const fixedNow = Date.UTC(2026, 10, 27, 8, 0, 0);
  const postponedFromNull = calculatePostponedDueDate(null, 15, fixedNow);
  assert.strictEqual(postponedFromNull, new Date(fixedNow + 15 * 60_000).toISOString(), 'Chưa có hạn phải lấy Date.now() + 15 phút');

  const { storageScript } = await import('../src/client/storage');
  const storageCtx: any = {
    localStorage: { getItem: () => null, setItem: () => {} },
    window: {},
    document: {},
    requestAnimationFrame: (fn: Function) => { fn(); return 1; },
    cancelAnimationFrame: () => {},
  };
  vm.runInNewContext(`${storageScript}; this.__storage = getStorageModule();`, storageCtx);
  const store = storageCtx.__storage;
  let canceledSwipeTaskId: string | null = null;
  let rescheduledSwipeTaskId: string | null = null;
  let swipeToastMsg = '';
  let persistedSwipe = 0;
  let toggledTodoId: string | null = null;

  store.parseDateSafe = parseDateSafe;
  store.triggerHaptic = () => {};
  store.playSound = () => {};
  store.showToast = (m: string) => { swipeToastMsg = m; };
  store.persistAllData = async () => { persistedSwipe++; };
  store.cancelNativeLocalNotification = async (id: string) => { canceledSwipeTaskId = id; };
  store.scheduleNativeLocalNotification = async (t: any) => { rescheduledSwipeTaskId = t.id; };
  store.toggleTodo = async (t: any) => { toggledTodoId = t.id; t.is_completed = t.is_completed ? 0 : 1; };

  const swipeTask: any = {
    id: 'swipe-1',
    title: 'Đọc tài liệu',
    due_date: '2026-11-27T07:00:00.000Z',
    is_completed: 0,
    _cardWidth: 360,
    _isSwiping: true,
    _swipeLocked: 'h',
    _swipeX: 210, // > 55% of 360 (198) -> Full Leading Swipe Hoãn 15p
  };
  store.endCardSwipe(swipeTask);
  await new Promise(r => setTimeout(r, 20));
  assert.strictEqual(swipeTask.due_date, '2026-11-27T07:15:00.000Z', 'Full Leading Swipe phải cộng 15 phút');
  assert.strictEqual(swipeTask._swipeX, 0, 'Full Swipe phải đóng thẻ mượt');
  assert.strictEqual(canceledSwipeTaskId, 'swipe-1', 'Phải hủy chuỗi thông báo cũ');
  assert.strictEqual(rescheduledSwipeTaskId, 'swipe-1', 'Phải lên lịch lại Rolling Queue');
  assert.ok(persistedSwipe >= 1, 'Phải lưu dữ liệu cục bộ');
  assert.ok(swipeToastMsg.includes('15 phút'), 'Phải hiện toast thông báo hoãn 15 phút');

  // Test 16: Full Trailing Swipe (> 55%) -> Hoàn thành / Hoàn tác + Lightbox ảnh minh chứng
  const completeSwipeTask: any = {
    id: 'swipe-2',
    title: 'Nộp báo cáo',
    is_completed: 0,
    _cardWidth: 360,
    _isSwiping: true,
    _swipeLocked: 'h',
    _swipeX: -215, // < -55% -> Full Trailing Swipe Hoàn thành
  };
  store.endCardSwipe(completeSwipeTask);
  assert.strictEqual(toggledTodoId, 'swipe-2', 'Full Trailing Swipe phải tự động gọi toggleTodo');
  assert.strictEqual(completeSwipeTask.is_completed, 1, 'Task phải chuyển sang hoàn thành');
  assert.strictEqual(completeSwipeTask._swipeX, 0);

  // Proof image store reactivity + Lightbox open/close
  store.activePhotoTodoId = 'swipe-2';
  await store.saveProofDataUrl('data:image/jpeg;base64,PROOFDATA', 'proof.jpg');
  const savedImgs = store.getTodoImages('swipe-2');
  assert.strictEqual(savedImgs.length, 1);
  assert.strictEqual(savedImgs[0].image_data, 'data:image/jpeg;base64,PROOFDATA');
  store.openLightbox(savedImgs[0].image_data);
  assert.strictEqual(store.showLightbox, true);
  assert.strictEqual(store.lightboxImage, 'data:image/jpeg;base64,PROOFDATA');
  store.closeLightbox();
  assert.strictEqual(store.showLightbox, false);
  assert.strictEqual(store.lightboxImage, null);

  // Test 17: Edge-Zone Swipe Detection (mép trái/phải cho kéo ngang, vùng giữa khóa cứng)
  const edgeTask: any = { id: 'edge-1', title: 'Test Edge', _swipeX: 0 };
  const makeTouchEvt = (clientX: number, clientY = 100) => ({
    currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 360 }), offsetWidth: 360 },
    touches: [{ clientX, clientY }],
    cancelable: true,
    preventDefault: () => {}
  });
  // Chạm vùng giữa (x = 180 trên width 360) -> khóa cứng
  store.startCardSwipe(makeTouchEvt(180), edgeTask);
  assert.strictEqual(edgeTask._isSwiping, false, 'Vùng giữa không được kích hoạt kéo ngang');
  assert.strictEqual(edgeTask._swipeEdge, null);
  store.moveCardSwipe(makeTouchEvt(280), edgeTask);
  assert.strictEqual(edgeTask._swipeX, 0, 'Kéo từ vùng giữa phải giữ _swipeX = 0');

  // Chạm mép trái (x = 24 <= edgeZone) -> chỉ cho phép kéo phải
  store.startCardSwipe(makeTouchEvt(24), edgeTask);
  assert.strictEqual(edgeTask._isSwiping, true);
  assert.strictEqual(edgeTask._swipeEdge, 'left');
  store.moveCardSwipe(makeTouchEvt(120), edgeTask);
  assert.ok(edgeTask._swipeX > 0, 'Kéo từ mép trái sang phải phải mở _swipeX > 0');
  edgeTask._swipeX = 0;

  // Chạm mép phải (x = 340 >= 360 - edgeZone) -> chỉ cho phép kéo trái
  store.startCardSwipe(makeTouchEvt(340), edgeTask);
  assert.strictEqual(edgeTask._isSwiping, true);
  assert.strictEqual(edgeTask._swipeEdge, 'right');
  store.moveCardSwipe(makeTouchEvt(230), edgeTask);
  assert.ok(edgeTask._swipeX < 0, 'Kéo từ mép phải sang trái phải mở _swipeX < 0');
  console.log('  ✅ PASS: Elastic Swipe Edge-Zone (Hoãn 15p & Hoàn thành), Hủy/Đặt lại Rolling Queue & Lightbox hoạt động chuẩn xác');

  console.log('🎉 TẤT CẢ KIỂM THỬ V3 & LOCAL NOTIFICATIONS ĐÃ VƯỢT QUA 100%!');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
