// ============================================================
// Telegram Bot API Integration — To-Do List Reminders & Webhook
// ============================================================

import type { Env, Todo } from './types';

/**
 * Thoát các ký tự đặc biệt theo chuẩn HTML của Telegram
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Định dạng thời gian theo múi giờ Việt Nam (UTC+7)
 */
export function formatVnDateTime(dateInput: string | Date | number): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const vnTime = new Date(d.getTime() + 7 * 3600 * 1000);
    const hours = String(vnTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vnTime.getUTCMinutes()).padStart(2, '0');
    const day = String(vnTime.getUTCDate()).padStart(2, '0');
    const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
    const year = vnTime.getUTCFullYear();
    return `${hours}:${minutes} (${day}/${month}/${year})`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Gửi tin nhắn HTML tùy chỉnh tới Telegram Chat ID thông qua Bot API
 */
export async function sendTelegramMessage(
  botToken?: string,
  chatId?: string,
  htmlText: string = '',
  replyMarkup?: any
): Promise<{ success: boolean; messageId?: number; error?: string; status?: number }> {
  try {
    if (!botToken || !botToken.trim()) {
      return { success: false, error: 'Chưa cấu hình TELEGRAM_BOT_TOKEN' };
    }
    if (!chatId || !chatId.trim()) {
      return { success: false, error: 'Chưa cấu hình TELEGRAM_CHAT_ID' };
    }

    const payload: any = {
      chat_id: chatId.trim(),
      text: htmlText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok || (data && data.ok === false)) {
      const errMsg = data?.description || `Telegram API HTTP ${response.status}`;
      console.warn('[Telegram] Send failed:', errMsg);
      return { success: false, error: errMsg, status: response.status };
    }

    return { success: true, messageId: data?.result?.message_id };
  } catch (err: any) {
    console.error('[Telegram] Network/runtime error:', err);
    return { success: false, error: err.message || 'Lỗi mạng khi kết nối Telegram API' };
  }
}

/**
 * Xóa một tin nhắn Telegram qua message_id
 */
export async function deleteTelegramMessage(
  botToken?: string,
  chatId?: string,
  messageId?: number | null
): Promise<boolean> {
  if (!botToken || !chatId || !messageId) return false;
  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/deleteMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        message_id: messageId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Telegram] Delete message error:', err);
    return false;
  }
}

/**
 * Trả lời Callback Query từ nút bấm inline keyboard của Telegram
 */
