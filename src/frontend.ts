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

  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
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
    .line-through-anim { text-decoration: line-through; color: #9ca3af; }
    
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

    button, a, input, select {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-200 ios-safe-bottom pb-24 sm:pb-8 selection:bg-brand-500 selection:text-white"
      @touchstart="handleTouchStart($event)"
      @touchmove="handleTouchMove($event)"
      @touchend="handleTouchEnd($event)"
      @touchcancel="handleTouchCancel($event)">

<!-- ═══════ PULL-TO-REFRESH INDICATOR (ĐO CHÍNH XÁC KHOẢNG CÁCH NGÓN TAY) ═══════ -->
<div x-data="{
       pullDistance: 0,
       isRefreshing: false,
       startX: 0,
       startY: 0,
       canPull: false,
       onStart(e) {
         if (this.isRefreshing) return;
         const scrollTop = window.scrollY || document.documentElement.scrollTop;
         this.canPull = scrollTop <= 0;
         if (this.canPull) {
           this.startX = e.touches[0].clientX;
           this.startY = e.touches[0].clientY;
         }
       },
       onMove(e) {
         if (!this.canPull || this.isRefreshing) return;
         const dx = e.touches[0].clientX - this.startX;
         const dy = e.touches[0].clientY - this.startY;
         
         if (dy < 0 || Math.abs(dx) > Math.abs(dy)) {
           this.canPull = false;
           this.pullDistance = 0;
           return;
         }
         
         // Lấy ĐÚNG khoảng cách thật của ngón tay (không nhân hệ số làm giảm số nữa)
         this.pullDistance = dy;
       },
       async onEnd() {
         if (!this.canPull || this.isRefreshing) return;
         this.canPull = false;
         
         // Đúng mốc 165px ngón tay thật để thả ra làm mới
         if (this.pullDistance >= 165) {
           this.isRefreshing = true;
           this.pullDistance = 165; 
           try {
             if (typeof loadTasks === 'function') await loadTasks();
             else location.reload();
           } finally {
             this.isRefreshing = false;
             this.pullDistance = 0;
           }
         } else {
           this.pullDistance = 0;
         }
       }
     }"
     @touchstart.window.passive="onStart($event)"
     @touchmove.window.passive="onMove($event)"
     @touchend.window="onEnd()"
     x-show="pullDistance >= 60 || isRefreshing" x-cloak
     x-transition:enter="transition ease-out duration-200"
     x-transition:enter-start="opacity-0 -translate-y-4 scale-95"
     x-transition:enter-end="opacity-100 translate-y-0 scale-100"
     x-transition:leave="transition ease-in duration-150"
     x-transition:leave-start="opacity-100 translate-y-0 scale-100"
     x-transition:leave-end="opacity-0 -translate-y-4 scale-95"
     class="fixed top-0 left-0 right-0 z-[130] flex items-center justify-center pointer-events-none"
     :style="'padding-top: calc(max(12px, env(safe-area-inset-top, 0px)) + ' + (pullDistance >= 60 ? (pullDistance - 60) * 0.3 : 0) + 'px);'">
  <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl border border-slate-700/80 text-xs font-bold text-white transition-all">
    <svg class="w-4 h-4 text-brand-400 transition-transform duration-200"
         :class="{ 'rotate-180': pullDistance >= 165, 'spinner': isRefreshing }"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      <polyline points="21 3 21 9 15 9"></polyline>
    </svg>
    <span x-text="isRefreshing ? 'Đang cập nhật công việc...' : (pullDistance >= 165 ? 'Thả ra để làm mới' : 'Kéo xuống thêm để làm mới')"></span>
  </div>
</div>

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
      <button @click="removeToast(toast.id)" class="opacity-70 hover:opacity-100 p-1 text-white flex-shrink-0" title="Đóng">✕</button>
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
      <div class="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
        <button @click="authMode='login'" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                :class="authMode==='login' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
          Đăng nhập
        </button>
        <button @click="authMode='register'" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                :class="authMode==='register' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
          Đăng ký
        </button>
      </div>

      <form @submit.prevent="handleAuth" class="space-y-4">
        <div x-show="authMode==='register'" class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Tên người dùng</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <input x-model="authForm.username" type="text" placeholder="Họ và tên..."
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input x-model="authForm.email" type="email" placeholder="you@example.com" required
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Mật khẩu</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input x-model="authForm.password" type="password" placeholder="••••••••" required minlength="6"
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <button type="submit" :disabled="authLoading"
                class="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
          <svg x-show="authLoading" class="spinner w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="authMode==='login' ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'"></span>
        </button>
      </form>
    </div>

    <div class="mt-6 text-center">
      <button @click="toggleDarkMode()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold inline-flex items-center gap-2 p-2 rounded-xl transition">
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
  <header class="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 transition-all"
          style="padding-top: calc(max(14px, env(safe-area-inset-top, 0px)) + 12px); padding-left: max(0.75rem, env(safe-area-inset-left, 0px)); padding-right: max(0.75rem, env(safe-area-inset-right, 0px));">
    <div class="max-w-5xl mx-auto px-2 sm:px-4 pb-3 flex items-center justify-between gap-2">
      
      <!-- Brand Logo & App Name (Bấm vào để xem Version & Designed by Chung) -->
      <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer select-none group"
           @click="openAboutModal()"
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

      <!-- Action Toolbar -->
      <div class="flex items-center gap-1 sm:gap-2">
        
        <!-- Nút Download App -->
        <button @click="showDownloadModal = true"
                class="px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/70 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 transition shadow-sm active:scale-95"
                title="Tải ứng dụng cho PC hoặc iOS">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download</span>
        </button>

        <!-- Chuông thông báo -->
        <button @click="toggleNotificationPermission()"
                class="p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                :class="notificationsEnabled
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-800'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'"
                :title="notificationsEnabled ? 'Đã bật thông báo' : 'Bật thông báo'">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>

        <!-- Làm mới thủ công -->
        <button @click="refreshDataManual()" class="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" :class="{ 'spinner text-brand-600': isRefreshing }" title="Làm mới dữ liệu">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path><polyline points="21 3 21 9 15 9"></polyline></svg>
        </button>

        <!-- Đổi Theme -->
        <button @click="toggleDarkMode()" class="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <svg x-show="!darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg x-show="darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>

        <!-- Đăng xuất -->
        <button @click="logout()" class="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition" title="Đăng xuất">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- ─── Banner yêu cầu cấp quyền thông báo nếu chưa bật (1 Click) ─── -->
  <div x-show="showNotificationBannerPrompt" x-cloak
       class="bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 shadow-sm border-b border-blue-500/50">
    <div class="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="text-base flex-shrink-0">🔔</span>
        <span class="font-medium truncate">Bật thông báo tự động theo ưu tiên (Low: 5p, Medium: 15p, High: 30p, lặp mỗi 5p)!</span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button @click="enableNotificationFromBanner()"
                class="px-3 py-1 bg-white text-blue-600 font-bold rounded-lg text-xs shadow hover:bg-blue-50 transition active:scale-95">
          Bật ngay
        </button>
        <button @click="notificationBannerDismissed = true; localStorage.setItem('notificationBannerDismissed', 'true')"
                class="p-1 text-white/80 hover:text-white transition" title="Đóng">
          ✕
        </button>
      </div>
    </div>
  </div>

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
          <span x-text="imminentTodos.map(t => '\"' + t.title + '\" (' + (t.priority || 'Medium') + ' - ' + getMinutesRemaining(t) + 'p)').join(', ')"></span>
        </span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button @click="filterStatus='pending'; fetchTodos()"
                class="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition">
          Xem ngay
        </button>
      </div>
    </div>
  </div>

  <!-- ─── Main Content Container ─── -->
  <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5">

    <!-- ─── Sleek Status & Progress Overview (Giao diện tối giản, tinh tế) ─── -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 mb-3 shadow-xs">
      <div class="flex items-center justify-between text-xs font-semibold gap-3 flex-wrap">
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span class="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <strong class="text-sm font-black text-slate-900 dark:text-white" x-text="stats.pending"></strong> cần làm
          </span>
          <span class="text-slate-300 dark:text-slate-700">•</span>
          <span x-show="stats.overdue > 0" class="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <strong class="text-sm font-black" x-text="stats.overdue"></strong> quá hạn
          </span>
          <span x-show="stats.overdue > 0" class="text-slate-300 dark:text-slate-700">•</span>
          <span class="text-slate-500 dark:text-slate-400">
            <strong class="text-emerald-600 dark:text-emerald-400 font-bold" x-text="stats.completed"></strong>/<span x-text="stats.total"></span> đã xong
          </span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <div class="w-20 sm:w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div class="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-300" :style="'width: ' + stats.percent + '%'"></div>
          </div>
          <span class="text-[11px] font-bold text-slate-400" x-text="stats.percent + '%'"></span>
        </div>
      </div>
    </div>

    <!-- ─── Search & Quick Filter Row ─── -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 mb-4 space-y-2.5 shadow-xs">
      <!-- Search Input -->
      <div class="relative">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input x-model="searchQuery" @input.debounce.300ms="fetchTodos()" type="text" placeholder="Tìm kiếm công việc nhanh..."
               class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-xs sm:text-sm font-medium" />
      </div>

      <!-- Quick Filter Chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-0.5 px-0.5">
        <template x-for="s in statusFilters" :key="s.value">
          <button @click="filterStatus = s.value; fetchTodos()"
                  class="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5"
                  :class="filterStatus === s.value
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400'">
            <span x-html="s.icon"></span>
            <span x-text="s.label"></span>
          </button>
        </template>
      </div>

      <!-- Secondary Filters (Danh mục, Ưu tiên, Sắp xếp) & Dọn dẹp -->
      <div class="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar text-xs">
        <select x-model="filterCategory" @change="fetchTodos()"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs">
          <option value="all">📁 Danh mục (Tất cả)</option>
          <template x-for="cat in categories" :key="cat">
            <option :value="cat" x-text="cat"></option>
          </template>
        </select>

        <select x-model="filterPriority" @change="fetchTodos()"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs">
          <option value="all">⚡ Ưu tiên (Tất cả)</option>
          <option value="High">🔴 Khẩn cấp (High)</option>
          <option value="Medium">🟡 Bình thường (Medium)</option>
          <option value="Low">🟢 Thấp (Low)</option>
        </select>

        <select x-model="sortBy" @change="fetchTodos()"
                class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs">
          <option value="due_date-asc">📅 Hạn: Gần → Xa</option>
          <option value="due_date-desc">📅 Hạn: Xa → Gần</option>
          <option value="created_at-desc">🕐 Mới tạo trước</option>
        </select>

        <button x-show="stats.completed > 0" @click="confirmClearCompleted()"
                class="ml-auto text-rose-500 hover:text-rose-600 font-bold inline-flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 flex-shrink-0 text-xs"
                title="Dọn dẹp việc đã xong">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span class="hidden sm:inline">Dọn dẹp đã xong</span>
        </button>
      </div>
    </div>

    <!-- ─── Nút thêm việc mới ─── -->
    <button @click="openCreateModal()"
            class="hidden sm:flex w-full mb-5 py-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-3xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition items-center justify-center gap-2 text-sm font-bold shadow-sm group">
      <div class="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950 transition">
        <svg class="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      Thêm công việc mới
    </button>

    <!-- ─── Loading Spinner ─── -->
    <div x-show="todosLoading" class="flex justify-center py-12">
      <svg class="spinner w-8 h-8 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
    </div>

    <!-- ─── Empty State ─── -->
    <div x-show="!todosLoading && todos.length === 0" class="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div class="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Không có công việc nào</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Bạn chưa có tác vụ nào hoặc không khớp với bộ lọc hiện tại.</p>
    </div>

    <!-- ─── Todo List Item Cards (Tự động sắp xếp: Việc cần làm lên đầu, Quá hạn & Đã xong rớt xuống dưới) ─── -->
    <div class="space-y-3" x-show="!todosLoading && todos.length > 0">
      <template x-for="todo in sortedTodos" :key="todo.id">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md transition-all group relative"
             :class="{
               'opacity-50 bg-slate-50/50 dark:bg-slate-900/50': todo.is_completed,
               'opacity-75 bg-rose-50/20 dark:bg-rose-950/20': !todo.is_completed && isOverdue(todo),
               'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-300/30': todo.is_pinned && !todo.is_completed
             }">
          <div class="flex items-start gap-3 sm:gap-4">
            
            <!-- Checkbox: Hết hạn tự hiện dấu ✕ (hủy), bấm vào sẽ tick thành xong việc ✓ -->
            <button @click="toggleTodo(todo)" class="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                    :class="{
                      'bg-emerald-500 border-emerald-500 text-white': todo.is_completed,
                      'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900': !todo.is_completed && isOverdue(todo),
                      'border-slate-300 dark:border-slate-600 hover:border-brand-500 bg-white dark:bg-slate-800 text-transparent': !todo.is_completed && !isOverdue(todo)
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
                  <button @click="togglePin(todo)" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                          :class="todo.is_pinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'" :title="todo.is_pinned ? 'Bỏ ghim' : 'Ghim lên đầu'">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                  </button>

                  <!-- Nhân bản (Copy Layer) -->
                  <button @click="duplicateTodo(todo)" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition active:scale-95" title="Nhân bản">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>

                  <!-- Chỉnh sửa (Pen Icon) -->
                  <button @click="openEditModal(todo)" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-600 transition active:scale-95" title="Sửa">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>

                  <!-- Xoá (Trash Icon) -->
                  <button @click="confirmDelete(todo)" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition active:scale-95" title="Xóa">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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

                <!-- Thời hạn: Hiển thị đúng theo chu kỳ (Không lặp: Giờ Thứ Ngày Tháng Năm; Hàng ngày: Giờ; Hàng tuần: Giờ Thứ) -->
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
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </main>

  <!-- ─── Floating Action Button (FAB) cho Mobile ─── -->
  <div class="fixed sm:hidden z-40"
       style="bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px)); right: calc(1.25rem + env(safe-area-inset-right, 0px));">
    <button @click="openCreateModal()"
            class="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 text-white shadow-2xl shadow-brand-600/40 flex items-center justify-center active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900"
            title="Thêm việc mới">
      <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
</div>



<!-- ═══════ MODAL THÔNG TIN PHIÊN BẢN & TÁC GIẢ (DESIGNED BY CHUNG) ═══════ -->
<div x-show="showAboutModal" x-cloak class="fixed inset-0 z-[160] flex items-center justify-center p-4">
  <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="showAboutModal=false"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center animate-bounce-once" @click.stop>
    
    <!-- Logo lớn có hiệu ứng viền -->
    <div class="relative inline-block mb-3">
      <img src="/icon-192.png" alt="Logo" class="w-20 h-20 rounded-2xl shadow-lg mx-auto ring-4 ring-brand-500/20" />
      <span class="absolute -bottom-1 -right-1 px-2 py-0.5 bg-brand-600 text-white text-[10px] font-black rounded-full shadow">
        v<span x-text="appVersion"></span>
      </span>
    </div>

    <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">To-Do List</h3>
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
        <span class="text-slate-500 dark:text-slate-400">Thông báo màn hình:</span>
        <span class="font-bold"
              :class="{
                'text-emerald-600 dark:text-emerald-400': notificationStatus === 'granted',
                'text-amber-600 dark:text-amber-400': notificationStatus === 'default',
                'text-rose-600 dark:text-rose-400': notificationStatus === 'denied'
              }">
          <span x-show="notificationStatus === 'granted'">Đã bật ✅</span>
          <span x-show="notificationStatus === 'default'">Chưa cấp quyền ⚠️</span>
          <span x-show="notificationStatus === 'denied'">Bị chặn trong trình duyệt ❌</span>
        </span>
      </div>
    </div>

    <!-- Nút hành động trong Modal -->
    <div class="flex flex-col gap-2">
      <!-- Nút Thử thông báo màn hình ngay lập tức -->
      <button @click="testNotificationOnScreen()"
              class="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold rounded-2xl shadow-md shadow-brand-500/25 transition text-xs flex items-center justify-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Bật thử thông báo màn hình (Test Notification)
      </button>

      <!-- Nút Kiểm tra bản cập nhật -->
      <button @click="checkAppVersion(true)"
              class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition text-xs flex items-center justify-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
        Kiểm tra bản cập nhật mới
      </button>

      <!-- Nút Đóng -->
      <button @click="showAboutModal = false"
              class="w-full py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition">
        Đóng
      </button>
    </div>
  </div>
