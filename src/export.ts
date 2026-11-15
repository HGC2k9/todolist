// ============================================================
// Export & Backup Module — iCalendar (.ics) and JSON Backup
// ============================================================

import type { Todo, Subtask } from './types';

/**
 * Thoát các ký tự đặc biệt cho định dạng iCalendar RFC 5545
 */
export function escapeIcs(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Định dạng Date object sang chuỗi iCalendar UTC (YYYYMMDDTHHMMSSZ)
 */
export function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Tạo nội dung file iCalendar (.ics RFC 5545) từ danh sách công việc
 */
export function generateIcs(todos: Todo[], appUrl = 'https://app.todolists.workers.dev'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//To-Do List Designed by Chung//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:To-Do List',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  const now = new Date();
  const nowStamp = formatIcsDate(now);

  for (const todo of todos) {
    if (!todo.due_date) continue;
    const dueDate = new Date(todo.due_date);
    if (isNaN(dueDate.getTime())) continue;

    const startDateStr = formatIcsDate(dueDate);
    // Thời lượng mặc định 30 phút
    const endDate = new Date(dueDate.getTime() + 30 * 60 * 1000);
    const endDateStr = formatIcsDate(endDate);

    let priorityNum = 5; // Normal
    if (todo.priority === 'High') priorityNum = 1;
    else if (todo.priority === 'Low') priorityNum = 9;

    let desc = todo.description || '';
    if (todo.category) desc += `\nDanh mục: ${todo.category}`;
    if (todo.repeat_mode && todo.repeat_mode !== 'none') {
      desc += `\nLặp lại: ${todo.repeat_mode === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}`;
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:task-${todo.id}@todolists.workers.dev`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${startDateStr}`);
    lines.push(`DTEND:${endDateStr}`);
    lines.push(`SUMMARY:${escapeIcs(todo.title)}`);
    if (desc) lines.push(`DESCRIPTION:${escapeIcs(desc)}`);
    lines.push(`STATUS:${todo.is_completed ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push(`PRIORITY:${priorityNum}`);
    lines.push(`URL:${appUrl}`);

    // Nhắc trước nếu có reminder_offset
    if (todo.reminder_offset && todo.reminder_offset > 0) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Nhắc nhở: ${escapeIcs(todo.title)}`);
      lines.push(`TRIGGER:-PT${todo.reminder_offset}M`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Xuất danh sách Todo ra định dạng JSON đầy đủ
 */
export function exportTodosJson(todos: Todo[]): string {
  const exportPayload = {
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    total_count: todos.length,
    todos: todos.map((t) => ({
      title: t.title,
      description: t.description || '',
      category: t.category || 'Personal',
      priority: t.priority || 'Medium',
      due_date: t.due_date,
      is_completed: t.is_completed ? 1 : 0,
      is_pinned: t.is_pinned ? 1 : 0,
      repeat_mode: t.repeat_mode || 'none',
      subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks || '[]') : (t.subtasks || []),
      tags: typeof t.tags === 'string' ? JSON.parse(t.tags || '[]') : (t.tags || []),
      reminder_offset: t.reminder_offset || 0,
      status: t.status || (t.is_completed ? 'completed' : 'todo'),
      position: t.position || 0,
    })),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Kiểm tra và giải mã file JSON khi người dùng nhập dữ liệu sao lưu
 */
export function validateAndParseImportJson(jsonStr: string): Partial<Todo>[] {
  const parsed = JSON.parse(jsonStr);
  let rawList: any[] = [];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && Array.isArray(parsed.todos)) {
    rawList = parsed.todos;
  } else {
    throw new Error('Định dạng file sao lưu không hợp lệ (cần danh sách todos).');
  }

  const validTodos: Partial<Todo>[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const title = String(item.title || '').trim();
    if (!title) continue;

    let subtasks: Subtask[] = [];
    if (Array.isArray(item.subtasks)) {
      subtasks = item.subtasks.map((st: any, idx: number) => ({
        id: String(st.id || `st-${idx}-${Date.now()}`),
        title: String(st.title || '').trim(),
        is_completed: st.is_completed ? 1 : 0,
      })).filter((st: Subtask) => st.title.length > 0);
    }

    let tags: string[] = [];
    if (Array.isArray(item.tags)) {
      tags = item.tags.map((tg: any) => String(tg).replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
    }

    validTodos.push({
      title,
      description: typeof item.description === 'string' ? item.description.trim() : '',
      category: typeof item.category === 'string' ? item.category.trim() : 'Personal',
      priority: (item.priority === 'High' || item.priority === 'Low') ? item.priority : 'Medium',
      due_date: item.due_date ? String(item.due_date) : null,
      is_completed: item.is_completed ? 1 : 0,
      is_pinned: item.is_pinned ? 1 : 0,
      repeat_mode: (item.repeat_mode === 'daily' || item.repeat_mode === 'weekly') ? item.repeat_mode : 'none',
      subtasks,
      tags,
      reminder_offset: typeof item.reminder_offset === 'number' ? item.reminder_offset : 0,
      status: (item.status === 'in_progress' || item.status === 'completed') ? item.status : 'todo',
      position: typeof item.position === 'number' ? item.position : 0,
    });
  }

  return validTodos;
}
