// ============================================================
// Client Module: Pure-Local Storage & Offline Data Management
// (Capacitor Preferences + LocalStorage, 0ms CRUD, Native iOS Share)
// ============================================================

export const storageScript = /*javascript*/ `
function getStorageModule() {
  return {
    todos: (() => {
      try {
        const local = localStorage.getItem('local_todos');
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    })(),

    categories: (() => {
      try {
        const local = localStorage.getItem('local_categories');
        const cats = local ? JSON.parse(local) : null;
        return Array.isArray(cats) && cats.length > 0 ? cats : ['Personal', 'Work', 'Study', 'Health', 'Shopping', 'Finance'];
      } catch (e) {
        return ['Personal', 'Work', 'Study', 'Health', 'Shopping', 'Finance'];
      }
    })(),

    completionHistory: (() => {
      try {
        const local = localStorage.getItem('local_completion_history');
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    })(),

    todoImagesMap: (() => {
      try {
        const local = localStorage.getItem('local_todo_images');
        return local ? JSON.parse(local) : {};
      } catch (e) {
        return {};
      }
    })(),

    todosLoading: false,
    todoSaving: false,
    activeTab: 'all',
    searchQuery: '',
    selectedCategory: '',
    selectedPriority: '',
    showCompleted: true,
    showModal: false,
    showDeleteModal: false,
    showClearCompletedModal: false,
    showTrashModal: false,
    showAnalyticsModal: false,
    draggedTodo: null,
    todoToDelete: null,
    deletingTodo: null,
    showCompletionModal: false,
    completingTodo: null,
    completingProofPhoto: null,
    completingUploadingPhoto: false,
    trashLoading: false,
    analyticsLoading: false,
    confirmDialog: {
      show: false,
      title: '',
      message: '',
      confirmText: 'Đồng ý',
      cancelText: 'Hủy',
      isDanger: false,
      icon: '⚠️',
      onConfirm: null
    },
    editingTodo: null,
    editingTodoImages: [],
    customCategoryMode: false,
    newCategoryName: '',
    newSubtaskInput: '',
    newTagInput: '',
    lightboxImage: null,
    showLightbox: false,
    compactMode: localStorage.getItem('compactMode') === 'true',
    swipedTodoId: null,
    pullRefreshY: 0,
    pullRefreshing: false,
    _pullStartY: 0,
    _isPullingRefresh: false,

    todoForm: {
      title: '',
      description: '',
      category: 'Personal',
      priority: 'Medium',
      repeat_mode: 'none',
      due_datetime: '',
      daily_time: '18:00',
      weekly_day: 1,
      weekly_time: '18:00',
      is_pinned: false,
      pomodoro_mode: false,
      subtasks: [],
      tags: [],
      reminder_offset: 0,
      estimated_minutes: 0,
      actual_minutes: 0
    },

    // ─── LƯU TRỮ CỤC BỘ BẤT BIẾN (CAPACITOR PREFERENCES + LOCALSTORAGE) ───
    async saveToPreferences(key, value) {
      try {
        const str = JSON.stringify(value);
        localStorage.setItem(key, str);
        const Prefs = window.Capacitor?.Plugins?.Preferences;
        if (Prefs?.set) {
          await Prefs.set({ key, value: str });
        }
      } catch (err) {
        console.warn('saveToPreferences error:', err);
      }
    },

    async loadFromPreferences(key, defaultVal) {
      try {
        const Prefs = window.Capacitor?.Plugins?.Preferences;
        if (Prefs?.get) {
          const res = await Prefs.get({ key });
          if (res && typeof res.value === 'string' && res.value.trim()) {
            return JSON.parse(res.value);
          }
        }
        const local = localStorage.getItem(key);
        if (local) return JSON.parse(local);
      } catch (err) {
        console.warn('loadFromPreferences error:', err);
      }
      return defaultVal;
    },

    async persistAllData() {
      await Promise.all([
        this.saveToPreferences('local_todos', this.todos),
        this.saveToPreferences('local_categories', this.categories),
        this.saveToPreferences('local_completion_history', this.completionHistory),
        this.saveToPreferences('local_todo_images', this.todoImagesMap)
      ]);
    },

    async initStorage() {
      try {
        const [loadedTodos, loadedCats, loadedHist, loadedImgs] = await Promise.all([
          this.loadFromPreferences('local_todos', this.todos),
          this.loadFromPreferences('local_categories', this.categories),
          this.loadFromPreferences('local_completion_history', this.completionHistory),
          this.loadFromPreferences('local_todo_images', this.todoImagesMap)
        ]);

        if (Array.isArray(loadedTodos) && loadedTodos.length > 0) {
          this.todos = loadedTodos;
        }
        if (Array.isArray(loadedCats) && loadedCats.length > 0) {
          this.categories = loadedCats;
        }
        if (Array.isArray(loadedHist) && loadedHist.length > 0) {
          this.completionHistory = loadedHist;
        }
        if (loadedImgs && typeof loadedImgs === 'object') {
          this.todoImagesMap = loadedImgs;
        }
      } catch (e) {
        console.warn('initStorage error:', e);
      }
    },

    // ─── HELPERS ───
    getSubtasks(todo) {
      if (!todo || !todo.subtasks) return [];
      let list = [];
      if (Array.isArray(todo.subtasks)) {
        list = todo.subtasks;
      } else {
        try {
          const parsed = JSON.parse(todo.subtasks);
          list = Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      const seenIds = new Set();
      return list.map((st, idx) => {
        if (!st || typeof st !== 'object') {
          return { id: 'st_' + (todo.id || 't') + '_' + idx, title: String(st || ''), is_completed: 0 };
        }
        let id = st.id;
        if (!id || seenIds.has(id)) {
          id = 'st_' + (todo.id || 't') + '_' + idx + '_' + Math.random().toString(36).slice(2, 6);
          st.id = id;
        }
        seenIds.add(id);
        return st;
      });
    },

    getTags(todo) {
      if (!todo || !todo.tags) return [];
      if (Array.isArray(todo.tags)) return todo.tags;
      try {
        const parsed = JSON.parse(todo.tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },

    generateLocalId(prefix = 'task') {
      return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    },

    toggleCompactMode() {
      this.compactMode = !this.compactMode;
      try { localStorage.setItem('compactMode', String(this.compactMode)); } catch {}
      if (typeof this.triggerHaptic === 'function') this.triggerHaptic('light');
      if (typeof this.playSound === 'function') this.playSound('click');
      this.showToast(this.compactMode ? 'Đã bật chế độ hiển thị Gọn' : 'Đã bật chế độ hiển thị Chi tiết', 'info');
    },

    parseQuickTaskText(rawText) {
      let text = String(rawText || '').trim();
      if (text.startsWith('/add')) text = text.substring(4).trim();

      const tags = [];
      const tagRegex = /#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;
      let m;
      while ((m = tagRegex.exec(text)) !== null) {
        tags.push(m[1].toLowerCase());
      }
      let cleanText = text.replace(tagRegex, '').trim();

      let priority = 'Medium';
      if (/!high\b/i.test(cleanText)) {
        priority = 'High';
        cleanText = cleanText.replace(/!high\b/gi, '').trim();
      } else if (/!low\b/i.test(cleanText)) {
        priority = 'Low';
        cleanText = cleanText.replace(/!low\b/gi, '').trim();
      } else if (/!medium\b/i.test(cleanText)) {
        priority = 'Medium';
        cleanText = cleanText.replace(/!medium\b/gi, '').trim();
      } else {
        const lower = cleanText.toLowerCase();
        if (lower.includes('gấp') || lower.includes('khẩn cấp') || lower.includes('quan trọng') || lower.includes('urgent') || lower.includes('high') || tags.includes('gap')) {
          priority = 'High';
        } else if (lower.includes('thấp') || lower.includes('thong thả') || lower.includes('rảnh') || lower.includes('low')) {
          priority = 'Low';
        }
      }

      let category = 'Personal';
      if (tags.includes('work') || /họp|báo\s*cáo|dự\s*án|khách|hợp\s*đồng|công\s*việc|task|code|deadline|email|mail|sếp|công\s*ty|văn\s*phòng/i.test(cleanText)) {
        category = 'Work';
      } else if (tags.includes('study') || /học|bài\s*tập|thi|ôn\s*tập|đọc\s*sách|sách|khóa\s*học|nghiên\s*cứu|tiếng\s*anh/i.test(cleanText)) {
        category = 'Study';
      } else if (tags.includes('health') || /thuốc|khám|bác\s*sĩ|bệnh|chạy\s*bộ|gym|thể\s*dục|yoga|sức\s*khỏe|uống\s*nước/i.test(cleanText)) {
        category = 'Health';
      } else if (tags.includes('shopping') || /mua|sắm|chợ|siêu\s*thị|order|đặt\s*hàng|shopping/i.test(cleanText)) {
        category = 'Shopping';
      } else if (tags.includes('finance') || /tiền|lương|hóa\s*đơn|thanh\s*toán|chuyển\s*khoản|ngân\s*hàng|nợ/i.test(cleanText)) {
        category = 'Finance';
      }

      let dueDate = null;
      const now = new Date();
      const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
      let targetYear = vnNow.getUTCFullYear();
      let targetMonth = vnNow.getUTCMonth();
      let targetDate = vnNow.getUTCDate();
      let targetHour = null;
      let targetMinute = 0;

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

      const kemMatch = cleanText.match(/(\d{1,2})\s*(?:h|:|giờ)\s*kém\s*(\d{1,2})/i);
      const ruoiMatch = cleanText.match(/(\d{1,2})\s*(?:h|:|giờ)?\s*rưỡi/i);
      const timeMatch = cleanText.match(/(\d{1,2})(?:h|:)(\d{2})?/i) || cleanText.match(/(\d{1,2})\s*(?:giờ|g)/i);

      if (kemMatch) {
        let h = parseInt(kemMatch[1], 10) - 1;
        const mMin = 60 - parseInt(kemMatch[2], 10);
        if (h < 0) h = 23;
        if (isAfternoonOrEvening && h < 12) h += 12;
        if (h >= 0 && h <= 23 && mMin >= 0 && mMin <= 59) {
          targetHour = h;
          targetMinute = mMin;
          cleanText = cleanText.replace(kemMatch[0], '').trim();
        }
      } else if (ruoiMatch) {
        let h = parseInt(ruoiMatch[1], 10);
        if (isAfternoonOrEvening && h < 12) h += 12;
        if (h >= 0 && h <= 23) {
          targetHour = h;
          targetMinute = 30;
          cleanText = cleanText.replace(ruoiMatch[0], '').trim();
        }
      } else if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const mMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        if (isAfternoonOrEvening && h < 12) h += 12;
        if (h >= 0 && h <= 23 && mMin >= 0 && mMin <= 59) {
          targetHour = h;
          targetMinute = mMin;
          cleanText = cleanText.replace(timeMatch[0], '').trim();
        }
      }

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

      let title = cleanText || text || 'Công việc mới';
      if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
      return { title, dueDate, priority, tags, category };
    },

    async quickAddFromText(rawText) {
      const val = String(rawText || '').trim();
      if (!val) return;
      const parsed = this.parseQuickTaskText(val);
      const nowIso = new Date().toISOString();
      const maxPos = this.todos.reduce((max, t) => Math.max(max, typeof t.position === 'number' ? t.position : 0), 0);
      const newTodo = {
        id: this.generateLocalId('task'),
        title: parsed.title,
        description: '',
        category: parsed.category || 'Personal',
        priority: parsed.priority || 'Medium',
        repeat_mode: 'none',
        due_date: parsed.dueDate,
        is_pinned: 0,
        pomodoro_mode: 0,
        subtasks: [],
        tags: parsed.tags || [],
        reminder_offset: 0,
        estimated_minutes: 0,
        actual_minutes: 0,
        status: 'todo',
        is_completed: 0,
        deleted_at: null,
        position: maxPos + 1,
        created_at: nowIso,
        updated_at: nowIso
      };
      this.todos.unshift(newTodo);
      this.searchQuery = '';
      await this.persistAllData();
      if (newTodo.due_date) {
        this.scheduleNativeLocalNotification(newTodo);
      }
      if (typeof this.playSound === 'function') this.playSound('add');
      if (typeof this.triggerHaptic === 'function') this.triggerHaptic('success');
      this.showToast('⚡ Đã tạo nhanh: "' + newTodo.title + '"', 'success');
    },

    // ─── SWIPE-TO-ACTION TRÊN THẺ CÔNG VIỆC ───
    startCardSwipe(e, todo) {
      if (!e.touches || !e.touches[0]) return;
      if (this.swipedTodoId && this.swipedTodoId !== todo.id) {
        const prev = this.todos.find(t => t.id === this.swipedTodoId);
        if (prev) prev._swipeX = 0;
        this.swipedTodoId = null;
      }
      todo._touchStartX = e.touches[0].clientX;
      todo._touchStartY = e.touches[0].clientY;
      todo._baseSwipeX = todo._swipeX || 0;
      todo._swipeLocked = null;
      todo._isSwiping = true;
    },

    moveCardSwipe(e, todo) {
      if (!todo._isSwiping || !e.touches || !e.touches[0]) return;
      const dx = e.touches[0].clientX - (todo._touchStartX || 0);
      const dy = e.touches[0].clientY - (todo._touchStartY || 0);
      if (todo._swipeLocked === null) {
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.35) {
          todo._swipeLocked = 'h';
        } else if (Math.abs(dy) > 12) {
          todo._swipeLocked = 'v';
          todo._isSwiping = false;
          return;
        } else {
          return;
        }
      }
      if (todo._swipeLocked === 'h') {
        if (e.cancelable) e.preventDefault();
        const nextX = Math.max(-165, Math.min(100, (todo._baseSwipeX || 0) + dx));
        todo._swipeX = nextX;
      }
    },

    endCardSwipe(todo) {
      if (!todo._isSwiping && todo._swipeLocked !== 'h') return;
      todo._isSwiping = false;
      const x = todo._swipeX || 0;
      if (x >= 72) {
        todo._swipeX = 0;
        this.swipedTodoId = null;
        this.toggleTodo(todo);
      } else if (x <= -56) {
        todo._swipeX = -148;
        this.swipedTodoId = todo.id;
        if (typeof this.triggerHaptic === 'function') this.triggerHaptic('light');
      } else {
        todo._swipeX = 0;
        if (this.swipedTodoId === todo.id) this.swipedTodoId = null;
      }
      todo._swipeLocked = null;
    },

    async postponeTodo(todo, mode = '1h', e) {
      if (e?.stopPropagation) e.stopPropagation();
      const nowMs = Date.now();
      let targetMs = nowMs + 3600 * 1000;
      if (mode === 'tomorrow') {
        const base = todo.due_date ? this.parseDateSafe(todo.due_date) : null;
        const vnBase = base ? this.getVnDateParts(base) : this.getVnDateParts(nowMs);
        const vnTomo = this.getVnDateParts(nowMs + 24 * 3600 * 1000);
        targetMs = Date.UTC(vnTomo.year, vnTomo.month, vnTomo.day, vnBase.hours, vnBase.minutes, 0) - (7 * 3600 * 1000);
      } else if (todo.due_date) {
        const cur = this.parseDateSafe(todo.due_date);
        if (cur && cur.getTime() > nowMs) {
          targetMs = cur.getTime() + 3600 * 1000;
        }
      }
      todo.due_date = new Date(targetMs).toISOString();
      todo.updated_at = new Date().toISOString();
      todo._swipeX = 0;
      this.swipedTodoId = null;
      await this.persistAllData();
      this.scheduleNativeLocalNotification(todo);
      if (typeof this.triggerHaptic === 'function') this.triggerHaptic('light');
      if (typeof this.playSound === 'function') this.playSound('click');
      this.showToast(mode === 'tomorrow' ? '📅 Đã dời hạn sang Ngày mai' : '⏰ Đã dời hạn thêm +1 giờ', 'info');
    },

    // ─── PULL-TO-REFRESH ĐÀN HỒI (LÒ XO) ───
    onBodyTouchStart(e) {
      const container = e.currentTarget;
      if (!container || container.scrollTop > 2 || !e.touches?.[0]) {
        this._isPullingRefresh = false;
        return;
      }
      this._pullStartY = e.touches[0].clientY;
      this._isPullingRefresh = true;
    },

    onBodyTouchMove(e) {
      if (!this._isPullingRefresh || !e.touches?.[0]) return;
      const container = e.currentTarget;
      if (container && container.scrollTop > 2) {
        this.pullRefreshY = 0;
        this._isPullingRefresh = false;
        return;
      }
      const dy = e.touches[0].clientY - this._pullStartY;
      if (dy > 0) {
        // Lực cản lò xo tự nhiên kiểu iOS
        this.pullRefreshY = Math.min(84, Math.round(dy * 0.45));
      } else {
        this.pullRefreshY = 0;
      }
    },

    onBodyTouchEnd() {
      if (!this._isPullingRefresh) return;
      this._isPullingRefresh = false;
      if (this.pullRefreshY >= 54) {
        this.pullRefreshing = true;
        this.pullRefreshY = 48;
        if (typeof this.triggerHaptic === 'function') this.triggerHaptic('light');
        this.checkAndResetRecurringTasksLocally();
        this.syncAllNativeLocalNotifications();
        setTimeout(() => {
          this.pullRefreshing = false;
          this.pullRefreshY = 0;
        }, 480);
      } else {
        this.pullRefreshY = 0;
      }
    },

    // ─── TODOS CRUD (0MS PHẢN HỒI TỨC THÌ) ───
    openCreateModal() {
      if (typeof this.playSound === 'function') this.playSound('sheet');
      if (typeof this.triggerHaptic === 'function') this.triggerHaptic('light');
      this.editingTodo = null;
      this.customCategoryMode = false;
      this.newSubtaskInput = '';
      this.newTagInput = '';
      const vnNow = this.getVnDateParts(Date.now());
      const localNow = vnNow.inputStr;
      const currentTime = vnNow.timeStr;
      this.todoForm = {
        title: '',
        description: '',
        category: this.categories[0] || 'Personal',
        priority: 'Medium',
        repeat_mode: 'none',
        due_datetime: localNow,
        daily_time: currentTime,
        weekly_day: vnNow.dayOfWeek,
        weekly_time: currentTime,
        is_pinned: false,
        pomodoro_mode: false,
        subtasks: [],
        tags: [],
        reminder_offset: 0,
        estimated_minutes: 0,
        actual_minutes: 0
      };
      this.editingTodoImages = [];
      this.showModal = true;
    },

    openEditModal(todo, e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      this.editingTodo = todo;
      this.customCategoryMode = false;
      this.newSubtaskInput = '';
      this.newTagInput = '';
      const vn = this.getVnDateParts(todo.due_date);
      const timeStr = vn ? vn.timeStr : '18:00';
      const dayVal = vn ? vn.dayOfWeek : 1;

      this.todoForm = {
        title: todo.title,
        description: todo.description || '',
        category: todo.category || 'Personal',
        priority: todo.priority || 'Medium',
        repeat_mode: todo.repeat_mode || 'none',
        due_datetime: this.toLocalDatetimeInput(todo.due_date),
        daily_time: timeStr,
        weekly_day: dayVal,
        weekly_time: timeStr,
        is_pinned: Boolean(todo.is_pinned),
        pomodoro_mode: Boolean(todo.pomodoro_mode),
        subtasks: this.getSubtasks(todo).map(st => ({ ...st })),
        tags: [...this.getTags(todo)],
        reminder_offset: todo.reminder_offset || 0,
        estimated_minutes: todo.estimated_minutes || 0,
        actual_minutes: todo.actual_minutes || 0
      };
      this.editingTodoImages = (this.todoImagesMap[todo.id] || []).map(img => ({ ...img }));
      this.showModal = true;
    },

    async saveTodo() {
      this.todoSaving = true;
      try {
        let dueDateISO = null;
        const mode = this.todoForm.repeat_mode || 'none';

        if (mode === 'none') {
          if (this.todoForm.due_datetime) {
            const d = this.parseDateSafe(this.todoForm.due_datetime);
            if (d && !isNaN(d.getTime())) {
              dueDateISO = d.toISOString();
            }
          }
        } else if (mode === 'daily') {
          const [h, m] = (this.todoForm.daily_time || '18:00').split(':').map(Number);
          const vnNow = this.getVnDateParts(Date.now());
          let targetMs = Date.UTC(vnNow.year, vnNow.month, vnNow.day, h || 0, m || 0, 0, 0) - (7 * 3600 * 1000);
          if (targetMs <= Date.now()) {
            targetMs += 24 * 3600 * 1000;
          }
          dueDateISO = new Date(targetMs).toISOString();
        } else if (mode === 'weekly') {
          const [h, m] = (this.todoForm.weekly_time || '18:00').split(':').map(Number);
          const vnNow = this.getVnDateParts(Date.now());
          const currentDay = vnNow.dayOfWeek;
          const targetDay = Number(this.todoForm.weekly_day ?? 1);
          let daysUntil = (targetDay - currentDay + 7) % 7;
          let targetMs = Date.UTC(vnNow.year, vnNow.month, vnNow.day, h || 0, m || 0, 0, 0) - (7 * 3600 * 1000);
          if (daysUntil === 0 && targetMs <= Date.now()) {
            daysUntil = 7;
          }
          targetMs += daysUntil * 24 * 3600 * 1000;
          dueDateISO = new Date(targetMs).toISOString();
        }

        const nowIso = new Date().toISOString();
        const payload = {
          title: this.todoForm.title.trim(),
          description: this.todoForm.description.trim(),
          category: this.todoForm.category,
          priority: this.todoForm.priority,
          repeat_mode: this.todoForm.repeat_mode,
          due_date: dueDateISO,
          is_pinned: this.todoForm.is_pinned ? 1 : 0,
          pomodoro_mode: this.todoForm.pomodoro_mode ? 1 : 0,
          subtasks: this.todoForm.subtasks || [],
          tags: this.todoForm.tags || [],
          reminder_offset: this.todoForm.reminder_offset || 0,
          estimated_minutes: Number(this.todoForm.estimated_minutes) || 0,
          actual_minutes: Number(this.todoForm.actual_minutes) || 0
        };

        if (this.editingTodo) {
          const editId = this.editingTodo.id;
          const idx = this.todos.findIndex(t => t.id === editId);
          if (idx !== -1) {
            Object.assign(this.todos[idx], payload, { updated_at: nowIso });
            if (this.editingTodoImages) {
              this.todoImagesMap[editId] = this.editingTodoImages;
            }
            await this.persistAllData();
            this.scheduleNativeLocalNotification(this.todos[idx]);
            this.showToast('Đã cập nhật công việc!');
          }
        } else {
          const newId = this.generateLocalId('task');
          const newTodo = {
            id: newId,
            ...payload,
            status: 'todo',
            is_completed: 0,
            deleted_at: null,
            position: this.todos.length,
            created_at: nowIso,
            updated_at: nowIso
          };
          this.todos.unshift(newTodo);
          if (this.editingTodoImages && this.editingTodoImages.length > 0) {
            this.todoImagesMap[newId] = this.editingTodoImages;
          }
          await this.persistAllData();
          this.scheduleNativeLocalNotification(newTodo);
          if (typeof this.playSound === 'function') this.playSound('add');
          this.showToast('Đã thêm công việc mới!');
        }

        this.showModal = false;
        this.editingTodo = null;
        this.editingTodoImages = [];
      } finally {
        this.todoSaving = false;
      }
    },

    async toggleTodo(todo, e) {
      if (e?.stopPropagation) e.stopPropagation();
      if (!todo || todo._isToggling) return;
      todo._isToggling = true;
      const newStatus = todo.is_completed ? 0 : 1;

      // Kiểm tra việc con trước khi hoàn thành
      if (newStatus === 1) {
        const subs = this.getSubtasks(todo);
        const uncompleted = subs.filter(st => !st.is_completed);
        if (uncompleted.length > 0) {
          delete todo._isToggling;
          if (typeof this.triggerHaptic === 'function') this.triggerHaptic('warning');
          this.showToast('Chưa thể hoàn thành: còn ' + uncompleted.length + ' việc con chưa xong!', 'warning');
          return;
        }
        // Hiệu ứng thu gọn mượt ~280ms trước khi trượt xuống nhóm Đã xong
        todo._collapsing = true;
        if (typeof this.triggerHaptic === 'function') this.triggerHaptic('success');
        if (typeof this.playSound === 'function') this.playSound('complete');
        setTimeout(async () => {
          todo._collapsing = false;
          await this.executeToggleTodo(todo, newStatus, true);
          delete todo._isToggling;
        }, 280);
        return;
      }

      await this.executeToggleTodo(todo, newStatus, false);
      setTimeout(() => { delete todo._isToggling; }, 220);
    },

    async executeToggleTodo(todo, targetStatus, soundAlreadyPlayed = false) {
      const prevStatus = todo.is_completed;
      todo.is_completed = targetStatus;
      todo.status = targetStatus === 1 ? 'completed' : 'todo';
      todo.updated_at = new Date().toISOString();

      if (targetStatus === 1) {
        if (!soundAlreadyPlayed) {
          if (typeof this.triggerHaptic === 'function') this.triggerHaptic('success');
          if (typeof this.playSound === 'function') this.playSound('complete');
        }
        this.playChime();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        this.triggerConfetti();
        this.cancelNativeLocalNotification(todo.id);

        // Ghi nhận lịch sử hoàn thành để tính Streak & Thống kê
        const vn = this.getVnDateParts(Date.now());
        this.completionHistory.push({
          id: this.generateLocalId('hist'),
          todo_id: todo.id,
          task_title: todo.title,
          completed_at: new Date().toISOString(),
          date_str: vn.dateStr,
          category: todo.category,
          priority: todo.priority,
          actual_minutes: todo.actual_minutes || 0,
          created_at: new Date().toISOString()
        });

        // Nếu là công việc lặp: tự động chuyển due_date sang chu kỳ kế tiếp
        if (todo.repeat_mode && todo.repeat_mode !== 'none' && todo.due_date) {
          const d = new Date(todo.due_date);
          if (!isNaN(d.getTime())) {
            const increment = todo.repeat_mode === 'daily' ? 1 : 7;
            d.setDate(d.getDate() + increment);
            while (d.getTime() < Date.now()) {
              d.setDate(d.getDate() + increment);
            }
            todo.due_date = d.toISOString();
          }
        }
      } else {
        if (typeof this.playSound === 'function') this.playSound('uncomplete');
        this.scheduleNativeLocalNotification(todo);
        // Xóa lần hoàn thành gần nhất của việc này nếu hoàn tác
        const histIdx = this.completionHistory.map(h => h.todo_id).lastIndexOf(todo.id);
        if (histIdx !== -1) {
          this.completionHistory.splice(histIdx, 1);
        }
      }

      await this.persistAllData();
      if (targetStatus === 1 && this.stats?.todayTotal > 0 && this.stats?.todayPercent === 100) {
        setTimeout(() => {
          if (typeof this.playSound === 'function') this.playSound('all_done');
        }, 260);
      }
      this.showToast(todo.is_completed ? 'Hoàn thành xuất sắc! 🎉' : 'Đã chuyển sang đang chờ.', 'info', {
        label: 'Hoàn tác',
        onClick: () => this.executeToggleTodo(todo, prevStatus)
      });
    },

    async togglePin(todo, e) {
      if (e?.stopPropagation) e.stopPropagation();
      todo.is_pinned = todo.is_pinned ? 0 : 1;
      todo._swipeX = 0;
      this.swipedTodoId = null;
      todo.updated_at = new Date().toISOString();
      await this.persistAllData();
      if (typeof this.triggerHaptic === 'function') this.triggerHaptic('light');
      this.showToast(todo.is_pinned ? 'Đã ghim công việc lên đầu' : 'Đã bỏ ghim');
    },

    async toggleSubtask(todo, subtaskId) {
      const subs = this.getSubtasks(todo);
      const target = subs.find(st => st.id === subtaskId);
      if (target) {
        target.is_completed = target.is_completed ? 0 : 1;
        todo.subtasks = subs;
        todo.updated_at = new Date().toISOString();
        await this.persistAllData();
        if (typeof this.playSound === 'function') this.playSound('click');
      }
    },

    addSubtaskToForm() {
      const val = this.newSubtaskInput.trim();
      if (!val) return;
      this.todoForm.subtasks.push({
        id: this.generateLocalId('sub'),
        title: val,
        is_completed: 0
      });
      this.newSubtaskInput = '';
      if (typeof this.playSound === 'function') this.playSound('click');
    },

    removeSubtaskFromForm(index) {
      this.todoForm.subtasks.splice(index, 1);
    },

    addTagToForm() {
      const val = this.newTagInput.trim().replace(/^#/, '');
      if (!val) return;
      if (!this.todoForm.tags.includes(val)) {
        this.todoForm.tags.push(val);
      }
      this.newTagInput = '';
    },

    removeTagFromForm(index) {
      this.todoForm.tags.splice(index, 1);
    },

    confirmDelete(todo) {
      this.todoToDelete = todo;
      this.deletingTodo = todo;
      this.showDeleteModal = true;
    },

    async deleteTodoConfirmed() {
      const target = this.todoToDelete || this.deletingTodo;
      if (!target) return;
      const targetId = target.id;
      const targetItem = this.todos.find(t => t.id === targetId);
      if (targetItem) {
        targetItem.deleted_at = new Date().toISOString();
        targetItem._swipeX = 0;
        this.swipedTodoId = null;
        this.cancelNativeLocalNotification(targetId);
        this.todos = [...this.todos];
        await this.persistAllData();
        if (typeof this.triggerHaptic === 'function') this.triggerHaptic('warning');
        if (typeof this.playSound === 'function') this.playSound('delete');
        this.showToast('Đã chuyển công việc vào thùng rác', 'info', {
          label: 'Hoàn tác',
          onClick: () => this.restoreTodo(targetItem)
        });
      }
      this.showDeleteModal = false;
      this.todoToDelete = null;
      this.deletingTodo = null;
    },

    async restoreTodo(todo) {
      todo.deleted_at = null;
      todo.updated_at = new Date().toISOString();
      this.todos = [...this.todos];
      await this.persistAllData();
      this.scheduleNativeLocalNotification(todo);
      if (typeof this.playSound === 'function') this.playSound('add');
      this.showToast('Đã khôi phục công việc!');
    },

    async permanentDeleteTodo(todo) {
      this.todos = this.todos.filter(t => t.id !== todo.id);
      delete this.todoImagesMap[todo.id];
      this.cancelNativeLocalNotification(todo.id);
      await this.persistAllData();
      this.showToast('Đã xóa vĩnh viễn công việc');
    },

    async clearTrashConfirmed() {
      const deletedIds = this.todos.filter(t => t.deleted_at).map(t => t.id);
      deletedIds.forEach(id => {
        this.cancelNativeLocalNotification(id);
        delete this.todoImagesMap[id];
      });
      this.todos = this.todos.filter(t => !t.deleted_at);
      await this.persistAllData();
      this.showTrashModal = false;
      this.showToast('Đã dọn sạch thùng rác');
    },

    async clearCompletedConfirmed() {
      const completed = this.todos.filter(t => t.is_completed && !t.deleted_at);
      const nowIso = new Date().toISOString();
      completed.forEach(t => {
        t.deleted_at = nowIso;
        this.cancelNativeLocalNotification(t.id);
      });
      await this.persistAllData();
      this.showClearCompletedModal = false;
      this.showToast('Đã chuyển các việc đã xong vào thùng rác');
    },

    async addCategory() {
      const name = this.newCategoryName.trim();
      if (!name) return;
      if (!this.categories.includes(name)) {
        this.categories.push(name);
        await this.persistAllData();
        this.showToast('Đã thêm danh mục: ' + name);
      }
      this.todoForm.category = name;
      this.customCategoryMode = false;
      this.newCategoryName = '';
    },

    // ─── SAO LƯU & XUẤT/NHẬP DỮ LIỆU CHUẨN IOS WKWEBVIEW ───
    async exportJsonLocally() {
      try {
        const payload = {
          app: 'ToDoList-Local',
          version: '3.3.0',
          exported_at: new Date().toISOString(),
          todos: this.todos,
          categories: this.categories,
          completion_history: this.completionHistory
        };
        const jsonStr = JSON.stringify(payload, null, 2);
        const fileName = 'todolist-backup-' + new Date().toISOString().slice(0, 10) + '.json';

        // 1. Thử dùng Web Share API (native iOS Share Sheet -> Lưu vào Tệp / AirDrop)
        if (navigator.share && typeof File !== 'undefined') {
          try {
            const file = new File([jsonStr], fileName, { type: 'application/json' });
            if (!navigator.canShare || navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Sao lưu ToDoList',
                text: 'Bản sao lưu gồm ' + this.todos.length + ' công việc',
                files: [file]
              });
              this.showToast('✅ Đã mở bảng chia sẻ/lưu tệp iOS!', 'success');
              return;
            }
          } catch (shareErr) {
            if (shareErr.name === 'AbortError') return; // Người dùng chủ động hủy share
          }
        }

        // 2. Thử tạo Blob download
        try {
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.showToast('✅ Đã tải file sao lưu về máy!', 'success');
          return;
        } catch {}

        // 3. Fallback: Sao chép vào Clipboard
        await this.copyBackupToClipboard();
      } catch (err) {
        console.warn('exportJsonLocally error:', err);
        await this.copyBackupToClipboard();
      }
    },

    async copyBackupToClipboard() {
      try {
        const payload = {
          app: 'ToDoList-Local',
          version: '3.3.0',
          exported_at: new Date().toISOString(),
          todos: this.todos,
          categories: this.categories,
          completion_history: this.completionHistory
        };
        const jsonStr = JSON.stringify(payload, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(jsonStr);
          this.showToast('📋 Đã sao chép dữ liệu JSON vào Clipboard! Hãy dán vào Ghi chú (Notes)', 'success');
        } else {
          prompt('Hãy sao chép toàn bộ nội dung JSON bên dưới:', jsonStr);
        }
      } catch (e) {
        this.showToast('Lỗi sao chép: ' + e.message, 'error');
      }
    },

    async handleImportJsonFile(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target.result;
            const parsed = JSON.parse(text);
            let incomingTodos = [];
            if (Array.isArray(parsed)) {
              incomingTodos = parsed;
            } else if (parsed && Array.isArray(parsed.todos)) {
              incomingTodos = parsed.todos;
            } else {
              throw new Error('File sao lưu không chứa danh sách công việc hợp lệ.');
            }

            const existingIds = new Set(this.todos.map(t => t.id));
            let addedCount = 0;
            for (const t of incomingTodos) {
              if (!t.title) continue;
              if (!t.id || existingIds.has(t.id)) {
                t.id = this.generateLocalId('task');
              }
              this.todos.push(t);
              addedCount++;
            }

            if (parsed.categories && Array.isArray(parsed.categories)) {
              this.categories = Array.from(new Set([...this.categories, ...parsed.categories]));
            }
            if (parsed.completion_history && Array.isArray(parsed.completion_history)) {
              this.completionHistory.push(...parsed.completion_history);
            }

            await this.persistAllData();
            this.syncAllNativeLocalNotifications();
            this.showToast('🎉 Đã nhập thành công ' + addedCount + ' công việc vào máy!', 'success');
          } catch (parseErr) {
            this.showToast('Lỗi đọc file: ' + parseErr.message, 'error');
          }
        };
        reader.readAsText(file);
      } catch (err) {
        this.showToast('Không thể mở file: ' + err.message, 'error');
      }
    },

    exportIcalLocally() {
      try {
        const validTodos = this.todos.filter(t => !t.deleted_at && t.due_date);
        const pad = (n) => String(n).padStart(2, '0');
        const formatIcs = (d) => {
          return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
        };

        const now = new Date();
        const nowStamp = formatIcs(now);
        const lines = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//ToDoList Local iOS//VI',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'X-WR-CALNAME:ToDoList',
          'X-WR-TIMEZONE:Asia/Ho_Chi_Minh'
        ];

        for (const t of validTodos) {
          const d = this.parseDateSafe(t.due_date);
          if (!d) continue;
          const endD = new Date(d.getTime() + 30 * 60 * 1000);
          lines.push('BEGIN:VEVENT');
          lines.push('UID:task-' + t.id + '@todolist.local');
          lines.push('DTSTAMP:' + nowStamp);
          lines.push('DTSTART:' + formatIcs(d));
          lines.push('DTEND:' + formatIcs(endD));
          lines.push('SUMMARY:' + (t.title || 'Công việc'));
          if (t.description) lines.push('DESCRIPTION:' + t.description.replace(/\\n/g, ' '));
          lines.push('STATUS:' + (t.is_completed ? 'COMPLETED' : 'CONFIRMED'));
          lines.push('END:VEVENT');
        }
        lines.push('END:VCALENDAR');

        const icsContent = lines.join('\\r\\n');
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'todolist-calendar.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('✅ Đã xuất lịch .ics thành công!', 'success');
      } catch (e) {
        this.showToast('Lỗi xuất file lịch: ' + e.message, 'error');
      }
    },

    // ─── THÙNG RÁC, PHÂN TÍCH & CÁC TIỆN ÍCH TƯƠNG TÁC GIAO DIỆN ───
    openAnalytics() {
      this.showAnalyticsModal = true;
    },

    openTrashModal() {
      this.showTrashModal = true;
    },

    async deleteTodo() {
      await this.deleteTodoConfirmed();
    },

    confirmClearCompleted() {
      this.showClearCompletedModal = true;
    },

    async clearCompleted() {
      await this.clearCompletedConfirmed();
    },

    async restoreAllTrash() {
      const trashed = (this.todos || []).filter(t => Boolean(t.deleted_at));
      if (!trashed || trashed.length === 0) return;
      const nowIso = new Date().toISOString();
      trashed.forEach(t => {
        t.deleted_at = null;
        t.updated_at = nowIso;
        this.scheduleNativeLocalNotification(t);
      });
      await this.persistAllData();
      this.showToast('Đã khôi phục ' + trashed.length + ' công việc! 🎉', 'success');
    },

    async emptyTrash() {
      const trashed = (this.todos || []).filter(t => Boolean(t.deleted_at));
      if (!trashed || trashed.length === 0) return;
      const ok = await this.askConfirm({
        title: 'Dọn sạch thùng rác?',
        message: 'Bạn có chắc chắn muốn dọn sạch toàn bộ thùng rác? Toàn bộ ' + trashed.length + ' công việc trong thùng rác sẽ bị xóa vĩnh viễn!',
        confirmText: 'Dọn sạch tất cả',
        isDanger: true,
        icon: '🗑️'
      });
      if (!ok) return;
      await this.clearTrashConfirmed();
    },

    async deletePermanently(todo) {
      if (!todo || !todo.id) return;
      const ok = await this.askConfirm({
        title: 'Xóa vĩnh viễn công việc?',
        message: 'Bạn có chắc chắn muốn xóa vĩnh viễn "' + (todo.title || 'công việc này') + '"? Dữ liệu sẽ không thể khôi phục!',
        confirmText: 'Xóa vĩnh viễn',
        isDanger: true,
        icon: '🗑️'
      });
      if (!ok) return;
      this.todos = this.todos.filter(t => t.id !== todo.id);
      delete this.todoImagesMap[todo.id];
      this.cancelNativeLocalNotification(todo.id);
      await this.persistAllData();
      this.showToast('Đã xóa vĩnh viễn công việc', 'info');
    },

    askConfirm(opts) {
      return new Promise((resolve) => {
        this.confirmDialog = {
          show: true,
          title: opts.title || 'Xác nhận',
          message: opts.message || '',
          confirmText: opts.confirmText || 'Đồng ý',
          cancelText: opts.cancelText || 'Hủy',
          isDanger: Boolean(opts.isDanger),
          icon: opts.icon || '⚠️',
          resolve
        };
      });
    },

    closeConfirm(result) {
      if (this.confirmDialog && typeof this.confirmDialog.resolve === 'function') {
        this.confirmDialog.resolve(Boolean(result));
        this.confirmDialog.resolve = null;
      }
      this.confirmDialog.show = false;
    },

    addSubtask() {
      const val = (this.newSubtaskInput || '').trim();
      if (!val) return;
      if (!Array.isArray(this.todoForm.subtasks)) {
        this.todoForm.subtasks = [];
      }
      this.todoForm.subtasks.push({
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        title: val,
        is_completed: 0
      });
      this.newSubtaskInput = '';
    },

    removeSubtask(idx) {
      if (Array.isArray(this.todoForm.subtasks)) {
        this.todoForm.subtasks.splice(idx, 1);
      }
    },

    addTag() {
      const val = (this.newTagInput || '').replace(/^#/, '').trim().toLowerCase();
      if (!val) return;
      if (!Array.isArray(this.todoForm.tags)) {
        this.todoForm.tags = [];
      }
      if (!this.todoForm.tags.includes(val)) {
        this.todoForm.tags.push(val);
      }
      this.newTagInput = '';
    },

    removeTag(idx) {
      if (Array.isArray(this.todoForm.tags)) {
        this.todoForm.tags.splice(idx, 1);
      }
    },

    getUncompletedSubtasksCount(todo) {
      if (!todo) return 0;
      const subtasks = this.getSubtasks(todo);
      return subtasks.filter(st => !st.is_completed).length;
    },

    hasUncompletedSubtasks(todo) {
      if (!todo) return false;
      const subtasks = this.getSubtasks(todo);
      return subtasks.some(st => !st.is_completed);
    },

    onDragStart(todo, e) {
      this.draggedTodo = todo;
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', todo.id);
      } catch (err) {}
    },

    onDragOver(todo, e) {
      if (this.sortBy !== 'custom' || !this.draggedTodo || this.draggedTodo.id === todo.id) return;
      e.preventDefault();
    },

    async onDrop(targetTodo, e) {
      if (this.sortBy !== 'custom' || !this.draggedTodo || this.draggedTodo.id === targetTodo.id) return;
      e.preventDefault();
      const list = [...this.todos];
      const fromIdx = list.findIndex(t => t.id === this.draggedTodo.id);
      const toIdx = list.findIndex(t => t.id === targetTodo.id);
      if (fromIdx === -1 || toIdx === -1) return;
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      list.forEach((t, i) => { t.position = i; });
      this.todos = list;
      this.draggedTodo = null;
      await this.persistAllData();
    },

    onDragEnd() {
      this.draggedTodo = null;
    },

    async moveTodo(todo, direction) {
      const currentList = this.filteredSortedTodos;
      const idx = currentList.findIndex(t => t.id === todo.id);
      if (idx === -1) return;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= currentList.length) return;

      const targetTodo = currentList[targetIdx];
      const list = [...this.todos];
      const fromIdx = list.findIndex(t => t.id === todo.id);
      const toIdx = list.findIndex(t => t.id === targetTodo.id);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      list.forEach((t, i) => { t.position = i; });
      this.todos = list;
      await this.persistAllData();
    },

    async duplicateTodo(todo, e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      const tempId = this.generateLocalId('todo');
      const nowIso = new Date().toISOString();
      const newTodo = {
        ...todo,
        id: tempId,
        title: todo.title + ' (Bản sao)',
        is_completed: 0,
        created_at: nowIso,
        updated_at: nowIso
      };
      this.todos.unshift(newTodo);
      await this.persistAllData();
      this.scheduleNativeLocalNotification(newTodo);
      this.showToast('Đã nhân bản công việc!');
    },

    getTodoImages(todoId) {
      this.todoImagesMap = this.todoImagesMap || {};
      return this.todoImagesMap[todoId] || [];
    },

    openLightbox(imageData) {
      this.lightboxImage = imageData;
      this.showLightbox = true;
    },

    async deleteImage(todoId, imageId) {
      this.todoImagesMap = this.todoImagesMap || {};
      this.editingTodoImages = this.editingTodoImages || [];
      if (imageId && imageId.startsWith('temp_img_')) {
        this.editingTodoImages = this.editingTodoImages.filter(img => img.id !== imageId);
        return;
      }
      const confirmed = await this.askConfirm({
        title: 'Xóa ảnh minh chứng?',
        message: 'Bạn có chắc chắn muốn xóa ảnh minh chứng này khỏi công việc không?',
        confirmText: 'Xóa ảnh',
        isDanger: true
      });
      if (!confirmed) return;
      if (this.todoImagesMap[todoId]) {
        this.todoImagesMap[todoId] = this.todoImagesMap[todoId].filter(img => img.id !== imageId);
      }
      this.editingTodoImages = this.editingTodoImages.filter(img => img.id !== imageId);
      await this.persistAllData();
      this.showToast('Đã xóa ảnh minh chứng', 'info');
    },

    chooseOrCapturePhoto(todoId) {
      this.activePhotoTodoId = todoId;
      const cam = document.getElementById('todo-camera-input');
      const img = document.getElementById('todo-image-input');
      if (cam) cam.click();
      else if (img) img.click();
    },

    chooseOrCaptureProofForCompletion(mode) {
      if (mode === 'camera') {
        document.getElementById('todo-camera-input')?.click();
      } else {
        document.getElementById('todo-image-input')?.click();
      }
    },

    closeCompletionModal() {
      this.showCompletionModal = false;
      this.completingTodo = null;
      this.completingProofPhoto = null;
      this.completingPhotoName = '';
      this.completingUploadingPhoto = false;
    },

    async confirmCompleteTask() {
      if (!this.completingTodo) return;
      const todo = this.completingTodo;
      const proofPhoto = this.completingProofPhoto;
      const photoName = this.completingPhotoName;

      const uncompletedCount = this.getUncompletedSubtasksCount(todo);
      if (uncompletedCount > 0) {
        this.showToast('⚠️ Không thể hoàn thành: còn ' + uncompletedCount + ' việc con chưa xong!', 'error');
        this.closeCompletionModal();
        return;
      }

      this.closeCompletionModal();

      if (proofPhoto) {
        const fileName = photoName || ('proof_' + Date.now() + '.jpg');
        if (!this.todoImagesMap[todo.id]) this.todoImagesMap[todo.id] = [];
        this.todoImagesMap[todo.id].push({
          id: 'img_' + Date.now(),
          image_data: proofPhoto,
          file_name: fileName
        });
      }

      await this.executeToggleTodo(todo, 1);
      try { this.playChime(); } catch {}
      try { this.triggerConfetti(); } catch {}
    },

    checkAppVersion(manual = false) {
      if (manual) {
        this.showToast('Bạn đang sử dụng phiên bản mới nhất (' + (this.appVersion || '3.3.0') + ')! 🎉', 'success');
      }
    },

    triggerConfetti() {
      try {
        if (typeof window.confetti === 'function') {
          window.confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      } catch (e) {
        console.warn('triggerConfetti error:', e);
      }
    }
  };
}
`;