</div>

<!-- ═══════ MODAL TẢI ỨNG DỤNG (DOWNLOAD FOR PC / IOS) ═══════ -->
<div x-show="showDownloadModal" x-cloak class="fixed inset-0 z-[115] flex items-end sm:items-center justify-center sm:p-4"
     x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-8 sm:translate-y-0" x-transition:enter-end="opacity-100 translate-y-0"
     x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0" x-transition:leave-end="opacity-0 translate-y-8 sm:translate-y-0">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showDownloadModal=false"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 max-h-[92vh] overflow-y-auto ios-safe-bottom" @click.stop>
    
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2.5">
        <img src="/icon-192.png" alt="Logo" class="w-8 h-8 rounded-xl shadow-sm" />
        <h2 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Cài đặt ứng dụng To-Do List</h2>
      </div>
      <button @click="showDownloadModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-5">
      <button @click="downloadTab='pc'" class="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              :class="downloadTab==='pc' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Download for PC
      </button>
      <button @click="downloadTab='ios'" class="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
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
     x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-8 sm:translate-y-0" x-transition:enter-end="opacity-100 translate-y-0"
     x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0" x-transition:leave-end="opacity-0 translate-y-8 sm:translate-y-0">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showModal=false"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 max-h-[90vh] overflow-y-auto ios-safe-bottom"
       @click.stop>
    
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white" x-text="editingTodo ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'"></h2>
      <button @click="showModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <form @submit.prevent="saveTodo()" class="space-y-4">
      <!-- Bước 1: Tiêu đề công việc -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
          1. Tiêu đề công việc <span class="text-rose-500">*</span>
        </label>
        <input x-model="todoForm.title" type="text" required placeholder="Ví dụ: Làm bài tập, Họp đối tác, Tập gym..."
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-semibold text-slate-900 dark:text-white" />
      </div>

      <!-- Bước 2: Ghi chú chi tiết -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
          2. Ghi chú chi tiết
        </label>
        <textarea x-model="todoForm.description" rows="2" placeholder="Ghi chú thêm nội dung hoặc link tài liệu..."
                  class="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm resize-none text-slate-800 dark:text-slate-200"></textarea>
      </div>

      <!-- Bước 3 & 4: Danh mục & Mức độ ưu tiên (2 cột cân đối) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Bước 3: Danh mục -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">3. Danh mục</label>
            <button type="button" @click="customCategoryMode = !customCategoryMode" class="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline">
              <span x-text="customCategoryMode ? 'Chọn sẵn' : '+ Tạo mới'"></span>
            </button>
          </div>
          <div x-show="!customCategoryMode">
            <select x-model="todoForm.category"
                    class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
              <template x-for="cat in categories" :key="cat">
                <option :value="cat" x-text="cat"></option>
              </template>
            </select>
          </div>
          <div x-show="customCategoryMode">
            <input x-model="todoForm.category" type="text" placeholder="Nhập danh mục mới..."
                   class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none" />
          </div>
        </div>

        <!-- Bước 4: Mức độ ưu tiên -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">4. Mức độ ưu tiên</label>
          <select x-model="todoForm.priority"
                  class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
            <option value="Low">🟢 Low</option>
            <option value="Medium">🟡 Medium</option>
            <option value="High">🔴 High</option>
          </select>
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
          <input x-model="todoForm.due_datetime" type="datetime-local"
                 class="block w-full max-w-full box-border appearance-none px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold text-left outline-none" />
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button type="button" @click="setQuickDate('today-12')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition">Hôm nay 12:00</button>
            <button type="button" @click="setQuickDate('today-21')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition">Tối nay 21:00</button>
            <button type="button" @click="setQuickDate('tomorrow-06')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition">Sáng mai 06:00</button>
            <button type="button" @click="setQuickDate('weekend')" class="py-2 px-1 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition">Chủ nhật tuần này</button>
          </div>
        </div>
        <!-- Khi CHỌN LẶP HÀNG NGÀY: Chỉ cần chọn Giờ -->
        <div x-show="todoForm.repeat_mode === 'daily'" class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Chọn giờ mỗi ngày:</span>
            <input x-model="todoForm.daily_time" type="time"
                   class="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none" />
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button type="button" @click="todoForm.daily_time = '06:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition" :class="todoForm.daily_time==='06:00' && 'ring-2 ring-brand-500 font-bold'">06:00 Sáng</button>
            <button type="button" @click="todoForm.daily_time = '12:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition" :class="todoForm.daily_time==='12:00' && 'ring-2 ring-brand-500 font-bold'">12:00 Trưa</button>
            <button type="button" @click="todoForm.daily_time = '18:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition" :class="todoForm.daily_time==='18:00' && 'ring-2 ring-brand-500 font-bold'">18:00 Tối</button>
            <button type="button" @click="todoForm.daily_time = '22:00'" class="py-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition" :class="todoForm.daily_time==='22:00' && 'ring-2 ring-brand-500 font-bold'">22:00 Đêm</button>
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
                        class="py-2 text-xs font-bold rounded-xl transition text-center"
                        :class="todoForm.weekly_day === day.val ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
                        x-text="day.label"></button>
              </template>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Chọn giờ thực hiện:</span>
            <input x-model="todoForm.weekly_time" type="time"
                   class="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none" />
          </div>
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
                class="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm">
          Huỷ
        </button>
        <button type="submit" :disabled="todoSaving"
                class="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm active:scale-95">
          <svg x-show="todoSaving" class="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="editingTodo ? 'Cập nhật' : 'Tạo việc mới'"></span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ═══════ CONFIRM DELETE MODAL ═══════ -->