export async function answerCallbackQuery(
  botToken?: string,
  callbackQueryId?: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  if (!botToken || !callbackQueryId) return false;
  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/answerCallbackQuery`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || '',
        show_alert: showAlert,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Telegram] Answer callback error:', err);
    return false;
  }
}

/**
 * Gửi tin nhắn thông báo nhắc việc sắp đến hạn (Kèm 2 nút bấm: Hoàn thành & Hoãn 15 phút)
 */
export async function sendTelegramTaskReminder(
  env: Env,
  task: Todo,
  minutesLeft: number
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { success: false, error: 'Chưa thiết lập biến môi trường Telegram' };
  }

  // Tự động xóa tin nhắn nhắc nhở cũ của việc này trước để cuộc trò chuyện luôn gọn gàng
  if (task.telegram_message_id) {
    await deleteTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, task.telegram_message_id);
  }

  const priorityLabel = task.priority === 'High'
    ? '🔴 <b>Cao (High)</b>'
    : (task.priority === 'Low' ? '🟢 <b>Thấp (Low)</b>' : '🟡 <b>Trung bình (Medium)</b>');

  const repeatLabel = task.repeat_mode === 'daily'
    ? '🔁 Hàng ngày'
    : (task.repeat_mode === 'weekly' ? '📅 Hàng tuần' : '');

  const dueTimeStr = task.due_date ? formatVnDateTime(task.due_date) : 'Không xác định';

  const message = [
    `⏰ <b>NHẮC NHỞ CÔNG VIỆC SẮP ĐẾN HẠN</b>`,
    ``,
    `📌 <b>Công việc:</b> <b>${escapeHtml(task.title)}</b>`,
    `⚠️ <b>Mức độ ưu tiên:</b> ${priorityLabel}`,
    `⏳ <b>Thời gian còn lại:</b> khoảng <b>${minutesLeft} phút</b>`,
    `🕒 <b>Hạn chót:</b> ${dueTimeStr}`,
    task.category ? `🏷️ <b>Danh mục:</b> ${escapeHtml(task.category)}` : '',
    repeatLabel ? `🔄 <b>Chu kỳ:</b> ${repeatLabel}` : '',
    task.description ? `📝 <b>Ghi chú:</b> ${escapeHtml(task.description)}` : '',
    ``,
    `👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng To-Do List</a>`
  ].filter(line => line !== '').join('\n');

  // Đính kèm nút bấm Inline Keyboard 2 chiều
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Hoàn thành', callback_data: `complete_${task.id}` },
        { text: '⏰ Hoãn 15 phút', callback_data: `snooze_${task.id}` }
      ]
    ]
  };

  return sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, message, replyMarkup);
}

/**
 * Gửi tin nhắn thử nghiệm kiểm tra kết nối Telegram Bot
 */
export async function sendTelegramTestMessage(
  botToken: string,
  chatId: string,
  username?: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const nowStr = formatVnDateTime(new Date());
  const safeUser = escapeHtml(username || 'Chung');

  const message = [
    `🤖 <b>KIỂM TRA KẾT NỐI TELEGRAM BOT THÀNH CÔNG!</b>`,
    ``,
    `🎉 Xin chào <b>${safeUser}</b>! Hệ thống nhắc việc <b>To-Do List</b> (Designed by Chung) đã kết nối thành công với tài khoản Telegram của bạn.`,
    ``,
    `🕒 <b>Thời gian kiểm tra:</b> ${nowStr}`,
    `🔔 <b>Trạng thái:</b> Đang hoạt động bình thường ✅`,
    `⚡ <b>Tương tác 2 chiều:</b> Đã hỗ trợ nút bấm Hoàn thành & Hoãn việc`,
    ``,
    `Hệ thống sẽ tự động gửi tin nhắn nhắc nhở mỗi khi có công việc sắp đến hạn (Low: 5 phút, Medium: 15 phút, High: 30 phút)!`,
    ``,
    `👉 <a href="https://app.todolists.workers.dev">Truy cập ứng dụng To-Do List</a>`,
    ``,
    `<i>⏱️ (Tin nhắn thử nghiệm này sẽ tự động xóa sau 15 giây để giữ cuộc trò chuyện luôn gọn gàng)</i>`
  ].join('\n');

  return sendTelegramMessage(botToken, chatId, message);
}

export interface ParsedTask {
  title: string;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High';
  tags: string[];
}

/**
 * Phân tích cú pháp văn bản tiếng Việt để tự động nhận diện Tiêu đề, Hạn chót, Mức độ ưu tiên và Thẻ #tag
 */
export function parseTaskFromText(rawText: string): ParsedTask {
  let text = (rawText || '').trim();
  if (text.startsWith('/add')) {
    text = text.substring(4).trim();
  }

  // 1. Trích xuất #tags
  const tags: string[] = [];
  const tagRegex = /#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    tags.push(tagMatch[1].toLowerCase());
  }
  // Xóa #tag khỏi cleanText
  let cleanText = text.replace(tagRegex, '').trim();

  // 2. Mức độ ưu tiên
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';
  const lower = cleanText.toLowerCase();
  if (lower.includes('gấp') || lower.includes('khẩn cấp') || lower.includes('quan trọng') || lower.includes('urgent') || lower.includes('high') || tags.includes('gap')) {
    priority = 'High';
  } else if (lower.includes('thấp') || lower.includes('thong thả') || lower.includes('rảnh') || lower.includes('low')) {
    priority = 'Low';
  }

  // 3. Thời gian & Hạn chót
  let dueDate: string | null = null;
  const now = new Date();
  // Giờ VN hiện tại (UTC+7)
  const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
  let targetYear = vnNow.getUTCFullYear();
  let targetMonth = vnNow.getUTCMonth();
  let targetDate = vnNow.getUTCDate();
  let targetHour: number | null = null;
  let targetMinute: number = 0;

  // Kiểm tra ngày: ngày mai / mai / ngày kia / mốt / hôm nay
  if (/\b(ngày mai|mai)\b/i.test(cleanText)) {
    targetDate += 1;
    cleanText = cleanText.replace(/\b(ngày mai|mai)\b/gi, '').trim();
  } else if (/\b(ngày kia|mốt)\b/i.test(cleanText)) {
    targetDate += 2;
    cleanText = cleanText.replace(/\b(ngày kia|mốt)\b/gi, '').trim();
  } else if (/\b(hôm nay|nay)\b/i.test(cleanText)) {
    cleanText = cleanText.replace(/\b(hôm nay|nay)\b/gi, '').trim();
  }

  // Buổi: tối / chiều / sáng
  const isAfternoonOrEvening = /\b(tối|chiều)\b/i.test(cleanText);
  cleanText = cleanText.replace(/\b(tối nay|chiều nay|sáng nay|tối|chiều|sáng)\b/gi, '').trim();

  // Trích xuất giờ: "15h", "15h30", "15:30", "15 giờ", "9h"
  const timeMatch = cleanText.match(/(\d{1,2})(?:h|:)(\d{2})?/i) || cleanText.match(/(\d{1,2})\s*(?:giờ|g)/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    let m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (isAfternoonOrEvening && h < 12) {
      h += 12;
    }
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      targetHour = h;
      targetMinute = m;
      cleanText = cleanText.replace(timeMatch[0], '').trim();
    }
  }

  // Nếu có giờ:
  if (targetHour !== null) {
    // Tính theo múi giờ VN (UTC+7): UTC = targetHour - 7
    const targetUtc = new Date(Date.UTC(targetYear, targetMonth, targetDate, targetHour - 7, targetMinute, 0, 0));
    dueDate = targetUtc.toISOString();
  }

  // Làm sạch tiêu đề
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  const title = cleanText || text || 'Công việc mới';

  return {
    title,
    dueDate,
    priority,
    tags
  };
}

/**
 * Tính số ngày liên tục (Streak) hoàn thành công việc theo múi giờ Việt Nam
 */
export function calculateStreak(completedTimestamps: number[]): number {
  if (!completedTimestamps || completedTimestamps.length === 0) return 0;

  // Chuyển timestamps sang danh sách chuỗi ngày YYYY-MM-DD (UTC+7) duy nhất
  const dateSet = new Set<string>();
  for (const ts of completedTimestamps) {
    if (!ts || isNaN(ts)) continue;
    const vnTime = new Date(ts + 7 * 3600 * 1000);
    const dateStr = `${vnTime.getUTCFullYear()}-${String(vnTime.getUTCMonth() + 1).padStart(2, '0')}-${String(vnTime.getUTCDate()).padStart(2, '0')}`;
    dateSet.add(dateStr);
  }

  const nowVn = new Date(Date.now() + 7 * 3600 * 1000);
  const todayStr = `${nowVn.getUTCFullYear()}-${String(nowVn.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVn.getUTCDate()).padStart(2, '0')}`;
  
  const yesterdayVn = new Date(Date.now() + 7 * 3600 * 1000 - 24 * 3600 * 1000);
  const yesterdayStr = `${yesterdayVn.getUTCFullYear()}-${String(yesterdayVn.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayVn.getUTCDate()).padStart(2, '0')}`;

  // Kiểm tra xem streak bắt đầu từ hôm nay hay hôm qua
  let checkDate = new Date(nowVn.getTime());
  if (!dateSet.has(todayStr)) {
    if (!dateSet.has(yesterdayStr)) {
      return 0; // Không có việc hoàn thành hôm nay hoặc hôm qua
    }
    checkDate = new Date(yesterdayVn.getTime());
  }

  let streak = 0;
  while (true) {
    const dStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;
    if (dateSet.has(dStr)) {
      streak++;
      // Lùi lại 1 ngày
      checkDate = new Date(checkDate.getTime() - 24 * 3600 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Tạo nội dung trợ giúp (Help & Start) kèm nút bấm điều khiển nhanh
 */
export function buildHelpResponse() {
  const text = [
    `🤖 <b>TRỢ LÝ QUẢN LÝ CÔNG VIỆC — TO-DO LIST</b>`,
    `<i>(Designed by Chung)</i>`,
    ``,
    `Chào bạn! Bạn có thể tra cứu và tạo việc trực tiếp ngay tại đây:`,
    ``,
    `📌 <b>Các lệnh nhanh:</b>`,
    `• /today - Danh sách công việc hôm nay`,
    `• /overdue - Danh sách công việc trễ hạn`,
    `• /stats - Thống kê năng suất & Chuỗi ngày (Streak)`,
    `• /help - Xem lại hướng dẫn sử dụng`,
    ``,
    `✍️ <b>Tạo việc siêu tốc bằng tin nhắn:</b>`,
    `Chỉ cần gõ văn bản tự nhiên, bot sẽ tự nhận diện:`,
    `<i>Ví dụ:</i> <code>Họp dự án 15h mai #gap</code>`,
    `<i>Ví dụ:</i> <code>Nộp báo cáo 18h tối nay</code>`,
    `<i>Ví dụ:</i> <code>/add Mua sữa cho bé chiều nay</code>`,
    ``,
    `👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng To-Do List trên Web/iOS</a>`
  ].join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '📅 Việc hôm nay', callback_data: 'cmd_today' },
        { text: '⚠️ Việc trễ hạn', callback_data: 'cmd_overdue' }
      ],
      [
        { text: '📊 Thống kê năng suất', callback_data: 'cmd_stats' },
        { text: '🌐 Mở ứng dụng', url: 'https://app.todolists.workers.dev' }
      ]
    ]
  };

  return { text, replyMarkup };
}

