// ============================================================
// Client Module: Notifications & Timezone Safe Helpers
// (Capacitor Local Notifications, Priority Repeats, Daily Briefing 06:00/18:00)
// ============================================================

export function getVnDateParts(dateOrMsOrStr: any) {
  let ms: number;
  if (!dateOrMsOrStr) {
    ms = Date.now();
  } else if (typeof dateOrMsOrStr === 'number') {
    ms = dateOrMsOrStr;
  } else if (dateOrMsOrStr instanceof Date) {
    ms = dateOrMsOrStr.getTime();
  } else {
    const s = String(dateOrMsOrStr).trim();
    const match = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})[T ]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?/);
    if (match && !s.endsWith('Z') && !/[+-][0-9]{2}:[0-9]{2}$/.test(s)) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const hours = parseInt(match[4], 10);
      const minutes = parseInt(match[5], 10);
      const seconds = match[6] ? parseInt(match[6], 10) : 0;
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        year, month, day, hours, minutes, seconds,
        timeStr: `${pad(hours)}:${pad(minutes)}`,
        dateStr: `${year}-${pad(month + 1)}-${pad(day)}`,
        inputStr: `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}`,
        dayOfWeek: new Date(year, month, day).getDay()
      };
    }
    const d = new Date(s);
    ms = isNaN(d.getTime()) ? Date.now() : d.getTime();
  }

  const vnTime = new Date(ms + 7 * 3600 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = vnTime.getUTCMonth();
  const day = vnTime.getUTCDate();
  const dayOfWeek = vnTime.getUTCDay();
  const hours = vnTime.getUTCHours();
  const minutes = vnTime.getUTCMinutes();
  const seconds = vnTime.getUTCSeconds();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(hours)}:${pad(minutes)}`;
  const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
  const inputStr = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}`;
  return { year, month, day, dayOfWeek, hours, minutes, seconds, timeStr, dateStr, inputStr };
}

export function formatVnTime(dateOrMsOrStr: any): string {
  if (!dateOrMsOrStr) return '';
  return getVnDateParts(dateOrMsOrStr).timeStr;
}

export function calculatePostponedDueDate(currentDueDate: string | null | undefined, addMinutes: number = 15, nowMs: number = Date.now()): string {
  const cur = parseDateSafe(currentDueDate);
  const baseMs = cur && !isNaN(cur.getTime()) ? cur.getTime() : nowMs;
  return new Date(baseMs + addMinutes * 60 * 1000).toISOString();
}

export function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s) return null;

  // Nếu chuỗi đã có hậu tố Z hoặc offset múi giờ (+07:00, -05:00)
  if (s.endsWith('Z') || /[+-][0-9]{2}:[0-9]{2}$/.test(s)) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    d.setSeconds(0, 0);
    return d;
  }

  // Nếu chuỗi ngày giờ không có múi giờ (ví dụ YYYY-MM-DDTHH:mm),
  // luôn hiểu theo giờ Việt Nam (UTC+7) -> trừ 7 tiếng để tạo Date UTC chuẩn xác
  const match = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})[T ]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    const utcMs = Date.UTC(year, month, day, hour, minute, 0, 0) - (7 * 3600 * 1000);
    const d = new Date(utcMs);
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(s);
  if (isNaN(fallback.getTime())) return null;
  fallback.setSeconds(0, 0);
  return fallback;
}

export function getNotificationId(idStr: string): number {
  if (!idStr) return 1;
  let hash = 0;
  const s = String(idStr);
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 2147483647) || 1;
}

export function getPriorityWarningMinutes(priority: string): number {
  const p = String(priority || '').toLowerCase();
  if (p === 'low') return 5;
  if (p === 'medium') return 15;
  if (p === 'high') return 30;
  return 15;
}

export const TASK_REMINDER_ACTION_TYPE_ID = 'TASK_REMINDER_ACTIONS';
export const TASK_REMINDER_ACTION_MARK_DONE = 'MARK_DONE';
export const TASK_REMINDER_ACTION_SNOOZE_10M = 'SNOOZE_10M';
export const NOTIFICATION_SOUND_FILE = 'pop_ding.wav';

export function formatRemainingDeadlineText(dueDateOrMs: any, nowMs: number = Date.now()): string {
  if (dueDateOrMs === null || dueDateOrMs === undefined || dueDateOrMs === '') return '';
  let dueMs: number | null = null;
  if (typeof dueDateOrMs === 'number') {
    dueMs = dueDateOrMs;
  } else if (dueDateOrMs instanceof Date) {
    dueMs = dueDateOrMs.getTime();
  } else {
    const parsed = parseDateSafe(String(dueDateOrMs));
    dueMs = parsed ? parsed.getTime() : null;
  }
  if (dueMs === null || isNaN(dueMs)) return '';

  const diffMs = dueMs - nowMs;
  if (diffMs <= 0) return 'Đã đến hạn';
  const mins = Math.ceil(diffMs / 60000);
  if (mins <= 0) return 'Đã đến hạn';
  return `Còn ${mins} phút nữa đến hạn`;
}