<div x-show="showDeleteModal" x-cloak class="fixed inset-0 z-[110] flex items-center justify-center p-4">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showDeleteModal=false"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center" @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <h3 class="text-base font-bold mb-1.5">Xác nhận xoá công việc?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      Bạn có chắc chắn muốn xoá "<strong x-text="deletingTodo?.title" class="text-slate-800 dark:text-slate-200"></strong>"? Hành động này không thể hoàn tác.
    </p>
    <div class="flex gap-2.5">
      <button @click="showDeleteModal=false" class="flex-1 py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Huỷ</button>
      <button @click="deleteTodo()" :disabled="todoSaving" class="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">Xoá vĩnh viễn</button>
    </div>
  </div>
</div>

<!-- ═══════ CONFIRM CLEAR COMPLETED MODAL ═══════ -->
<div x-show="showClearCompletedModal" x-cloak class="fixed inset-0 z-[110] flex items-center justify-center p-4">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showClearCompletedModal=false"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center" @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <h3 class="text-base font-bold mb-1.5">Dọn dẹp công việc đã xong?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      Tất cả <strong x-text="stats.completed" class="text-rose-500"></strong> việc đã hoàn tất sẽ bị dọn dẹp khỏi danh sách.
    </p>
    <div class="flex gap-2.5">
      <button @click="showClearCompletedModal=false" class="flex-1 py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Huỷ</button>
      <button @click="clearCompleted()" :disabled="todoSaving" class="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">Dọn dẹp ngay</button>
    </div>
  </div>