/**
 * Xây dựng danh sách công việc hôm nay cho Telegram
 */
export async function buildTodayTasksResponse(env: Env, userId: string) {
  const now = Date.now();
  const vnNow = new Date(now + 7 * 3600 * 1000);
  const startOfDayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), -7, 0, 0, 0)).toISOString();
  const endOfDayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), 16, 59, 59, 999)).toISOString();

  const todos = (await env.DB.prepare(
    `SELECT * FROM todos WHERE user_id = ? AND is_completed = 0 AND deleted_at IS NULL AND (
      (due_date >= ? AND due_date <= ?) OR repeat_mode = 'daily'
    ) ORDER BY (due_date IS NULL) ASC, due_date ASC`
  ).bind(userId, startOfDayUtc, endOfDayUtc).all<Todo>()).results || [];

  const todayStr = `${String(vnNow.getUTCDate()).padStart(2, '0')}/${String(vnNow.getUTCMonth() + 1).padStart(2, '0')}/${vnNow.getUTCFullYear()}`;

  if (todos.length === 0) {
    const text = [
      `📅 <b>CÔNG VIỆC HÔM NAY (${todayStr})</b>`,
      ``,
      `🎉 Tuyệt vời! Bạn không còn công việc nào cần hoàn thành trong hôm nay.`,
      `Hãy nghỉ ngơi hoặc thêm công việc mới bằng cách gửi tin nhắn cho bot nhé!`,
      ``,
      `👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng To-Do List</a>`
    ].join('\n');
    return { text, replyMarkup: undefined };
  }

  const textLines = [
    `📅 <b>DANH SÁCH VIỆC HÔM NAY (${todayStr})</b>`,
    `Tổng số việc cần làm: <b>${todos.length} việc</b>`,
    ``
  ];

  const inlineKeyboard: any[][] = [];

  todos.slice(0, 10).forEach((t, index) => {
    const pIcon = t.priority === 'High' ? '🔴' : (t.priority === 'Low' ? '🟢' : '🟡');
    const timeStr = t.due_date ? formatVnDateTime(t.due_date).split(' ')[0] : 'Cả ngày';
    textLines.push(`${index + 1}. ${pIcon} <b>${escapeHtml(t.title)}</b> <i>(${timeStr})</i>`);
    
    // Thêm nút hoàn thành nhanh cho từng việc
    inlineKeyboard.push([
      { text: `✅ Xong: ${t.title.slice(0, 20)}`, callback_data: `complete_${t.id}` }
    ]);
  });

  if (todos.length > 10) {
    textLines.push(`<i>...và còn ${todos.length - 10} việc nữa trên ứng dụng.</i>`);
  }

  textLines.push(``);
  textLines.push(`👉 <a href="https://app.todolists.workers.dev">Xem tất cả trên Web/iOS</a>`);

  return {
    text: textLines.join('\n'),
    replyMarkup: { inline_keyboard: inlineKeyboard }
  };
}

