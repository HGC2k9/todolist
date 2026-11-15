// ============================================================
// Service Worker — To-Do List (PWA Offline Cache & Auto-Update)
// ============================================================

export function renderServiceWorker(): string {
  return /*javascript*/ `
const CACHE_NAME = 'todolist-v20';
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

// Lắng nghe lệnh từ frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── NETWORK-FIRST CHO TRANG CHÍNH: ĐẢM BẢO APP LUÔN TỰ CẬP NHẬT MỚI NHẤT ───
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
`;
}