</div>

<!-- ═══════ JAVASCRIPT CONTROLLER ═══════ -->
<script>
function app() {
  return {
    darkMode: localStorage.getItem('darkMode') === 'true',
    authenticated: false,
    currentUser: null,
    authMode: 'login',
    authForm: { email: '', username: '', password: '' },
    authLoading: false,

    todos: [],
    todosLoading: false,
    categories: ['Personal', 'Work', 'Shopping', 'Health', 'Study'],

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
      due_datetime: '',
      daily_time: '18:00',
      weekly_day: 1,
      weekly_time: '18:00',
      is_pinned: false
    },
    todoSaving: false,
    bgAudio: null,

    showDeleteModal: false,
    deletingTodo: null,
    showClearCompletedModal: false,

    // Download Modal State
    showDownloadModal: false,
    downloadTab: 'ios',
    deferredInstallPrompt: null,

    // Pull to Refresh State
    pullStartY: 0,
    pullDistance: 0,
    isRefreshing: false,

    // Toasts
    toasts: [],
    toastId: 0,

    // Modal About & Version
    showAboutModal: false,
    appVersion: '1.5.5',
    notificationStatus: ('Notification' in window ? Notification.permission : 'unsupported'),

    // Notifications, Priorities & Auto-Update
    notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
    notificationBannerDismissed: localStorage.getItem('notificationBannerDismissed') === 'true',
    lastNotifiedTimes: {},
    reminderInterval: null,
    autoPollInterval: null,
    bgWorker: null,
    swRegistration: null,
    audioCtx: null,

    get showNotificationBannerPrompt() {
      return this.authenticated &&
        ('Notification' in window) &&
        Notification.permission === 'default' &&
        !this.notificationBannerDismissed;
    },

    get stats() {
      const total = this.todos.length;
      const completed = this.todos.filter(t => t.is_completed).length;
      const pending = this.todos.filter(t => !t.is_completed).length;
      const overdue = this.todos.filter(t => this.isOverdue(t)).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, pending, overdue, percent };
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

      // 4. Lắng nghe khi người dùng mở lại app / tab từ background
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.authenticated) {
          this.fetchTodos(true);
          this.checkDueReminders();
          this.checkAppVersion();
        }
      });
      window.addEventListener('focus', () => {
        if (this.authenticated) {
          this.fetchTodos(true);
          this.checkDueReminders();
          this.checkAppVersion();
        }
      });

      // Kiểm tra phiên bản mới nhất từ server mỗi 60 giây
      setInterval(() => {
        this.checkAppVersion();
      }, 60000);

      // Đảm bảo Pull-to-refresh không bao giờ bị kẹt trên màn hình
      window.addEventListener('touchend', () => {
        if (!this.isRefreshing) {
          this.pullDistance = 0;
          this.pullStartY = 0;
        }
      }, { passive: true });

      window.addEventListener('touchcancel', () => {
        if (!this.isRefreshing) {
          this.pullDistance = 0;
          this.pullStartY = 0;
        }
      }, { passive: true });

      await this.checkAuth();
      if (this.authenticated && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        this.registerPushSubscription();
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
    },

    // ─── PULL-TO-REFRESH HANDLERS ───
    handleTouchStart(e) {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY <= 0) {
        this.pullStartY = e.touches[0].clientY;
      } else {
        this.pullStartY = 0;
      }
    },

    handleTouchMove(e) {
      if (this.pullStartY === 0 || this.isRefreshing) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY > 0) {
        this.pullStartY = 0;
        this.pullDistance = 0;
        return;
      }
      const currentY = e.touches[0].clientY;
      const diff = currentY - this.pullStartY;
      if (diff > 25) {
        // Áp dụng vùng chết 25px và độ trễ tự nhiên (damping factor 0.38)
        this.pullDistance = Math.min(95, (diff - 25) * 0.38);
      } else {
        this.pullDistance = 0;
      }
    },

    handleTouchCancel(e) {
      if (!this.isRefreshing) {
        this.pullDistance = 0;
      }
      this.pullStartY = 0;
    },

    async handleTouchEnd(e) {
      if (this.isRefreshing) return;
      if (this.pullDistance >= 75) {
        this.isRefreshing = true;
        this.pullDistance = 50;
        if (navigator.vibrate) navigator.vibrate(25);
        await this.refreshDataManual();
        this.pullDistance = 0;
        this.isRefreshing = false;
        this.showToast('Đã làm mới dữ liệu! ✨', 'success');
      } else {
        this.pullDistance = 0;
      }
      this.pullStartY = 0;
    },

    async refreshDataManual() {
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

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    },

    showToast(message, type = 'success') {
      const existing = this.toasts.find(t => t.type === type);
      if (existing) {
        // Cùng loại thông báo: Xếp chồng (stacking) với badge đếm số lượng
        existing.count = (existing.count || 1) + 1;
        existing.message = message;
        if (existing.timer) clearTimeout(existing.timer);
        existing.timer = setTimeout(() => {
          this.removeToast(existing.id);
        }, 3000);
      } else {
        // Khác loại: Đẩy thông báo cũ đi (giữ tối đa 2 thông báo trên màn hình)
        if (this.toasts.length >= 2) {
          const oldest = this.toasts.shift();
          if (oldest && oldest.timer) clearTimeout(oldest.timer);
        }
        const id = ++this.toastId;
        const newToast = {
          id,
          message,
          type,
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
        }, 3000);
        this.toasts.push(newToast);
      }
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

    async enableNotificationFromBanner() {
      if (!('Notification' in window)) {
        this.showToast('Trình duyệt không hỗ trợ thông báo.', 'error');
        return;
      }
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          this.notificationsEnabled = true;
          localStorage.setItem('notificationsEnabled', 'true');
          this.notificationBannerDismissed = true;
          localStorage.setItem('notificationBannerDismissed', 'true');
          this.showToast('Đã kích hoạt thông báo thành công! 🎉', 'success');
          this.playChime();
          this.triggerSystemNotification(
            'To-Do List',
            'Đã kích hoạt nhắc nhở trước 30 phút thành công!',
            'welcome'
          );
          this.registerPushSubscription();
        } else {
          this.notificationBannerDismissed = true;
          localStorage.setItem('notificationBannerDismissed', 'true');
          this.showToast('Bạn đã từ chối nhận thông báo.', 'warning');
        }
      } catch (e) {
        this.showToast('Lỗi yêu cầu quyền: ' + e.message, 'error');
      }
    },

    async toggleNotificationPermission() {
      if (!('Notification' in window)) {
        this.showToast('Trình duyệt không hỗ trợ thông báo.', 'error');
        return;
      }

      if (Notification.permission === 'granted') {
        this.notificationsEnabled = !this.notificationsEnabled;
        localStorage.setItem('notificationsEnabled', this.notificationsEnabled);
        this.showToast(this.notificationsEnabled ? 'Đã bật nhắc nhở màn hình theo mức ưu tiên!' : 'Đã tạm tắt thông báo.', 'info');
        if (this.notificationsEnabled) {
          this.testNotificationOnScreen();
        }
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        this.notificationStatus = permission;
        if (permission === 'granted') {
          this.notificationsEnabled = true;
          localStorage.setItem('notificationsEnabled', true);
          this.showToast('Đã cấp quyền thông báo thành công! 🎉', 'success');
          this.testNotificationOnScreen();
        } else {
          this.showToast('Bạn đã từ chối quyền thông báo.', 'warning');
        }
      } else {
        this.showToast('Trình duyệt đang chặn thông báo! Vui lòng bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ để Cho phép.', 'warning');
      }
    },

    openAboutModal() {
      if ('Notification' in window) {
        this.notificationStatus = Notification.permission;
      }
      this.showAboutModal = true;
    },

    async testNotificationOnScreen() {
      if (!('Notification' in window)) {
        this.showToast('Trình duyệt này không hỗ trợ Notification.', 'error');
        return;
      }

      if (Notification.permission === 'denied') {
        this.showToast('Trình duyệt đang chặn thông báo! Vui lòng bấm vào ổ khóa 🔒 ở cạnh thanh địa chỉ để Cho phép.', 'error');
        return;
      }

      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        this.notificationStatus = perm;
        if (perm !== 'granted') {
          this.showToast('Bạn chưa cho phép thông báo màn hình.', 'warning');
          return;
        }
      }

      this.notificationStatus = Notification.permission;
      this.notificationsEnabled = true;
      localStorage.setItem('notificationsEnabled', 'true');
      this.playChime();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      this.showToast('Đang phát thông báo màn hình thử nghiệm... 🚀', 'info');

      await this.triggerSystemNotification(
        'To-Do List (Designed by Chung)',
        '🎉 Thông báo màn hình đang hoạt động hoàn hảo! Bạn sẽ nhận được nhắc nhở đúng giờ.',
        'test-screen-notif'
      );

      // Đồng thời đăng ký & thử nghiệm Web Push chạy ngầm từ server
      await this.registerPushSubscription();
      try {
        await fetch('/api/push/test', { method: 'POST' });
      } catch {}
    },

    async registerPushSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('PushManager not supported in this browser');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const res = await fetch('/api/push/vapid-public-key');
        if (!res.ok) return;
        const data = await res.json();
        const publicKey = data.publicKey;
        if (!publicKey) return;

        const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: outputArray
          });
        }

        const subJson = sub.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: subJson.keys ? subJson.keys.p256dh : '',
              auth: subJson.keys ? subJson.keys.auth : ''
            }
          })
        });
        console.log('Web Push subscription registered with server!');
      } catch (err) {
        console.warn('Register push error:', err);
      }
    },

    async triggerSystemNotification(title, body, tag) {
      if (!('Notification' in window)) return;

      // Nếu đang default, chủ động xin quyền ngay
      if (Notification.permission === 'default') {
        try {
          const p = await Notification.requestPermission();
          this.notificationStatus = p;
          if (p !== 'granted') return;
        } catch {
          return;
        }
      }

      if (Notification.permission !== 'granted') {
        this.notificationStatus = Notification.permission;
        return;
      }

      this.notificationStatus = 'granted';
      const iconUrl = window.location.origin + '/icon-192.png';
      const uniqueTag = (tag || 'todo-reminder') + '-' + Date.now();
      const options = {
        body: body,
        icon: iconUrl,
        badge: iconUrl,
        tag: uniqueTag,
        renotify: true,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        data: { url: '/' }
      };

      // 1. Thử gửi trực tiếp qua new Notification (cực kỳ nhạy và lập tức trên PC/Windows/Mac)
      let sent = false;
      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        sent = true;
      } catch (e) {
        // Trên iOS Safari / WebKit WebClip, new Notification() bị chặn, chuyển sang Service Worker
        console.log('Direct Notification not supported, trying Service Worker:', e);
      }

      // 2. Đồng thời hoặc fallback qua Service Worker (chuẩn cho Mobile iOS/Android)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
          ]);
          if (reg && reg.showNotification && !sent) {
            await reg.showNotification(title, options);
            sent = true;
          }
        } catch (e) {
          console.warn('SW notification fallback error:', e);
        }
      }

      // 3. Dự phòng gửi message qua Service Worker Controller
      if (!sent && navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: title,
          body: body,
          tag: uniqueTag
        });
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

    async checkAppVersion() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
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

    syncScheduleWithSW() {
      if (!('serviceWorker' in navigator)) return;
      try {
        const tasks = (this.todos || [])
          .filter(t => !t.is_completed && t.due_date)
          .map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            due_date: t.due_date,
            warningMinutes: this.getPriorityWarningMinutes(t.priority),
            repeat_mode: t.repeat_mode || 'none'
          }));

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_SCHEDULE',
            tasks: tasks
          });
        }
      } catch (e) {
        console.warn('Sync schedule with SW error:', e);
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

            const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            // 1. Toast cảnh báo
            this.showToast('⏰ Sắp hết hạn trong ' + minutesLeft + ' phút! Việc "' + todo.title + '"', 'warning');

            // 2. Thông báo hệ thống (Notification)
            if (this.notificationsEnabled) {
              this.triggerSystemNotification(
                'Sắp hết hạn trong ' + minutesLeft + ' phút',
                'Công việc "' + todo.title + '" cần hoàn thành trước ' + timeStr,
                'reminder-' + todo.id + '-' + Math.floor(now / FIVE_MINUTES_MS)
              );
            }
          }
        }
      });
    },

    async api(url, options = {}) {
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
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
          await this.fetchCategories();
          await this.fetchTodos();
        }
      } catch {}
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
      this.showToast('Đã đăng xuất an toàn.', 'info');
    },

    async fetchTodos(isSilent = false) {
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
        this.todos = data.todos;
        this.checkDueReminders();
        this.syncScheduleWithSW();
      } catch (err) {
        if (!isSilent) this.showToast(err.message, 'error');
      } finally {
        if (!isSilent) this.todosLoading = false;
      }
    },

    async fetchCategories() {
      try {
        const data = await this.api('/api/categories');
        this.categories = data.categories;
      } catch {}
    },

    openCreateModal() {
      this.editingTodo = null;
      this.customCategoryMode = false;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const defaultDue = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(Math.min(23, now.getHours() + 2)) + ':00';
      this.todoForm = {
        title: '',
        description: '',
        category: 'Personal',
        priority: 'Medium',
        repeat_mode: 'none',
        due_datetime: defaultDue,
        daily_time: '18:00',
        weekly_day: 1,
        weekly_time: '18:00',
        is_pinned: false
      };
      this.showModal = true;
    },

    openEditModal(todo) {
      this.editingTodo = todo;
      this.customCategoryMode = false;
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
        is_pinned: Boolean(todo.is_pinned)
      };
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
          is_pinned: this.todoForm.is_pinned ? 1 : 0
        };

        if (this.editingTodo) {
          await this.api('/api/todos/' + this.editingTodo.id, { method: 'PUT', body: JSON.stringify(body) });
          this.showToast('Đã cập nhật công việc!');
        } else {
          await this.api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
          this.showToast('Đã tạo công việc mới!');
        }
        this.showModal = false;
        await this.fetchTodos();
        await this.fetchCategories();
        this.syncScheduleWithSW();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    },

    async toggleTodo(todo) {
      try {
        const res = await this.api('/api/todos/' + todo.id + '/toggle', { method: 'PATCH' });
        if (res && res.todo) {
          Object.assign(todo, res.todo);
        } else {
          todo.is_completed = todo.is_completed ? 0 : 1;
        }
        this.showToast(todo.is_completed ? 'Hoàn thành xuất sắc! 🎉' : 'Đã chuyển sang đang chờ.', 'info');
        this.syncScheduleWithSW();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async togglePin(todo) {
      try {
        const res = await this.api('/api/todos/' + todo.id + '/pin', { method: 'PATCH' });
        if (res && res.todo) {
          todo.is_pinned = res.todo.is_pinned;
        } else {
          todo.is_pinned = todo.is_pinned ? 0 : 1;
        }
        this.showToast(todo.is_pinned ? '📌 Đã ghim lên đầu' : 'Đã bỏ ghim', 'info');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async duplicateTodo(todo) {
      try {
        const body = {
          title: todo.title + ' (Bản sao)',
          description: todo.description || '',
          category: todo.category,
          priority: todo.priority,
          repeat_mode: todo.repeat_mode || 'none',
          due_date: todo.due_date,
          is_pinned: 0
        };
        await this.api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
        this.showToast('Đã nhân bản công việc!');
        await this.fetchTodos();
        this.syncScheduleWithSW();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    confirmDelete(todo) {
      this.deletingTodo = todo;
      this.showDeleteModal = true;
    },

    async deleteTodo() {
      this.todoSaving = true;
      try {
        await this.api('/api/todos/' + this.deletingTodo.id, { method: 'DELETE' });
        this.showToast('Đã xoá công việc!');
        this.showDeleteModal = false;
        this.deletingTodo = null;
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    },

    confirmClearCompleted() {
      this.showClearCompletedModal = true;
    },

    async clearCompleted() {
      this.todoSaving = true;
      try {
        await this.api('/api/todos/clear-completed', { method: 'POST' });
        this.showToast('Đã dọn dẹp tất cả việc đã hoàn thành!');
        this.showClearCompletedModal = false;
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    }
  };
}
</script>

</body>
</html>`;
}
