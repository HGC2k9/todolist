// ============================================================
// Service Worker — To-Do List (Background, PWA & Auto-Update)
// ============================================================

export function renderServiceWorker(): string {
  return /*javascript*/ `
const CACHE_NAME = 'todolist-v11';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png'
];

// Cài đặt Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Kích hoạt Service Worker và dọn dẹp toàn bộ cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── CHẠY NGẦM QUÉT NHẮC VIỆC TRONG SERVICE WORKER (NGAY CẢ KHI TAB MỞ NGẦM) ───
let scheduledTasks = [];
let lastNotifiedInSW = {};

function checkSWReminders() {
  if (!scheduledTasks || scheduledTasks.length === 0) return;
  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;

  scheduledTasks.forEach((task) => {
    if (task.is_completed || !task.due_date) return;
    const dueTime = new Date(task.due_date).getTime();
    if (isNaN(dueTime)) return;

    const diffMs = dueTime - now;
    const minLeft = Math.ceil(diffMs / 60000);
    const windowMin = task.warningMinutes || 15;

    // Khi vào khung nhắc nhở (Low: 5p, Medium: 15p, High: 30p)
    if (minLeft >= 0 && minLeft <= windowMin) {
      const last = lastNotifiedInSW[task.id] || 0;
      const isRepeat = (task.priority === 'High' || task.priority === 'Medium');
      const shouldNotify = isRepeat ? (now - last >= FIVE_MIN) : (!last);

      if (shouldNotify) {
        lastNotifiedInSW[task.id] = now;
        const timeStr = new Date(dueTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const iconUrl = self.location.origin + '/icon-192.png';
        self.registration.showNotification('Sắp hết hạn trong ' + minLeft + ' phút', {
          body: 'Công việc "' + task.title + '" cần hoàn thành trước ' + timeStr,
          icon: iconUrl,
          badge: iconUrl,
          tag: 'sw-rem-' + task.id + '-' + Math.floor(now / FIVE_MIN),
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url: '/' }
        });
      }
    }
  });
}

// Lắng nghe lệnh từ frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'SYNC_SCHEDULE') {
    scheduledTasks = event.data.tasks || [];
    checkSWReminders();
  }
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    const iconUrl = self.location.origin + '/icon-192.png';
    self.registration.showNotification(title || 'To-Do List', {
      body: body || 'Bạn có công việc cần hoàn thành!',
      icon: iconUrl,
      badge: iconUrl,
      tag: tag || 'todo-reminder',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  }
});

setInterval(checkSWReminders, 8000);

// ─── NETWORK-FIRST CHO TRANG CHÍNH: ĐẢM BẢO IOS APP LUÔN TỰ CẬP NHẬT MỚI NHẤT ───
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Không can thiệp API
  if (url.pathname.startsWith('/api/')) return;

  // Đối với navigation / trang chính: LUÔN LẤY BẢN MỚI TỪ MẠNG TRƯỚC (Network-First)
  // Chỉ khi mất mạng (offline) mới dùng bản lưu trong cache
  if (event.request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/') || caches.match(event.request))
    );
    return;
  }

  // Đối với assets (icon, manifest): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cached || fetchPromise;
    })
  );
});

// ─── LẮNG NGHE WEB PUSH NOTIFICATION KHI TẮT TRÌNH DUYỆT ───
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'To-Do List', body: event.data.text() };
    }
  }

  const title = data.title || 'To-Do List';
  const iconUrl = self.location.origin + '/icon-192.png';
  const options = {
    body: data.body || 'Nhắc nhở công việc sắp đến hạn!',
    icon: iconUrl,
    badge: iconUrl,
    tag: data.tag || 'todo-push',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── XỬ LÝ KHI NGƯỜI DÙNG BẤM VÀO THÔNG BÁO ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
`;
}