/**
 * Xây dựng danh sách công việc trễ hạn cho Telegram
 */
export async function buildOverdueTasksResponse(env: Env, userId: string) {
  const nowIso = new Date().toISOString();
  const todos = (await env.DB.prepare(
    `SELECT * FROM todos WHERE user_id = ? AND is_completed = 0 AND deleted_at IS NULL AND due_date IS NOT NULL AND due_date < ? ORDER BY due_date ASC`
  ).bind(userId, nowIso).all<Todo>()).results || [];

  if (todos.length === 0) {
    const text = [
      `⚠️ <b>CÔNG VIỆC TRỄ HẠN</b>`,
      ``,
      `🎉 Chúc mừng! Bạn không có công việc nào bị trễ hạn. Tiến độ rất chuẩn xác! 👏`,
      ``,
      `👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng To-Do List</a>`
    ].join('\n');
    return { text, replyMarkup: undefined };
  }

  const textLines = [
    `⚠️ <b>CÔNG VIỆC ĐÃ TRỄ HẠN (${todos.length} việc)</b>`,
    `Cần ưu tiên xử lý sớm:`,
    ``
  ];

  const inlineKeyboard: any[][] = [];

  todos.slice(0, 8).forEach((t, index) => {
    const pIcon = t.priority === 'High' ? '🔴' : (t.priority === 'Low' ? '🟢' : '🟡');
    const timeStr = t.due_date ? formatVnDateTime(t.due_date) : '';
    textLines.push(`${index + 1}. ${pIcon} <b>${escapeHtml(t.title)}</b> - Hạn: ${timeStr}`);
    
    inlineKeyboard.push([
      { text: `✅ Xong: ${t.title.slice(0, 16)}`, callback_data: `complete_${t.id}` },
      { text: `⏰ Hoãn +15p`, callback_data: `snooze_${t.id}` }
    ]);
  });

  textLines.push(``);
  textLines.push(`👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng để quản lý</a>`);

  return {
    text: textLines.join('\n'),
    replyMarkup: { inline_keyboard: inlineKeyboard }
  };
}

