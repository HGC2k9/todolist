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

export const notificationsScript = /*javascript*/ `
function getNotificationsModule() {
  return {
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
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

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diffDays = Math.round((startOfTarget - startOfToday) / (24 * 3600 * 1000));

      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateFormatted = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (diffDays === 0) {
        return 'Hôm nay, ' + timeStr;
      } else if (diffDays === 1) {
        return 'Ngày mai, ' + timeStr;
      } else if (diffDays === -1) {
        return 'Hôm qua, ' + timeStr;
      } else if (diffDays > 1 && diffDays <= 7) {
        return diffDays + ' ngày nữa (' + timeStr + ')';
      } else if (diffDays < -1 && diffDays >= -7) {
        return Math.abs(diffDays) + ' ngày trước';
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
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const format = (d, h, m) => {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(h) + ':' + pad(m);
      };

      let val = '';
      if (type === 'today-12') {
        val = format(now, 12, 0);
      } else if (type === 'today-21') {
        val = format(now, 21, 0);
      } else if (type === 'tomorrow-06') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        val = format(tomorrow, 6, 0);
      } else if (type === 'weekend') {
        const weekend = new Date(now);
        const day = weekend.getDay();
        const diff = (0 - day + 7) % 7 || 7;
        weekend.setDate(weekend.getDate() + diff);
        val = format(weekend, 8, 0);
      }
      this.todoForm.due_datetime = val;
    },

    isOverdue(todo) {
      if (!todo.due_date || todo.is_completed) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      const now = new Date();
      now.setSeconds(0, 0);
      return d.getTime() < now.getTime();
    },

    isTodoForToday(todo) {
      if (!todo) return false;
      const todayStr = this.getVnDateParts(Date.now()).dateStr;

      if (todo.due_date) {
        const d = this.parseDateSafe(todo.due_date);
        if (d) {
          const dueStr = this.getVnDateParts(d).dateStr;
          if (dueStr === todayStr) return true;
        }
      }
      if (todo.repeat_mode === 'daily') return true;
      if (todo.is_completed) {
        const d = this.parseDateSafe(todo.updated_at || todo.created_at);
        if (d) {
          const compStr = this.getVnDateParts(d).dateStr;
          if (compStr === todayStr) return true;
        }
      }
      if (!todo.due_date && todo.created_at) {
        const d = this.parseDateSafe(todo.created_at);
        if (d) {
          const createStr = this.getVnDateParts(d).dateStr;
          if (createStr === todayStr) return true;
        }
      }
      return false;
    },

    checkAndResetRecurringTasksLocally() {
      if (!Array.isArray(this.todos) || this.todos.length === 0) return;
      const vnNow = this.getVnDateParts(Date.now());
      const todayStr = vnNow.dateStr;

      const currentDay = vnNow.dayOfWeek;
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayTime = Date.now() - diffToMonday * 24 * 3600 * 1000;
      const currentWeekMondayStr = this.getVnDateParts(mondayTime).dateStr;

      let hasChanges = false;
      for (const t of this.todos) {
        if (!t.repeat_mode || t.repeat_mode === 'none' || !t.is_completed) continue;
        const lastUpdated = this.parseDateSafe(t.updated_at || t.created_at);
        if (!lastUpdated) continue;
        const lastUpdatedVn = this.getVnDateParts(lastUpdated);

        if (t.repeat_mode === 'daily') {
          if (lastUpdatedVn.dateStr < todayStr) {
            t.is_completed = 0;
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
          if (upMonStr < currentWeekMondayStr) {
            t.is_completed = 0;
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
              const targetDayMs = (Date.now() - diffToMonday * 24 * 3600 * 1000) + dayOffsetFromMonday * 24 * 3600 * 1000;
              const targetVn = this.getVnDateParts(targetDayMs);
              const newWkMs = Date.UTC(targetVn.year, targetVn.month, targetVn.day, dueVn.hours, dueVn.minutes, 0) - (7 * 3600 * 1000);
              t.due_date = new Date(newWkMs).toISOString();
            }
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        this.saveCachedTodos();
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
      if (!todo || !todo.due_date || todo.is_completed) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      const diffMs = d.getTime() - Date.now();
      const warningMs = this.getPriorityWarningMinutes(todo.priority) * 60 * 1000;
      return diffMs > 0 && diffMs <= warningMs;
    },

    isWithin30Minutes(todo) {
      return this.isImminent(todo);
    },

    getMinutesRemaining(todo) {
      if (!todo || !todo.due_date) return null;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return null;
      return Math.ceil((d.getTime() - Date.now()) / (60 * 1000));
    },

    startBackgroundTimerWorker() {
      try {
        if (typeof Worker !== 'undefined') {
          const blobCode = 'let timer = null; self.onmessage = function(e) { if (e.data === "START") { if (timer) clearInterval(timer); timer = setInterval(function() { self.postMessage("TICK"); }, 4000); } else if (e.data === "STOP") { if (timer) clearInterval(timer); } };';
          const blob = new Blob([blobCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          this.bgWorker = new Worker(workerUrl);
          this.bgWorker.onmessage = (e) => {
            if (e.data === 'TICK' && this.authenticated) {
              this.checkDueReminders();
            }
          };
          this.bgWorker.postMessage('START');
        }
      } catch (e) {
        console.warn('Dedicated Web Worker timer not available:', e);
      }
    },

    checkDueReminders() {
      if (!this.todos || this.todos.length === 0) return;
      const now = Date.now();
      const FIVE_MINUTES_MS = 5 * 60 * 1000;

      this.todos.forEach(todo => {
        if (todo.is_completed || !todo.due_date) return;
        const d = this.parseDateSafe(todo.due_date);
        if (!d) return;

        const timeLeftMs = d.getTime() - now;
        const minutesLeft = Math.ceil(timeLeftMs / (60 * 1000));
        const warningWindow = this.getPriorityWarningMinutes(todo.priority);

        if (minutesLeft >= 0 && minutesLeft <= warningWindow) {
          const lastTime = this.lastNotifiedTimes[todo.id] || 0;
          const isRecurring = (todo.priority === 'High' || todo.priority === 'Medium');
          const shouldNotify = isRecurring ? (now - lastTime >= FIVE_MINUTES_MS) : (!lastTime);

          if (shouldNotify) {
            this.lastNotifiedTimes[todo.id] = now;
            this.playChime();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            this.showToast('⏰ Sắp hết hạn trong ' + minutesLeft + ' phút! Việc "' + todo.title + '"', 'warning');
          }
        }
      });
    },

    testInAppAlert() {
      this.playChime();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      this.showToast('🔔 Âm thanh và thông báo nhắc việc đang hoạt động hoàn hảo!', 'info');
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

      const pendingTodos = Array.isArray(this.todos) ? this.todos.filter(t => !t.is_completed) : [];
      const pendingCount = pendingTodos.length;
      const highCount = pendingTodos.filter(t => t.priority === 'High').length;

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
          sound: 'beep.caf',
          extra: { type: 'daily_briefing_morning' }
        },
        {
          id: 999018,
          title: '🌙 Chào buổi tối! Tổng kết & việc tối nay',
          body: eveningBody,
          schedule: { at: new Date(eveningMs), every: 'day', allowWhileIdle: true },
          sound: 'beep.caf',
          extra: { type: 'daily_briefing_evening' }
        }
      ];
    },

    async initNativeLocalNotifications() {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        const perm = await LN.checkPermissions();
        if (perm.display !== 'granted') {
          await LN.requestPermissions();
        }
        LN.addListener('localNotificationActionPerformed', (notification) => {
          const todoId = notification?.notification?.extra?.todoId;
          if (todoId) {
            this.cancelNativeLocalNotification(todoId);
          }
        });
      } catch (e) {
        console.warn('Native LocalNotifications init error:', e);
      }
    },

    async scheduleNativeLocalNotification(todo) {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      if (!todo || !todo.due_date || todo.is_completed) return;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return;

      const offsetMinutes = Number(todo.reminder_offset) || 0;
      const dueTime = d.getTime();
      const startAt = dueTime - (offsetMinutes * 60 * 1000);
      const now = Date.now();

      const priority = todo.priority || 'Medium';
      const intervalMs = (priority === 'High') ? 60 * 1000 : (priority === 'Medium' ? 3 * 60 * 1000 : 5 * 60 * 1000);
      const baseId = ((this.getNotificationId(todo.id) % 90000) + 1000) * 10;
      const notifications = [];

      for (let i = 0; i < 8; i++) {
        const triggerTime = startAt + (i * intervalMs);
        if (triggerTime > dueTime + (intervalMs * 2)) break;
        if (triggerTime > now) {
          const priorityPrefix = priority === 'High' ? '🚨 [KHẨN CẤP] ' : (priority === 'Medium' ? '⚡ [ƯU TIÊN] ' : '⏰ Nhắc việc: ');
          const dueTimeStr = d ? this.formatVnTime(d) : '';
          const repeatSuffix = i > 0 ? (' (Nhắc lặp lần ' + (i + 1) + ')') : '';
          notifications.push({
            id: baseId + i,
            title: priorityPrefix + (todo.title || 'Công việc cần làm'),
            body: 'Hạn: ' + dueTimeStr + (todo.category ? (' • ' + todo.category) : '') + repeatSuffix,
            schedule: { at: new Date(triggerTime), allowWhileIdle: true },
            sound: 'beep.caf',
            extra: { todoId: todo.id, baseId: baseId }
          });
        }
      }

      if (notifications.length === 0) return;

      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        await this.cancelNativeLocalNotification(todo.id);
        await LN.schedule({ notifications });
      } catch (e) {
        console.warn('scheduleNativeLocalNotification error:', e);
      }
    },

    async cancelNativeLocalNotification(todoId) {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      if (!todoId) return;
      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        const baseId = ((this.getNotificationId(todoId) % 90000) + 1000) * 10;
        const toCancel = [];
        for (let i = 0; i < 10; i++) {
          toCancel.push({ id: baseId + i });
        }
        await LN.cancel({ notifications: toCancel }).catch(() => {});
      } catch (e) {
        console.warn('cancelNativeLocalNotification error:', e);
      }
    },

    async syncAllNativeLocalNotifications() {
      if (!window.Capacitor?.isPluginAvailable?.('LocalNotifications')) return;
      try {
        const LN = window.Capacitor.Plugins.LocalNotifications;
        const pending = await LN.getPending();
        if (pending && pending.notifications && pending.notifications.length > 0) {
          await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) }).catch(() => {});
        }

        const now = Date.now();
        const allToSchedule = [];

        // 1. Cố định 2 mốc Daily Briefing 06:00 và 18:00
        const briefings = this.getDailyBriefingPayloads();
        allToSchedule.push(...briefings);

        // 2. Lên lịch nhắc việc lặp theo độ ưu tiên (tối đa 50 thông báo để tổng <= 52 trên iOS)
        if (Array.isArray(this.todos)) {
          const validTodos = this.todos.filter(t => !t.is_completed && t.due_date);
          const taskNotifications = [];

          for (const t of validTodos) {
            const d = this.parseDateSafe(t.due_date);
            if (!d) continue;

            const offsetMinutes = Number(t.reminder_offset) || 0;
            const dueTime = d.getTime();
            const startAt = dueTime - (offsetMinutes * 60 * 1000);
            const priority = t.priority || 'Medium';
            const intervalMs = (priority === 'High') ? 60 * 1000 : (priority === 'Medium' ? 3 * 60 * 1000 : 5 * 60 * 1000);
            const baseId = ((this.getNotificationId(t.id) % 90000) + 1000) * 10;

            for (let i = 0; i < 8; i++) {
              const triggerTime = startAt + (i * intervalMs);
              if (triggerTime > dueTime + (intervalMs * 2)) break;
              if (triggerTime > now) {
                const priorityPrefix = priority === 'High' ? '🚨 [KHẨN CẤP] ' : (priority === 'Medium' ? '⚡ [ƯU TIÊN] ' : '⏰ Nhắc việc: ');
                const dueTimeStr = d ? this.formatVnTime(d) : '';
                const repeatSuffix = i > 0 ? (' (Nhắc lặp lần ' + (i + 1) + ')') : '';
                taskNotifications.push({
                  id: baseId + i,
                  title: priorityPrefix + (t.title || 'Công việc cần làm'),
                  body: 'Hạn: ' + dueTimeStr + (t.category ? (' • ' + t.category) : '') + repeatSuffix,
                  schedule: { at: new Date(triggerTime), allowWhileIdle: true },
                  sound: 'beep.caf',
                  extra: { todoId: t.id, baseId: baseId }
                });
              }
            }
          }

          taskNotifications.sort((a, b) => a.schedule.at.getTime() - b.schedule.at.getTime());
          allToSchedule.push(...taskNotifications.slice(0, 50));
        }

        if (allToSchedule.length > 0) {
          await LN.schedule({ notifications: allToSchedule });
        }
      } catch (e) {
        console.warn('syncAllNativeLocalNotifications error:', e);
      }
    }
  };
}
`;
