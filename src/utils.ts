// ============================================================
// Utility Functions — Streak, DateTime formatting & Local NLP
// ============================================================

export interface ParsedTask {
  title: string;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High';
  tags: string[];
  category: string;
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
 * Phân tích cú pháp văn bản tiếng Việt để tự động nhận diện Tiêu đề, Hạn chót, Mức độ ưu tiên và Thẻ #tag
 */
export function parseTaskFromText(rawText: string): ParsedTask {
  let text = String(rawText || '').trim();
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
  let cleanText = text.replace(tagRegex, '').trim();

  // 2. Mức độ ưu tiên
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';
  const lower = cleanText.toLowerCase();
  if (lower.includes('gấp') || lower.includes('khẩn cấp') || lower.includes('quan trọng') || lower.includes('urgent') || lower.includes('high') || tags.includes('gap')) {
    priority = 'High';
  } else if (lower.includes('thấp') || lower.includes('thong thả') || lower.includes('rảnh') || lower.includes('low')) {
    priority = 'Low';
  }

  // 3. Phân loại Danh mục thông minh theo ý nghĩa
  let category = 'Personal';
  if (/họp|báo\s*cáo|dự\s*án|khách|hợp\s*đồng|công\s*việc|task|code|deadline|email|mail|sếp|công\s*ty|văn\s*phòng/i.test(cleanText)) {
    category = 'Work';
  } else if (/học|bài\s*tập|thi|ôn\s*tập|đọc\s*sách|sách|khóa\s*học|nghiên\s*cứu|tiếng\s*anh/i.test(cleanText)) {
    category = 'Study';
  } else if (/thuốc|khám|bác\s*sĩ|bệnh|chạy\s*bộ|gym|thể\s*dục|yoga|sức\s*khỏe|uống\s*nước/i.test(cleanText)) {
    category = 'Health';
  } else if (/mua|sắm|chợ|siêu\s*thị|order|đặt\s*hàng|shopping/i.test(cleanText)) {
    category = 'Shopping';
  } else if (/tiền|lương|hóa\s*đơn|thanh\s*toán|chuyển\s*khoản|ngân\s*hàng|nợ/i.test(cleanText)) {
    category = 'Finance';
  }

  // 4. Thời gian & Hạn chót
  let dueDate: string | null = null;
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
  let targetYear = vnNow.getUTCFullYear();
  let targetMonth = vnNow.getUTCMonth();
  let targetDate = vnNow.getUTCDate();
  let targetHour: number | null = null;
  let targetMinute: number = 0;

  if (/\b(ngày mai|mai)\b/i.test(cleanText)) {
    targetDate += 1;
    cleanText = cleanText.replace(/\b(ngày mai|mai)\b/gi, '').trim();
  } else if (/\b(ngày kia|mốt)\b/i.test(cleanText)) {
    targetDate += 2;
    cleanText = cleanText.replace(/\b(ngày kia|mốt)\b/gi, '').trim();
  } else if (/\b(hôm nay|nay)\b/i.test(cleanText)) {
    cleanText = cleanText.replace(/\b(hôm nay|nay)\b/gi, '').trim();
  }

  const isAfternoonOrEvening = /\b(tối|chiều)\b/i.test(cleanText);
  cleanText = cleanText.replace(/\b(tối nay|chiều nay|sáng nay|tối|chiều|sáng)\b/gi, '').trim();

  // Nhận diện giờ dạng "7h kém 15" hoặc "7 giờ kém 15"
  const kemMatch = cleanText.match(/(\d{1,2})\s*(?:h|:|giờ)\s*kém\s*(\d{1,2})/i);
  // Nhận diện giờ dạng "6h rưỡi" hoặc "6 giờ rưỡi"
  const ruoiMatch = cleanText.match(/(\d{1,2})\s*(?:h|:|giờ)?\s*rưỡi/i);
  // Nhận diện giờ tiêu chuẩn "6h", "18:00", "6 giờ", "6h30"
  const timeMatch = cleanText.match(/(\d{1,2})(?:h|:)(\d{2})?/i) || cleanText.match(/(\d{1,2})\s*(?:giờ|g)/i);

  if (kemMatch) {
    let h = parseInt(kemMatch[1], 10) - 1;
    let m = 60 - parseInt(kemMatch[2], 10);
    if (h < 0) h = 23;
    if (isAfternoonOrEvening && h < 12) h += 12;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      targetHour = h;
      targetMinute = m;
      cleanText = cleanText.replace(kemMatch[0], '').trim();
    }
  } else if (ruoiMatch) {
    let h = parseInt(ruoiMatch[1], 10);
    let m = 30;
    if (isAfternoonOrEvening && h < 12) h += 12;
    if (h >= 0 && h <= 23) {
      targetHour = h;
      targetMinute = m;
      cleanText = cleanText.replace(ruoiMatch[0], '').trim();
    }
  } else if (timeMatch) {
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

  // Loại bỏ các từ thừa như "lúc", "vào lúc", "vào", "nhắc tôi", "hãy"
  cleanText = cleanText
    .replace(/\b(vào\s*lúc|lúc|vào)\b/gi, ' ')
    .replace(/^(?:hãy|tạo\s*việc|thêm\s*việc|nhắc\s*tôi|nhắc)\s+/gi, ' ')
    .replace(/\b(?:rưỡi|kém)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (targetHour !== null) {
    const targetUtc = new Date(Date.UTC(targetYear, targetMonth, targetDate, targetHour - 7, targetMinute, 0, 0));
    dueDate = targetUtc.toISOString();
  }

  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  let title = cleanText || text || 'Công việc mới';
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    dueDate,
    priority,
    tags,
    category
  };
}

/**
 * Tính số ngày liên tục (Streak) hoàn thành công việc theo múi giờ Việt Nam
 */
export function calculateStreak(completedTimestamps: number[]): number {
  if (!completedTimestamps || completedTimestamps.length === 0) return 0;

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

  let checkDate = new Date(nowVn.getTime());
  if (!dateSet.has(todayStr)) {
    if (!dateSet.has(yesterdayStr)) {
      return 0;
    }
    checkDate = new Date(yesterdayVn.getTime());
  }

  let streak = 0;
  while (true) {
    const dStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;
    if (dateSet.has(dStr)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 24 * 3600 * 1000);
    } else {
      break;
    }
  }

  return streak;
}