/**
 * Xây dựng báo cáo thống kê năng suất cho Telegram
 */
export async function buildStatsResponse(env: Env, userId: string) {
  const total = (await env.DB.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND deleted_at IS NULL').bind(userId).first<{ count: number }>())?.count || 0;
  const completed = (await env.DB.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_completed = 1 AND deleted_at IS NULL').bind(userId).first<{ count: number }>())?.count || 0;
  const pending = (await env.DB.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_completed = 0 AND deleted_at IS NULL').bind(userId).first<{ count: number }>())?.count || 0;
  
  const nowIso = new Date().toISOString();
  const overdue = (await env.DB.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_completed = 0 AND deleted_at IS NULL AND due_date IS NOT NULL AND due_date < ?').bind(userId, nowIso).first<{ count: number }>())?.count || 0;

  // Lấy các mốc hoàn thành để tính Streak
  const completedRows = (await env.DB.prepare(
    'SELECT updated_at FROM todos WHERE user_id = ? AND is_completed = 1 AND deleted_at IS NULL'
  ).bind(userId).all<{ updated_at: string }>()).results || [];

  const timestamps = completedRows.map(r => new Date(r.updated_at).getTime()).filter(t => !isNaN(t));
  const streak = calculateStreak(timestamps);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const text = [
    `📊 <b>BÁO CÁO NĂNG SUẤT CÔNG VIỆC</b>`,
    `<i>(Designed by Chung)</i>`,
    ``,
    `🔥 <b>Chuỗi ngày liên tục (Streak):</b> <b>${streak} ngày</b> ${streak > 0 ? '🔥' : '🌱'}`,
    `📈 <b>Tỷ lệ hoàn thành:</b> <b>${completionRate}%</b>`,
    ``,
    `• Tổng số việc: <b>${total}</b>`,
    `• Đã hoàn thành: <b>${completed}</b> ✅`,
    `• Đang chờ thực hiện: <b>${pending}</b> ⏳`,
    `• Quá hạn: <b>${overdue}</b> ⚠️`,
    ``,
    completionRate >= 80 ? `🌟 <i>Phong độ xuất sắc! Hãy tiếp tục duy trì!</i>` : `💪 <i>Cố gắng hoàn thành các mục tiêu còn lại nhé!</i>`,
    ``,
    `👉 <a href="https://app.todolists.workers.dev">Truy cập ứng dụng To-Do List</a>`
  ].join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '📅 Việc hôm nay', callback_data: 'cmd_today' },
        { text: '⚠️ Việc trễ hạn', callback_data: 'cmd_overdue' }
      ]
    ]
  };

  return { text, replyMarkup };
}

