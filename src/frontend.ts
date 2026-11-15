// ============================================================
// Frontend SPA — To-Do List (Alpine.js + Tailwind CSS + PWA)
// iOS Safe Area Support + Pull-To-Refresh + Auto-Alert 30m
// ============================================================

export function renderHTML(): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="vi" x-data="app()" :class="{ 'dark': darkMode }">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>To-Do List</title>

  <!-- PWA Manifest & iOS Meta Tags -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="To-Do List">
  <meta name="application-name" content="To-Do List">

  <!-- Icons chuẩn PNG sắc nét (Không vỡ) -->
  <link rel="icon" type="image/png" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/icon-192.png">

  <!-- Font chữ Plus Jakarta Sans hiện đại, tinh gọn -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      future: {
        hoverOnlyWhenSupported: true,
      },
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
          },
          colors: {
            brand: {
              50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
              400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
              800: '#1e40af', 900: '#1e3a8a'
            }
          }
        }
      }
    }
  </script>
  <style>
    [x-cloak] { display: none !important; }

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html, body {
      max-width: 100%;
      overflow-x: hidden;
      position: relative;
      width: 100%;
    }
    
    html {
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    body {
      transition: background-color 0.25s ease, color 0.2s ease;
    }

    :root {
      --sat: env(safe-area-inset-top, 0px);
      --sab: env(safe-area-inset-bottom, 0px);
      --sal: env(safe-area-inset-left, 0px);
      --sar: env(safe-area-inset-right, 0px);
    }

    /* Padding an toàn cho iOS Dynamic Island & Tai thỏ */
    .ios-safe-top {
      padding-top: calc(max(14px, env(safe-area-inset-top, 0px)) + 12px);
    }
    .ios-safe-bottom {
      padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
    }

    .toast-enter { animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes toastIn { from { opacity:0; transform:translateY(-16px) scale(0.94); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    .spinner { animation: spin 0.7s linear infinite; }
    .line-through-anim { text-decoration: line-through; color: #94a3b8; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .dark ::-webkit-scrollbar-thumb { background: #334155; }

    @keyframes pulse-warning {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse-warning {
      animation: pulse-warning 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* Hiệu ứng thẻ mượt mà & nâng nhẹ khi hover trên màn hình có chuột */
    .todo-card {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease, background-color 0.15s ease, opacity 0.2s ease;
      will-change: transform;
    }
    @media (hover: hover) and (pointer: fine) {
      .todo-card:hover {
        transform: translateY(-1.5px);
      }
    }

    /* Tối ưu hóa phản hồi nút bấm & Cảm ứng trên iOS WKWebView / Mobile */
    *, *::before, *::after {
      -webkit-tap-highlight-color: transparent;
    }

    button, a, [role="button"], input[type="button"], input[type="submit"] {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    }

    button:focus:not(:focus-visible), a:focus:not(:focus-visible), [role="button"]:focus:not(:focus-visible) {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Tiêu chuẩn trợ năng a11y: hiển thị viền focus rõ ràng cho điều hướng bằng bàn phím */
    :focus-visible {
      outline: 2px solid #2563eb !important;
      outline-offset: 2px !important;
    }
    .dark :focus-visible {
      outline: 2px solid #60a5fa !important;
    }

    /* Chỉ kích hoạt hiệu ứng :hover khi dùng thiết bị có chuột thực sự (ngăn ngừa lỗi kẹt nút / vết ấn lưu lại trên iPhone) */
    @media (hover: none) and (pointer: coarse) {
      button:hover, a:hover, [role="button"]:hover, .group:hover {
        filter: none !important;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      button:hover, a:hover {
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
    }

    /* Tôn trọng cài đặt giảm chuyển động cho người nhạy cảm (Accessibility) */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-200 ios-safe-bottom pb-24 sm:pb-8 selection:bg-brand-500 selection:text-white max-w-full overflow-x-hidden">

<!-- ═══════ TOAST NOTIFICATIONS (Vuốt lên/sang để tắt, xếp chồng, 3s tự tắt) ═══════ -->
<div class="fixed right-4 left-4 sm:left-auto z-[120] space-y-2 pointer-events-none"
     style="top: calc(max(14px, env(safe-area-inset-top, 0px)) + 12px);" x-cloak>
  <template x-for="toast in toasts" :key="toast.id">
    <div class="toast-enter pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-md ml-auto border transition-all duration-200 cursor-grab active:cursor-grabbing select-none"
         :style="toast.offset ? 'transform: translate(' + (toast.offsetX || 0) + 'px, ' + (toast.offsetY || 0) + 'px); opacity: ' + (1 - Math.min(1, Math.abs(toast.offsetX || toast.offsetY || 0) / 100)) + ';' : ''"
         @touchstart="startToastSwipe($event, toast)"
         @touchmove="moveToastSwipe($event, toast)"
         @touchend="endToastSwipe($event, toast)"
         :class="{
           'bg-emerald-600 border-emerald-500 text-white': toast.type === 'success',
           'bg-rose-600 border-rose-500 text-white': toast.type === 'error',
           'bg-amber-600 border-amber-500 text-white': toast.type === 'warning',
           'bg-blue-600 border-blue-500 text-white': toast.type === 'info'
         }">
      <div class="flex items-center gap-2.5 min-w-0">
        <svg x-show="toast.type==='success'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg x-show="toast.type==='error'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <svg x-show="toast.type==='warning'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <svg x-show="toast.type==='info'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span x-text="toast.message" class="break-words"></span>
        <span x-show="toast.count > 1" class="ml-1 px-1.5 py-0.5 rounded-full bg-white/25 text-[11px] font-black" x-text="'x' + toast.count"></span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <template x-if="toast.action">
          <button @click="toast.action.onClick(); removeToast(toast.id)"
                  class="px-2.5 py-1 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 active:scale-95 transition flex-shrink-0"
                  x-text="toast.action.label || 'Hoàn tác'"></button>
        </template>
        <button @click="removeToast(toast.id)" class="opacity-70 hover:opacity-100 p-1 text-white flex-shrink-0" title="Đóng">✕</button>
      </div>
    </div>
  </template>
</div>

<!-- ═══════ AUTH SCREEN (Đăng nhập / Đăng ký) ═══════ -->
<div x-show="!authenticated" x-cloak class="min-h-screen flex items-center justify-center p-4 ios-safe-top">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-400 text-white shadow-lg shadow-brand-500/30 mb-4 ring-4 ring-brand-100 dark:ring-brand-950">
        <img src="/icon-192.png" alt="Logo" class="w-12 h-12 rounded-xl" />
      </div>
      <h1 class="text-3xl font-extrabold bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">To-Do List</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Cloudflare Edge & D1 Serverless</p>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-xl">
      <div class="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6" role="tablist" aria-label="Phương thức xác thực">
        <button @click="authMode='login'" role="tab" :aria-selected="authMode==='login'" class="flex-1 h-10 text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center"
                :class="authMode==='login' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
          Đăng nhập
        </button>
        <button @click="authMode='register'" role="tab" :aria-selected="authMode==='register'" class="flex-1 h-10 text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center"
                :class="authMode==='register' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
          Đăng ký
        </button>
      </div>

      <form @submit.prevent="handleAuth" class="space-y-4">
        <div x-show="authMode==='register'" class="space-y-1.5">
          <label for="auth-username" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Tên người dùng</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <input id="auth-username" name="username" autocomplete="name" x-model="authForm.username" type="text" placeholder="Họ và tên..."
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="auth-email" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input id="auth-email" name="email" autocomplete="email" x-model="authForm.email" type="email" placeholder="you@example.com" required
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="auth-password" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Mật khẩu</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input id="auth-password" name="password" autocomplete="current-password" x-model="authForm.password" type="password" placeholder="••••••••" required minlength="6"
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <button type="submit" :disabled="authLoading"
                class="w-full h-12 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 inline-flex items-center justify-center gap-2 mt-2 text-sm">
          <svg x-show="authLoading" class="spinner w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="authMode==='login' ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'"></span>
        </button>
      </form>
    </div>

    <div class="mt-6 text-center">
      <button @click="toggleDarkMode($event)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold inline-flex items-center gap-2 p-2 rounded-xl transition active:scale-95">
        <svg x-show="!darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg x-show="darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <span x-text="darkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'"></span>
      </button>
    </div>
  </div>
</div>

<!-- ═══════ MAIN APPLICATION INTERFACE ═══════ -->
<div x-show="authenticated" x-cloak class="min-h-screen flex flex-col">

  <!-- ─── HEADER ĐÃ SỬA: ĐỆM AN TOÀN TRÁNH TAI THỎ / DYNAMIC ISLAND ─── -->
  <header class="sticky top-0 z-50 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-all"
          style="padding-top: calc(max(14px, env(safe-area-inset-top, 0px)) + 12px); padding-left: max(0.75rem, env(safe-area-inset-left, 0px)); padding-right: max(0.75rem, env(safe-area-inset-right, 0px));">
    <div class="max-w-5xl mx-auto px-2 sm:px-4 pb-3 flex items-center justify-between gap-2">
      
      <!-- Brand Logo & App Name (Bấm vào để xem Version & Designed by Chung) -->
      <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer select-none group focus:outline-none"
           role="button" tabindex="0"
           @click="openAboutModal()"
           @keydown.enter="openAboutModal()"
           @keydown.space.prevent="openAboutModal()"
           aria-label="Xem thông tin phiên bản và tác giả Designed by Chung"
           title="Bấm để xem Thông tin phiên bản & Tác giả (Designed by Chung)">
        <img src="/icon-192.png" alt="Logo" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-sm transition-transform group-hover:scale-105 active:scale-95 ring-2 ring-transparent group-hover:ring-brand-400/50" />
        <div>
          <h1 class="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-brand-600 to-blue-500 bg-clip-text text-transparent leading-none">To-Do List</h1>
          <div class="flex items-center gap-1 mt-0.5">
            <span class="text-[9px] font-bold text-slate-400 group-hover:text-brand-600 transition">v<span x-text="appVersion"></span></span>
            <span class="text-[9px] text-slate-300 dark:text-slate-600">•</span>
            <span class="text-[9px] font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">by Chung</span>
          </div>
        </div>
      </div>

      <!-- User Profile Chip (Desktop / Tablet) -->
      <div x-show="currentUser" class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none shadow-xs">
        <div class="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-[10px] font-black uppercase"
             x-text="(currentUser?.username || currentUser?.email || 'U').slice(0, 1)"></div>
        <span class="max-w-[130px] truncate" x-text="currentUser?.username || currentUser?.email"></span>
      </div>

      <!-- Trạng thái Ngoại tuyến / Chờ đồng bộ (Offline Sync Indicator) -->
      <div x-show="isOffline || offlineQueue.length > 0" x-cloak
           @click="syncOfflineQueue()"
           role="button" tabindex="0"
           @keydown.enter="syncOfflineQueue()"
           aria-label="Trạng thái đồng bộ ngoại tuyến. Bấm để đồng bộ ngay"
           class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition select-none animate-pulse"
           :class="isOffline ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800'"
           :title="isOffline ? 'Đang ngoại tuyến. Bấm để thử đồng bộ lại.' : 'Bấm để đồng bộ ngay'">
        <span class="w-2 h-2 rounded-full" :class="isOffline ? 'bg-amber-500' : 'bg-blue-500'"></span>
        <span x-text="isSyncing ? 'Đang đồng bộ...' : (isOffline ? 'Ngoại tuyến (' + offlineQueue.length + ' chờ gửi)' : 'Chờ đồng bộ (' + offlineQueue.length + ')')"></span>
      </div>

      <!-- Action Toolbar (Căn chỉnh đối xứng 100% - Chuẩn hóa chiều cao h-8) -->
      <div class="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        
        <!-- Nút Download App -->
        <button @click="showDownloadModal = true"
                aria-label="Tải ứng dụng To-Do List cho PC hoặc iOS"
                class="h-8 px-2 sm:px-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/70 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 transition shadow-xs active:scale-95"
                title="Tải ứng dụng cho PC hoặc iOS">
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span class="hidden md:inline">Download</span>
        </button>

        <!-- Nút Mở thẳng Bot Telegram @hgc_todolist_bot -->
        <a href="https://t.me/hgc_todolist_bot" target="_blank" rel="noopener noreferrer"
           @click="openTelegramBot($event)"
           aria-label="Mở Bot Telegram To-Do List @hgc_todolist_bot"
           class="h-8 px-2 sm:px-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition shadow-xs active:scale-95"
           title="Mở Bot Telegram @hgc_todolist_bot">
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
          </svg>
          <span class="hidden md:inline">@hgc_todolist_bot</span>
          <span class="hidden sm:inline md:hidden">Bot</span>
        </a>

        <!-- Nút Sao lưu & Xuất lịch -->
        <button @click="showBackupModal = true"
                aria-label="Sao lưu dữ liệu và xuất lịch"
                class="h-8 px-2 sm:px-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/70 dark:hover:bg-violet-900 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 transition shadow-xs active:scale-95"
                title="Sao lưu JSON & Xuất lịch (.ics)">
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span class="hidden md:inline">Sao lưu & Lịch</span>
          <span class="hidden sm:inline md:hidden">Lịch</span>
        </button>

        <!-- Làm mới thủ công -->
        <button @click="refreshDataManual($event)"
                aria-label="Làm mới dữ liệu danh sách công việc"
                class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700" :class="{ 'spinner text-brand-600': isRefreshing }" title="Làm mới dữ liệu">
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path><polyline points="21 3 21 9 15 9"></polyline></svg>
        </button>

        <!-- Đổi Theme -->
        <button @click="toggleDarkMode($event)"
                aria-label="Chuyển đổi giao diện Sáng / Tối"
                class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Đổi giao diện">
          <svg x-show="!darkMode" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg x-show="darkMode" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>

        <!-- Đăng xuất (Có xác nhận an toàn) -->
        <button @click="confirmLogout($event)"
                aria-label="Đăng xuất tài khoản"
                class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition active:scale-95 border border-transparent hover:border-rose-200 dark:hover:border-rose-900" title="Đăng xuất">
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- ─── Banner thông báo nhắc nhở theo mức độ ưu tiên ─── -->
  <div x-show="imminentTodos.length > 0" x-cloak
       class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 px-4 shadow-md">
    <div class="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
      <div class="flex items-center gap-2 overflow-hidden">
        <svg class="w-5 h-5 flex-shrink-0 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="truncate">
          <strong>Việc sắp đến hạn:</strong>
          <span x-text="imminentSummary"></span>
        </span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button @click="filterStatus='pending'; fetchTodos()"
                class="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition active:scale-95">
          Xem ngay
        </button>
      </div>
    </div>
  </div>

  <!-- ─── Main Content Container ─── -->
  <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5">

    <!-- ─── Sleek Status & Progress Overview (Giao diện tối giản, tinh tế) ─── -->
    <div class="bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-5 sm:py-3.5 mb-3.5 shadow-xs transition-all">
      <div class="flex items-center justify-between text-xs font-semibold gap-3 flex-wrap">
        <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button type="button" @click="filterStatus='pending'; fetchTodos()"
                  class="h-7.5 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                  :class="filterStatus==='pending' && 'ring-1 ring-amber-500/50 bg-amber-50/50 dark:bg-amber-950/30'"
                  title="Bấm để lọc việc cần làm">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <strong class="text-sm font-black text-slate-900 dark:text-white" x-text="stats.pending"></strong>
            <span class="text-slate-600 dark:text-slate-400">cần làm</span>
          </button>
          
          <span class="text-slate-200 dark:text-slate-700">•</span>
          
          <button type="button" x-show="stats.overdue > 0" @click="filterStatus='overdue'; fetchTodos()"
                  class="h-7.5 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition active:scale-95"
                  :class="filterStatus==='overdue' && 'ring-1 ring-rose-500/50 bg-rose-50/70 dark:bg-rose-950/40'"
                  title="Bấm để lọc việc quá hạn">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <strong class="text-sm font-black" x-text="stats.overdue"></strong>
            <span>quá hạn</span>
          </button>
          
          <span x-show="stats.overdue > 0" class="text-slate-200 dark:text-slate-700">•</span>
          
          <button type="button" @click="filterStatus='completed'; fetchTodos()"
                  class="h-7.5 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                  :class="filterStatus==='completed' && 'ring-1 ring-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30'"
                  title="Bấm để lọc việc đã xong">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span><strong class="text-emerald-600 dark:text-emerald-400 font-black text-sm" x-text="stats.completed"></strong>/<span x-text="stats.total"></span> đã xong</span>
          </button>
        </div>
        
        <div class="flex items-center gap-2.5 flex-shrink-0 ml-auto">
          <!-- Chuỗi ngày năng suất (Streak Counter) -->
          <div class="h-7.5 inline-flex items-center justify-center gap-1 px-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-bold text-xs select-none shadow-xs"
               :title="'Chuỗi ngày năng suất: ' + streak + ' ngày liên tục'">
            <span class="text-sm">🔥</span>
            <span class="font-black text-xs sm:text-sm" x-text="streak"></span>
            <span class="hidden sm:inline text-[11px] font-semibold text-orange-700/80 dark:text-orange-300">streak</span>
          </div>

          <div class="w-16 sm:w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5"
               role="progressbar" :aria-valuenow="stats.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="'Tiến độ hoàn thành: ' + stats.percent + '%'">
            <div class="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out" :style="'width: ' + stats.percent + '%'"></div>
          </div>
          <span class="text-[11px] font-black text-slate-500 dark:text-slate-400" x-text="stats.percent + '%'"></span>
        </div>
      </div>
      
      <!-- Lời chúc mừng khi hoàn thành 100% -->
      <div x-show="stats.total > 0 && stats.percent === 100" x-cloak
           class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-bounce-once">
        <span>🎉</span>
        <span>Tuyệt vời! Bạn đã hoàn thành 100% tất cả công việc! Chúc bạn một ngày năng suất!</span>
      </div>
    </div>

    <!-- ─── Search & Quick Filter Row ─── -->
    <div class="bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 mb-4 space-y-2.5 shadow-xs">
      <!-- Search Input with clear button and keyboard shortcut hint -->
      <div class="relative">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input x-model="searchQuery" @input.debounce.300ms="fetchTodos()" type="text" placeholder="Tìm kiếm công việc nhanh (phím / để tìm)..."
               aria-label="Tìm kiếm công việc"
               class="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-xs sm:text-sm font-medium" />
        <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          <button x-show="searchQuery" @click="searchQuery=''; fetchTodos()" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition" aria-label="Xóa nội dung tìm kiếm">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">/</kbd>
        </div>
      </div>

      <!-- Quick Filter Chips với số lượng đếm trực tiếp (Căn chỉnh đối xứng h-8) -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-0.5 px-0.5" role="group" aria-label="Bộ lọc trạng thái công việc">
        <template x-for="s in statusFilters" :key="s.value">
          <button @click="filterStatus = s.value; fetchTodos()"
                  role="button"
                  :aria-pressed="filterStatus === s.value"
                  class="flex-shrink-0 h-8 px-3 text-xs font-bold rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  :class="filterStatus === s.value
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-500'">
            <span x-html="s.icon" class="flex-shrink-0"></span>
            <span x-text="s.label"></span>
            <span class="ml-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-full"
                  :class="filterStatus === s.value ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300'"
                  x-text="getFilterCount(s.value)"></span>
          </button>
        </template>
      </div>

      <!-- Chế độ xem Đa năng: Danh sách / Kanban / Lịch -->
      <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
        <div class="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 h-8">
          <button type="button" @click="setViewMode('list')"
                  class="h-7 px-2.5 rounded-lg transition inline-flex items-center justify-center gap-1.5 active:scale-95"
                  :class="viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
            <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>Danh sách</span>
          </button>
          <button type="button" @click="setViewMode('kanban')"
                  class="h-7 px-2.5 rounded-lg transition inline-flex items-center justify-center gap-1.5 active:scale-95"
                  :class="viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
            <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
            <span>Kanban</span>
          </button>
          <button type="button" @click="setViewMode('calendar')"
                  class="h-7 px-2.5 rounded-lg transition inline-flex items-center justify-center gap-1.5 active:scale-95"
                  :class="viewMode === 'calendar' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
            <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Lịch</span>
          </button>
        </div>

        <!-- Lọc theo #tag -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs max-w-full" x-show="allTags.length > 0">
          <span class="text-slate-400 text-[11px] font-bold flex-shrink-0">Thẻ:</span>
          <button type="button" @click="filterTag = 'all'"
                  class="h-7 px-2.5 rounded-lg text-[11px] font-bold border transition inline-flex items-center justify-center active:scale-95 flex-shrink-0"
                  :class="filterTag === 'all' ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'">
            #tất cả
          </button>
          <template x-for="tg in allTags" :key="tg">
            <button type="button" @click="filterTag = (filterTag === tg ? 'all' : tg)"
                    class="h-7 px-2.5 rounded-lg text-[11px] font-bold border transition inline-flex items-center justify-center active:scale-95 flex-shrink-0"
                    :class="filterTag === tg ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'">
              #<span x-text="tg"></span>
            </button>
          </template>
        </div>
      </div>

      <!-- Secondary Filters (Danh mục, Ưu tiên, Sắp xếp) & Dọn dẹp -->
      <div class="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar text-xs">
        <select x-model="filterCategory" @change="fetchTodos()"
                aria-label="Lọc theo danh mục"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs transition hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-brand-500">
          <option value="all">📁 Danh mục (Tất cả)</option>
          <template x-for="cat in categories" :key="cat">
            <option :value="cat" x-text="cat"></option>
          </template>
        </select>

        <select x-model="filterPriority" @change="fetchTodos()"
                aria-label="Lọc theo mức độ ưu tiên"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs transition hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-brand-500">
          <option value="all">⚡ Ưu tiên (Tất cả)</option>
          <option value="High">🔴 Khẩn cấp (High)</option>
          <option value="Medium">🟡 Bình thường (Medium)</option>
          <option value="Low">🟢 Thấp (Low)</option>
        </select>

        <select x-model="sortBy" @change="fetchTodos()"
                aria-label="Sắp xếp danh sách công việc"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs transition hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-brand-500">
          <option value="due_date-asc">📅 Hạn: Gần → Xa</option>
          <option value="due_date-desc">📅 Hạn: Xa → Gần</option>
          <option value="created_at-desc">🕐 Mới tạo trước</option>
        </select>

        <!-- Nút Năng suất (Productivity Analytics) -->
        <button type="button" @click="openAnalytics()"
                aria-label="Báo cáo năng suất sâu"
                class="h-8 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex-shrink-0 text-xs inline-flex items-center gap-1.5 transition active:scale-95"
                title="Báo cáo thống kê năng suất sâu">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span class="hidden sm:inline">Năng suất</span>
        </button>

        <!-- Nút Pomodoro Focus Mode -->
        <button type="button" @click="openPomodoro()"
                aria-label="Chế độ tập trung Pomodoro"
                class="h-8 px-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold flex-shrink-0 text-xs inline-flex items-center gap-1.5 transition active:scale-95"
                title="Tập trung Pomodoro 25 phút kèm âm thanh tiếng mưa/tiếng ồn trắng">
          <span>🍅</span>
          <span class="hidden sm:inline">Focus</span>
        </button>

        <!-- Nút Thùng rác (Trash) -->
        <button type="button" @click="openTrashModal()"
                aria-label="Mở thùng rác"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0 text-xs inline-flex items-center gap-1.5 transition active:scale-95"
                title="Xem và khôi phục các công việc đã xóa trong Thùng rác">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span class="hidden sm:inline">Thùng rác</span>
        </button>

        <button x-show="stats.completed > 0" @click="confirmClearCompleted()"
                aria-label="Dọn dẹp công việc đã hoàn thành"
                class="h-8 ml-auto text-rose-500 hover:text-rose-600 font-bold inline-flex items-center justify-center gap-1 transition px-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 flex-shrink-0 text-xs active:scale-95"
                title="Dọn dẹp việc đã xong">
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span class="hidden sm:inline">Dọn dẹp đã xong</span>
        </button>
      </div>
    </div>

    <!-- ─── Nút thêm việc mới & Nói để tạo việc (Desktop & Tablet) ─── -->
    <div class="hidden sm:flex items-center gap-2 mb-5">
      <button @click="openCreateModal()"
              class="flex-1 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 bg-white/60 dark:bg-slate-900/60 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-xs group active:scale-[0.99]">
        <div class="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900 transition text-brand-600">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <span>Thêm công việc mới</span>
        <kbd class="ml-2 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">N</kbd>
      </button>

      <button type="button" @click="openCreateModal(); setTimeout(() => startVoiceInput(), 200)"
              class="h-[50px] px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 active:scale-95 transition"
              title="Nói tiếng Việt để tự động tạo công việc bằng Whisper AI">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        <span>Nói để tạo việc</span>
      </button>
    </div>

    <!-- ─── Skeleton Loading State (Tránh giật giật màn hình khi tải) ─── -->
    <div x-show="todosLoading" class="space-y-3" role="status" aria-busy="true" aria-label="Đang tải danh sách công việc...">
      <template x-for="i in [1, 2, 3]" :key="i">
        <div class="bg-white dark:bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 animate-pulse shadow-xs">
          <div class="flex items-start gap-3 sm:gap-4">
            <div class="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
            <div class="flex-1 space-y-2.5">
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
              <div class="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2"></div>
              <div class="flex gap-2 pt-1">
                <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-16"></div>
                <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20"></div>
                <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ─── Empty State ─── -->
    <div x-show="!todosLoading && todos.length === 0" class="text-center py-16 px-4 bg-white dark:bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div class="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Không có công việc nào</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Bạn chưa có tác vụ nào hoặc không khớp với bộ lọc hiện tại.</p>
      <button @click="openCreateModal()" class="mt-4 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/25 transition active:scale-95 inline-flex items-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tạo công việc đầu tiên
      </button>
    </div>

    <!-- ─── Todo List Item Cards (Tự động sắp xếp: Việc cần làm lên đầu, Quá hạn & Đã xong rớt xuống dưới) ─── -->
    <div class="space-y-3" x-show="viewMode === 'list' && !todosLoading && filteredSortedTodos.length > 0">
      <template x-for="todo in filteredSortedTodos" :key="todo.id">
        <div class="todo-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md group relative"
             :class="{
               'opacity-50 bg-slate-50/50 dark:bg-slate-900/50': todo.is_completed,
               'opacity-75 bg-rose-50/20 dark:bg-rose-950/20': !todo.is_completed && isOverdue(todo),
               'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-300/30': todo.is_pinned && !todo.is_completed
             }">
          <div class="flex items-start gap-3 sm:gap-4">
            
            <!-- Checkbox: Hết hạn tự hiện dấu ✕ (hủy), bấm vào sẽ tick thành xong việc ✓ -->
            <button @click="toggleTodo(todo, $event)"
                    role="checkbox"
                    :aria-checked="Boolean(todo.is_completed)"
                    :aria-label="todo.is_completed ? ('Đánh dấu chưa hoàn thành: ' + todo.title) : (isOverdue(todo) ? ('Xác nhận đã xong việc quá hạn: ' + todo.title) : ('Đánh dấu hoàn thành: ' + todo.title))"
                    class="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs active:scale-90"
                    :class="{
                      'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20': todo.is_completed,
                      'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900': !todo.is_completed && isOverdue(todo),
                      'border-slate-300 dark:border-slate-600 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/40 bg-white dark:bg-slate-800 text-transparent': !todo.is_completed && !isOverdue(todo)
                    }"
                    :title="todo.is_completed ? 'Đã hoàn thành (Bấm để mở lại)' : (isOverdue(todo) ? 'Quá hạn (Tự hủy) - Bấm để xác nhận xong việc' : 'Đánh dấu hoàn thành')">
              <!-- Đã xong: checkmark xanh lá -->
              <svg x-show="todo.is_completed" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <!-- Quá hạn: Dấu X đỏ tự hủy, bấm vào sẽ tick thành xong việc -->
              <svg x-show="!todo.is_completed && isOverdue(todo)" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span x-show="Boolean(todo.is_pinned)" x-cloak class="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                    Đã ghim
                  </span>

                  <!-- Cả việc Đã xong lẫn Quá hạn đều bị gạch ngang tên theo yêu cầu -->
                  <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white break-words"
                      :class="(todo.is_completed || isOverdue(todo)) && 'line-through-anim opacity-75'" x-text="todo.title"></h3>
                </div>

                <div class="flex-shrink-0 flex items-center gap-0.5 sm:gap-1">
                  <!-- Ghim (Pushpin Solid) -->
                  <button @click="togglePin(todo, $event)"
                          :aria-label="todo.is_pinned ? ('Bỏ ghim: ' + todo.title) : ('Ghim lên đầu: ' + todo.title)"
                          class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
                          :class="todo.is_pinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'" :title="todo.is_pinned ? 'Bỏ ghim' : 'Ghim lên đầu'">
                    <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                  </button>

                  <!-- Nhân bản (Copy Layer) -->
                  <button @click="duplicateTodo(todo, $event)"
                          :aria-label="'Nhân bản công việc: ' + todo.title"
                          class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition active:scale-90" title="Nhân bản">
                    <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>

                  <!-- Chỉnh sửa (Pen Icon) -->
                  <button @click="openEditModal(todo, $event)"
                          :aria-label="'Chỉnh sửa công việc: ' + todo.title"
                          class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-600 transition active:scale-90" title="Sửa">
                    <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>

                  <!-- Xoá (Trash Icon) -->
                  <button @click="confirmDelete(todo, $event)"
                          :aria-label="'Xóa công việc: ' + todo.title"
                          class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition active:scale-90" title="Xóa">
                    <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>

              <p x-show="todo.description" class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" x-text="todo.description"></p>

              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                <!-- Mức độ ưu tiên với Icon đẹp -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      :class="{
                        'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900': todo.priority==='High',
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900': todo.priority==='Medium',
                        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900': todo.priority==='Low'
                      }">
                  <svg x-show="todo.priority==='High'" class="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <svg x-show="todo.priority==='Medium'" class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <svg x-show="todo.priority==='Low'" class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  <span x-text="todo.priority"></span>
                </span>

                <!-- Danh mục với Icon Folder -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  <svg class="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                  <span x-text="todo.category"></span>
                </span>

                <!-- Badge chu kỳ lặp lại: Hàng ngày / Hàng tuần -->
                <span x-show="todo.repeat_mode && todo.repeat_mode !== 'none'"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      :class="todo.repeat_mode === 'daily'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
                        : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900'">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                  <span x-text="todo.repeat_mode === 'daily' ? 'Hàng ngày' : 'Hàng tuần'"></span>
                </span>

                <!-- Thời hạn: Hiển thị đúng theo chu kỳ -->
                <span x-show="todo.due_date" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      :class="isOverdue(todo)
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                        : isImminent(todo)
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-400 animate-pulse-warning'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'">
                  <svg x-show="isOverdue(todo)" class="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <svg x-show="!isOverdue(todo) && isImminent(todo)" class="w-3.5 h-3.5 text-amber-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <svg x-show="!isOverdue(todo) && !isImminent(todo)" class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                  <span x-text="formatTodoDueDate(todo)"></span>
                </span>

                <span x-show="isImminent(todo)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white animate-pulse">
                  ⏰ Sắp hết hạn (&lt; <span x-text="getPriorityWarningMinutes(todo.priority)"></span>P)
                </span>

                <!-- Thẻ #tags -->
                <template x-for="tg in getTags(todo)" :key="tg">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    #<span x-text="tg"></span>
                  </span>
                </template>

                <!-- Thời gian & Nút Pomodoro Focus -->
                <div class="inline-flex items-center gap-1.5">
                  <span x-show="todo.estimated_minutes > 0 || todo.actual_minutes > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span x-text="(todo.actual_minutes || 0) + '/' + (todo.estimated_minutes || 0) + 'm'"></span>
                  </span>
                  <button type="button" @click="openPomodoro(todo)"
                          class="h-6 px-1.5 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1 transition active:scale-95"
                          title="Tập trung Pomodoro cho việc này">
                    <span>🍅</span>
                    <span>Focus</span>
                  </button>
                </div>
              </div>

              <!-- Ảnh đính kèm (Thumbnails Strip) -->
              <div x-show="getTodoImages(todo.id).length > 0" class="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
                <template x-for="img in getTodoImages(todo.id)" :key="img.id">
                  <img :src="img.image_data" @click="openLightbox(img.image_data)" alt="Ảnh đính kèm"
                       class="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition hover:scale-105 flex-shrink-0" />
                </template>
              </div>

              <!-- Việc con / Checklist -->
              <div x-show="getSubtasks(todo).length > 0" class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 cursor-pointer select-none"
                     @click="todo._expandedSubtasks = !todo._expandedSubtasks">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-brand-500 transition-transform" :class="todo._expandedSubtasks && 'rotate-90'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    <span>Việc con: <strong class="text-slate-700 dark:text-slate-200" x-text="getSubtasks(todo).filter(s => s.is_completed).length + '/' + getSubtasks(todo).length"></strong></span>
                  </span>
                  <span class="text-[10px] text-slate-400" x-text="todo._expandedSubtasks ? 'Thu gọn' : 'Xem chi tiết'"></span>
                </div>
                <!-- Mini progress bar -->
                <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div class="h-full bg-brand-500 rounded-full transition-all duration-300"
                       :style="'width: ' + (getSubtasks(todo).length > 0 ? (getSubtasks(todo).filter(s => s.is_completed).length / getSubtasks(todo).length * 100) : 0) + '%'"></div>
                </div>
                <!-- Subtasks List (Direct Tick) -->
                <div x-show="todo._expandedSubtasks" class="space-y-1.5 pl-2">
                  <template x-for="st in getSubtasks(todo)" :key="st.id">
                    <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                      <input type="checkbox" :checked="Boolean(st.is_completed)" @change="toggleSubtask(todo, st.id)"
                             class="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer" />
                      <span :class="st.is_completed && 'line-through text-slate-400 dark:text-slate-500'" x-text="st.title"></span>
                    </label>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══════ KANBAN BOARD VIEW ═══════ -->
    <div x-show="viewMode === 'kanban' && !todosLoading" x-cloak class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <!-- Cột 1: Cần làm (To-Do) -->
      <div class="bg-slate-50/80 dark:bg-slate-900/60 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[400px]">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">Cần làm</h3>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                x-text="kanbanTodos.todo.length"></span>
        </div>
        <div class="space-y-2.5 flex-1"
             @dragover.prevent
             @drop="handleKanbanDrop('todo')">
          <template x-for="todo in kanbanTodos.todo" :key="todo.id">
            <div class="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition group cursor-grab active:cursor-grabbing"
                 draggable="true"
                 @dragstart="draggedTodoId = todo.id">
              <div class="flex items-start justify-between gap-1 mb-1.5">
                <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2" x-text="todo.title"></h4>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      :class="todo.priority==='High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : (todo.priority==='Low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300')"
                      x-text="todo.priority"></span>
              </div>
              <p x-show="todo.description" class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2" x-text="todo.description"></p>
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                <span x-text="todo.due_date ? formatTodoDueDate(todo) : 'Không hạn'"></span>
                <button type="button" @click="moveKanbanTask(todo, 'in_progress')"
                        class="h-6 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold transition active:scale-95 inline-flex items-center justify-center">
                  Bắt đầu →
                </button>
              </div>
            </div>
          </template>
          <div x-show="kanbanTodos.todo.length === 0" class="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            Kéo việc vào đây
          </div>
        </div>
      </div>

      <!-- Cột 2: Đang làm (In Progress) -->
      <div class="bg-amber-50/40 dark:bg-amber-950/20 rounded-3xl p-4 border border-amber-200/60 dark:border-amber-900/40 flex flex-col min-h-[400px]">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">Đang làm</h3>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                x-text="kanbanTodos.in_progress.length"></span>
        </div>
        <div class="space-y-2.5 flex-1"
             @dragover.prevent
             @drop="handleKanbanDrop('in_progress')">
          <template x-for="todo in kanbanTodos.in_progress" :key="todo.id">
            <div class="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs hover:shadow-md transition group cursor-grab active:cursor-grabbing"
                 draggable="true"
                 @dragstart="draggedTodoId = todo.id">
              <div class="flex items-start justify-between gap-1 mb-1.5">
                <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2" x-text="todo.title"></h4>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      :class="todo.priority==='High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : (todo.priority==='Low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300')"
                      x-text="todo.priority"></span>
              </div>
              <p x-show="todo.description" class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2" x-text="todo.description"></p>
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                <button type="button" @click="moveKanbanTask(todo, 'todo')" class="h-6 px-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold inline-flex items-center justify-center transition active:scale-95">
                  ← Cần làm
                </button>
                <button type="button" @click="moveKanbanTask(todo, 'completed')"
                        class="h-6 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold transition active:scale-95 inline-flex items-center justify-center">
                  Xong ✓
                </button>
              </div>
            </div>
          </template>
          <div x-show="kanbanTodos.in_progress.length === 0" class="text-center py-8 text-xs text-slate-400 border border-dashed border-amber-200 dark:border-amber-900/60 rounded-2xl">
            Kéo việc vào đây
          </div>
        </div>
      </div>

      <!-- Cột 3: Đã xong (Done) -->
      <div class="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-3xl p-4 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col min-h-[400px]">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">Đã xong</h3>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                x-text="kanbanTodos.completed.length"></span>
        </div>
        <div class="space-y-2.5 flex-1"
             @dragover.prevent
             @drop="handleKanbanDrop('completed')">
          <template x-for="todo in kanbanTodos.completed" :key="todo.id">
            <div class="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 opacity-75 shadow-xs transition group cursor-grab active:cursor-grabbing"
                 draggable="true"
                 @dragstart="draggedTodoId = todo.id">
              <div class="flex items-start justify-between gap-1 mb-1.5">
                <h4 class="font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-through line-clamp-2" x-text="todo.title"></h4>
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                <button type="button" @click="moveKanbanTask(todo, 'todo')"
                        class="h-6 px-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold inline-flex items-center justify-center transition active:scale-95">
                  ↩️ Mở lại việc
                </button>
              </div>
            </div>
          </template>
          <div x-show="kanbanTodos.completed.length === 0" class="text-center py-8 text-xs text-slate-400 border border-dashed border-emerald-200 dark:border-emerald-900/60 rounded-2xl">
            Chưa có việc hoàn thành
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════ CALENDAR VIEW ═══════ -->
    <div x-show="viewMode === 'calendar' && !todosLoading" x-cloak class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 mb-8 shadow-xs">
      <!-- Calendar Month Navigation -->
      <div class="flex items-center justify-between mb-4">
        <button type="button" @click="prevCalendarMonth()" class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white" x-text="calendarTitle"></h3>
        <button type="button" @click="nextCalendarMonth()" class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Days of Week Header -->
      <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
        <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
      </div>

      <!-- Calendar Month Days Grid -->
      <div class="grid grid-cols-7 gap-1 sm:gap-1.5">
        <template x-for="day in calendarDays" :key="day.dateStr">
          <button type="button" @click="selectCalendarDay(day.dateStr)"
                  class="h-14 sm:h-16 p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95"
                  :class="{
                    'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 ring-2 ring-brand-500/30': selectedCalendarDate === day.dateStr,
                    'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80': day.isCurrentMonth && selectedCalendarDate !== day.dateStr,
                    'opacity-30 border-transparent': !day.isCurrentMonth,
                    'font-black text-brand-600': day.isToday
                  }">
            <span class="text-xs" x-text="day.dayNum"></span>
            <div class="flex items-center gap-0.5 flex-wrap">
              <template x-for="i in Math.min(day.tasksCount, 3)" :key="i">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              </template>
              <span x-show="day.tasksCount > 3" class="text-[9px] font-bold text-slate-400">+<span x-text="day.tasksCount - 3"></span></span>
            </div>
          </button>
        </template>
      </div>

      <!-- Selected Day Tasks List -->
      <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800" x-show="selectedCalendarDate">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            Công việc ngày <span x-text="formatSelectedCalendarDate()"></span> (<span x-text="selectedDateTodos.length"></span> việc)
          </h4>
        </div>
        <div class="space-y-2">
          <template x-for="todo in selectedDateTodos" :key="todo.id">
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <button @click="toggleTodo(todo, $event)" class="w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer"
                        :class="todo.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'">
                  <svg x-show="todo.is_completed" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-100" :class="todo.is_completed && 'line-through opacity-60'" x-text="todo.title"></span>
              </div>
              <span class="text-[10px] font-bold text-slate-400" x-text="formatTodoDueDate(todo).split(',')[0]"></span>
            </div>
          </template>
          <div x-show="selectedDateTodos.length === 0" class="text-xs text-slate-400 text-center py-4">
            Không có công việc nào đến hạn vào ngày này.
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- ─── Floating Action Button (FAB) cho Mobile ─── -->
  <div class="fixed sm:hidden z-40"
       style="bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px)); right: calc(1.25rem + env(safe-area-inset-right, 0px));">
    <button @click="openCreateModal()"
            aria-label="Thêm công việc mới"
            class="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 text-white shadow-2xl shadow-brand-600/40 flex items-center justify-center active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900 focus-visible:ring-4 focus-visible:ring-brand-400"
            title="Thêm việc mới">
      <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
</div>



<!-- ═══════ MODAL THÔNG TIN PHIÊN BẢN & TÁC GIẢ (DESIGNED BY CHUNG) ═══════ -->
<div x-show="showAboutModal" x-cloak class="fixed inset-0 z-[160] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
  <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="showAboutModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center"
       x-transition:enter="transition ease-out duration-250" x-transition:enter-start="opacity-0 scale-95 translate-y-2" x-transition:enter-end="opacity-100 scale-100 translate-y-0"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100 translate-y-0" x-transition:leave-end="opacity-0 scale-95 translate-y-2"
       @click.stop>
    
    <!-- Logo lớn có hiệu ứng viền -->
    <div class="relative inline-block mb-3">
      <img src="/icon-192.png" alt="Logo" class="w-20 h-20 rounded-2xl shadow-lg mx-auto ring-4 ring-brand-500/20" />
      <span class="absolute -bottom-1 -right-1 px-2 py-0.5 bg-brand-600 text-white text-[10px] font-black rounded-full shadow">
        v<span x-text="appVersion"></span>
      </span>
    </div>

    <h3 id="about-modal-title" class="text-xl font-black text-slate-900 dark:text-white tracking-tight">To-Do List</h3>
    <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5 mb-2">Cloudflare Serverless Edition</p>

    <!-- Designed by Chung Badge -->
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-200 text-xs font-bold mb-4 shadow-sm">
      <span>✨</span>
      <span>Designed by <strong class="text-brand-600 dark:text-brand-400">Chung</strong></span>
    </div>

    <!-- Thông tin chi tiết -->
    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2 mb-4">
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Phiên bản:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200">v<span x-text="appVersion"></span> (Mới nhất)</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Tác giả:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200">Chung</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Hạ tầng:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200">Cloudflare Workers + D1</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Nhắc nhở công việc:</span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400">Chuông In-App & Telegram 🔔</span>
      </div>
    </div>

    <!-- Nút hành động trong Modal -->
    <div class="flex flex-col gap-2">
      <!-- Nút Mở thẳng Bot Telegram @hgc_todolist_bot -->
      <a href="https://t.me/hgc_todolist_bot" target="_blank" rel="noopener noreferrer"
         @click="openTelegramBot($event)"
         class="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold rounded-2xl shadow-md shadow-sky-500/25 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer">
        <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
        </svg>
        <span>Mở Bot Telegram (@hgc_todolist_bot)</span>
      </a>

      <!-- Nút Gửi thử Telegram Bot (Tự động xóa sau 15s) -->
      <button @click="testTelegram()"
              :disabled="testingTelegram"
              class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
        <svg class="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
        </svg>
        <span x-text="testingTelegram ? 'Đang gửi qua Telegram...' : 'Gửi thử Telegram (Tự xóa sau 15s)'"></span>
      </button>

      <!-- Nút Kích hoạt Telegram Webhook 2 chiều (1-Click) -->
      <button @click="setupTelegramWebhook()"
              :disabled="settingUpWebhook"
              class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-md shadow-emerald-500/25 transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span x-text="settingUpWebhook ? 'Đang kích hoạt...' : 'Kích hoạt Webhook Telegram 2 Chiều (1-Click)'"></span>
      </button>

      <!-- Nút Thử âm thanh & thông báo In-App -->
      <button @click="testInAppAlert()"
              class="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold rounded-2xl shadow-md shadow-brand-500/25 transition text-xs flex items-center justify-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Thử âm thanh & thông báo nhắc việc (Test Alert)
      </button>

      <!-- Nút Kiểm tra bản cập nhật -->
      <button @click="checkAppVersion(true)"
              class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition text-xs flex items-center justify-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
        Kiểm tra bản cập nhật mới
      </button>

      <!-- Nút Đóng -->
      <button @click="showAboutModal = false"
              aria-label="Đóng thông tin phiên bản"
              class="w-full py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition">
        Đóng
      </button>
    </div>
  </div>
</div>

<!-- ═══════ MODAL TẢI ỨNG DỤNG (DOWNLOAD FOR PC / IOS) ═══════ -->
<div x-show="showDownloadModal" x-cloak class="fixed inset-0 z-[115] flex items-end sm:items-center justify-center sm:p-4"
     role="dialog" aria-modal="true" aria-labelledby="download-modal-title">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showDownloadModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 max-h-[92vh] overflow-y-auto ios-safe-bottom"
       x-transition:enter="transition ease-out duration-250" x-transition:enter-start="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100" x-transition:leave-end="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
       @click.stop>
    
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2.5">
        <img src="/icon-192.png" alt="Logo" class="w-8 h-8 rounded-xl shadow-sm" />
        <h2 id="download-modal-title" class="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Cài đặt ứng dụng To-Do List</h2>
      </div>
      <button @click="showDownloadModal=false" aria-label="Đóng cửa sổ tải ứng dụng" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-5">
      <button @click="downloadTab='pc'" class="flex-1 h-10 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2"
              :class="downloadTab==='pc' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Download for PC
      </button>
      <button @click="downloadTab='ios'" class="flex-1 h-10 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2"
              :class="downloadTab==='ios' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        Download for iOS
      </button>
    </div>

    <!-- TAB 1: PC -->
    <div x-show="downloadTab==='pc'" class="space-y-4">
      <div class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs sm:text-sm text-blue-900 dark:text-blue-300 space-y-2">
        <p class="font-bold flex items-center gap-1.5">
          <svg class="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Lợi ích khi cài bản PC App:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
          <li>Chạy độc lập như phần mềm máy tính (có icon Desktop & Start Menu).</li>
          <li>Thông báo hiển thị tên <strong>"To-Do List"</strong> và logo sắc nét.</li>
          <li>Nhận thông báo ngay cả khi đóng tab trình duyệt.</li>
        </ul>
      </div>

      <button @click="installPWA()"
              class="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-sm">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Cài đặt ngay vào máy tính (1-Click)</span>
      </button>

      <div class="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
        <p class="font-semibold text-slate-700 dark:text-slate-300">Hoặc cài đặt từ trình duyệt:</p>
        <p>• <strong>Microsoft Edge</strong>: Bấm biểu tượng <strong>Ứng dụng</strong> trên thanh URL &gt; chọn <strong>Cài đặt</strong>.</p>
        <p>• <strong>Google Chrome</strong>: Bấm menu 3 chấm &gt; chọn <strong>Lưu & chia sẻ &gt; Cài đặt To-Do List...</strong></p>
      </div>
    </div>

    <!-- TAB 2: IOS -->
    <div x-show="downloadTab==='ios'" class="space-y-4">
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs sm:text-sm text-amber-900 dark:text-amber-300 space-y-2">
        <p class="font-bold flex items-center gap-1.5">
          <svg class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Cài đặt Web App lên iPhone không cần App Store:
        </p>
        <p class="text-slate-700 dark:text-slate-300">
          Ứng dụng sử dụng chuẩn <strong>Hồ sơ WebClip (.mobileconfig)</strong> của Apple với icon chuẩn HD, tự động chạy chế độ Toàn màn hình (FullScreen) như App Native!
        </p>
      </div>

      <div class="p-4 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-800 bg-white dark:bg-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black uppercase text-brand-600 dark:text-brand-400">Cách 1: Tải file cấu hình iOS (.mobileconfig)</span>
          <span class="text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full">Khuyên dùng</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Tải hồ sơ Apple WebClip chính thức của To-Do List với icon sắc nét chuẩn 100%.
        </p>
        <a href="/api/download/ios-profile" download="todolist.mobileconfig"
           class="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Tải hồ sơ cài đặt (.mobileconfig)
        </a>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
          <p class="font-bold text-slate-700 dark:text-slate-200">Các bước sau khi bấm Tải:</p>
          <p>1. Safari hỏi tải hồ sơ &gt; bấm <strong>Cho phép (Allow)</strong>.</p>
          <p>2. Mở <strong>Cài đặt (Settings)</strong> trên iPhone &gt; bấm vào mục <strong>"Đã tải về hồ sơ" (Profile Downloaded)</strong> ở trên cùng.</p>
          <p>3. Bấm <strong>Cài đặt (Install)</strong> ở góc phải trên &gt; Icon To-Do List sẽ xuất hiện ngay trên màn hình chính!</p>
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
        <p class="font-bold text-slate-800 dark:text-slate-200">Cách 2: Thêm từ trình duyệt Safari:</p>
        <p>1. Mở trang web này trong trình duyệt <strong>Safari</strong> trên iPhone.</p>
        <p>2. Bấm nút <strong>Chia sẻ (Share)</strong> ở thanh dưới Safari.</p>
        <p>3. Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> &gt; Bấm <strong>Thêm</strong>.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ CREATE / EDIT MODAL ═══════ -->
<div x-show="showModal" x-cloak class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
     role="dialog" aria-modal="true" aria-labelledby="todo-modal-title">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 max-h-[90vh] overflow-y-auto ios-safe-bottom"
       x-transition:enter="transition ease-out duration-250" x-transition:enter-start="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100" x-transition:leave-end="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
       @click.stop>
    
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-4">
      <h2 id="todo-modal-title" class="text-lg sm:text-xl font-black text-slate-900 dark:text-white" x-text="editingTodo ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'"></h2>
      <button @click="showModal=false" aria-label="Đóng cửa sổ" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <form @submit.prevent="saveTodo()" class="space-y-4">
      <!-- Bước 1: Tiêu đề công việc kèm Nhập liệu bằng giọng nói (Voice Input) -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="todo-title-input" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            1. Tiêu đề công việc <span class="text-rose-500">*</span>
          </label>
          <button type="button" @click="startVoiceInput()"
                  class="text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                  :class="isListeningVoice ? 'bg-rose-500 text-white animate-pulse' : 'bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'"
                  title="Nhấn để nói tiếng Việt điền tiêu đề tự động">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <span x-text="isListeningVoice ? 'Đang nghe...' : 'Nói tiếng Việt'"></span>
          </button>
        </div>
        <input id="todo-title-input" x-model="todoForm.title" type="text" required placeholder="Ví dụ: Làm bài tập, Họp đối tác, Tập gym..."
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-semibold text-slate-900 dark:text-white" />
      </div>

      <!-- Bước 2: Ghi chú chi tiết -->
      <div>
        <label for="todo-desc-input" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
          2. Ghi chú chi tiết
        </label>
        <textarea id="todo-desc-input" x-model="todoForm.description" rows="2" placeholder="Ghi chú thêm nội dung hoặc link tài liệu..."
                  class="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm resize-none text-slate-800 dark:text-slate-200"></textarea>
      </div>

      <!-- Việc con / Danh sách kiểm tra (Subtasks / Checklist) -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Danh sách việc con (Checklist)
        </label>
        <div class="space-y-1.5 mb-2" x-show="todoForm.subtasks && todoForm.subtasks.length > 0">
          <template x-for="(st, idx) in todoForm.subtasks" :key="st.id || idx">
            <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <input type="checkbox" :checked="Boolean(st.is_completed)" @change="st.is_completed = st.is_completed ? 0 : 1"
                     class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
              <input type="text" x-model="st.title" placeholder="Tên việc con..."
                     class="flex-1 bg-transparent text-xs font-semibold outline-none text-slate-800 dark:text-slate-200" />
              <button type="button" @click="removeSubtask(idx)" class="p-1 text-slate-400 hover:text-rose-500 rounded-lg">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </template>
        </div>
        <div class="flex gap-2">
          <input type="text" x-model="newSubtaskInput" @keydown.enter.prevent="addSubtask()" placeholder="+ Thêm việc con (nhấn Enter)..."
                 class="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-brand-500" />
          <button type="button" @click="addSubtask()"
                  class="h-10 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs active:scale-95 transition inline-flex items-center justify-center">
            + Thêm
          </button>
        </div>
      </div>

      <!-- Bước 3, 4, 5: Danh mục, Ưu tiên & Mốc nhắc trước -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Danh mục -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">3. Danh mục</label>
            <button type="button" @click="customCategoryMode = !customCategoryMode" class="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline">
              <span x-text="customCategoryMode ? 'Chọn sẵn' : '+ Tạo mới'"></span>
            </button>
          </div>
          <div x-show="!customCategoryMode">
            <select x-model="todoForm.category" aria-label="Chọn danh mục có sẵn"
                    class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
              <template x-for="cat in categories" :key="cat">
                <option :value="cat" x-text="cat"></option>
              </template>
            </select>
          </div>
          <div x-show="customCategoryMode">
            <input x-model="todoForm.category" type="text" placeholder="Nhập danh mục mới..." aria-label="Nhập danh mục mới"
                   class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none" />
          </div>
        </div>

        <!-- Mức độ ưu tiên -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">4. Ưu tiên</label>
          <select x-model="todoForm.priority" aria-label="Mức độ ưu tiên"
                  class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
            <option value="Low">🟢 Low</option>
            <option value="Medium">🟡 Medium</option>
            <option value="High">🔴 High</option>
          </select>
        </div>

        <!-- Tùy chỉnh mốc nhắc nhở (Reminder Offset) -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">5. Nhắc trước</label>
          <select x-model.number="todoForm.reminder_offset" aria-label="Nhắc trước hạn"
                  class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
            <option :value="0">Đúng giờ</option>
            <option :value="15">Trước 15 phút</option>
            <option :value="30">Trước 30 phút</option>
            <option :value="60">Trước 1 giờ</option>
            <option :value="1440">Trước 1 ngày</option>
          </select>
        </div>
      </div>

      <!-- Gắn Thẻ phân loại linh hoạt (#tags) -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Gắn Thẻ (#tags)
        </label>
        <div class="flex flex-wrap gap-1.5 mb-2" x-show="todoForm.tags && todoForm.tags.length > 0">
          <template x-for="(tg, idx) in todoForm.tags" :key="tg">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              #<span x-text="tg"></span>
              <button type="button" @click="removeTag(idx)" class="text-brand-400 hover:text-rose-500 font-black ml-0.5">✕</button>
            </span>
          </template>
        </div>
        <div class="flex gap-2">
          <input type="text" x-model="newTagInput" @keydown.enter.prevent="addTag()" placeholder="Nhập tag (ví dụ: gap, canhan, congty) rồi bấm + Thẻ..."
                 class="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-brand-500" />
          <button type="button" @click="addTag()"
                  class="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs active:scale-95 transition inline-flex items-center justify-center">
            + Thẻ
          </button>
        </div>
      </div>

      <!-- Bước 5: Chu kỳ lặp lại -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">5. Chu kỳ lặp lại</label>
        <div class="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button type="button" @click="todoForm.repeat_mode = 'none'"
                  class="py-2 px-2 rounded-xl text-center transition"
                  :class="todoForm.repeat_mode === 'none' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'">
            🚫 Không lặp
          </button>
          <button type="button" @click="todoForm.repeat_mode = 'daily'"
                  class="py-2 px-2 rounded-xl text-center transition"
                  :class="todoForm.repeat_mode === 'daily' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'">
            🔁 Hàng ngày
          </button>
          <button type="button" @click="todoForm.repeat_mode = 'weekly'"
                  class="py-2 px-2 rounded-xl text-center transition"
                  :class="todoForm.repeat_mode === 'weekly' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'">
            📅 Hàng tuần
          </button>
        </div>
      </div>

      <!-- Bước 6: Hạn chót (Thay đổi thông minh theo Chu kỳ lặp lại) -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">6. Thời hạn hoàn thành</label>

        <!-- Khi CHỌN KHÔNG LẶP: Nhập đầy đủ Giờ, Ngày Tháng Năm -->
        <div x-show="todoForm.repeat_mode === 'none'" class="w-full space-y-2">
          <input x-model="todoForm.due_datetime" type="datetime-local" aria-label="Thời hạn hoàn thành"
                 class="block w-full max-w-full box-border appearance-none px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold text-left outline-none" />
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button type="button" @click="setQuickDate('today-12')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95">Hôm nay 12:00</button>
            <button type="button" @click="setQuickDate('today-21')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95">Tối nay 21:00</button>
            <button type="button" @click="setQuickDate('tomorrow-06')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95">Sáng mai 06:00</button>
            <button type="button" @click="setQuickDate('weekend')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95">Chủ nhật tuần này</button>
          </div>
        </div>
        <!-- Khi CHỌN LẶP HÀNG NGÀY: Chỉ cần chọn Giờ -->
        <div x-show="todoForm.repeat_mode === 'daily'" class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Chọn giờ mỗi ngày:</span>
            <input x-model="todoForm.daily_time" type="time" aria-label="Chọn giờ mỗi ngày"
                   class="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none" />
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button type="button" @click="todoForm.daily_time = '06:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95" :class="todoForm.daily_time==='06:00' && 'ring-2 ring-brand-500 font-bold'">06:00 Sáng</button>
            <button type="button" @click="todoForm.daily_time = '12:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95" :class="todoForm.daily_time==='12:00' && 'ring-2 ring-brand-500 font-bold'">12:00 Trưa</button>
            <button type="button" @click="todoForm.daily_time = '18:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95" :class="todoForm.daily_time==='18:00' && 'ring-2 ring-brand-500 font-bold'">18:00 Tối</button>
            <button type="button" @click="todoForm.daily_time = '22:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95" :class="todoForm.daily_time==='22:00' && 'ring-2 ring-brand-500 font-bold'">22:00 Đêm</button>
          </div>
        </div>

        <!-- Khi CHỌN LẶP HÀNG TUẦN: Chỉ cần chọn Giờ và Thứ -->
        <div x-show="todoForm.repeat_mode === 'weekly'" class="space-y-2.5">
          <div>
            <span class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Chọn ngày trong tuần:</span>
            <div class="grid grid-cols-7 gap-1">
              <template x-for="day in [
                { val: 1, label: 'T2' },
                { val: 2, label: 'T3' },
                { val: 3, label: 'T4' },
                { val: 4, label: 'T5' },
                { val: 5, label: 'T6' },
                { val: 6, label: 'T7' },
                { val: 0, label: 'CN' }
              ]" :key="day.val">
                <button type="button" @click="todoForm.weekly_day = day.val"
                        class="py-2 text-xs font-bold rounded-xl transition text-center active:scale-95"
                        :class="todoForm.weekly_day === day.val ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
                        x-text="day.label"></button>
              </template>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Chọn giờ thực hiện:</span>
            <input x-model="todoForm.weekly_time" type="time" aria-label="Chọn giờ thực hiện hàng tuần"
                   class="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none" />
          </div>
        </div>
      </div>

      <!-- Ước lượng thời gian & Thời gian thực tế -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Thời gian ước lượng (phút)
        </label>
        <div class="flex items-center gap-2">
          <input type="number" min="0" max="1440" x-model.number="todoForm.estimated_minutes" placeholder="0"
                 class="w-24 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none text-center" />
          <span class="text-xs text-slate-500 font-semibold">phút</span>
          <div class="flex items-center gap-1 ml-auto">
            <button type="button" @click="todoForm.estimated_minutes = 15" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-[11px] font-bold cursor-pointer">+15p</button>
            <button type="button" @click="todoForm.estimated_minutes = 25" class="px-2 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-[11px] font-bold cursor-pointer">25p (🍅)</button>
            <button type="button" @click="todoForm.estimated_minutes = 45" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-[11px] font-bold cursor-pointer">+45p</button>
            <button type="button" @click="todoForm.estimated_minutes = 60" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-[11px] font-bold cursor-pointer">+1h</button>
          </div>
        </div>
      </div>

      <!-- Ảnh đính kèm (D1 todo_images, Canvas compress <= 40KB & Native Camera/Album) -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Ảnh đính kèm
        </label>
        <div class="flex flex-wrap gap-2 mb-2" x-show="editingTodoImages.length > 0">
          <template x-for="img in editingTodoImages" :key="img.id">
            <div class="relative group">
              <img :src="img.image_data" @click="openLightbox(img.image_data)" alt="Ảnh"
                   class="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition" />
              <button type="button" @click="deleteImage(editingTodo?.id, img.id)"
                      class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-md hover:bg-rose-600 cursor-pointer">✕</button>
            </div>
          </template>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" @click="chooseOrCapturePhoto(editingTodo?.id)"
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition active:scale-95 shadow-xs">
            <svg class="w-4 h-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span x-text="imageUploading ? 'Đang nén & tải ảnh...' : '📷 Chụp ảnh / Album'"></span>
          </button>
          <input id="todo-image-input" type="file" accept="image/*" class="hidden" @change="handleImageUpload($event, editingTodo?.id)" :disabled="imageUploading" />
        </div>
      </div>

      <!-- Ghim công việc -->
      <div class="flex items-center gap-2 pt-1">
        <input type="checkbox" id="pinCheck" x-model="todoForm.is_pinned" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer" />
        <label for="pinCheck" class="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 select-none">
          <svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
          Ghim công việc này lên đầu danh sách
        </label>
      </div>

      <div class="flex gap-2.5 pt-2">
        <button type="button" @click="showModal=false"
                class="flex-1 h-11 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm active:scale-95 inline-flex items-center justify-center">
          Huỷ
        </button>
        <button type="submit" :disabled="todoSaving"
                class="flex-1 h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 inline-flex items-center justify-center gap-2 text-sm active:scale-95">
          <svg x-show="todoSaving" class="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="editingTodo ? 'Cập nhật' : 'Tạo việc mới'"></span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ═══════ CONFIRM DELETE MODAL ═══════ -->
<div x-show="showDeleteModal" x-cloak class="fixed inset-0 z-[110] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showDeleteModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
       @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <h3 id="delete-modal-title" class="text-base font-bold mb-1.5">Xác nhận xoá công việc?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      Công việc "<strong x-text="deletingTodo?.title" class="text-slate-800 dark:text-slate-200"></strong>" sẽ được chuyển vào Thùng rác. Bạn có thể bấm [Hoàn tác] ngay hoặc khôi phục lại bất kỳ lúc nào.
    </p>
    <div class="flex gap-2.5">
      <button @click="showDeleteModal=false" class="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 inline-flex items-center justify-center">Huỷ</button>
      <button @click="deleteTodo()" :disabled="todoSaving" class="flex-1 h-10 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/25 transition active:scale-95 inline-flex items-center justify-center">Xoá vào thùng rác</button>
    </div>
  </div>
</div>

<!-- ═══════ CONFIRM CLEAR COMPLETED MODAL ═══════ -->
<div x-show="showClearCompletedModal" x-cloak class="fixed inset-0 z-[110] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="clear-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showClearCompletedModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
       @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <h3 id="clear-modal-title" class="text-base font-bold mb-1.5">Dọn dẹp công việc đã xong?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      Tất cả <strong x-text="stats.completed" class="text-rose-500"></strong> việc đã hoàn tất sẽ bị dọn dẹp khỏi danh sách.
    </p>
    <div class="flex gap-2.5">
      <button @click="showClearCompletedModal=false" class="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 inline-flex items-center justify-center">Huỷ</button>
      <button @click="clearCompleted()" :disabled="todoSaving" class="flex-1 h-10 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/25 transition active:scale-95 inline-flex items-center justify-center">Dọn dẹp ngay</button>
    </div>
  </div>
</div>

<!-- ═══════ CONFIRM LOGOUT MODAL ═══════ -->
<div x-show="showLogoutModal" x-cloak class="fixed inset-0 z-[115] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showLogoutModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center animate-bounce-once"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
       @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    </div>
    <h3 id="logout-modal-title" class="text-base font-bold mb-1.5">Xác nhận đăng xuất?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong x-text="currentUser?.username || 'này'" class="text-slate-800 dark:text-slate-200"></strong> không?
    </p>
    <div class="flex gap-2.5">
      <button @click="showLogoutModal=false" class="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 inline-flex items-center justify-center">Huỷ</button>
      <button @click="confirmLogoutAction()" class="flex-1 h-10 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition active:scale-95 inline-flex items-center justify-center">Đăng xuất ngay</button>
    </div>
  </div>
</div>

<!-- ═══════ BACKUP & CALENDAR EXPORT MODAL ═══════ -->
<div x-show="showBackupModal" x-cloak class="fixed inset-0 z-[120] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="backup-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showBackupModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-left"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
       @click.stop>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center text-lg font-black">
          📅
        </div>
        <div>
          <h3 id="backup-modal-title" class="text-base font-bold text-slate-900 dark:text-white">Sao lưu & Đồng bộ Lịch</h3>
          <p class="text-xs text-slate-400">Xuất file iCal và sao lưu dữ liệu To-Do List</p>
        </div>
      </div>
      <button @click="showBackupModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl">✕</button>
    </div>

    <div class="space-y-3 pt-2">
      <!-- 1. Xuất lịch iCal (.ics) -->
      <a href="/api/export/ics" download="todolist.ics"
         class="w-full p-3.5 rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100/50 dark:hover:bg-violet-900/40 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-violet-900 dark:text-violet-200 group">
        <span class="text-2xl">📅</span>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span>Xuất file iCalendar (.ics)</span>
            <span class="text-[10px] bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-2 py-0.5 rounded-full font-bold">Chuẩn RFC 5545</span>
          </div>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Đồng bộ tự động sang Google Calendar, Apple Calendar, Outlook</p>
        </div>
      </a>

      <!-- 2. Xuất sao lưu JSON -->
      <a href="/api/export/json" download
         class="w-full p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200 group">
        <span class="text-2xl">💾</span>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span>Sao lưu dữ liệu JSON</span>
            <span class="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">Toàn bộ 100%</span>
          </div>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Tải toàn bộ công việc, danh mục và lịch sử về máy</p>
        </div>
      </a>

      <!-- 3. Nhập phục hồi file JSON -->
      <label class="w-full p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
        <span class="text-2xl">📥</span>
        <div class="flex-1">
          <span>Khôi phục từ file JSON</span>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Nhập lại danh sách công việc từ file sao lưu</p>
        </div>
        <input type="file" accept=".json" class="hidden" @change="handleImportJsonFile($event)" />
      </label>
    </div>
  </div>
</div>

<!-- ═══════ TRASH MODAL (THÙNG RÁC) ═══════ -->
<div x-show="showTrashModal" x-cloak class="fixed inset-0 z-[130] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="trash-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showTrashModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-left max-h-[85vh] flex flex-col"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       @click.stop>
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center font-bold">
          🗑️
        </div>
        <div>
          <h3 id="trash-modal-title" class="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Thùng rác (<span x-text="trashTodos.length"></span>)
          </h3>
          <p class="text-[11px] text-slate-400">Tự động xóa vĩnh viễn các mục sau 30 ngày</p>
        </div>
      </div>
      <button @click="showTrashModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">✕</button>
    </div>

    <!-- Actions bar in Trash -->
    <div x-show="trashTodos.length > 0" class="flex items-center justify-between gap-2 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
      <button type="button" @click="restoreAllTrash()" class="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        <span>Khôi phục tất cả</span>
      </button>
      <button type="button" @click="emptyTrash()" class="h-8 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Dọn sạch thùng rác</span>
      </button>
    </div>

    <!-- Trash List -->
    <div class="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
      <div x-show="trashLoading" class="text-center py-8 text-xs text-slate-400 font-bold animate-pulse">
        Đang tải danh sách thùng rác...
      </div>
      <div x-show="!trashLoading && trashTodos.length === 0" class="text-center py-10 text-slate-400">
        <span class="text-3xl block mb-2">🎉</span>
        <p class="text-xs font-bold">Thùng rác hiện đang trống sạch sẽ!</p>
      </div>
      <template x-for="todo in trashTodos" :key="todo.id">
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate" x-text="todo.title"></h4>
            <div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              <span x-text="todo.category"></span>
              <span>•</span>
              <span>Đã xóa: <span x-text="formatDateShort(todo.deleted_at)"></span></span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button type="button" @click="restoreTodo(todo)" class="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 active:scale-95 transition" title="Khôi phục việc này">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              <span>Khôi phục</span>
            </button>
            <button type="button" @click="deletePermanently(todo)" class="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 inline-flex items-center justify-center transition active:scale-95" title="Xóa vĩnh viễn">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <div class="pt-2 text-center border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex-shrink-0">
      Bấm "Khôi phục" để đưa công việc trở lại màn hình chính bất cứ lúc nào.
    </div>
  </div>
</div>

<!-- ═══════ POMODORO FOCUS MODE & AMBIENT SOUND MODAL ═══════ -->
<div x-show="showPomodoroModal" x-cloak class="fixed inset-0 z-[130] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="pomodoro-modal-title">
  <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="showPomodoroModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center"
       x-transition:enter="transition ease-out duration-250" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       @click.stop>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🍅</span>
        <h3 id="pomodoro-modal-title" class="text-lg font-black text-slate-900 dark:text-white">Chế độ Tập trung</h3>
      </div>
      <button @click="showPomodoroModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">✕</button>
    </div>

    <!-- Target Task (nếu mở từ thẻ công việc) -->
    <div x-show="pomodoroActiveTodo" class="mb-4 p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300 truncate">
      🎯 Đang làm: <strong x-text="pomodoroActiveTodo?.title"></strong>
    </div>

    <!-- Mode Selector -->
    <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 text-xs font-bold">
      <button type="button" @click="setPomodoroMode('focus')"
              class="py-2 rounded-xl transition cursor-pointer"
              :class="pomodoroMode === 'focus' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-900'">
        Tập trung (25p)
      </button>
      <button type="button" @click="setPomodoroMode('shortBreak')"
              class="py-2 rounded-xl transition cursor-pointer"
              :class="pomodoroMode === 'shortBreak' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-900'">
        Nghỉ ngắn (5p)
      </button>
      <button type="button" @click="setPomodoroMode('longBreak')"
              class="py-2 rounded-xl transition cursor-pointer"
              :class="pomodoroMode === 'longBreak' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900'">
        Nghỉ dài (15p)
      </button>
    </div>

    <!-- Timer Display -->
    <div class="my-6">
      <div class="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-slate-900 dark:text-white select-none"
           x-text="formatTimer(pomodoroTimeLeft)"></div>
      <div class="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest"
           x-text="pomodoroRunning ? 'Đang đếm ngược...' : 'Tạm dừng'"></div>
    </div>

    <!-- Timer Controls -->
    <div class="flex items-center justify-center gap-3 mb-6">
      <button type="button" @click="pomodoroRunning ? pausePomodoro() : startPomodoro()"
              class="h-12 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              :class="pomodoroRunning ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'">
        <span x-text="pomodoroRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu tập trung'"></span>
      </button>
      <button type="button" @click="resetPomodoro()"
              class="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold inline-flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Đặt lại đồng hồ">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
    </div>

    <!-- Ambient Sound Generator (Web Audio API - 0KB) -->
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-left">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>🎧</span>
          <span>Âm thanh nền (Web Audio API - 0KB)</span>
        </span>
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">Tổng hợp trực tiếp</span>
      </div>

      <div class="grid grid-cols-3 gap-1.5 mb-3 text-xs font-bold">
        <button type="button" @click="playAmbientSound('none')"
                class="py-2 px-1 rounded-xl text-center border transition cursor-pointer"
                :class="ambientSound === 'none' ? 'bg-white dark:bg-slate-900 border-brand-500 text-brand-600 shadow-xs' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900'">
          🔇 Tắt tiếng
        </button>
        <button type="button" @click="playAmbientSound('rain')"
                class="py-2 px-1 rounded-xl text-center border transition cursor-pointer"
                :class="ambientSound === 'rain' ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-500 text-sky-700 dark:text-sky-300 shadow-xs' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900'">
          🌧️ Mưa rào
        </button>
        <button type="button" @click="playAmbientSound('white')"
                class="py-2 px-1 rounded-xl text-center border transition cursor-pointer"
                :class="ambientSound === 'white' ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900'">
          💨 Ồn trắng
        </button>
      </div>

      <div x-show="ambientSound !== 'none'" class="flex items-center gap-3 pt-1">
        <span class="text-[11px] font-bold text-slate-400">Âm lượng:</span>
        <input type="range" min="0" max="1" step="0.05" x-model="ambientVolume" @input="setAmbientVolume($event.target.value)"
               class="flex-1 accent-brand-600 cursor-pointer h-1.5 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <span class="text-[11px] font-mono text-slate-400 w-8 text-right" x-text="Math.round(ambientVolume * 100) + '%'"></span>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ PRODUCTIVITY ANALYTICS MODAL ═══════ -->
<div x-show="showAnalyticsModal" x-cloak class="fixed inset-0 z-[130] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="analytics-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showAnalyticsModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-left max-h-[85vh] flex flex-col"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       @click.stop>
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center font-bold">
          📊
        </div>
        <div>
          <h3 id="analytics-modal-title" class="text-base sm:text-lg font-black text-slate-900 dark:text-white">Báo cáo Năng suất Sâu</h3>
          <p class="text-[11px] text-slate-400">Đo lường tiến độ, chu kỳ & phân bố thời gian</p>
        </div>
      </div>
      <button @click="showAnalyticsModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">✕</button>
    </div>

    <div class="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
      <div x-show="analyticsLoading" class="text-center py-10 text-xs text-slate-400 font-bold animate-pulse">
        Đang phân tích dữ liệu công việc...
      </div>

      <div x-show="!analyticsLoading && analyticsData" class="space-y-4">
        <!-- 4 KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
            <span class="text-[11px] font-bold text-slate-400 block mb-0.5">Tỷ lệ xong</span>
            <span class="text-xl font-black text-emerald-600 dark:text-emerald-400" x-text="(analyticsData?.completion_rate || 0) + '%'"></span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
            <span class="text-[11px] font-bold text-slate-400 block mb-0.5">Đúng hạn</span>
            <span class="text-xl font-black text-blue-600 dark:text-blue-400" x-text="analyticsData?.on_time || 0"></span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
            <span class="text-[11px] font-bold text-slate-400 block mb-0.5">Thời gian thực</span>
            <span class="text-xl font-black text-amber-600 dark:text-amber-400" x-text="(analyticsData?.total_actual_minutes || 0) + 'm'"></span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
            <span class="text-[11px] font-bold text-slate-400 block mb-0.5">Còn chờ</span>
            <span class="text-xl font-black text-rose-600 dark:text-rose-400" x-text="analyticsData?.pending || 0"></span>
          </div>
        </div>

        <!-- Weekly Chart (T2 -> CN) -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Việc hoàn thành trong tuần (T2 - CN)</h4>
            <span class="text-[11px] font-bold text-brand-600 dark:text-brand-400">Tuần hiện tại</span>
          </div>
          <div class="flex items-end justify-between gap-2 h-28 pt-4 pb-2 px-1">
            <template x-for="item in (analyticsData?.week_stats || [])" :key="item.day">
              <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span class="text-[10px] font-bold text-slate-500" x-text="item.count"></span>
                <div class="w-full max-w-[28px] bg-brand-500 rounded-t-lg transition-all duration-500"
                     :style="'height: ' + Math.max(8, Math.min(80, item.count * 15)) + 'px; opacity: ' + (item.count > 0 ? '1' : '0.2')"></div>
                <span class="text-[11px] font-bold text-slate-400" x-text="item.day"></span>
              </div>
            </template>
          </div>
        </div>

        <!-- Category Distribution -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">Phân bố theo danh mục</h4>
          <div class="space-y-2">
            <template x-for="c in (analyticsData?.category_distribution || [])" :key="c.category">
              <div>
                <div class="flex items-center justify-between text-xs font-bold mb-1">
                  <span class="text-slate-700 dark:text-slate-300" x-text="c.category"></span>
                  <span class="text-slate-400" x-text="c.count + ' việc'"></span>
                </div>
                <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500"
                       :style="'width: ' + ((c.count / (analyticsData?.total || 1)) * 100) + '%'"></div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════ LIGHTBOX IMAGE MODAL ═══════ -->
<div x-show="lightboxImage" x-cloak class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
     @click="lightboxImage=null">
  <div class="relative max-w-3xl max-h-[90vh] flex flex-col items-center" @click.stop>
    <img :src="lightboxImage" alt="Phóng to ảnh" class="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20" />
    <div class="flex items-center gap-3 mt-4">
      <a :href="lightboxImage" download="todo-image.jpg" class="h-9 px-4 rounded-xl bg-white text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg hover:bg-slate-100 transition active:scale-95">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Tải ảnh về máy</span>
      </a>
      <button type="button" @click="lightboxImage=null" class="h-9 px-4 rounded-xl bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-700 transition active:scale-95 cursor-pointer">
        Đóng
      </button>
    </div>
  </div>
</div>

<!-- ═══════ MÀN HÌNH BẢO TRÌ HỆ THỐNG CHO NATIVE APP ═══════ -->
<div x-show="isUnderMaintenance" x-cloak
     class="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl text-white flex flex-col items-center justify-center p-6 text-center">
  <div class="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-amber-500/20 ring-1 ring-amber-500/30 animate-pulse">
    🚧
  </div>
  <h2 class="text-2xl font-black mb-3">Hệ thống đang bảo trì</h2>
  <p class="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed" x-text="maintenanceMessage || 'Máy chủ đang được nâng cấp định kỳ để tăng cường hiệu năng & bảo mật. Vui lòng thử lại sau ít phút!'"></p>
  <button type="button" @click="checkMaintenanceStatus()"
          class="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 active:scale-95 transition cursor-pointer flex items-center gap-2">
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
    <span>Thử kết nối lại</span>
  </button>
</div>

<!-- ═══════ JAVASCRIPT CONTROLLER ═══════ -->
<script>
const DEFAULT_API_BASE_URL = 'https://app.todolists.workers.dev';
const IS_CAPACITOR_NATIVE = (
  typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.origin && window.location.origin.includes('localhost') && Boolean(window.Capacitor))
  )
);
const API_BASE = (
  (typeof window !== 'undefined' && (window.VITE_API_BASE_URL || window.ENV_API_BASE_URL)) ||
  (IS_CAPACITOR_NATIVE ? DEFAULT_API_BASE_URL : '')
);

function cleanBaseUrl(base) {
  if (!base) return '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function app() {
  return {
    authToken: localStorage.getItem('todo_auth_token') || '',
    isUnderMaintenance: false,
    maintenanceMessage: '',
    darkMode: localStorage.getItem('darkMode') === 'true',
    authenticated: Boolean(localStorage.getItem('cached_user')),
    currentUser: (() => {
      try {
        return JSON.parse(localStorage.getItem('cached_user') || 'null');
      } catch (e) {
        return null;
      }
    })(),
    authMode: 'login',
    authForm: { email: '', username: '', password: '' },
    authLoading: false,

    // Tải tức thì từ LocalStorage (Instant Load)
    todos: (() => {
      try {
        return JSON.parse(localStorage.getItem('cached_todos') || '[]');
      } catch (e) {
        return [];
      }
    })(),
    todosLoading: false,
    categories: (() => {
      try {
        return JSON.parse(localStorage.getItem('cached_categories') || '["Personal", "Work", "Shopping", "Health", "Study"]');
      } catch (e) {
        return ['Personal', 'Work', 'Shopping', 'Health', 'Study'];
      }
    })(),

    // Quản lý Ngoại tuyến & Hàng đợi thao tác (Offline Sync Queue)
    isOffline: !navigator.onLine,
    isSyncing: false,
    offlineQueue: (() => {
      try {
        return JSON.parse(localStorage.getItem('offline_queue') || '[]');
      } catch (e) {
        return [];
      }
    })(),
    settingUpWebhook: false,

    // Filters
    searchQuery: '',
    filterStatus: 'all',
    filterCategory: 'all',
    filterPriority: 'all',
    sortBy: 'due_date-asc',

    statusFilters: [
      {
        value: 'all',
        label: 'Tất cả',
        icon: '<svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>'
      },
      {
        value: 'pending',
        label: 'Đang chờ',
        icon: '<svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14.2l-3.9-2.3.8-1.4 3.1 1.8V7h1.5v9.2z"/></svg>'
      },
      {
        value: 'recurring',
        label: 'Lặp lại',
        icon: '<svg class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>'
      },
      {
        value: 'completed',
        label: 'Đã xong',
        icon: '<svg class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      },
      {
        value: 'overdue',
        label: 'Quá hạn',
        icon: '<svg class="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
      }
    ],

    // Multi-view mode & Filters
    viewMode: localStorage.getItem('viewMode') || 'list',
    filterTag: 'all',
    showBackupModal: false,
    isListeningVoice: false,
    newSubtaskInput: '',
    newTagInput: '',
    draggedTodoId: null,
    calendarDate: new Date(),
    selectedCalendarDate: null,

    // Modals
    showModal: false,
    editingTodo: null,
    customCategoryMode: false,
    todoForm: {
      title: '',
      description: '',
      category: 'Personal',
      priority: 'Medium',
      repeat_mode: 'none',
      due_datetime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      daily_time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
      weekly_day: new Date().getDay(),
      weekly_time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
      is_pinned: false,
      subtasks: [],
      tags: [],
      reminder_offset: 0,
      estimated_minutes: 0,
      actual_minutes: 0
    },
    todoSaving: false,
    bgAudio: null,

    // V3: Thùng rác (Trash)
    showTrashModal: false,
    trashTodos: [],
    trashLoading: false,
    lastDeletedTodo: null,

    // V3: Pomodoro & Web Audio API
    showPomodoroModal: false,
    pomodoroRunning: false,
    pomodoroMode: 'focus',
    pomodoroTimeLeft: 25 * 60,
    pomodoroTotalTime: 25 * 60,
    pomodoroActiveTodo: null,
    pomodoroInterval: null,
    ambientSound: 'none',
    ambientVolume: 50,
    ambientNodes: null,

    // V3: Productivity Analytics
    showAnalyticsModal: false,
    analyticsData: null,
    analyticsLoading: false,

    // V3: Images & Lightbox
    todoImagesMap: {},
    editingTodoImages: [],
    allImagesMap: {},
    imageUploading: false,
    lightboxImage: null,

    // V3: Real-Time Sync & Voice MediaRecorder Fallback
    lastSyncVersion: localStorage.getItem('last_sync_version') || '0',
    liveSyncInterval: null,
    isRecordingVoiceMedia: false,
    mediaRecorder: null,
    audioChunks: [],
    voiceRecordingSeconds: 0,
    voiceTimerInterval: null,

    showDeleteModal: false,
    deletingTodo: null,
    showClearCompletedModal: false,
    showLogoutModal: false,

    // Download Modal State
    showDownloadModal: false,
    downloadTab: 'ios',
    deferredInstallPrompt: null,

    // Refresh State
    isRefreshing: false,

    // Toasts
    toasts: [],
    toastId: 0,

    // Modal About & Version
    showAboutModal: false,
    appVersion: '2.0.0',
    testingTelegram: false,

    // In-App Notifications, Priorities & Auto-Update
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    lastNotifiedTimes: {},
    reminderInterval: null,
    autoPollInterval: null,
    bgWorker: null,
    swRegistration: null,
    audioCtx: null,

    get stats() {
      const total = this.todos.length;
      const completed = this.todos.filter(t => t.is_completed).length;
      const pending = this.todos.filter(t => !t.is_completed).length;
      const overdue = this.todos.filter(t => this.isOverdue(t)).length;
      const recurring = this.todos.filter(t => t.repeat_mode && t.repeat_mode !== 'none' && !t.is_completed).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, pending, overdue, recurring, percent };
    },

    getFilterCount(value) {
      if (value === 'all') return this.stats.total;
      if (value === 'pending') return this.stats.pending;
      if (value === 'recurring') return this.stats.recurring;
      if (value === 'completed') return this.stats.completed;
      if (value === 'overdue') return this.stats.overdue;
      return 0;
    },

    get sortedTodos() {
      if (!this.todos || this.todos.length === 0) return [];
      const list = [...this.todos];
      return list.sort((a, b) => {
        const aCompleted = a.is_completed ? 1 : 0;
        const bCompleted = b.is_completed ? 1 : 0;
        const aOverdue = this.isOverdue(a) ? 1 : 0;
        const bOverdue = this.isOverdue(b) ? 1 : 0;

        // Phân loại:
        // 0 = Cần làm (chưa hoàn thành & chưa quá hạn) -> LÊN TRÊN ĐẦU
        // 1 = Quá hạn (chưa hoàn thành nhưng đã quá hạn) -> RỚT XUỐNG DƯỚI
        // 2 = Đã xong -> RỚT XUỐNG DƯỚI CÙNG
        const getGroup = (isComp, isOver) => {
          if (isComp) return 2;
          if (isOver) return 1;
          return 0;
        };

        const groupA = getGroup(aCompleted, aOverdue);
        const groupB = getGroup(bCompleted, bOverdue);

        if (groupA !== groupB) {
          return groupA - groupB;
        }

        // Trong cùng nhóm: việc ghim lên trước
        const aPinned = a.is_pinned ? 1 : 0;
        const bPinned = b.is_pinned ? 1 : 0;
        if (aPinned !== bPinned) {
          return bPinned - aPinned;
        }

        // Xếp theo tiêu chí sortBy mà người dùng chọn
        const sortBy = this.sortBy || 'due_date-asc';

        if (sortBy === 'due_date-desc') {
          // Xa -> Gần: Việc có hạn lâu tới nhất đứng đầu
          if (a.due_date && b.due_date) {
            const tA = new Date(a.due_date).getTime();
            const tB = new Date(b.due_date).getTime();
            if (!isNaN(tA) && !isNaN(tB) && tA !== tB) return tB - tA;
          }
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
        } else if (sortBy === 'created_at-desc') {
          // Mới tạo: Việc mới tạo nhất đứng đầu
          const cA = new Date(a.created_at).getTime() || 0;
          const cB = new Date(b.created_at).getTime() || 0;
          if (cA !== cB) return cB - cA;
        } else if (sortBy === 'created_at-asc') {
          // Cũ nhất trước
          const cA = new Date(a.created_at).getTime() || 0;
          const cB = new Date(b.created_at).getTime() || 0;
          if (cA !== cB) return cA - cB;
        } else {
          // Mặc định 'due_date-asc': Gần -> Xa (Việc có hạn gần nhất đứng đầu)
          if (a.due_date && b.due_date) {
            const tA = new Date(a.due_date).getTime();
            const tB = new Date(b.due_date).getTime();
            if (!isNaN(tA) && !isNaN(tB) && tA !== tB) return tA - tB;
          }
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
        }

        const cA = new Date(a.created_at).getTime() || 0;
        const cB = new Date(b.created_at).getTime() || 0;
        return cB - cA;
      });
    },

    get imminentTodos() {
      return this.todos.filter(t => this.isWithin30Minutes(t));
    },

    get imminentSummary() {
      return this.imminentTodos.map(t => '«' + t.title + '» (' + (t.priority || 'Medium') + ' - ' + this.getMinutesRemaining(t) + 'p)').join(', ');
    },

    get allTags() {
      const set = new Set();
      for (const t of this.todos) {
        const tags = this.getTags(t);
        tags.forEach(tg => set.add(tg));
      }
      return Array.from(set).sort();
    },

    get filteredSortedTodos() {
      const list = this.sortedTodos;
      if (this.filterTag === 'all') return list;
      return list.filter(t => {
        const tags = this.getTags(t);
        return tags.includes(this.filterTag);
      });
    },

    get kanbanTodos() {
      const list = this.filteredSortedTodos;
      return {
        todo: list.filter(t => !t.is_completed && t.status !== 'in_progress'),
        in_progress: list.filter(t => !t.is_completed && t.status === 'in_progress'),
        completed: list.filter(t => t.is_completed || t.status === 'completed'),
      };
    },

    get streak() {
      const completed = this.todos.filter(t => t.is_completed);
      if (!completed.length) return 0;
      const dateSet = new Set();
      completed.forEach(t => {
        const time = new Date(t.updated_at || t.created_at).getTime();
        if (!isNaN(time)) {
          const vn = new Date(time + 7 * 3600 * 1000);
          dateSet.add(vn.getUTCFullYear() + '-' + String(vn.getUTCMonth()+1).padStart(2,'0') + '-' + String(vn.getUTCDate()).padStart(2,'0'));
        }
      });
      const nowVn = new Date(Date.now() + 7 * 3600 * 1000);
      const pad = n => String(n).padStart(2, '0');
      const todayStr = nowVn.getUTCFullYear() + '-' + pad(nowVn.getUTCMonth()+1) + '-' + pad(nowVn.getUTCDate());
      const yestVn = new Date(Date.now() + 7 * 3600 * 1000 - 86400000);
      const yestStr = yestVn.getUTCFullYear() + '-' + pad(yestVn.getUTCMonth()+1) + '-' + pad(yestVn.getUTCDate());
      let check = dateSet.has(todayStr) ? new Date(nowVn.getTime()) : (dateSet.has(yestStr) ? new Date(yestVn.getTime()) : null);
      if (!check) return 0;
      let count = 0;
      while (true) {
        const str = check.getUTCFullYear() + '-' + pad(check.getUTCMonth()+1) + '-' + pad(check.getUTCDate());
        if (dateSet.has(str)) {
          count++;
          check = new Date(check.getTime() - 86400000);
        } else {
          break;
        }
      }
      return count;
    },

    get calendarTitle() {
      const d = this.calendarDate;
      return 'Tháng ' + (d.getMonth() + 1) + ' / ' + d.getFullYear();
    },

    get calendarDays() {
      const year = this.calendarDate.getFullYear();
      const month = this.calendarDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      let startDayOfWeek = firstDay.getDay();
      startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

      const days = [];
      const pad = n => String(n).padStart(2, '0');

      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dNum = prevMonthLastDay - i;
        const prevM = month === 0 ? 12 : month;
        const prevY = month === 0 ? year - 1 : year;
        const dateStr = prevY + '-' + pad(prevM) + '-' + pad(dNum);
        days.push({ dayNum: dNum, dateStr, isCurrentMonth: false, isToday: false, tasksCount: 0 });
      }

      const todayVn = new Date(Date.now() + 7 * 3600 * 1000);
      const todayStr = todayVn.getUTCFullYear() + '-' + pad(todayVn.getUTCMonth()+1) + '-' + pad(todayVn.getUTCDate());

      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = year + '-' + pad(month + 1) + '-' + pad(d);
        const tasksOnDay = this.todos.filter(t => {
          if (!t.due_date) return false;
          const taskD = new Date(t.due_date);
          if (isNaN(taskD.getTime())) return false;
          const taskVn = new Date(taskD.getTime() + 7 * 3600 * 1000);
          const taskDateStr = taskVn.getUTCFullYear() + '-' + pad(taskVn.getUTCMonth()+1) + '-' + pad(taskVn.getUTCDate());
          return taskDateStr === dateStr;
        });
        days.push({
          dayNum: d,
          dateStr,
          isCurrentMonth: true,
          isToday: dateStr === todayStr,
          tasksCount: tasksOnDay.length
        });
      }

      const remaining = (7 - (days.length % 7)) % 7;
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 1 : month + 2;
        const nextY = month === 11 ? year + 1 : year;
        const dateStr = nextY + '-' + pad(nextM) + '-' + pad(d);
        days.push({ dayNum: d, dateStr, isCurrentMonth: false, isToday: false, tasksCount: 0 });
      }

      return days;
    },

    get selectedDateTodos() {
      if (!this.selectedCalendarDate) return [];
      const pad = n => String(n).padStart(2, '0');
      return this.todos.filter(t => {
        if (!t.due_date) return false;
        const taskD = new Date(t.due_date);
        if (isNaN(taskD.getTime())) return false;
        const taskVn = new Date(taskD.getTime() + 7 * 3600 * 1000);
        const taskDateStr = taskVn.getUTCFullYear() + '-' + pad(taskVn.getUTCMonth()+1) + '-' + pad(taskVn.getUTCDate());
        return taskDateStr === this.selectedCalendarDate;
      });
    },

    async init() {
      // 1. Mở khóa AudioContext và Background Audio Loop giữ app luôn thức khi ở đa nhiệm
      const unlockAudio = () => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext && !this.audioCtx) {
            this.audioCtx = new AudioContext();
          }
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          this.startBackgroundAudioKeepAlive();
        } catch {}
      };
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
      window.addEventListener('click', unlockAudio, { once: true, passive: true });

      // 1b. Khởi tạo Native Capacitor Settings (StatusBar, Preferences, Maintenance & OTA)
      if (window.Capacitor?.Plugins?.Preferences) {
        try {
          const prefToken = await window.Capacitor.Plugins.Preferences.get({ key: 'todo_auth_token' });
          if (prefToken?.value) {
            this.authToken = prefToken.value;
          }
        } catch {}
      }
      this.checkMaintenanceStatus();
      this.checkNativeOtaUpdate();
      if (window.Capacitor?.Plugins?.StatusBar) {
        try {
          const { StatusBar, Style } = window.Capacitor.Plugins;
          await StatusBar.setStyle({ style: this.darkMode ? Style.Dark : Style.Light });
        } catch {}
      }

      // 2. Đăng ký Service Worker & Tự động cập nhật phiên bản mới nhất ngay trên iOS/PWA
      if ('serviceWorker' in navigator) {
        try {
          this.swRegistration = await navigator.serviceWorker.register('/sw.js');
          if (this.swRegistration.update) {
            this.swRegistration.update().catch(() => {});
          }
          this.swRegistration.addEventListener('updatefound', () => {
            const installingWorker = this.swRegistration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              });
            }
          });
          navigator.serviceWorker.ready.then((reg) => {
            this.swRegistration = reg;
          });
        } catch (e) {
          console.warn('SW failed:', e);
        }
      }

      // 3. Bắt sự kiện PWA Install
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
      });

      // 4. Lắng nghe trạng thái Online / Offline để kích hoạt đồng bộ hàng đợi
      window.addEventListener('online', () => {
        this.isOffline = false;
        this.syncOfflineQueue();
      });
      window.addEventListener('offline', () => {
        this.isOffline = true;
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
      });

      // Kiểm tra và đồng bộ hàng đợi ngoại tuyến định kỳ mỗi 15 giây
      setInterval(() => {
        if (navigator.onLine && this.offlineQueue.length > 0 && !this.isSyncing) {
          this.syncOfflineQueue();
        }
      }, 15000);

      // 5. Lắng nghe khi người dùng mở lại app / tab từ background
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.authenticated) {
          if (navigator.onLine && this.offlineQueue.length > 0) {
            this.syncOfflineQueue();
          }
          this.fetchTodos(true);
          this.checkDueReminders();
          this.checkAppVersion();
        }
      });
      window.addEventListener('focus', () => {
        if (this.authenticated) {
          if (navigator.onLine && this.offlineQueue.length > 0) {
            this.syncOfflineQueue();
          }
          this.fetchTodos(true);
          this.checkDueReminders();
          this.checkAppVersion();
        }
      });

      // Kiểm tra phiên bản mới nhất từ server mỗi 60 giây
      setInterval(() => {
        this.checkAppVersion();
      }, 60000);

      await this.checkAuth();
      if (navigator.onLine && this.offlineQueue.length > 0) {
        this.syncOfflineQueue();
      }

      // 5. Khởi động Web Worker chạy ngầm (chống trình duyệt bóp nghẹt timer khi mở ngầm)
      this.startBackgroundTimerWorker();

      // 6. Tự động kiểm tra nhắc nhở mỗi 10 giây trên main thread
      this.reminderInterval = setInterval(() => {
        this.checkDueReminders();
      }, 10000);

      // 7. Tự động đồng bộ dữ liệu từ server ngầm mỗi 30 giây (Auto-Refresh)
      this.autoPollInterval = setInterval(() => {
        if (this.authenticated && !this.todosLoading && !this.showModal) {
          this.fetchTodos(true);
        }
      }, 30000);

      // 7b. Live Sync Polling (Version check siêu nhẹ mỗi 12 giây)
      this.lastKnownVersion = null;
      this.liveSyncInterval = setInterval(async () => {
        if (!this.authenticated || !navigator.onLine || this.isSyncing) return;
        try {
          const syncUrl = cleanBaseUrl(API_BASE) + '/api/sync/version';
          const res = await fetch(syncUrl, {
            credentials: 'include',
            headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
          });
          if (res.ok) {
            const data = await res.json();
            const currentVersion = String(data.latest_updated_at) + '_' + String(data.count);
            if (this.lastKnownVersion && this.lastKnownVersion !== currentVersion && !this.showModal) {
              await this.fetchTodos(true);
            }
            this.lastKnownVersion = currentVersion;
          }
        } catch {}
      }, 12000);

      // 7c. Đọc URL Parameters (PWA Shortcuts deep linking: ?action=new, ?action=voice, ?filter=today)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new') {
          setTimeout(() => this.openCreateModal(), 300);
        } else if (urlParams.get('action') === 'voice') {
          setTimeout(() => {
            this.openCreateModal();
            setTimeout(() => this.startVoiceInput(), 200);
          }, 300);
        } else if (urlParams.get('filter')) {
          this.currentFilter = urlParams.get('filter');
        }
      } catch {}

      // 8. Tự động nhả focus (.blur()) sau khi chạm/click để loại bỏ triệt để lỗi nút bị kẹt lõm trên iOS/Safari
      const handleTouchEndBlur = (e) => {
        const btn = e.target?.closest ? e.target.closest('button, a, [role="button"]') : null;
        if (btn && typeof btn.blur === 'function') {
          btn.blur();
          setTimeout(() => {
            if (typeof btn.blur === 'function') btn.blur();
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
          }, 40);
        }
      };
      window.addEventListener('touchend', handleTouchEndBlur, { passive: true });
      window.addEventListener('mouseup', handleTouchEndBlur, { passive: true });

      // 9. Lắng nghe phím tắt toàn cục (A11y & Power User: Esc -> Đóng modal, N -> Tạo việc mới, / -> Tìm kiếm)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAllModals();
          return;
        }
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
        if (!isInput && this.authenticated) {
          const anyModalOpen = this.showModal || this.showDeleteModal || this.showClearCompletedModal || this.showLogoutModal || this.showAboutModal || this.showDownloadModal || this.showTrashModal || this.showPomodoroModal || this.showAnalyticsModal || this.showLightbox;
          if (!anyModalOpen) {
            if (e.key === 'n' || e.key === 'N') {
              e.preventDefault();
              this.openCreateModal();
            } else if (e.key === '/') {
              e.preventDefault();
              const searchInput = document.querySelector('input[x-model="searchQuery"]');
              if (searchInput && typeof searchInput.focus === 'function') {
                searchInput.focus();
              }
            }
          }
        }
      });
    },

    closeAllModals() {
      this.showModal = false;
      this.showDeleteModal = false;
      this.showClearCompletedModal = false;
      this.showLogoutModal = false;
      this.showAboutModal = false;
      this.showDownloadModal = false;
      this.showTrashModal = false;
      this.showPomodoroModal = false;
      this.showAnalyticsModal = false;
      this.showLightbox = false;
    },

    async refreshDataManual(e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.isRefreshing = true;
      try {
        await Promise.all([this.fetchTodos(), this.fetchCategories()]);
      } finally {
        this.isRefreshing = false;
      }
    },

    async installPWA() {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showToast('Cài đặt ứng dụng thành công! 🎉', 'success');
          this.showDownloadModal = false;
        }
        this.deferredInstallPrompt = null;
      } else {
        this.showToast('Vui lòng bấm biểu tượng Cài đặt trên thanh địa chỉ URL!', 'info');
      }
    },

    toggleDarkMode(e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    },

    showToast(message, type = 'success', action = null) {
      const duration = action ? 5000 : 3000;
      if (!action) {
        const existing = this.toasts.find(t => t.type === type && !t.action);
        if (existing) {
          // Cùng loại thông báo: Xếp chồng (stacking) với badge đếm số lượng
          existing.count = (existing.count || 1) + 1;
          existing.message = message;
          if (existing.timer) clearTimeout(existing.timer);
          existing.timer = setTimeout(() => {
            this.removeToast(existing.id);
          }, duration);
          return;
        }
      }

      // Đẩy bớt nếu nhiều hơn 2 thông báo
      if (this.toasts.length >= 2) {
        const oldest = this.toasts.shift();
        if (oldest && oldest.timer) clearTimeout(oldest.timer);
      }
      const id = ++this.toastId;
      const newToast = {
        id,
        message,
        type,
        action,
        count: 1,
        offset: false,
        offsetX: 0,
        offsetY: 0,
        touchStartX: 0,
        touchStartY: 0,
        timer: null
      };
      newToast.timer = setTimeout(() => {
        this.removeToast(id);
      }, duration);
      this.toasts.push(newToast);
    },

    removeToast(id) {
      const t = this.toasts.find(x => x.id === id);
      if (t && t.timer) clearTimeout(t.timer);
      this.toasts = this.toasts.filter(x => x.id !== id);
    },

    startToastSwipe(e, toast) {
      if (!e.touches || !e.touches[0]) return;
      toast.touchStartX = e.touches[0].clientX;
      toast.touchStartY = e.touches[0].clientY;
      toast.offset = true;
      if (toast.timer) clearTimeout(toast.timer);
    },

    moveToastSwipe(e, toast) {
      if (!toast.touchStartX || !e.touches || !e.touches[0]) return;
      const dx = e.touches[0].clientX - toast.touchStartX;
      const dy = e.touches[0].clientY - toast.touchStartY;
      toast.offsetX = dx;
      toast.offsetY = Math.min(10, dy);
    },

    endToastSwipe(e, toast) {
      if (toast.offsetY < -35 || Math.abs(toast.offsetX) > 60) {
        if (navigator.vibrate) navigator.vibrate(20);
        this.removeToast(toast.id);
      } else {
        toast.offsetX = 0;
        toast.offsetY = 0;
        toast.offset = false;
        toast.timer = setTimeout(() => {
          this.removeToast(toast.id);
        }, 3000);
      }
      toast.touchStartX = 0;
      toast.touchStartY = 0;
    },

    startBackgroundAudioKeepAlive() {
      try {
        if (!this.bgAudio) {
          // Âm thanh im lặng WAV 1-giây (8-bit mono 8kHz) loop ngầm để giữ WebKit Process không bị iOS ngủ đông
          const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          this.bgAudio = new Audio(silentWav);
          this.bgAudio.loop = true;
          this.bgAudio.volume = 0.001;
        }
        if (this.bgAudio.paused) {
          this.bgAudio.play().catch(() => {});
        }
      } catch {}
    },

    playChime() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.55);
      } catch (e) {
        console.warn('Audio chime error:', e);
      }
    },

    openAboutModal() {
      this.showAboutModal = true;
    },

    testInAppAlert() {
      this.playChime();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
      this.showToast('🔔 Âm thanh và thông báo nhắc việc đang hoạt động hoàn hảo!', 'info');
    },

    async testTelegram() {
      this.testingTelegram = true;
      this.showToast('Đang kết nối và gửi thử qua Telegram Bot...', 'info');
      try {
        const res = await this.api('/api/test-telegram', { method: 'POST' });
        if (res && res.success) {
          this.playChime();
          this.showToast(res.message || 'Gửi tin nhắn Telegram thành công! 🎉', 'success');
        } else {
          this.showToast(res?.error || res?.message || 'Chưa gửi được tin nhắn Telegram.', 'warning');
        }
      } catch (err) {
        this.showToast(err.message || 'Lỗi gửi Telegram', 'error');
      } finally {
        this.testingTelegram = false;
      }
    },

    async setupTelegramWebhook() {
      this.settingUpWebhook = true;
      this.showToast('Đang kích hoạt Webhook 2 chiều trên Telegram...', 'info');
      try {
        const data = await this.api('/api/setup-telegram-webhook');
        if (data && data.success) {
          this.playChime();
          this.showToast('Kích hoạt Webhook Telegram thành công! 🎉', 'success');
        } else {
          this.showToast(data?.error || data?.telegram_response?.description || 'Chưa thể kích hoạt Webhook.', 'warning');
        }
      } catch (err) {
        this.showToast(err.message || 'Lỗi kết nối Webhook', 'error');
      } finally {
        this.settingUpWebhook = false;
      }
    },

    openTelegramBot(event) {
      if (event) event.preventDefault();
      const url = 'https://t.me/hgc_todolist_bot';
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
          window.Capacitor.Plugins.Browser.open({ url });
          return;
        }
      } catch {}
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w || w.closed || typeof w.closed === 'undefined') {
        window.location.href = url;
      }
    },

    confirmLogout(e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.showLogoutModal = true;
    },

    async confirmLogoutAction() {
      this.showLogoutModal = false;
      await this.logout();
    },

    getCurrentLocalDatetime() {
      return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    },

    saveOfflineQueue() {
      try {
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
      } catch {}
    },

    saveCachedTodos() {
      try {
        localStorage.setItem('cached_todos', JSON.stringify(this.todos));
      } catch {}
    },

    addToOfflineQueue(action) {
      this.offlineQueue.push({
        id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        timestamp: Date.now(),
        ...action
      });
      this.saveOfflineQueue();
      this.saveCachedTodos();
    },

    async syncOfflineQueue() {
      if (this.isSyncing || this.offlineQueue.length === 0 || !navigator.onLine) return;
      this.isSyncing = true;
      let syncedCount = 0;

      try {
        while (this.offlineQueue.length > 0) {
          const item = this.offlineQueue[0];
          try {
            if (item.type === 'CREATE') {
              const res = await this.api('/api/todos', { method: 'POST', body: JSON.stringify(item.body) });
              if (res && res.todo) {
                const idx = this.todos.findIndex(t => t.id === item.tempId);
                if (idx !== -1) {
                  this.todos[idx] = res.todo;
                }
              }
            } else if (item.type === 'UPDATE') {
              await this.api('/api/todos/' + item.todoId, { method: 'PUT', body: JSON.stringify(item.body) });
            } else if (item.type === 'TOGGLE') {
              await this.api('/api/todos/' + item.todoId + '/toggle', { method: 'PATCH' });
            } else if (item.type === 'PIN') {
              await this.api('/api/todos/' + item.todoId + '/pin', { method: 'PATCH' });
            } else if (item.type === 'DELETE') {
              await this.api('/api/todos/' + item.todoId, { method: 'DELETE' });
            }
            this.offlineQueue.shift();
            this.saveOfflineQueue();
            this.saveCachedTodos();
            syncedCount++;
          } catch (err) {
            console.warn('[Offline Sync] Item failed:', item, err);
            if (!navigator.onLine || String(err.message).toLowerCase().includes('fetch') || String(err.message).toLowerCase().includes('network')) {
              this.isOffline = true;
              break;
            } else {
              this.offlineQueue.shift();
              this.saveOfflineQueue();
            }
          }
        }
      } finally {
        this.isSyncing = false;
        if (syncedCount > 0) {
          this.showToast('Đã đồng bộ dữ liệu lên Cloud', 'success');
          await this.fetchTodos(true);
          await this.fetchCategories();
        }
      }
    },

    // ── QUÉT KIỂM TRA NHẮC NHỞ THEO MỨC ĐỘ ƯU TIÊN (Low: 5p, Medium: 15p, High: 30p, lặp mỗi 5p) ──
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

    async checkAppVersion(manual = false) {
      try {
        const versionUrl = cleanBaseUrl(API_BASE) + '/api/version';
        const res = await fetch(versionUrl, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.version && data.version !== this.appVersion) {
          console.log('Phát hiện bản mới:', data.version, 'Bản hiện tại:', this.appVersion);
          this.showToast('✨ Ứng dụng đã có bản cập nhật mới (' + data.version + '). Đang tự động làm mới...', 'info');
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else if (manual) {
          this.showToast('Bạn đang sử dụng phiên bản mới nhất (' + this.appVersion + ')! 🎉', 'success');
        }
      } catch {}
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
      const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 phút = 300,000ms

      this.todos.forEach(todo => {
        if (todo.is_completed || !todo.due_date) return;
        const d = this.parseDateSafe(todo.due_date);
        if (!d) return;

        const timeLeftMs = d.getTime() - now;
        const minutesLeft = Math.ceil(timeLeftMs / (60 * 1000));
        const warningWindow = this.getPriorityWarningMinutes(todo.priority);

        // Khung thông báo: Low <= 5p, Medium <= 15p, High <= 30p
        if (minutesLeft >= 0 && minutesLeft <= warningWindow) {
          const lastTime = this.lastNotifiedTimes[todo.id] || 0;
          // Chỉ High và Medium mới lặp lại mỗi 5 phút; Low chỉ thông báo 1 lần duy nhất
          const isRecurring = (todo.priority === 'High' || todo.priority === 'Medium');
          const shouldNotify = isRecurring ? (now - lastTime >= FIVE_MINUTES_MS) : (!lastTime);

          if (shouldNotify) {
            this.lastNotifiedTimes[todo.id] = now;

            this.playChime();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);

            // Toast cảnh báo trực tiếp trong app
            this.showToast('⏰ Sắp hết hạn trong ' + minutesLeft + ' phút! Việc "' + todo.title + '"', 'warning');
          }
        }
      });
    },

    async api(url, options = {}) {
      const base = cleanBaseUrl(API_BASE);
      const fullUrl = url.startsWith('http') ? url : (base ? (base + (url.startsWith('/') ? url : '/' + url)) : url);
      const token = this.authToken || localStorage.getItem('todo_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...options.headers
      };

      const res = await fetch(fullUrl, {
        credentials: 'include',
        ...options,
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra.');
      }
      return data;
    },

    parseDateSafe(dateStr) {
      if (!dateStr) return null;
      let s = String(dateStr).trim();
      if (s.length >= 19 && s.indexOf('T') === -1 && s.indexOf(' ') !== -1) {
        s = s.replace(' ', 'T');
      }
      if (!s.endsWith('Z') && s.includes('T') && s.length >= 19) {
        s = s + 'Z';
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    },

    isOverdue(todo) {
      if (!todo.due_date || todo.is_completed) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      return d.getTime() < Date.now();
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

      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeek = dayNames[d.getDay()];

      const mode = todo.repeat_mode || 'none';
      if (mode === 'daily') {
        return timeStr;
      }
      if (mode === 'weekly') {
        return timeStr + ', ' + dayOfWeek;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return timeStr + ', ' + dayOfWeek + ' ' + day + '/' + month + '/' + year;
    },

    toLocalDatetimeInput(dateStr) {
      const d = this.parseDateSafe(dateStr);
      if (!d) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
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

    async checkAuth() {
      try {
        const data = await this.api('/api/auth/me');
        if (data.authenticated) {
          this.authenticated = true;
          this.currentUser = data.user;
          try {
            localStorage.setItem('cached_user', JSON.stringify(data.user));
          } catch {}
          await this.fetchCategories();
          await this.fetchTodos();
        } else {
          this.authenticated = false;
          this.currentUser = null;
          try {
            localStorage.removeItem('cached_user');
          } catch {}
        }
      } catch (e) {
        if (!navigator.onLine) {
          this.isOffline = true;
        }
      }
    },

    async handleAuth() {
      this.authLoading = true;
      try {
        const url = this.authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = this.authMode === 'login'
          ? { email: this.authForm.email, password: this.authForm.password }
          : { ...this.authForm };

        const data = await this.api(url, { method: 'POST', body: JSON.stringify(body) });
        this.authenticated = true;
        this.currentUser = data.user;
        if (data.token) {
          this.authToken = data.token;
          try {
            localStorage.setItem('todo_auth_token', data.token);
            if (window.Capacitor?.Plugins?.Preferences) {
              window.Capacitor.Plugins.Preferences.set({ key: 'todo_auth_token', value: data.token }).catch(() => {});
            }
          } catch {}
        }
        try {
          localStorage.setItem('cached_user', JSON.stringify(data.user));
        } catch {}
        this.showToast(this.authMode === 'login' ? 'Đăng nhập thành công!' : 'Tạo tài khoản thành công!');
        this.authForm = { email: '', username: '', password: '' };
        await this.fetchCategories();
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.authLoading = false;
      }
    },

    async logout() {
      try {
        await this.api('/api/auth/logout', { method: 'POST' });
      } catch {}
      this.authenticated = false;
      this.currentUser = null;
      this.todos = [];
      this.authToken = '';
      try {
        localStorage.removeItem('todo_auth_token');
        if (window.Capacitor?.Plugins?.Preferences) {
          window.Capacitor.Plugins.Preferences.remove({ key: 'todo_auth_token' }).catch(() => {});
        }
        localStorage.removeItem('cached_user');
        localStorage.removeItem('cached_todos');
        localStorage.removeItem('cached_categories');
        localStorage.removeItem('offline_queue');
      } catch {}
      this.showToast('Đã đăng xuất an toàn.', 'info');
    },

    async fetchTodos(isSilent = false) {
      if (!navigator.onLine) {
        this.isOffline = true;
        return;
      }
      if (!isSilent) this.todosLoading = true;
      try {
        const [sort, order] = this.sortBy.split('-');
        const params = new URLSearchParams();
        if (this.filterStatus !== 'all') params.set('status', this.filterStatus);
        if (this.filterCategory !== 'all') params.set('category', this.filterCategory);
        if (this.filterPriority !== 'all') params.set('priority', this.filterPriority);
        if (this.searchQuery) params.set('search', this.searchQuery);
        params.set('sort', sort);
        params.set('order', order);

        const data = await this.api('/api/todos?' + params.toString());
        if (this.offlineQueue.length === 0) {
          this.todos = data.todos;
          this.saveCachedTodos();
        }
        this.checkDueReminders();
      } catch (err) {
        if (!isSilent) this.showToast(err.message, 'error');
      } finally {
        if (!isSilent) this.todosLoading = false;
      }
    },

    async fetchCategories() {
      if (!navigator.onLine) return;
      try {
        const data = await this.api('/api/categories');
        this.categories = data.categories;
        try {
          localStorage.setItem('cached_categories', JSON.stringify(data.categories));
        } catch {}
      } catch {}
    },

    setViewMode(mode) {
      this.viewMode = mode;
      try {
        localStorage.setItem('viewMode', mode);
      } catch {}
    },

    getSubtasks(todo) {
      if (!todo) return [];
      if (Array.isArray(todo.subtasks)) return todo.subtasks;
      if (typeof todo.subtasks === 'string') {
        try {
          return JSON.parse(todo.subtasks || '[]');
        } catch {
          return [];
        }
      }
      return [];
    },

    getTags(todo) {
      if (!todo) return [];
      if (Array.isArray(todo.tags)) return todo.tags;
      if (typeof todo.tags === 'string') {
        try {
          return JSON.parse(todo.tags || '[]');
        } catch {
          return [];
        }
      }
      return [];
    },

    async toggleSubtask(todo, subtaskId) {
      const subtasks = this.getSubtasks(todo);
      const st = subtasks.find(s => String(s.id) === String(subtaskId));
      if (!st) return;
      st.is_completed = st.is_completed ? 0 : 1;
      todo.subtasks = subtasks;
      this.saveCachedTodos();

      if (!navigator.onLine) {
        this.showToast('Đang ngoại tuyến - đã lưu tạm checklist', 'info');
        return;
      }

      try {
        await this.api('/api/todos/' + todo.id + '/subtasks/' + subtaskId + '/toggle', { method: 'PATCH' });
      } catch (err) {
        console.warn('Subtask toggle error:', err);
      }
    },

    addSubtask() {
      const val = (this.newSubtaskInput || '').trim();
      if (!val) return;
      if (!Array.isArray(this.todoForm.subtasks)) {
        this.todoForm.subtasks = [];
      }
      this.todoForm.subtasks.push({
        id: 'st_' + Date.now(),
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

    async startVoiceInput() {
      // Nếu đang ghi âm thì nhấn lần nữa để dừng và hoàn tất
      if (this.isListeningVoice || this.isRecordingVoiceMedia) {
        this.stopVoiceRecording();
        return;
      }

      // Ưu tiên Native: Capacitor VoiceRecorder (hoạt động tuyệt hảo trong WKWebView iOS)
      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('VoiceRecorder')) {
        try {
          const { VoiceRecorder } = window.Capacitor.Plugins;
          const perm = await VoiceRecorder.requestAudioRecordingPermission();
          if (!perm.value) {
            this.showToast('Vui lòng cấp quyền Micro trong Cài đặt iPhone để nhận diện giọng nói', 'error');
            return;
          }
          await VoiceRecorder.startRecording();
          this.isRecordingVoiceMedia = true;
          this.isListeningVoice = true;
          this.showToast('🔴 Đang ghi âm giọng nói... Bấm lại Micro để dừng và tạo việc', 'info');
          return;
        } catch (e) {
          console.warn('Native VoiceRecorder start error, fallback to Web:', e);
        }
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      // Ưu tiên 1: Web Speech API trực tiếp
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'vi-VN';
          recognition.continuous = false;
          recognition.interimResults = false;

          this.isListeningVoice = true;
          this.showToast('🎤 Đang lắng nghe... Hãy nói tiêu đề công việc', 'info');

          recognition.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
              this.todoForm.title = this.todoForm.title ? (this.todoForm.title + ' ' + transcript) : transcript;
              this.showToast('Đã nhận diện: "' + transcript + '"', 'success');
            }
          };

          recognition.onerror = (err) => {
            console.warn('[SpeechRecognition] error:', err);
            this.isListeningVoice = false;
            if (err.error === 'no-speech') {
              this.showToast('Chưa nhận được giọng nói, bạn hãy thử nói lại gần micro hơn nhé', 'info');
              return;
            }
            if (err.error === 'not-allowed' || err.error === 'service-not-allowed' || err.error === 'permission-denied') {
              this.showToast('Vui lòng nhấn vào biểu tượng ổ khóa trên thanh địa chỉ để CHO PHÉP quyền Micro!', 'error');
              return;
            }
            if (err.error === 'aborted') {
              return;
            }
            this.startMediaRecorderVoice();
          };

          recognition.onend = () => {
            this.isListeningVoice = false;
          };

          recognition.start();
          return;
        } catch (err) {
          console.warn('[SpeechRecognition] Start error, fallback to MediaRecorder:', err);
          this.isListeningVoice = false;
        }
      }

      // Ưu tiên 2 / Fallback: MediaRecorder + Cloudflare Workers AI Whisper
      await this.startMediaRecorderVoice();
    },

    async startMediaRecorderVoice() {
      const getUserMedia = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        ? (c) => navigator.mediaDevices.getUserMedia(c)
        : (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)
          ? (c) => new Promise((res, rej) => (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).call(navigator, c, res, rej))
          : null;

      if (!getUserMedia) {
        this.showToast('Micro yêu cầu kết nối bảo mật HTTPS hoặc cấp quyền trong Cài đặt ứng dụng', 'error');
        return;
      }

      try {
        const stream = await getUserMedia({ audio: true });
        this.audioChunks = [];
        const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) 
          ? 'audio/webm' 
          : ((typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) ? 'audio/mp4' : '');
        this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          this.isRecordingVoiceMedia = false;
          this.isListeningVoice = false;
          clearInterval(this.voiceTimerInterval);

          if (this.audioChunks.length === 0) return;
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
          this.showToast('🔄 Đang nhận diện qua Whisper AI...', 'info');

          try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice.webm');
            const transcribeUrl = cleanBaseUrl(API_BASE) + '/api/ai/transcribe';
            const res = await fetch(transcribeUrl, {
              method: 'POST',
              body: formData,
              credentials: 'include',
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            const data = await res.json();
            if (data.success && data.text) {
              const text = data.text.trim();
              this.todoForm.title = this.todoForm.title ? (this.todoForm.title + ' ' + text) : text;
              this.showToast('🎙️ Whisper AI: "' + text + '"', 'success');
            } else {
              this.showToast('Không nhận diện được nội dung: ' + (data.error || 'Thử lại'), 'error');
            }
          } catch (err) {
            this.showToast('Lỗi nhận diện giọng nói: ' + err.message, 'error');
          }
        };

        this.mediaRecorder.start(250);
        this.isRecordingVoiceMedia = true;
        this.isListeningVoice = true;
        this.voiceRecordingSeconds = 0;
        this.showToast('🔴 Đang ghi âm (Whisper AI)... Nhấn nút Micro để dừng', 'info');

        this.voiceTimerInterval = setInterval(() => {
          this.voiceRecordingSeconds++;
          if (this.voiceRecordingSeconds >= 15) {
            this.stopVoiceRecording();
          }
        }, 1000);
      } catch (err) {
        this.isListeningVoice = false;
        this.isRecordingVoiceMedia = false;
        this.showToast('Lỗi micro: ' + err.message, 'error');
      }
    },

    async stopVoiceRecording() {
      // Native VoiceRecorder stop & transcribe
      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('VoiceRecorder') && this.isRecordingVoiceMedia) {
        try {
          const { VoiceRecorder } = window.Capacitor.Plugins;
          const recording = await VoiceRecorder.stopRecording();
          this.isListeningVoice = false;
          this.isRecordingVoiceMedia = false;
          if (recording?.value?.recordDataBase64) {
            this.showToast('🔄 Đang nhận diện qua Whisper AI...', 'info');
            const byteChars = atob(recording.value.recordDataBase64);
            const byteNums = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
              byteNums[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNums);
            const blob = new Blob([byteArray], { type: recording.value.mimeType || 'audio/aac' });

            const formData = new FormData();
            formData.append('file', blob, 'voice.aac');
            const transcribeUrl = cleanBaseUrl(API_BASE) + '/api/ai/transcribe';
            const res = await fetch(transcribeUrl, {
              method: 'POST',
              body: formData,
              headers: this.authToken ? { 'Authorization': 'Bearer ' + this.authToken } : {}
            });
            const data = await res.json();
            if (data.success && data.text) {
              const text = data.text.trim();
              this.todoForm.title = this.todoForm.title ? (this.todoForm.title + ' ' + text) : text;
              this.showToast('🎙️ Whisper AI: "' + text + '"', 'success');
            } else {
              this.showToast('Không nhận diện được giọng nói: ' + (data.error || 'Thử lại'), 'error');
            }
          }
          return;
        } catch (err) {
          console.warn('Native VoiceRecorder stop error:', err);
        }
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isListeningVoice = false;
      this.isRecordingVoiceMedia = false;
      clearInterval(this.voiceTimerInterval);
    },

    async moveKanbanTask(todo, newStatus) {
      const prevStatus = todo.status || (todo.is_completed ? 'completed' : 'todo');
      todo.status = newStatus;
      todo.is_completed = (newStatus === 'completed' ? 1 : 0);
      this.saveCachedTodos();

      if (!navigator.onLine) {
        this.showToast('Đang ngoại tuyến - đã lưu tạm Kanban', 'info');
        return;
      }

      try {
        await this.api('/api/todos/' + todo.id, {
          method: 'PUT',
          body: JSON.stringify({
            status: newStatus,
            is_completed: todo.is_completed
          })
        });
        this.showToast('Đã chuyển sang "' + (newStatus === 'todo' ? 'Cần làm' : (newStatus === 'in_progress' ? 'Đang làm' : 'Đã xong')) + '"');
      } catch (err) {
        todo.status = prevStatus;
        todo.is_completed = (prevStatus === 'completed' ? 1 : 0);
        this.saveCachedTodos();
        this.showToast('Lỗi cập nhật Kanban: ' + err.message, 'error');
      }
    },

    handleKanbanDrop(targetStatus) {
      if (!this.draggedTodoId) return;
      const todo = this.todos.find(t => t.id === this.draggedTodoId);
      if (todo) {
        this.moveKanbanTask(todo, targetStatus);
      }
      this.draggedTodoId = null;
    },

    prevCalendarMonth() {
      const d = new Date(this.calendarDate);
      d.setMonth(d.getMonth() - 1);
      this.calendarDate = d;
    },

    nextCalendarMonth() {
      const d = new Date(this.calendarDate);
      d.setMonth(d.getMonth() + 1);
      this.calendarDate = d;
    },

    selectCalendarDay(dateStr) {
      this.selectedCalendarDate = (this.selectedCalendarDate === dateStr ? null : dateStr);
    },

    formatSelectedCalendarDate() {
      if (!this.selectedCalendarDate) return '';
      const parts = this.selectedCalendarDate.split('-');
      if (parts.length === 3) {
        return parts[2] + '/' + parts[1] + '/' + parts[0];
      }
      return this.selectedCalendarDate;
    },

    async handleImportJsonFile(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = String(e.target?.result || '');
          const data = await this.api('/api/import/json', {
            method: 'POST',
            body: text
          });
          if (data && data.success) {
            this.showToast('Khôi phục thành công ' + data.count + ' công việc! 🎉', 'success');
            this.showBackupModal = false;
            await this.fetchTodos();
            await this.fetchCategories();
          } else {
            this.showToast(data?.error || 'Lỗi khôi phục dữ liệu', 'error');
          }
        } catch (err) {
          this.showToast('Lỗi đọc file sao lưu: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    },

    openCreateModal() {
      this.editingTodo = null;
      this.customCategoryMode = false;
      this.newSubtaskInput = '';
      this.newTagInput = '';
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const localNow = this.getCurrentLocalDatetime();
      const currentTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
      this.todoForm = {
        title: '',
        description: '',
        category: 'Personal',
        priority: 'Medium',
        repeat_mode: 'none',
        due_datetime: localNow,
        daily_time: currentTime,
        weekly_day: now.getDay(),
        weekly_time: currentTime,
        is_pinned: false,
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
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.editingTodo = todo;
      this.customCategoryMode = false;
      this.newSubtaskInput = '';
      this.newTagInput = '';
      const d = this.parseDateSafe(todo.due_date);
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '18:00';
      const dayVal = d ? d.getDay() : 1;

      this.todoForm = {
        title: todo.title,
        description: todo.description || '',
        category: todo.category,
        priority: todo.priority,
        repeat_mode: todo.repeat_mode || 'none',
        due_datetime: this.toLocalDatetimeInput(todo.due_date),
        daily_time: timeStr,
        weekly_day: dayVal,
        weekly_time: timeStr,
        is_pinned: Boolean(todo.is_pinned),
        subtasks: this.getSubtasks(todo).map(st => ({ ...st })),
        tags: [...this.getTags(todo)],
        reminder_offset: todo.reminder_offset || 0,
        estimated_minutes: todo.estimated_minutes || 0,
        actual_minutes: todo.actual_minutes || 0
      };
      this.editingTodoImages = [];
      if (todo.id && !todo.id.startsWith('temp_')) {
        this.fetchTodoImages(todo.id);
      }
      this.showModal = true;
    },

    async saveTodo() {
      this.todoSaving = true;
      try {
        let dueDateISO = null;
        const mode = this.todoForm.repeat_mode || 'none';

        if (mode === 'none') {
          if (this.todoForm.due_datetime) {
            const d = new Date(this.todoForm.due_datetime);
            if (!isNaN(d.getTime())) {
              dueDateISO = d.toISOString();
            }
          }
        } else if (mode === 'daily') {
          const [h, m] = (this.todoForm.daily_time || '18:00').split(':').map(Number);
          const now = new Date();
          const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h || 0, m || 0, 0, 0);
          if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
          }
          dueDateISO = target.toISOString();
        } else if (mode === 'weekly') {
          const [h, m] = (this.todoForm.weekly_time || '18:00').split(':').map(Number);
          const now = new Date();
          const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h || 0, m || 0, 0, 0);
          const currentDay = now.getDay();
          const targetDay = Number(this.todoForm.weekly_day ?? 1);
          let daysUntil = (targetDay - currentDay + 7) % 7;
          if (daysUntil === 0 && target.getTime() <= now.getTime()) {
            daysUntil = 7;
          }
          target.setDate(target.getDate() + daysUntil);
          dueDateISO = target.toISOString();
        }

        const body = {
          title: this.todoForm.title,
          description: this.todoForm.description,
          category: this.todoForm.category,
          priority: this.todoForm.priority,
          repeat_mode: mode,
          due_date: dueDateISO,
          is_pinned: this.todoForm.is_pinned ? 1 : 0,
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
            Object.assign(this.todos[idx], body, { updated_at: new Date().toISOString() });
            this.saveCachedTodos();
          }

          if (!navigator.onLine) {
            this.addToOfflineQueue({ type: 'UPDATE', todoId: editId, body });
            this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
          } else {
            try {
              await this.api('/api/todos/' + editId, { method: 'PUT', body: JSON.stringify(body) });
              this.showToast('Đã cập nhật công việc!');
              await this.fetchTodos(true);
            } catch (err) {
              this.addToOfflineQueue({ type: 'UPDATE', todoId: editId, body });
              this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
            }
          }
        } else {
          const tempId = 'temp_' + Date.now();
          const newTodo = {
            id: tempId,
            user_id: this.currentUser?.id || 'temp',
            title: body.title,
            description: body.description,
            category: body.category,
            priority: body.priority,
            repeat_mode: body.repeat_mode,
            due_date: body.due_date,
            is_pinned: body.is_pinned,
            subtasks: body.subtasks,
            tags: body.tags,
            reminder_offset: body.reminder_offset,
            estimated_minutes: body.estimated_minutes,
            actual_minutes: body.actual_minutes,
            status: 'todo',
            is_completed: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.todos.unshift(newTodo);
          this.saveCachedTodos();

          if (!navigator.onLine) {
            this.addToOfflineQueue({ type: 'CREATE', tempId, body });
            this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
          } else {
            try {
              const res = await this.api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
              if (res && res.todo) {
                const idx = this.todos.findIndex(t => t.id === tempId);
                if (idx !== -1) this.todos[idx] = res.todo;
                this.saveCachedTodos();

                if (this.editingTodoImages && this.editingTodoImages.length > 0) {
                  for (const img of this.editingTodoImages) {
                    if (img.image_data) {
                      await this.api('/api/todos/' + res.todo.id + '/images', {
                        method: 'POST',
                        body: JSON.stringify({
                          image_data: img.image_data,
                          file_name: img.file_name || 'image.jpg'
                        })
                      }).catch(() => {});
                    }
                  }
                  await this.fetchTodoImages(res.todo.id);
                }
              }
              this.showToast('Đã tạo công việc mới!');
              await this.fetchCategories();
            } catch (err) {
              this.addToOfflineQueue({ type: 'CREATE', tempId, body });
              this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
            }
          }
        }
        this.showModal = false;
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    },

    async toggleTodo(todo, e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      const prevStatus = todo.is_completed;
      const newStatus = prevStatus ? 0 : 1;
      todo.is_completed = newStatus;

      if (newStatus === 1 && todo.repeat_mode && todo.repeat_mode !== 'none' && todo.due_date) {
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
      this.saveCachedTodos();

      if (!navigator.onLine) {
        this.addToOfflineQueue({ type: 'TOGGLE', todoId: todo.id });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
        return;
      }

      try {
        const res = await this.api('/api/todos/' + todo.id + '/toggle', { method: 'PATCH' });
        if (res && res.todo) {
          Object.assign(todo, res.todo);
          this.saveCachedTodos();
        }
        this.showToast(todo.is_completed ? 'Hoàn thành xuất sắc! 🎉' : 'Đã chuyển sang đang chờ.', 'info', {
          label: 'Hoàn tác',
          onClick: () => this.toggleTodo(todo)
        });
      } catch (err) {
        this.addToOfflineQueue({ type: 'TOGGLE', todoId: todo.id });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
      }
    },

    async togglePin(todo, e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      todo.is_pinned = todo.is_pinned ? 0 : 1;
      this.saveCachedTodos();
      this.showToast(todo.is_pinned ? '📌 Đã ghim lên đầu' : 'Đã bỏ ghim', 'info');

      if (!navigator.onLine) {
        this.addToOfflineQueue({ type: 'PIN', todoId: todo.id });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
        return;
      }

      try {
        const res = await this.api('/api/todos/' + todo.id + '/pin', { method: 'PATCH' });
        if (res && res.todo) {
          todo.is_pinned = res.todo.is_pinned;
          this.saveCachedTodos();
        }
        await this.fetchTodos(true);
      } catch (err) {
        this.addToOfflineQueue({ type: 'PIN', todoId: todo.id });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
      }
    },

    async duplicateTodo(todo, e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      const tempId = 'temp_' + Date.now();
      const body = {
        title: todo.title + ' (Bản sao)',
        description: todo.description || '',
        category: todo.category,
        priority: todo.priority,
        repeat_mode: todo.repeat_mode || 'none',
        due_date: todo.due_date,
        is_pinned: 0
      };

      const newTodo = {
        id: tempId,
        user_id: this.currentUser?.id || 'temp',
        ...body,
        is_completed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.todos.unshift(newTodo);
      this.saveCachedTodos();

      if (!navigator.onLine) {
        this.addToOfflineQueue({ type: 'CREATE', tempId, body });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
        return;
      }

      try {
        const res = await this.api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
        if (res && res.todo) {
          const idx = this.todos.findIndex(t => t.id === tempId);
          if (idx !== -1) this.todos[idx] = res.todo;
          this.saveCachedTodos();
        }
        this.showToast('Đã nhân bản công việc!');
      } catch (err) {
        this.addToOfflineQueue({ type: 'CREATE', tempId, body });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
      }
    },

    confirmDelete(todo, e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      this.deletingTodo = todo;
      this.showDeleteModal = true;
    },

    async deleteTodo() {
      this.todoSaving = true;
      const targetTodo = this.deletingTodo;
      const targetId = targetTodo?.id;
      if (!targetId) {
        this.todoSaving = false;
        return;
      }

      this.lastDeletedTodo = { ...targetTodo };
      this.todos = this.todos.filter(t => t.id !== targetId);
      this.saveCachedTodos();
      this.showDeleteModal = false;
      this.deletingTodo = null;

      if (!navigator.onLine) {
        this.addToOfflineQueue({ type: 'DELETE', todoId: targetId });
        this.showToast('Đã chuyển vào thùng rác (ngoại tuyến)', 'info', {
          label: 'Hoàn tác',
          onClick: () => this.restoreTodo(this.lastDeletedTodo)
        });
        this.todoSaving = false;
        return;
      }

      try {
        await this.api('/api/todos/' + targetId, { method: 'DELETE' });
        this.showToast('Đã chuyển công việc vào thùng rác!', 'info', {
          label: 'Hoàn tác',
          onClick: () => this.restoreTodo(this.lastDeletedTodo)
        });
      } catch (err) {
        this.addToOfflineQueue({ type: 'DELETE', todoId: targetId });
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
      } finally {
        this.todoSaving = false;
      }
    },

    confirmClearCompleted() {
      this.showClearCompletedModal = true;
    },

    async clearCompleted() {
      this.todoSaving = true;
      const completedTodos = this.todos.filter(t => t.is_completed);
      this.todos = this.todos.filter(t => !t.is_completed);
      this.saveCachedTodos();
      this.showClearCompletedModal = false;

      if (!navigator.onLine) {
        completedTodos.forEach(t => this.addToOfflineQueue({ type: 'DELETE', todoId: t.id }));
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
        this.todoSaving = false;
        return;
      }

      try {
        await this.api('/api/todos/clear-completed', { method: 'POST' });
        this.showToast('Đã dọn dẹp tất cả việc đã hoàn thành!');
      } catch (err) {
        completedTodos.forEach(t => this.addToOfflineQueue({ type: 'DELETE', todoId: t.id }));
        this.showToast('Đang ngoại tuyến - đã lưu tạm', 'info');
      } finally {
        this.todoSaving = false;
      }
    },

    // ─── THÙNG RÁC & HOÀN TÁC (TRASH & UNDO) ───
    async openTrashModal() {
      this.showTrashModal = true;
      await this.fetchTrashTodos();
    },

    async fetchTrashTodos() {
      this.trashLoading = true;
      try {
        const res = await this.api('/api/trash');
        this.trashTodos = res.todos || [];
      } catch (err) {
        this.showToast('Lỗi tải thùng rác: ' + err.message, 'error');
      } finally {
        this.trashLoading = false;
      }
    },

    async restoreTodo(todo) {
      if (!todo || !todo.id) return;
      try {
        await this.api('/api/todos/' + todo.id + '/restore', { method: 'POST' });
        this.trashTodos = this.trashTodos.filter(t => t.id !== todo.id);
        this.showToast('Đã khôi phục công việc: "' + todo.title + '" 🎉', 'success');
        await this.fetchTodos(true);
      } catch (err) {
        this.showToast('Lỗi khôi phục: ' + err.message, 'error');
      }
    },

    async deletePermanently(todo) {
      if (!todo || !todo.id) return;
      if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn công việc này? Không thể khôi phục!')) return;
      try {
        await this.api('/api/todos/' + todo.id + '?permanent=true', { method: 'DELETE' });
        this.trashTodos = this.trashTodos.filter(t => t.id !== todo.id);
        this.showToast('Đã xóa vĩnh viễn công việc', 'info');
      } catch (err) {
        this.showToast('Lỗi xóa vĩnh viễn: ' + err.message, 'error');
      }
    },

    async emptyTrash() {
      if (this.trashTodos.length === 0) return;
      if (!confirm('Bạn có chắc chắn muốn dọn sạch toàn bộ thùng rác? Toàn bộ công việc sẽ bị xóa vĩnh viễn!')) return;
      try {
        await this.api('/api/trash/empty', { method: 'DELETE' });
        this.trashTodos = [];
        this.showToast('Đã dọn sạch thùng rác!', 'info');
      } catch (err) {
        this.showToast('Lỗi dọn thùng rác: ' + err.message, 'error');
      }
    },

    async restoreAllTrash() {
      if (this.trashTodos.length === 0) return;
      try {
        await this.api('/api/trash/restore-all', { method: 'POST' });
        this.trashTodos = [];
        this.showToast('Đã khôi phục tất cả công việc từ thùng rác! 🎉', 'success');
        await this.fetchTodos(true);
      } catch (err) {
        this.showToast('Lỗi khôi phục: ' + err.message, 'error');
      }
    },

    // ─── WEB AUDIO & AMBIENT SOUNDS (FOCUS MODE) ───
    initAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    },

    playChime() {
      try {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const tones = [659.25, 880];
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.18 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.85);
        });
      } catch (e) {
        console.warn('playChime error:', e);
      }
    },

    stopAmbientSound() {
      if (this.ambientNodes) {
        try {
          this.ambientNodes.source?.stop?.();
          this.ambientNodes.gain?.disconnect?.();
        } catch {}
        this.ambientNodes = null;
      }
      this.ambientSound = 'none';
    },

    playAmbientSound(type) {
      if (this.ambientSound === type && type !== 'none') {
        this.stopAmbientSound();
        return;
      }
      this.stopAmbientSound();
      if (type === 'none') return;

      const ctx = this.initAudioContext();
      if (!ctx) return;

      try {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (type === 'white') {
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
        } else if (type === 'rain') {
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          }
        }

        const whiteNoiseSource = ctx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'rain' ? 850 : 1200;
        filter.Q.value = 1.0;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime((this.ambientVolume || 50) / 100 * 0.15, ctx.currentTime);

        whiteNoiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoiseSource.start();
        this.ambientNodes = { source: whiteNoiseSource, gain: gainNode, filter };
        this.ambientSound = type;
      } catch (err) {
        console.warn('Error starting ambient sound:', err);
      }
    },

    setAmbientVolume(val) {
      this.ambientVolume = Number(val);
      if (this.ambientNodes && this.ambientNodes.gain && this.audioCtx) {
        this.ambientNodes.gain.gain.setValueAtTime((this.ambientVolume / 100) * 0.15, this.audioCtx.currentTime);
      }
    },

    // ─── POMODORO FOCUS TIMER ───
    openPomodoro(todo) {
      this.pomodoroActiveTodo = todo || null;
      this.setPomodoroMode('focus');
      this.showPomodoroModal = true;
    },

    setPomodoroMode(mode) {
      this.pomodoroMode = mode;
      clearInterval(this.pomodoroInterval);
      this.pomodoroRunning = false;
      if (mode === 'focus') {
        this.pomodoroTimeLeft = 25 * 60;
        this.pomodoroTotalTime = 25 * 60;
      } else if (mode === 'shortBreak') {
        this.pomodoroTimeLeft = 5 * 60;
        this.pomodoroTotalTime = 5 * 60;
      } else if (mode === 'longBreak') {
        this.pomodoroTimeLeft = 15 * 60;
        this.pomodoroTotalTime = 15 * 60;
      }
    },

    togglePomodoro() {
      if (this.pomodoroRunning) {
        this.pausePomodoro();
      } else {
        this.startPomodoro();
      }
    },

    startPomodoro() {
      this.initAudioContext();
      this.pomodoroRunning = true;
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = setInterval(() => {
        if (this.pomodoroTimeLeft > 0) {
          this.pomodoroTimeLeft--;
        } else {
          this.onPomodoroComplete();
        }
      }, 1000);
    },

    pausePomodoro() {
      this.pomodoroRunning = false;
      clearInterval(this.pomodoroInterval);
    },

    resetPomodoro() {
      this.pausePomodoro();
      this.setPomodoroMode(this.pomodoroMode);
    },

    async onPomodoroComplete() {
      this.pausePomodoro();
      this.playChime();

      if (this.pomodoroMode === 'focus') {
        if (this.pomodoroActiveTodo) {
          await this.trackTimeForTodo(this.pomodoroActiveTodo, 25);
        }
        this.showToast('🎉 Hoàn thành phiên Pomodoro 25 phút! Hãy nghỉ ngơi nào.', 'success');
        this.setPomodoroMode('shortBreak');
      } else {
        this.showToast('⏰ Hết giờ nghỉ ngơi! Sẵn sàng cho phiên tập trung tiếp theo.', 'info');
        this.setPomodoroMode('focus');
      }
    },

    async trackTimeForTodo(todo, addedMinutes) {
      if (!todo || !todo.id) return;
      const currentActual = Number(todo.actual_minutes) || 0;
      const newActual = currentActual + addedMinutes;
      todo.actual_minutes = newActual;
      this.saveCachedTodos();

      try {
        await this.api('/api/todos/' + todo.id, {
          method: 'PUT',
          body: JSON.stringify({ actual_minutes: newActual })
        });
        this.showToast('Đã ghi nhận +' + addedMinutes + ' phút tập trung cho: ' + todo.title, 'success');
      } catch (err) {
        console.warn('Failed to update actual_minutes:', err);
      }
    },

    formatTimer(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },

    // ─── NĂNG SUẤT & THỐNG KÊ (ANALYTICS) ───
    async openAnalytics() {
      this.showAnalyticsModal = true;
      this.analyticsLoading = true;
      try {
        const data = await this.api('/api/analytics');
        this.analyticsData = data;
      } catch (err) {
        this.showToast('Lỗi tải dữ liệu phân tích: ' + err.message, 'error');
      } finally {
        this.analyticsLoading = false;
      }
    },

    // ─── ĐÍNH KÈM HÌNH ẢNH QUA D1 (CANVAS COMPRESSION & LIGHTBOX) ───
    async handleImageUpload(event, todoId) {
      const files = event?.target?.files;
      if (!files || files.length === 0) return;
      const targetId = todoId || this.editingTodo?.id;
      this.todoImagesMap = this.todoImagesMap || {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        this.showToast('📷 Đang xử lý & nén ảnh...', 'info');
        try {
          const base64Data = await this.compressImageCanvas(file, 640, 0.55);

          if (targetId && !targetId.startsWith('temp_')) {
            const res = await this.api('/api/todos/' + targetId + '/images', {
              method: 'POST',
              body: JSON.stringify({
                image_data: base64Data,
                file_name: file.name
              })
            });
            if (res && res.image) {
              if (!this.todoImagesMap[targetId]) this.todoImagesMap[targetId] = [];
              this.todoImagesMap[targetId].push(res.image);
              this.editingTodoImages = this.editingTodoImages || [];
              this.editingTodoImages.push(res.image);
              this.showToast('Đã tải ảnh lên thành công!', 'success');
            }
          } else {
            const tempImg = {
              id: 'temp_img_' + Date.now() + '_' + i,
              image_data: base64Data,
              file_name: file.name
            };
            this.editingTodoImages = this.editingTodoImages || [];
            this.editingTodoImages.push(tempImg);
          }
        } catch (err) {
          this.showToast('Lỗi xử lý ảnh: ' + err.message, 'error');
        }
      }
      if (event.target) event.target.value = '';
    },

    compressImageCanvas(file, maxWidth = 640, quality = 0.55) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    async fetchTodoImages(todoId) {
      if (!todoId || todoId.startsWith('temp_')) return;
      this.todoImagesMap = this.todoImagesMap || {};
      try {
        const res = await this.api('/api/todos/' + todoId + '/images');
        if (res && res.images) {
          this.todoImagesMap[todoId] = res.images;
          this.editingTodoImages = [...res.images];
        }
      } catch (err) {
        console.warn('Error fetching todo images:', err);
      }
    },

    getTodoImages(todoId) {
      this.todoImagesMap = this.todoImagesMap || {};
      return this.todoImagesMap[todoId] || [];
    },

    async deleteImage(todoId, imageId) {
      this.todoImagesMap = this.todoImagesMap || {};
      this.editingTodoImages = this.editingTodoImages || [];
      if (imageId && imageId.startsWith('temp_img_')) {
        this.editingTodoImages = this.editingTodoImages.filter(img => img.id !== imageId);
        return;
      }
      try {
        await this.api('/api/todos/' + todoId + '/images/' + imageId, { method: 'DELETE' });
        if (this.todoImagesMap[todoId]) {
          this.todoImagesMap[todoId] = this.todoImagesMap[todoId].filter(img => img.id !== imageId);
        }
        this.editingTodoImages = this.editingTodoImages.filter(img => img.id !== imageId);
        this.showToast('Đã xóa ảnh đính kèm', 'info');
      } catch (err) {
        this.showToast('Lỗi xóa ảnh: ' + err.message, 'error');
      }
    },

    openLightbox(imageData) {
      this.lightboxImage = imageData;
      this.showLightbox = true;
    },

    formatDateShort(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    },

    // ===== BỔ SUNG NATIVE CAPACITOR & OTA UPDATE METHODS =====
    async chooseOrCapturePhoto(todoId) {
      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Camera')) {
        try {
          const { Camera, CameraResultType, CameraSource } = window.Capacitor.Plugins;
          const photo = await Camera.getPhoto({
            quality: 70,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Prompt
          });
          if (photo && photo.base64String) {
            const format = photo.format || 'jpeg';
            const base64Data = 'data:image/' + format + ';base64,' + photo.base64String;
            await this.attachBase64Image(base64Data, todoId, 'camera_photo_' + Date.now() + '.' + format);
          }
        } catch (err) {
          if (err && err.message && (err.message.includes('cancelled') || err.message.includes('User cancelled'))) {
            return;
          }
          console.warn('Capacitor Camera fallback:', err);
          document.getElementById('todo-image-input')?.click();
        }
      } else {
        document.getElementById('todo-image-input')?.click();
      }
    },

    async attachBase64Image(base64Data, todoId, fileName) {
      const targetId = todoId || this.editingTodo?.id;
      this.todoImagesMap = this.todoImagesMap || {};
      this.editingTodoImages = this.editingTodoImages || [];
      const name = fileName || ('photo_' + Date.now() + '.jpg');

      if (targetId && !targetId.startsWith('temp_')) {
        try {
          this.imageUploading = true;
          this.showToast('📷 Đang lưu ảnh vào công việc...', 'info');
          const res = await this.api('/api/todos/' + targetId + '/images', {
            method: 'POST',
            body: JSON.stringify({
              image_data: base64Data,
              file_name: name
            })
          });
          if (res && res.image) {
            if (!this.todoImagesMap[targetId]) this.todoImagesMap[targetId] = [];
            this.todoImagesMap[targetId].push(res.image);
            this.editingTodoImages.push(res.image);
            this.showToast('Đã tải ảnh lên thành công!', 'success');
          }
        } catch (e) {
          this.showToast('Lỗi tải ảnh: ' + (e?.message || e), 'error');
        } finally {
          this.imageUploading = false;
        }
      } else {
        const tempImg = {
          id: 'temp_img_' + Date.now(),
          image_data: base64Data,
          file_name: name
        };
        this.editingTodoImages.push(tempImg);
        this.showToast('Đã chọn ảnh thành công!', 'success');
      }
    },

    async checkMaintenanceStatus() {
      try {
        const res = await this.api('/api/app-status');
        if (res) {
          this.isUnderMaintenance = Boolean(res.maintenance ?? res.isUnderMaintenance ?? false);
          if (res.maintenance_message || res.message) {
            this.maintenanceMessage = res.maintenance_message || res.message;
          }
        }
      } catch (e) {
        console.warn('checkMaintenanceStatus error:', e);
      }
    },

    async checkNativeOtaUpdate() {
      if (!window.Capacitor) return;
      try {
        const updater = window.Capacitor.Plugins?.CapacitorUpdater || window.Capacitor.Plugins?.CapgoUpdater;
        if (!updater) return;

        if (updater.notifyAppReady) {
          await updater.notifyAppReady();
        }

        const res = await this.api('/api/app-status');
        const bundleUrl = res?.latest_bundle?.url || res?.otaBundleUrl;
        const bundleVersion = res?.latest_bundle?.version || res?.otaBundleVersion;
        if (bundleUrl && bundleVersion) {
          const currentVersion = this.appVersion || '2.0.0';
          if (bundleVersion !== currentVersion && updater.download && updater.set) {
            console.log('Downloading OTA bundle update:', bundleVersion);
            const version = await updater.download({
              url: bundleUrl,
              version: bundleVersion,
            });
            if (version) {
              await updater.set(version);
              console.log('OTA bundle update ready. Will apply on restart.');
            }
          }
        }
      } catch (e) {
        console.warn('OTA check error:', e);
      }
    },

    async getCurrentLocation() {
      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Geolocation')) {
        try {
          const { Geolocation } = window.Capacitor.Plugins;
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (e) {
          console.warn('Capacitor Geolocation error:', e);
        }
      }
      if ('geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      }
      return null;
    }
  };
}
</script>

</body>
</html>`;
}