export async function handleMarkDoneNotificationAction(params: {
  actionId: string;
  notification: { id?: number; extra?: { taskId?: string; todoId?: string } };
  todos: any[];
  completionHistory?: any[];
  persistTodosAndHistory?: (todos: any[], history: any[]) => Promise<void> | void;
  getPending?: () => Promise<{ notifications: any[] }>;
  cancelNotifications?: (opts: { notifications: { id: number }[] }) => Promise<void>;
  getDeliveredNotifications?: () => Promise<{ notifications: any[] }>;
  removeDeliveredNotifications?: (opts: { notifications: any[] }) => Promise<void>;
  syncQueue?: () => Promise<void> | void;
}): Promise<{ completed: boolean; snoozed?: boolean; taskId?: string }> {
  const taskId = params.notification?.extra?.taskId || params.notification?.extra?.todoId;
  const isMarkDone = params.actionId === TASK_REMINDER_ACTION_MARK_DONE;
  const isSnooze = params.actionId === TASK_REMINDER_ACTION_SNOOZE_10M;
  if ((!isMarkDone && !isSnooze) || !taskId) {
    if (params.syncQueue) await params.syncQueue();
    return { completed: false, snoozed: false, taskId };
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const vnNow = getVnDateParts(nowMs);
  const history = Array.isArray(params.completionHistory) ? params.completionHistory : [];
  const target = Array.isArray(params.todos) ? params.todos.find(t => t.id === taskId) : null;
  let completed = false;
  let snoozed = false;

  if (target && isMarkDone && !target.is_completed) {
    target.is_completed = 1;
    target.status = 'completed';
    target.updated_at = nowIso;
    completed = true;

    history.push({
      id: 'hist_' + nowMs + '_' + Math.random().toString(36).substring(2, 8),
      todo_id: target.id,
      task_title: target.title,
      completed_at: nowIso,
      date_str: vnNow.dateStr,
      category: target.category,
      priority: target.priority,
      actual_minutes: target.actual_minutes || 0,
      created_at: nowIso
    });

    if (target.repeat_mode && target.repeat_mode !== 'none' && target.due_date) {
      const d = new Date(target.due_date);
      if (!isNaN(d.getTime())) {
        const increment = target.repeat_mode === 'daily' ? 1 : 7;
        d.setDate(d.getDate() + increment);
        while (d.getTime() < nowMs) {
          d.setDate(d.getDate() + increment);
        }
        target.due_date = d.toISOString();
      }
    }

    if (params.persistTodosAndHistory) {
      await params.persistTodosAndHistory(params.todos, history);
    }
  } else if (target && isSnooze) {
    const snoozeTargetMs = nowMs + 10 * 60 * 1000;
    target.due_date = new Date(snoozeTargetMs).toISOString();
    target.reminder_offset = 0;
    target.updated_at = nowIso;
    snoozed = true;
    if (params.persistTodosAndHistory) {
      await params.persistTodosAndHistory(params.todos, history);
    }
  }

  const baseId = ((getNotificationId(taskId) % 80000) + 1000) * 10000;

  if (params.getPending && params.cancelNotifications) {
    const pending = await params.getPending();
    const toCancel = (pending?.notifications || [])
      .filter(n => n.extra?.taskId === taskId || n.extra?.todoId === taskId || (n.id >= baseId && n.id < baseId + 10000))
      .map(n => ({ id: n.id }));
    if (toCancel.length > 0) {
      await params.cancelNotifications({ notifications: toCancel });
    }
  }

  if (params.getDeliveredNotifications && params.removeDeliveredNotifications) {
    const delivered = await params.getDeliveredNotifications();
    const toRemove = (delivered?.notifications || []).filter(n =>
      n.extra?.taskId === taskId ||
      n.extra?.todoId === taskId ||
      (n.id >= baseId && n.id < baseId + 10000) ||
      (params.notification?.id != null && n.id === params.notification.id)
    );
    if (toRemove.length > 0) {
      await params.removeDeliveredNotifications({ notifications: toRemove });
    } else if (params.notification?.id != null) {
      await params.removeDeliveredNotifications({ notifications: [params.notification] });
    }
  }

  if (params.syncQueue) {
    await params.syncQueue();
  }

  return { completed, snoozed, taskId };
}

export function isTodoForToday(todo: any, nowMs: number = Date.now()): boolean {
  if (!todo || todo.deleted_at) return false;
  const vnNow = getVnDateParts(nowMs);
  const mode = todo.repeat_mode || 'none';

  if (mode === 'daily') return true;

  if (mode === 'weekly') {
    if (!todo.due_date) return false;
    const d = parseDateSafe(todo.due_date);
    if (!d) return false;
    return getVnDateParts(d).dayOfWeek === vnNow.dayOfWeek;
  }

  if (!todo.due_date) return false;
  const d = parseDateSafe(todo.due_date);
  if (!d) return false;
  return getVnDateParts(d).dateStr === vnNow.dateStr;
}

export function checkAndResetRecurringTasks(todos: any[], nowMs: number = Date.now()): boolean {
  if (!Array.isArray(todos) || todos.length === 0) return false;
  const vnNow = getVnDateParts(nowMs);
  const todayStr = vnNow.dateStr;
  const isAfter0001Today = vnNow.hours > 0 || vnNow.minutes >= 1;

  const currentDay = vnNow.dayOfWeek;
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const mondayTime = nowMs - diffToMonday * 24 * 3600 * 1000;
  const currentWeekMondayStr = getVnDateParts(mondayTime).dateStr;
  const isAfterMonday0001 = currentDay !== 1 || vnNow.hours > 0 || vnNow.minutes >= 1;

  let hasChanges = false;
  for (const t of todos) {
    if (!t || t.deleted_at || !t.repeat_mode || t.repeat_mode === 'none' || !t.is_completed) continue;
    const lastUpdated = parseDateSafe(t.updated_at || t.created_at);
    if (!lastUpdated) continue;
    const lastUpdatedVn = getVnDateParts(lastUpdated);

    if (t.repeat_mode === 'daily') {
      if (isAfter0001Today && lastUpdatedVn.dateStr < todayStr) {
        t.is_completed = 0;
        t.status = 'todo';
        t.updated_at = new Date(nowMs).toISOString();
        if (t.subtasks) {
          let subs = Array.isArray(t.subtasks) ? t.subtasks : [];
          if (typeof t.subtasks === 'string') {
            try { subs = JSON.parse(t.subtasks); } catch { subs = []; }
          }
          subs.forEach((st: any) => { st.is_completed = 0; });
          t.subtasks = subs;
        }
        if (t.due_date) {
          const dueVn = getVnDateParts(t.due_date);
          const newVnMs = Date.UTC(vnNow.year, vnNow.month, vnNow.day, dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
          t.due_date = new Date(newVnMs).toISOString();
        }
        hasChanges = true;
      }
    } else if (t.repeat_mode === 'weekly') {
      const upDay = lastUpdatedVn.dayOfWeek;
      const upDiffToMon = upDay === 0 ? 6 : upDay - 1;
      const upMonTime = lastUpdated.getTime() - upDiffToMon * 24 * 3600 * 1000;
      const upMonStr = getVnDateParts(upMonTime).dateStr;
      if (isAfterMonday0001 && upMonStr < currentWeekMondayStr) {
        t.is_completed = 0;
        t.status = 'todo';
        t.updated_at = new Date(nowMs).toISOString();
        if (t.subtasks) {
          let subs = Array.isArray(t.subtasks) ? t.subtasks : [];
          if (typeof t.subtasks === 'string') {
            try { subs = JSON.parse(t.subtasks); } catch { subs = []; }
          }
          subs.forEach((st: any) => { st.is_completed = 0; });
          t.subtasks = subs;
        }
        if (t.due_date) {
          const dueVn = getVnDateParts(t.due_date);
          const dayOffsetFromMonday = dueVn.dayOfWeek === 0 ? 6 : dueVn.dayOfWeek - 1;
          const targetDayMs = mondayTime + dayOffsetFromMonday * 24 * 3600 * 1000;
          const targetVn = getVnDateParts(targetDayMs);
          const newWkMs = Date.UTC(targetVn.year, targetVn.month, targetVn.day, dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
          t.due_date = new Date(newWkMs).toISOString();
        }
        hasChanges = true;
      }
    }
  }

  return hasChanges;
}

export function generateRollingTaskNotifications(
  todo: { id: string; title: string; category?: string; priority?: string; due_date?: string; reminder_offset?: number },
  nowMs: number,
  maxPerTask: number = 200
): any[] {
  if (!todo || !todo.due_date) return [];
  const d = parseDateSafe(todo.due_date);
  if (!d) return [];

  const dueTime = d.getTime();
  const minuteEndMs = (d.getSeconds() === 0) ? (dueTime + 60 * 1000) : dueTime;
  if (nowMs >= minuteEndMs) return [];

  const offsetMinutes = Number(todo.reminder_offset) || 0;
  const startAt = dueTime - (offsetMinutes * 60 * 1000);
  const priority = todo.priority || 'Medium';
  // High: 2 giây, Medium: 150 giây, Low: 300 giây
  const intervalMs = (priority === 'High') ? (2 * 1000) : (priority === 'Medium' ? (150 * 1000) : (300 * 1000));
  const baseId = ((getNotificationId(todo.id) % 80000) + 1000) * 10000;

  const notifications = [];
  const priorityPrefix = priority === 'High' ? '🚨 [KHẨN CẤP] ' : (priority === 'Medium' ? '⚡ [ƯU TIÊN] ' : '⏰ Nhắc việc: ');
  const dueTimeStr = formatVnTime(d);

  let startIndex = 0;
  if (nowMs > startAt) {
    startIndex = Math.max(0, Math.floor((nowMs - startAt) / intervalMs));
  }

  let count = 0;
  for (let i = startIndex; count < maxPerTask; i++) {
    const triggerTime = startAt + (i * intervalMs);
    if (triggerTime >= minuteEndMs) break;

    if (triggerTime > nowMs) {
      const remainingText = formatRemainingDeadlineText(dueTime, triggerTime);
      const repeatSuffix = i > 0 ? (' (Nhắc lặp lần ' + (i + 1) + ')') : '';
      notifications.push({
        id: baseId + (i % 10000),
        title: priorityPrefix + (todo.title || 'Công việc cần làm'),
        body: remainingText + ' • Hạn: ' + dueTimeStr + (todo.category ? (' • ' + todo.category) : '') + repeatSuffix,
        schedule: { at: new Date(triggerTime), allowWhileIdle: true },
        sound: NOTIFICATION_SOUND_FILE,
        actionTypeId: TASK_REMINDER_ACTION_TYPE_ID,
        extra: { taskId: todo.id, todoId: todo.id, iteration: i + 1 },
        triggerTime
      });
      count++;
    }
  }

  return notifications;
}

export const notificationsScript = /*javascript*/ `
function getNotificationsModule() {
  return {
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    currentTimeTick: Date.now(),
    lastNotifiedTimes: {},
    reminderInterval: null,
    bgWorker: null,

    getVnDateParts(dateOrMsOrStr) {
      let ms;
      if (!dateOrMsOrStr) {
        ms = Date.now();
      } else if (typeof dateOrMsOrStr === 'number') {
        ms = dateOrMsOrStr;
      } else if (dateOrMsOrStr instanceof Date) {
        ms = dateOrMsOrStr.getTime();
      } else {
        const s = String(dateOrMsOrStr).trim();
        const match = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})[T ]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?/);
        if (match && !s.endsWith('Z') && !/[+-][0-9]{2}:[0-9]{2}$/.test(s)) {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          const hours = parseInt(match[4], 10);
          const minutes = parseInt(match[5], 10);
          const seconds = match[6] ? parseInt(match[6], 10) : 0;
          const pad = (n) => String(n).padStart(2, '0');
          return {
            year, month, day, hours, minutes, seconds,
            timeStr: pad(hours) + ':' + pad(minutes),
            dateStr: year + '-' + pad(month + 1) + '-' + pad(day),
            inputStr: year + '-' + pad(month + 1) + '-' + pad(day) + 'T' + pad(hours) + ':' + pad(minutes),
            dayOfWeek: new Date(year, month, day).getDay()
          };
        }
        const d = new Date(s);
        ms = isNaN(d.getTime()) ? Date.now() : d.getTime();
      }

      const vnTime = new Date(ms + 7 * 3600 * 1000);
      const year = vnTime.getUTCFullYear();
      const month = vnTime.getUTCMonth();
      const day = vnTime.getUTCDate();
      const dayOfWeek = vnTime.getUTCDay();
      const hours = vnTime.getUTCHours();
      const minutes = vnTime.getUTCMinutes();
      const seconds = vnTime.getUTCSeconds();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = pad(hours) + ':' + pad(minutes);
      const dateStr = year + '-' + pad(month + 1) + '-' + pad(day);
      const inputStr = year + '-' + pad(month + 1) + '-' + pad(day) + 'T' + pad(hours) + ':' + pad(minutes);
      return { year, month, day, dayOfWeek, hours, minutes, seconds, timeStr, dateStr, inputStr };
    },

    formatVnTime(dateOrMsOrStr) {
      if (!dateOrMsOrStr) return '';
      return this.getVnDateParts(dateOrMsOrStr).timeStr;
    },

    parseDateSafe(dateStr) {
      if (!dateStr) return null;
      const s = String(dateStr).trim();
      if (!s) return null;
      if (s.endsWith('Z') || /[+-][0-9]{2}:[0-9]{2}$/.test(s)) {
        const d = new Date(s);
        if (isNaN(d.getTime())) return null;
        d.setSeconds(0, 0);
        return d;
      }
      const match = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})[T ]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        const utcMs = Date.UTC(year, month, day, hour, minute, 0, 0) - (7 * 3600 * 1000);
        const d = new Date(utcMs);
        if (!isNaN(d.getTime())) return d;
      }
      const fallback = new Date(s);
      if (isNaN(fallback.getTime())) return null;
      fallback.setSeconds(0, 0);
      return fallback;
    },

    getCurrentLocalDatetime() {
      return this.getVnDateParts(Date.now()).inputStr;
    },

    toLocalDatetimeInput(dateStr) {
      if (!dateStr) return '';
      return this.getVnDateParts(dateStr).inputStr;
    },

    formatDateDisplay(dateStr) {
      const d = this.parseDateSafe(dateStr);
      if (!d) return '';

      const vn = this.getVnDateParts(d);
      const nowVn = this.getVnDateParts(Date.now());
      const pad = (n) => String(n).padStart(2, '0');

      const timeStr = vn.timeStr;
      const dateFormatted = pad(vn.day) + '/' + pad(vn.month + 1) + '/' + vn.year;

      if (vn.dateStr === nowVn.dateStr) {
        return 'Hôm nay, ' + timeStr;
      }

      const tomoMs = Date.now() + 24 * 3600 * 1000;
      if (vn.dateStr === this.getVnDateParts(tomoMs).dateStr) {
        return 'Ngày mai, ' + timeStr;
      }

      const yestMs = Date.now() - 24 * 3600 * 1000;
      if (vn.dateStr === this.getVnDateParts(yestMs).dateStr) {
        return 'Hôm qua, ' + timeStr;
      }

      return dateFormatted + ' ' + timeStr;
    },

    formatTodoDueDate(todo) {
      if (!todo || !todo.due_date) return '';
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return '';

      const vn = this.getVnDateParts(d);
      const timeStr = vn.timeStr;
      const pad = (n) => String(n).padStart(2, '0');

      const mode = todo.repeat_mode || 'none';
      if (mode === 'daily') {
        return 'Hàng ngày, ' + timeStr;
      }
      if (mode === 'weekly') {
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return 'Hàng tuần (' + dayNames[vn.dayOfWeek] + '), ' + timeStr;
      }

      const vnNow = this.getVnDateParts(Date.now());
      const targetKey = vn.dateStr;
      const todayKey = vnNow.dateStr;

      const yestMs = Date.now() - 24 * 3600 * 1000;
      const yestKey = this.getVnDateParts(yestMs).dateStr;

      const tomoMs = Date.now() + 24 * 3600 * 1000;
      const tomoKey = this.getVnDateParts(tomoMs).dateStr;

      let datePrefix = '';
      if (targetKey === todayKey) {
        datePrefix = 'Hôm nay';
      } else if (targetKey === yestKey) {
        datePrefix = 'Hôm qua';
      } else if (targetKey === tomoKey) {
        datePrefix = 'Ngày mai';
      } else {
        const day = pad(vn.day);
        const month = pad(vn.month + 1);
        const year = vn.year;
        datePrefix = (year === vnNow.year) ? (day + '/' + month) : (day + '/' + month + '/' + year);
      }
      return datePrefix + ', ' + timeStr;
    },

    formatDateShort(dateStr) {
      if (!dateStr) return '';
      const vn = this.getVnDateParts(dateStr);
      const pad = (n) => String(n).padStart(2, '0');
      return pad(vn.day) + '/' + pad(vn.month + 1) + ' ' + vn.timeStr;
    },

    setQuickDate(type) {
      const vnNow = this.getVnDateParts(Date.now());
      let val = '';
      if (type === 'today-12') {
        val = vnNow.dateStr + 'T12:00';
      } else if (type === 'today-21') {
        val = vnNow.dateStr + 'T21:00';
      } else if (type === 'tomorrow-06') {
        const tomoVn = this.getVnDateParts(Date.now() + 24 * 3600 * 1000);
        val = tomoVn.dateStr + 'T06:00';
      } else if (type === 'weekend') {
        const currentDay = vnNow.dayOfWeek;
        const diff = (0 - currentDay + 7) % 7 || 7;
        const wkndVn = this.getVnDateParts(Date.now() + diff * 24 * 3600 * 1000);
        val = wkndVn.dateStr + 'T08:00';
      }
      this.todoForm.due_datetime = val;
    },

    isOverdue(todo) {
      if (!todo || !todo.due_date || todo.is_completed || todo.deleted_at) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      const nowMs = this.currentTimeTick || Date.now();
      const dueMs = d.getTime();
      // Hết phút thời hạn: nếu đặt 14:15, hết phút 14:15 (tức 14:16:00) là lập tức thành quá hạn
      const minuteEndMs = (d.getSeconds() === 0) ? (dueMs + 60 * 1000) : dueMs;
      return nowMs >= minuteEndMs;
    },

    isTodoForToday(todo, customNowMs) {
      if (!todo || todo.deleted_at) return false;
      const nowMs = typeof customNowMs === 'number' ? customNowMs : (this.currentTimeTick || Date.now());
      const vnNow = this.getVnDateParts(nowMs);
      const mode = todo.repeat_mode || 'none';

      if (mode === 'daily') return true;

      if (mode === 'weekly') {
        if (!todo.due_date) return false;
        const d = this.parseDateSafe(todo.due_date);
        if (!d) return false;
        return this.getVnDateParts(d).dayOfWeek === vnNow.dayOfWeek;
      }

      if (!todo.due_date) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      return this.getVnDateParts(d).dateStr === vnNow.dateStr;
    },

    checkAndResetRecurringTasksLocally(customNowMs) {
      if (!Array.isArray(this.todos) || this.todos.length === 0) return;
      const nowMs = typeof customNowMs === 'number' ? customNowMs : Date.now();
      const vnNow = this.getVnDateParts(nowMs);
      const todayStr = vnNow.dateStr;
      const isAfter0001Today = vnNow.hours > 0 || vnNow.minutes >= 1;

      const currentDay = vnNow.dayOfWeek;
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayTime = nowMs - diffToMonday * 24 * 3600 * 1000;
      const currentWeekMondayStr = this.getVnDateParts(mondayTime).dateStr;
      const isAfterMonday0001 = currentDay !== 1 || vnNow.hours > 0 || vnNow.minutes >= 1;

      let hasChanges = false;
      for (const t of this.todos) {
        if (!t || t.deleted_at || !t.repeat_mode || t.repeat_mode === 'none' || !t.is_completed) continue;
        const lastUpdated = this.parseDateSafe(t.updated_at || t.created_at);
        if (!lastUpdated) continue;
        const lastUpdatedVn = this.getVnDateParts(lastUpdated);

        if (t.repeat_mode === 'daily') {
          if (isAfter0001Today && lastUpdatedVn.dateStr < todayStr) {
            t.is_completed = 0;
            t.status = 'todo';
            t.updated_at = new Date(nowMs).toISOString();
            if (t.subtasks) {
              let subs = Array.isArray(t.subtasks) ? t.subtasks : [];
              if (typeof t.subtasks === 'string') {
                try { subs = JSON.parse(t.subtasks); } catch { subs = []; }
              }
              subs.forEach(st => { st.is_completed = 0; });
              t.subtasks = subs;
            }
            if (t.due_date) {
              const dueVn = this.getVnDateParts(t.due_date);
              const newVnMs = Date.UTC(vnNow.year, vnNow.month, vnNow.day, dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
              t.due_date = new Date(newVnMs).toISOString();
            }
            hasChanges = true;
          }
        } else if (t.repeat_mode === 'weekly') {
          const upDay = lastUpdatedVn.dayOfWeek;
          const upDiffToMon = upDay === 0 ? 6 : upDay - 1;
          const upMonTime = lastUpdated.getTime() - upDiffToMon * 24 * 3600 * 1000;
          const upMonStr = this.getVnDateParts(upMonTime).dateStr;
          if (isAfterMonday0001 && upMonStr < currentWeekMondayStr) {
            t.is_completed = 0;
            t.status = 'todo';
            t.updated_at = new Date(nowMs).toISOString();
            if (t.subtasks) {
              let subs = Array.isArray(t.subtasks) ? t.subtasks : [];
              if (typeof t.subtasks === 'string') {
                try { subs = JSON.parse(t.subtasks); } catch { subs = []; }
              }
              subs.forEach(st => { st.is_completed = 0; });
              t.subtasks = subs;
            }
            if (t.due_date) {
              const dueVn = this.getVnDateParts(t.due_date);
              const dayOffsetFromMonday = dueVn.dayOfWeek === 0 ? 6 : dueVn.dayOfWeek - 1;
              const targetDayMs = mondayTime + dayOffsetFromMonday * 24 * 3600 * 1000;
              const targetVn = this.getVnDateParts(targetDayMs);
              const newWkMs = Date.UTC(targetVn.year, targetVn.month, targetVn.day, dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
              t.due_date = new Date(newWkMs).toISOString();
            }
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        if (typeof this.persistAllData === 'function') {
          this.persistAllData();
        }
        this.syncAllNativeLocalNotifications();
      }
    },

    getPriorityWarningMinutes(priority) {
      const p = String(priority || '').toLowerCase();
      if (p === 'low') return 5;
      if (p === 'medium') return 15;
      if (p === 'high') return 30;
      return 15;
    },

    isImminent(todo) {
      if (!todo || !todo.due_date || todo.is_completed || todo.deleted_at) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      const nowMs = this.currentTimeTick || Date.now();
      const dueMs = d.getTime();
      const minuteEndMs = (d.getSeconds() === 0) ? (dueMs + 60 * 1000) : dueMs;
      if (nowMs >= minuteEndMs) return false;
      const warningMs = this.getPriorityWarningMinutes(todo.priority) * 60 * 1000;
      return (dueMs - nowMs) <= warningMs;
    },

    isWithin30Minutes(todo) {
      return this.isImminent(todo);
    },

    getMinutesRemaining(todo) {
      if (!todo || !todo.due_date) return null;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return null;
      const nowMs = this.currentTimeTick || Date.now();
      const diffMs = d.getTime() - nowMs;
      if (diffMs <= 0) return 0;
      return Math.ceil(diffMs / (60 * 1000));
    },

    formatRemainingDeadlineText(todoOrDue, customNowMs) {
      if (todoOrDue === null || todoOrDue === undefined || todoOrDue === '') return '';
      let dueMs = null;
      if (typeof todoOrDue === 'number') {
        dueMs = todoOrDue;
      } else if (todoOrDue instanceof Date) {
        dueMs = todoOrDue.getTime();
      } else if (typeof todoOrDue === 'object') {
        const d = this.parseDateSafe(todoOrDue.due_date);
        dueMs = d ? d.getTime() : null;
      } else {
        const d = this.parseDateSafe(String(todoOrDue));
        dueMs = d ? d.getTime() : null;
      }
      if (dueMs === null || isNaN(dueMs)) return '';

      const nowMs = typeof customNowMs === 'number' ? customNowMs : (this.currentTimeTick || Date.now());
      const diffMs = dueMs - nowMs;
      if (diffMs <= 0) return 'Đã đến hạn';
      const mins = Math.ceil(diffMs / 60000);
      if (mins <= 0) return 'Đã đến hạn';
      return 'Còn ' + mins + ' phút nữa đến hạn';
    },

    startBackgroundTimerWorker() {
      try {
        if (typeof Worker !== 'undefined') {
          const blobCode = 'let timer = null; self.onmessage = function(e) { if (e.data === "START") { if (timer) clearInterval(timer); timer = setInterval(function() { self.postMessage("TICK"); }, 1000); } else if (e.data === "STOP") { if (timer) clearInterval(timer); } };';
          const blob = new Blob([blobCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          this.bgWorker = new Worker(workerUrl);
          this.bgWorker.onmessage = (e) => {
            if (e.data === 'TICK') {
              this.currentTimeTick = Date.now();
            }
          };
          this.bgWorker.postMessage('START');
        }
      } catch (e) {
        console.warn('Dedicated Web Worker timer not available:', e);
      }
    },

    getNotificationId(idStr) {
      if (!idStr) return 1;
      let hash = 0;
      const s = String(idStr);
      for (let i = 0; i < s.length; i++) {
        hash = ((hash << 5) - hash) + s.charCodeAt(i);
        hash |= 0;
      }
      return (Math.abs(hash) % 2147483647) || 1;
    },

    generateRollingTaskNotifications(todo, nowMs, maxPerTask = 100, soundFile = 'pop_ding.wav') {
      if (!todo || !todo.due_date || todo.is_completed || todo.deleted_at) return [];
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return [];

      const dueTime = d.getTime();
      const minuteEndMs = (d.getSeconds() === 0) ? (dueTime + 60 * 1000) : dueTime;
      if (nowMs >= minuteEndMs) return [];

      const offsetMinutes = Number(todo.reminder_offset) || 0;
      const startAt = dueTime - (offsetMinutes * 60 * 1000);
      const priority = todo.priority || 'Medium';
      // High: 2 giây, Medium: 150 giây, Low: 300 giây
      const intervalMs = (priority === 'High') ? (2 * 1000) : (priority === 'Medium' ? (150 * 1000) : (300 * 1000));
      const baseId = ((this.getNotificationId(todo.id) % 80000) + 1000) * 10000;

      const notifications = [];
      const priorityPrefix = priority === 'High' ? '🚨 [KHẨN CẤP] ' : (priority === 'Medium' ? '⚡ [ƯU TIÊN] ' : '⏰ Nhắc việc: ');
      const dueTimeStr = this.formatVnTime(d);

      let startIndex = 0;
      if (nowMs > startAt) {
        startIndex = Math.max(0, Math.floor((nowMs - startAt) / intervalMs));
      }

      let count = 0;
      for (let i = startIndex; count < maxPerTask; i++) {
        const triggerTime = startAt + (i * intervalMs);
        if (triggerTime >= minuteEndMs) break;

        if (triggerTime > nowMs) {
          const remainingText = this.formatRemainingDeadlineText(dueTime, triggerTime);
          const repeatSuffix = i > 0 ? (' (Nhắc lặp lần ' + (i + 1) + ')') : '';
          notifications.push({
            id: baseId + (i % 10000),
            title: priorityPrefix + (todo.title || 'Công việc cần làm'),
            body: remainingText + ' • Hạn: ' + dueTimeStr + (todo.category ? (' • ' + todo.category) : '') + repeatSuffix,
            schedule: { at: new Date(triggerTime), allowWhileIdle: true },
            sound: soundFile || 'pop_ding.wav',
            actionTypeId: 'TASK_REMINDER_ACTIONS',
            extra: { taskId: todo.id, todoId: todo.id, baseId: baseId, iteration: i + 1 },
            triggerTime
          });
          count++;
        }
      }

      return notifications;
    },

    getDailyBriefingPayloads() {
      const now = Date.now();
      const vnNow = this.getVnDateParts(now);

      // 06:00 sáng VN (tính bằng UTC ms: Date.UTC(year, month, day, 6, 0) - 7h)
      let morningMs = Date.UTC(vnNow.year, vnNow.month, vnNow.day, 6, 0, 0, 0) - (7 * 3600 * 1000);
      if (morningMs <= now) {
        morningMs += 24 * 3600 * 1000;
      }

      // 18:00 tối VN (tính bằng UTC ms: Date.UTC(year, month, day, 18, 0) - 7h)
      let eveningMs = Date.UTC(vnNow.year, vnNow.month, vnNow.day, 18, 0, 0, 0) - (7 * 3600 * 1000);
      if (eveningMs <= now) {
        eveningMs += 24 * 3600 * 1000;
      }

      const pendingTodos = Array.isArray(this.todos) ? this.todos.filter(t => !t.is_completed && !t.deleted_at) : [];
      const pendingCount = pendingTodos.length;
      const highCount = pendingTodos.filter(t => t.priority === 'High').length;
      const soundFile = this.notificationSound || 'pop_ding.wav';

      let morningBody = pendingCount > 0
        ? ('Bạn có ' + pendingCount + ' việc cần làm hôm nay' + (highCount > 0 ? (' (' + highCount + ' việc khẩn cấp)') : '') + '. Chúc bạn ngày mới hiệu quả!')
        : 'Bạn chưa có việc nào hôm nay. Hãy bắt đầu lên kế hoạch ngay!';

      let eveningBody = pendingCount > 0
        ? ('Còn ' + pendingCount + ' việc chưa hoàn thành' + (highCount > 0 ? (' (' + highCount + ' việc khẩn cấp)') : '') + '. Hãy kiểm tra và hoàn thành nhé!')
        : 'Tuyệt vời! Bạn đã hoàn thành toàn bộ mục tiêu hôm nay. Nghỉ ngơi thôi nào! 🎉';

      return [
        {
          id: 999006,
          title: '☀️ Chào buổi sáng! Kế hoạch hôm nay',
          body: morningBody,
          schedule: { at: new Date(morningMs), every: 'day', allowWhileIdle: true },
          sound: soundFile,
          extra: { type: 'daily_briefing_morning' }
        },
        {
          id: 999018,
          title: '🌙 Chào buổi tối! Tổng kết & việc tối nay',
          body: eveningBody,
          schedule: { at: new Date(eveningMs), every: 'day', allowWhileIdle: true },
          sound: soundFile,
          extra: { type: 'daily_briefing_evening' }
        }
      ];
    },

    _nativeNotifInitialized: false,

    async handleLocalNotificationAction(actionPerformed) {
      const actionId = actionPerformed?.actionId;
      const extra = actionPerformed?.notification?.extra || {};
      const taskId = extra.taskId || extra.todoId;

      if ((actionId === 'MARK_DONE' || actionId === 'SNOOZE_10M') && taskId) {
        try {
          const Prefs = window.Capacitor?.Plugins?.Preferences;
          const LN = window.Capacitor?.Plugins?.LocalNotifications;
          const nowMs = Date.now();
          const nowIso = new Date(nowMs).toISOString();
          const vnNow = this.getVnDateParts(nowMs);

          // Đảm bảo nạp đầy đủ todos mới nhất nếu xử lý ngầm lúc vừa mở lại WebView
          if (!Array.isArray(this.todos) || !this.todos.find(t => t.id === taskId)) {
            try {
              let rawTodos = null;
              if (Prefs?.get) {
                const res = await Prefs.get({ key: 'local_todos' });
                if (res && typeof res.value === 'string' && res.value.trim()) rawTodos = res.value;
              }
              if (!rawTodos) rawTodos = localStorage.getItem('local_todos');
              if (rawTodos) {
                const parsed = JSON.parse(rawTodos);
                if (Array.isArray(parsed)) this.todos = parsed;
              }
            } catch {}
          }

          const targetTodo = Array.isArray(this.todos) ? this.todos.find(t => t.id === taskId) : null;
          if (targetTodo && actionId === 'MARK_DONE' && !targetTodo.is_completed) {
            targetTodo.is_completed = 1;
            targetTodo.status = 'completed';
            targetTodo.updated_at = nowIso;

            if (!Array.isArray(this.completionHistory) || this.completionHistory.length === 0) {
              try {
                let rawHist = null;
                if (Prefs?.get) {
                  const hRes = await Prefs.get({ key: 'local_completion_history' });
                  if (hRes && typeof hRes.value === 'string' && hRes.value.trim()) rawHist = hRes.value;
                }
                if (!rawHist) rawHist = localStorage.getItem('local_completion_history');
                if (rawHist) {
                  const parsedHist = JSON.parse(rawHist);
                  if (Array.isArray(parsedHist)) this.completionHistory = parsedHist;
                }
              } catch {}
            }

            if (!Array.isArray(this.completionHistory)) this.completionHistory = [];
            this.completionHistory.push({
              id: 'hist_' + nowMs + '_' + Math.random().toString(36).substring(2, 8),
              todo_id: targetTodo.id,
              task_title: targetTodo.title,
              completed_at: nowIso,
              date_str: vnNow.dateStr,
              category: targetTodo.category,
              priority: targetTodo.priority,
              actual_minutes: targetTodo.actual_minutes || 0,
              created_at: nowIso
            });

            if (targetTodo.repeat_mode && targetTodo.repeat_mode !== 'none' && targetTodo.due_date) {
              const d = new Date(targetTodo.due_date);
              if (!isNaN(d.getTime())) {
                const increment = targetTodo.repeat_mode === 'daily' ? 1 : 7;
                d.setDate(d.getDate() + increment);
                while (d.getTime() < nowMs) {
                  d.setDate(d.getDate() + increment);
                }
                targetTodo.due_date = d.toISOString();
              }
            }

            if (typeof this.persistAllData === 'function') {
              await this.persistAllData();
            } else {
              const todosStr = JSON.stringify(this.todos || []);
              const histStr = JSON.stringify(this.completionHistory || []);
              localStorage.setItem('local_todos', todosStr);
              localStorage.setItem('local_completion_history', histStr);
              if (Prefs?.set) {
                await Promise.all([
                  Prefs.set({ key: 'local_todos', value: todosStr }),
                  Prefs.set({ key: 'local_completion_history', value: histStr })
                ]);
              }
            }
          } else if (targetTodo && actionId === 'SNOOZE_10M') {
            const snoozeTargetMs = nowMs + 10 * 60 * 1000;
            targetTodo.due_date = new Date(snoozeTargetMs).toISOString();
            targetTodo.reminder_offset = 0;
            targetTodo.updated_at = nowIso;

            if (typeof this.persistAllData === 'function') {
              await this.persistAllData();
            } else {
              const todosStr = JSON.stringify(this.todos || []);
              localStorage.setItem('local_todos', todosStr);
              if (Prefs?.set) {
                await Prefs.set({ key: 'local_todos', value: todosStr });
              }
            }
          }

          if (LN) {
            const baseId = ((this.getNotificationId(taskId) % 80000) + 1000) * 10000;
            try {
              const pending = await LN.getPending();
              if (pending?.notifications?.length > 0) {
                const toCancel = pending.notifications
                  .filter(n => n.extra?.taskId === taskId || n.extra?.todoId === taskId || (n.id >= baseId && n.id < baseId + 10000))
                  .map(n => ({ id: n.id }));
                if (toCancel.length > 0) {
                  await LN.cancel({ notifications: toCancel }).catch(() => {});
                }
              }
            } catch {}

            try {
              const delivered = await LN.getDeliveredNotifications();
              const deliveredList = Array.isArray(delivered?.notifications) ? delivered.notifications : [];
              const toRemove = deliveredList.filter(n =>
                n.extra?.taskId === taskId ||
                n.extra?.todoId === taskId ||
                (n.id >= baseId && n.id < baseId + 10000) ||
                (actionPerformed?.notification?.id != null && n.id === actionPerformed.notification.id)
              );
              if (toRemove.length > 0) {
                await LN.removeDeliveredNotifications({ notifications: toRemove }).catch(() => {});
              } else if (actionPerformed?.notification?.id != null) {
                await LN.removeDeliveredNotifications({ notifications: [actionPerformed.notification] }).catch(() => {});
              }
            } catch {}
          }

          await this._doSyncAllNativeLocalNotifications();
          return;
        } catch (err) {
          console.warn('handleLocalNotificationAction error:', err);
        }
      }

      this.syncAllNativeLocalNotifications();
    },

    async initNativeLocalNotifications() {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      if (this._nativeNotifInitialized) return;
      this._nativeNotifInitialized = true;
      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        const perm = await LN.checkPermissions();
        if (perm.display !== 'granted') {
          await LN.requestPermissions();
        }

        // Đăng ký Action Type có nút "Đã xong" chạy ngầm không mở bung app
        try {
          await LN.registerActionTypes({
            types: [
              {
                id: 'TASK_REMINDER_ACTIONS',
                actions: [
                  {
                    id: 'MARK_DONE',
                    title: 'Đã xong',
                    foreground: false
                  },
                  {
                    id: 'SNOOZE_10M',
                    title: 'Nhắc lại sau 10 phút',
                    foreground: false
                  }
                ]
              }
            ]
          });
        } catch (regErr) {
          console.warn('registerActionTypes error:', regErr);
        }

        // Lắng nghe sự kiện thông báo được gửi đến thiết bị (Rolling Queue replenishment)
        LN.addListener('localNotificationReceived', () => {
          this.syncAllNativeLocalNotifications();
        });

        // Lắng nghe sự kiện người dùng bấm nút hành động (ví dụ "Đã xong") hoặc chạm vào thông báo
        LN.addListener('localNotificationActionPerformed', (notificationAction) => {
          this.handleLocalNotificationAction(notificationAction);
        });

        // Lắng nghe khi app trở lại trạng thái active
        if (window.Capacitor?.Plugins?.App) {
          window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
            if (state.isActive) {
              this.syncAllNativeLocalNotifications();
            }
          });
        }

        // Lắng nghe visibilitychange và focus của cửa sổ WebView
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            this.syncAllNativeLocalNotifications();
          }
        });
        window.addEventListener('focus', () => {
          this.syncAllNativeLocalNotifications();
        });

        await this.syncAllNativeLocalNotifications();
      } catch (e) {
        console.warn('Native LocalNotifications init error:', e);
      }
    },

    async scheduleNativeLocalNotification(todo) {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      this.syncAllNativeLocalNotifications();
    },

    async cancelNativeLocalNotification(todoId) {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      if (!todoId) return;
      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        const baseId = ((this.getNotificationId(todoId) % 80000) + 1000) * 10000;
        const pending = await LN.getPending();
        if (pending && pending.notifications && pending.notifications.length > 0) {
          const toCancel = pending.notifications
            .filter(n => n.extra?.taskId === todoId || n.extra?.todoId === todoId || (n.id >= baseId && n.id < baseId + 10000))
            .map(n => ({ id: n.id }));
          if (toCancel.length > 0) {
            await LN.cancel({ notifications: toCancel }).catch(() => {});
          }
        }
        try {
          const delivered = await LN.getDeliveredNotifications();
          const toRemove = (delivered?.notifications || []).filter(
            n => n.extra?.taskId === todoId || n.extra?.todoId === todoId || (n.id >= baseId && n.id < baseId + 10000)
          );
          if (toRemove.length > 0) {
            await LN.removeDeliveredNotifications({ notifications: toRemove }).catch(() => {});
          }
        } catch {}
        this.syncAllNativeLocalNotifications();
      } catch (e) {
        console.warn('cancelNativeLocalNotification error:', e);
      }
    },

    _isSyncingLocalNotifications: false,
    _syncTimeout: null,

    syncAllNativeLocalNotifications() {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      if (this._syncTimeout) clearTimeout(this._syncTimeout);
      this._syncTimeout = setTimeout(() => {
        this._doSyncAllNativeLocalNotifications();
      }, 50);
    },

    async _doSyncAllNativeLocalNotifications() {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      if (this._isSyncingLocalNotifications) return;
      this._isSyncingLocalNotifications = true;

      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        const pending = await LN.getPending();
        if (pending && pending.notifications && pending.notifications.length > 0) {
          await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) }).catch(() => {});
        }

        if (this.notificationsEnabled === false) return;

        const now = Date.now();
        const allToSchedule = [];

        // 1. Cố định 2 slot Daily Briefing 06:00 và 18:00
        const briefings = this.getDailyBriefingPayloads();
        allToSchedule.push(...briefings);

        // 2. Rolling Queue: Tối đa 60 slot cho các việc sắp đến hạn nhất (Tổng <= 64 slot của iOS)
        if (Array.isArray(this.todos)) {
          const validTodos = this.todos.filter(t => !t.is_completed && !t.deleted_at && t.due_date);
          const candidateNotifications = [];

          const soundFile = this.notificationSound || 'pop_ding.wav';
          for (const t of validTodos) {
            const taskNotifs = this.generateRollingTaskNotifications(t, now, 100, soundFile);
            candidateNotifications.push(...taskNotifs);
          }

          // Sắp xếp các mốc nhắc lặp theo thời gian kích hoạt tăng dần
          candidateNotifications.sort((a, b) => a.triggerTime - b.triggerTime);

          // Cắt tối đa 60 thông báo tiếp theo
          const top60 = candidateNotifications.slice(0, 60).map(n => ({
            id: n.id,
            title: n.title,
            body: n.body,
            schedule: n.schedule,
            sound: n.sound,
            actionTypeId: n.actionTypeId,
            extra: n.extra
          }));

          allToSchedule.push(...top60);
        }

        if (allToSchedule.length > 0) {
          await LN.schedule({ notifications: allToSchedule });
        }
      } catch (e) {
        console.warn('syncAllNativeLocalNotifications error:', e);
      } finally {
        this._isSyncingLocalNotifications = false;
      }
    }
  };
}
`;