/**
 * Xây dựng bản tin buổi sáng lúc 07:30 (VN)
 */
export async function buildMorningBriefing(env: Env, userId: string) {
  const now = Date.now();
  const vnNow = new Date(now + 7 * 3600 * 1000);
  const startOfDayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), -7, 0, 0, 0)).toISOString();
  const endOfDayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), 16, 59, 59, 999)).toISOString();

  const todos = (await env.DB.prepare(
    `SELECT * FROM todos WHERE user_id = ? AND is_completed = 0 AND deleted_at IS NULL AND (
      (due_date >= ? AND due_date <= ?) OR repeat_mode = 'daily'
    ) ORDER BY (due_date IS NULL) ASC, due_date ASC`
  ).bind(userId, startOfDayUtc, endOfDayUtc).all<Todo>()).results || [];

  const todayStr = `${String(vnNow.getUTCDate()).padStart(2, '0')}/${String(vnNow.getUTCMonth() + 1).padStart(2, '0')}/${vnNow.getUTCFullYear()}`;

  const textLines = [
    `🌅 <b>BẢN TIN SÁNG — ${todayStr}</b>`,
    `<i>Chúc bạn một ngày mới tràn đầy năng lượng & hiệu quả!</i>`,
    ``,
    `📋 Hôm nay bạn có <b>${todos.length} công việc</b> cần xử lý:`,
    ``
  ];

  const inlineKeyboard: any[][] = [];

  if (todos.length === 0) {
    textLines.push(`✨ <i>Hôm nay chưa có lịch việc nào. Hãy đặt mục tiêu mới nhé!</i>`);
  } else {
    todos.slice(0, 8).forEach((t, index) => {
      const pIcon = t.priority === 'High' ? '🔴' : (t.priority === 'Low' ? '🟢' : '🟡');
      const timeStr = t.due_date ? formatVnDateTime(t.due_date).split(' ')[0] : 'Cả ngày';
      textLines.push(`${index + 1}. ${pIcon} <b>${escapeHtml(t.title)}</b> <i>(${timeStr})</i>`);
      inlineKeyboard.push([
        { text: `✅ Xong: ${t.title.slice(0, 16)}`, callback_data: `complete_${t.id}` },
        { text: `⏰ Hoãn +15p`, callback_data: `snooze_${t.id}` }
      ]);
    });
  }

  textLines.push(``);
  textLines.push(`👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng To-Do List</a>`);

  inlineKeyboard.push([
    { text: '📊 Thống kê năng suất', callback_data: 'cmd_stats' },
    { text: '⚠️ Việc trễ hạn', callback_data: 'cmd_overdue' }
  ]);

  return {
    text: textLines.join('\n'),
    replyMarkup: { inline_keyboard: inlineKeyboard }
  };
}

/**
 * Xây dựng bản tin tổng kết buổi tối lúc 21:30 (VN)
 */
export async function buildEveningBriefing(env: Env, userId: string) {
  const now = Date.now();
  const vnNow = new Date(now + 7 * 3600 * 1000);
  const startOfDayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), -7, 0, 0, 0)).toISOString();
  const endOfDayUtc = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), 16, 59, 59, 999)).toISOString();

  // Việc hôm nay đã xong
  const completedToday = (await env.DB.prepare(
    `SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND is_completed = 1 AND deleted_at IS NULL AND updated_at >= ?`
  ).bind(userId, startOfDayUtc).first<{ count: number }>())?.count || 0;

  // Việc tồn đọng (hôm nay hoặc trước đó chưa xong)
  const pendingOverdue = (await env.DB.prepare(
    `SELECT * FROM todos WHERE user_id = ? AND is_completed = 0 AND deleted_at IS NULL AND due_date IS NOT NULL AND due_date <= ? ORDER BY due_date ASC`
  ).bind(userId, endOfDayUtc).all<Todo>()).results || [];

  // Streak
  const completedRows = (await env.DB.prepare(
    'SELECT updated_at FROM todos WHERE user_id = ? AND is_completed = 1 AND deleted_at IS NULL'
  ).bind(userId).all<{ updated_at: string }>()).results || [];
  const streak = calculateStreak(completedRows.map(r => new Date(r.updated_at).getTime()).filter(t => !isNaN(t)));

  const todayStr = `${String(vnNow.getUTCDate()).padStart(2, '0')}/${String(vnNow.getUTCMonth() + 1).padStart(2, '0')}/${vnNow.getUTCFullYear()}`;

  const textLines = [
    `🌙 <b>TỔNG KẾT NĂNG SUẤT TỐI — ${todayStr}</b>`,
    `<i>(Trợ lý Quản gia To-Do List)</i>`,
    ``,
    `🔥 <b>Chuỗi ngày Streak:</b> <b>${streak} ngày liên tục</b> ${streak > 0 ? '🔥' : '🌱'}`,
    `✅ <b>Đã hoàn thành hôm nay:</b> <b>${completedToday} việc</b>`,
    `⏳ <b>Việc còn tồn đọng:</b> <b>${pendingOverdue.length} việc</b>`,
    ``
  ];

  const inlineKeyboard: any[][] = [];

  if (pendingOverdue.length > 0) {
    textLines.push(`📌 <b>Danh sách tồn đọng:</b>`);
    pendingOverdue.slice(0, 5).forEach((t) => {
      textLines.push(`• ${escapeHtml(t.title)}`);
    });
    textLines.push(``);
    textLines.push(`Bấm nút dưới đây để dời nhanh các việc này sang ngày mai:`);
    inlineKeyboard.push([
      { text: '🌙 Dời tất cả sang ngày mai (+1 ngày)', callback_data: 'snooze_all_tomorrow' }
    ]);
  } else {
    textLines.push(`🎉 <b>Tuyệt vời! Bạn không còn việc tồn đọng nào. Chúc bạn có một giấc ngủ thật ngon! 🌟</b>`);
  }

  textLines.push(``);
  textLines.push(`👉 <a href="https://app.todolists.workers.dev">Mở ứng dụng To-Do List</a>`);

  inlineKeyboard.push([
    { text: '📊 Thống kê năng suất', callback_data: 'cmd_stats' }
  ]);

  return {
    text: textLines.join('\n'),
    replyMarkup: { inline_keyboard: inlineKeyboard }
  };
}

/**
 * Tải file (ví dụ tin nhắn thoại voice note) từ Telegram Bot API
 */
export async function downloadTelegramFile(botToken: string, fileId: string): Promise<Uint8Array | null> {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getFile?file_id=${fileId}`);
    const fileData: any = await fileRes.json();
    if (!fileRes.ok || !fileData?.ok || !fileData?.result?.file_path) {
      console.error('[Telegram] getFile error:', fileData);
      return null;
    }
    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${botToken.trim()}/${filePath}`;
    const dlRes = await fetch(downloadUrl);
    if (!dlRes.ok) {
      console.error('[Telegram] Download file error:', dlRes.statusText);
      return null;
    }
    const arrayBuffer = await dlRes.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error('[Telegram] downloadTelegramFile error:', err);
    return null;
  }
}


