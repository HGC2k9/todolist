import { storageScript } from './client/storage';
import { notificationsScript } from './client/notifications';
import { audioTimerScript } from './client/audio-timer';
import { otaUpdaterScript } from './client/ota-updater';

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
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="To-Do List">
  <meta name="application-name" content="To-Do List">

  <!-- Icons chuẩn PNG sắc nét (Không vỡ) -->
  <link rel="icon" type="image/png" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/icon-192.png">

  <!-- Font chữ Plus Jakarta Sans hiện đại, tinh gọn (Non-blocking cho app offline iOS) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"></noscript>

  <!-- ═══════ OTA BOOT HEALTH CHECK & AUTO-ROLLBACK GUARD ═══════ -->
  <script>
    (function() {
      try {
        var otaVersion = localStorage.getItem('ota_active_version');
        if (otaVersion) {
          window.__OTA_BOOT_TIMER__ = setTimeout(function() {
            if (!window.__APP_BOOTED__) {
              console.warn('[OTA Guard] Bản OTA ' + otaVersion + ' không thể khởi động sau 3.5s! Đang tự động rollback về bản gốc .ipa...');
              try {
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WebView) {
                  var WV = window.Capacitor.Plugins.WebView;
                  WV.setServerAssetPath({ path: 'public' }).then(function() {
                    WV.persistServerBasePath().then(function() {
                      localStorage.setItem('ota_blacklisted_' + otaVersion, '1');
                      localStorage.removeItem('ota_active_version');
                      window.location.reload();
                    });
                  }).catch(function() {
                    localStorage.removeItem('ota_active_version');
                    window.location.reload();
                  });
                } else {
                  localStorage.removeItem('ota_active_version');
                  window.location.reload();
                }
              } catch(e) {
                localStorage.removeItem('ota_active_version');
                window.location.reload();
              }
            }
          }, 3500);
        }
      } catch(e) {}
    })();
  </script>

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

    [x-cloak] {
      display: none !important;
      pointer-events: none !important;
    }

    /* Padding an toàn cho iOS Dynamic Island & Tai thỏ */
    .ios-safe-top {
      padding-top: calc(max(14px, env(safe-area-inset-top, 0px)) + 12px);
    }
    .ios-safe-bottom {
      padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
    }

    .ios-scroll-body {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
    }

    .toast-enter { animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes toastIn { from { opacity:0; transform:translateY(-16px) scale(0.94); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    .spinner { animation: spin 0.7s linear infinite; }
    .line-through-anim { text-decoration: line-through; color: #94a3b8; }

    @keyframes checkmark-pop {
      0% { transform: scale(0.5); opacity: 0; }
      60% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-checkmark {
      animation: checkmark-pop 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes badge-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
      50% { box-shadow: 0 0 10px 2px rgba(239, 68, 68, 0.2); }
    }
    .overdue-glow {
      animation: badge-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
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
<body class="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-200 selection:bg-brand-500 selection:text-white max-w-full">

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

<!-- ═══════ MAIN APPLICATION INTERFACE ═══════ -->
<div class="h-screen h-[100dvh] flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans">

  <!-- ─── HEADER CỐ ĐỊNH 100% TRÁNH BỊ TREO HOẶC TRÔI KHI VUỐT ─── -->
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 select-none shadow-xs"
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

        <!-- Bật / Tắt Âm thanh thao tác (Tùy chọn) -->
        <button @click="toggleSoundEffects()"
                :aria-label="soundEffectsEnabled ? 'Tắt âm thanh thao tác' : 'Bật âm thanh thao tác'"
                class="w-8 h-8 rounded-xl inline-flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                :title="soundEffectsEnabled ? 'Âm thanh: Đang bật 🔊 (Bấm để tắt)' : 'Âm thanh: Đang tắt 🔇 (Bấm để bật)'">
          <span x-show="soundEffectsEnabled" class="text-xs">🔊</span>
          <span x-show="!soundEffectsEnabled" class="text-xs opacity-50">🔇</span>
        </button>

        </div>
  </header>

  <!-- ═══════ PHẦN 2: BODY CUỘN ĐỘC LẬP ═══════ -->
  <div class="flex-1 overflow-y-auto overscroll-contain ios-scroll-body w-full" style="padding-top: calc(max(14px, env(safe-area-inset-top, 0px)) + 60px); padding-bottom: calc(max(1.25rem, env(safe-area-inset-bottom, 0px)) + 4rem);">

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
        <button @click="filterStatus='pending'"
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
          <button type="button" @click="filterStatus='pending'"
                  class="h-7.5 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                  :class="filterStatus==='pending' && 'ring-1 ring-amber-500/50 bg-amber-50/50 dark:bg-amber-950/30'"
                  title="Bấm để lọc việc cần làm hôm nay">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <strong class="text-sm font-black text-slate-900 dark:text-white" x-text="stats.todayPending"></strong>
            <span class="text-slate-600 dark:text-slate-400">cần làm hôm nay</span>
          </button>
          
          <span class="text-slate-200 dark:text-slate-700">•</span>
          
          <button type="button" x-show="stats.overdue > 0" @click="filterStatus='overdue'"
                  class="h-7.5 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition active:scale-95"
                  :class="filterStatus==='overdue' && 'ring-1 ring-rose-500/50 bg-rose-50/70 dark:bg-rose-950/40'"
                  title="Bấm để lọc việc quá hạn">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <strong class="text-sm font-black" x-text="stats.overdue"></strong>
            <span>quá hạn</span>
          </button>
          
          <span x-show="stats.overdue > 0" class="text-slate-200 dark:text-slate-700">•</span>
          
          <button type="button" @click="filterStatus='completed'"
                  class="h-7.5 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                  :class="filterStatus==='completed' && 'ring-1 ring-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30'"
                  title="Bấm để lọc việc đã xong">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span><strong class="text-emerald-600 dark:text-emerald-400 font-black text-sm" x-text="stats.todayCompleted"></strong>/<span x-text="stats.todayTotal"></span> đã xong</span>
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
               role="progressbar" :aria-valuenow="stats.todayPercent" aria-valuemin="0" aria-valuemax="100" :aria-label="'Tiến độ hôm nay: ' + stats.todayPercent + '%'">
            <div class="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out" :style="'width: ' + stats.todayPercent + '%'"></div>
          </div>
          <span class="text-[11px] font-black text-slate-500 dark:text-slate-400" x-text="stats.todayPercent + '%'"></span>
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
        <input x-model="searchQuery" type="text" placeholder="Tìm kiếm công việc nhanh (phím / để tìm)..."
               aria-label="Tìm kiếm công việc"
               class="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-xs sm:text-sm font-medium" />
        <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          <button x-show="searchQuery" @click="searchQuery=''" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition" aria-label="Xóa nội dung tìm kiếm">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">/</kbd>
        </div>
      </div>

      <!-- Quick Filter Chips với số lượng đếm trực tiếp (Căn chỉnh đối xứng h-8) -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-0.5 px-0.5" role="group" aria-label="Bộ lọc trạng thái công việc">
        <template x-for="s in statusFilters" :key="s.value">
          <button @click="filterStatus = s.value"
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

      <!-- Chế độ xem: Danh sách / Lịch -->
      <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
        <div class="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/80 h-8">
          <button type="button" @click="setViewMode('list')"
                  class="h-7 px-2.5 rounded-lg transition inline-flex items-center justify-center gap-1.5 active:scale-95"
                  :class="viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
            <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>Danh sách</span>
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
        <select x-model="filterCategory"
                aria-label="Lọc theo danh mục"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs transition hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-brand-500">
          <option value="all">📁 Danh mục (Tất cả)</option>
          <template x-for="cat in categories" :key="cat">
            <option :value="cat" x-text="cat"></option>
          </template>
        </select>

        <select x-model="filterPriority"
                aria-label="Lọc theo mức độ ưu tiên"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs transition hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-brand-500">
          <option value="all">⚡ Ưu tiên (Tất cả)</option>
          <option value="High">🔴 Khẩn cấp (High)</option>
          <option value="Medium">🟡 Bình thường (Medium)</option>
          <option value="Low">🟢 Thấp (Low)</option>
        </select>

        <select x-model="sortBy"
                aria-label="Sắp xếp danh sách công việc"
                class="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none cursor-pointer flex-shrink-0 text-xs transition hover:border-slate-300 dark:hover:border-slate-600 focus:ring-1 focus:ring-brand-500">
          <option value="due_date-asc">📅 Hạn: Gần → Xa</option>
          <option value="due_date-desc">📅 Hạn: Xa → Gần</option>
          <option value="created_at-desc">🕐 Mới tạo trước</option>
          <option value="custom">✋ Tùy chỉnh (Kéo thả)</option>
        </select>

        <!-- Nút Năng suất (Productivity Analytics) -->
        <button type="button" @click="openAnalytics()"
                aria-label="Báo cáo năng suất sâu"
                class="h-8 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex-shrink-0 text-xs inline-flex items-center gap-1.5 transition active:scale-95"
                title="Báo cáo thống kê năng suất sâu">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span class="hidden sm:inline">Năng suất</span>
        </button>

        <!-- Nút Pomodoro Focus Mode (Bật / Tắt tập trung toàn ứng dụng) -->
        <button type="button" @click="openPomodoro()"
                aria-label="Chế độ tập trung Pomodoro"
                class="h-8 px-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold flex-shrink-0 text-xs inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                :class="pomodoroRunning && 'ring-2 ring-rose-500 animate-pulse bg-rose-100 dark:bg-rose-900'"
                title="Bật/Tắt chế độ tập trung Pomodoro">
          <span>🍅</span>
          <span x-text="pomodoroRunning ? ('Tập trung: ' + formatTimer(pomodoroTimeLeft)) : 'Pomodoro'"></span>
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
        <div class="todo-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md group relative transition-all"
             :class="{
               'opacity-50 bg-slate-50/50 dark:bg-slate-900/50': todo.is_completed,
               'opacity-75 bg-rose-50/20 dark:bg-rose-950/20': !todo.is_completed && isOverdue(todo),
               'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-300/30': todo.is_pinned && !todo.is_completed,
               'ring-2 ring-brand-400 border-brand-400': draggedTodo && draggedTodo.id === todo.id
             }"
             :draggable="sortBy === 'custom'"
             @dragstart="onDragStart($event, todo)"
             @dragover.prevent="onDragOver($event, todo)"
             @drop="onDrop($event, todo)"
             @dragend="onDragEnd()">
          <div class="flex items-start gap-3 sm:gap-4">
            
            <!-- Controls kéo thả / di chuyển thứ tự khi ở chế độ Tùy chỉnh (Kéo thả) -->
            <div x-show="sortBy === 'custom'" class="flex items-center gap-0.5 text-slate-400 flex-shrink-0 select-none mr-0.5">
              <button type="button" @click.stop="moveTodo(todo, -1)" aria-label="Chuyển lên" class="p-1 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg active:scale-90 transition text-xs cursor-pointer" title="Chuyển lên trên">▲</button>
              <button type="button" @click.stop="moveTodo(todo, 1)" aria-label="Chuyển xuống" class="p-1 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg active:scale-90 transition text-xs cursor-pointer" title="Chuyển xuống dưới">▼</button>
              <span class="hidden sm:inline-block cursor-grab active:cursor-grabbing px-1 text-slate-300 dark:text-slate-600 font-bold" title="Kéo thả sắp xếp vị trí">⋮⋮</span>
            </div>
            
            <!-- Checkbox: Hết hạn tự hiện dấu ✕ (hủy), bấm vào sẽ tick thành xong việc ✓ -->
            <button @click="toggleTodo(todo, $event)"
                    role="checkbox"
                    :aria-checked="Boolean(todo.is_completed)"
                    :aria-label="todo.is_completed ? ('Đánh dấu chưa hoàn thành: ' + todo.title) : (isOverdue(todo) ? ('Xác nhận đã xong việc quá hạn: ' + todo.title) : ('Đánh dấu hoàn thành: ' + todo.title))"
                    class="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs active:scale-90"
                    :class="{
                      'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20': todo.is_completed,
                      'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 overdue-glow': !todo.is_completed && isOverdue(todo),
                      'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 text-amber-500': !todo.is_completed && !isOverdue(todo) && hasUncompletedSubtasks(todo),
                      'border-slate-300 dark:border-slate-600 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/40 bg-white dark:bg-slate-800 text-transparent': !todo.is_completed && !isOverdue(todo) && !hasUncompletedSubtasks(todo)
                    }"
                    :title="todo.is_completed ? 'Đã hoàn thành (Bấm để mở lại)' : (hasUncompletedSubtasks(todo) ? ('Còn ' + getUncompletedSubtasksCount(todo) + ' việc con chưa xong!') : (isOverdue(todo) ? 'Quá hạn (Tự hủy) - Bấm để xác nhận xong việc' : 'Đánh dấu hoàn thành'))">
              <!-- Đã xong: checkmark xanh lá -->
              <svg x-show="todo.is_completed" class="w-4 h-4 animate-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              <!-- Quá hạn: Dấu X đỏ tự hủy, bấm vào sẽ tick thành xong việc -->
              <svg x-show="!todo.is_completed && isOverdue(todo)" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <!-- Còn việc con chưa xong: Chấm amber cảnh báo -->
              <span x-show="!todo.is_completed && !isOverdue(todo) && hasUncompletedSubtasks(todo)" class="w-2 h-2 rounded-full bg-amber-500"></span>
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

                <!-- Nút Minh chứng hoàn thành (Chụp ảnh/Tải ảnh kết quả, có thể không chụp) -->
                <div class="inline-flex items-center gap-1.5">
                  <button type="button" @click="chooseOrCapturePhoto(todo.id)"
                          class="h-6 px-1.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
                          :class="getTodoImages(todo.id).length > 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'"
                          title="Chụp ảnh hoặc chọn ảnh minh chứng kết quả hoàn thành">
                    <span>📸</span>
                    <span x-text="getTodoImages(todo.id).length > 0 ? ('Minh chứng (' + getTodoImages(todo.id).length + ')') : 'Minh chứng'"></span>
                  </button>
                </div>
              </div>

              <!-- Khối Ảnh Minh chứng hoàn thành (Evidence Strip) -->
              <div x-show="getTodoImages(todo.id).length > 0" class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div class="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Ảnh minh chứng kết quả (<span x-text="getTodoImages(todo.id).length"></span>)</span>
                  </span>
                  <button type="button" @click="chooseOrCapturePhoto(todo.id)" class="text-[10px] text-brand-600 hover:underline font-bold cursor-pointer">+ Thêm ảnh</button>
                </div>
                <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                  <template x-for="img in getTodoImages(todo.id)" :key="img.id">
                    <div class="relative group flex-shrink-0">
                      <img :src="img.image_data" @click="openLightbox(img.image_data)" alt="Ảnh minh chứng"
                           class="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-85 transition hover:scale-105 shadow-xs" />
                      <button type="button" @click.stop="deleteImage(todo.id, img.id)"
                              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-black shadow-xs hover:bg-rose-600 transition cursor-pointer"
                              title="Xóa ảnh minh chứng này">✕</button>
                    </div>
                  </template>
                </div>
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
  </div>

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

    <!-- Thông tin: Phiên bản & Tác giả -->
    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2.5 my-4">
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Phiên bản:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200">v<span x-text="appVersion"></span></span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Tác giả:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200">Chung</span>
      </div>
    </div>

    <!-- Nút hành động -->
    <div class="flex flex-col gap-2.5">
      <!-- Nút Kiểm tra phiên bản -->
      <button @click="checkAppVersion(true)"
              class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer">
        <svg class="w-4 h-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
        Kiểm tra phiên bản
      </button>

      <!-- Nút Đóng -->
      <button @click="showAboutModal = false"
              aria-label="Đóng thông tin phiên bản"
              class="w-full py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer">
        Đóng
      </button>
    </div>
  </div>
</div>
  </div>
</div>

<!-- ═══════ CREATE / EDIT MODAL ═══════ -->
<div x-show="showModal" x-cloak class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
     role="dialog" aria-modal="true" aria-labelledby="todo-modal-title">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showModal=false; modalDragY=0"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 h-[88vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden ios-safe-bottom"
       :style="modalDragY > 0 ? ('transform: translateY(' + modalDragY + 'px); transition: ' + (isDraggingModal ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)')) : ''"
       x-transition:enter="transition ease-out duration-250" x-transition:enter-start="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95" x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100" x-transition:leave-end="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
       @click.stop>
    
    <!-- ─── PHẦN 1: HEADER CỐ ĐỊNH (Thanh kéo lên kéo xuống để thoát + Tiêu đề + Nút đóng) ─── -->
    <div class="shrink-0 px-5 sm:px-7 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 select-none cursor-grab active:cursor-grabbing touch-none"
         @touchstart="onModalDragStart($event)"
         @touchmove="onModalDragMove($event)"
         @touchend="onModalDragEnd($event)"
         @mousedown="onModalDragStart($event)">
      <!-- Thanh kéo cửa sổ mobile (Kéo xuống để tắt thoát) -->
      <div class="w-16 h-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full mx-auto mb-2.5 transition"></div>

      <div class="flex items-center justify-between pointer-events-auto">
        <h2 id="todo-modal-title" class="text-lg sm:text-xl font-black text-slate-900 dark:text-white" x-text="editingTodo ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'"></h2>
        <button @click="showModal=false; modalDragY=0" type="button" aria-label="Đóng cửa sổ" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- ─── PHẦN 2: BODY CUỘN ĐỘC LẬP (Toàn bộ form nhập liệu) ─── -->
    <form id="todo-create-form" @submit.prevent="saveTodo()" class="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-4 overscroll-contain">
      <!-- Bước 1: Tiêu đề công việc kèm Nhập liệu bằng giọng nói (Voice Input) -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label for="todo-title-input" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            1. Tiêu đề công việc <span class="text-rose-500">*</span>
          </label>
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
          3. Việc con (Checklist)
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

      <!-- Bước 4, 5, 6: Danh mục, Ưu tiên & Mốc nhắc trước -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Danh mục -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">4. Danh mục</label>
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

        <!-- Mức độ ưu tiên (Tần suất nhắc chuông) -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">5. Ưu tiên</label>
          <select x-model="todoForm.priority" aria-label="Mức độ ưu tiên"
                  class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>

        <!-- Tùy chỉnh mốc nhắc nhở (Reminder Offset) -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">6. Nhắc trước</label>
          <select x-model.number="todoForm.reminder_offset" aria-label="Nhắc trước hạn"
                  class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
            <option :value="0">Đúng giờ</option>
            <option :value="5">Trước 5 phút</option>
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

      <!-- Bước 7: Chu kỳ lặp lại -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">7. Chu kỳ lặp lại</label>
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

      <!-- Bước 8: Hạn chót (Thay đổi thông minh theo Chu kỳ lặp lại) -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">8. Thời hạn hoàn thành</label>

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

      <!-- Ghim công việc -->
      <div class="flex items-center gap-2 pt-1">
        <input type="checkbox" id="pinCheck" x-model="todoForm.is_pinned" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer" />
        <label for="pinCheck" class="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 select-none">
          <svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
          Ghim công việc này lên đầu danh sách
        </label>
      </div>

    </form>

    <!-- ─── PHẦN 3: FOOTER CỐ ĐỊNH (2 nút Hủy và "Tạo việc mới" / "Cập nhật") ─── -->
    <div class="shrink-0 px-5 sm:px-7 py-3 sm:py-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800/80 select-none">
      <div class="flex gap-2.5">
        <button type="button" @click="showModal=false"
                class="flex-1 h-11 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm active:scale-95 inline-flex items-center justify-center cursor-pointer">
          Huỷ
        </button>
        <button type="submit" form="todo-create-form" :disabled="todoSaving"
                class="flex-1 h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 inline-flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer">
          <svg x-show="todoSaving" class="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="editingTodo ? 'Cập nhật' : 'Tạo việc mới'"></span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Global Hidden Inputs for Camera and Photo Gallery Upload -->
<input id="todo-camera-input" type="file" accept="image/*" capture="environment" class="hidden" @change="handleProofImageSelected($event)" />
<input id="todo-image-input" type="file" accept="image/*" class="hidden" @change="handleProofImageSelected($event)" />

<!-- ═══════ MODAL XÁC NHẬN HOÀN THÀNH CÔNG VIỆC KÈM MINH CHỨNG (TÙY CHỌN) ═══════ -->
<div x-show="showCompletionModal" x-cloak class="fixed inset-0 z-[125] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="completion-modal-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="closeCompletionModal()"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-center"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
       @click.stop>
    
    <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    </div>

    <h3 id="completion-modal-title" class="text-base font-bold text-slate-900 dark:text-white mb-1">
      Xác nhận hoàn thành?
    </h3>
    
    <p class="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2 truncate px-2" x-text="completingTodo?.title"></p>

    <!-- Cảnh báo nếu công việc đã quá hạn -->
    <div x-show="completingTodo && isOverdue(completingTodo)" class="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 text-left">
      <span class="text-base">⚠️</span>
      <span>Công việc này đã quá hạn! Bạn xác nhận đã hoàn tất muộn?</span>
    </div>

    <!-- Ô Minh chứng hoàn thành (Tùy chọn: Chụp/Tải ảnh) -->
    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 mb-4 text-left">
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <span>📸</span>
          <span>Ảnh minh chứng kết quả</span>
        </label>
        <span class="text-[10px] text-slate-400">(không bắt buộc)</span>
      </div>

      <!-- Preview ảnh nếu đã chọn -->
      <div x-show="completingProofPhoto" class="relative inline-block mb-2">
        <img :src="completingProofPhoto" class="w-20 h-20 object-cover rounded-xl border border-emerald-400 shadow-sm" alt="Minh chứng" />
        <button type="button" @click="completingProofPhoto=null; completingPhotoName=''" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-md cursor-pointer hover:bg-rose-600">✕</button>
      </div>

      <div x-show="!completingProofPhoto" class="flex items-center gap-2">
        <button type="button" @click="chooseOrCaptureProofForCompletion('camera')"
                class="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs">
          <span>📷 Chụp ảnh</span>
        </button>
        <button type="button" @click="chooseOrCaptureProofForCompletion('album')"
                class="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs">
          <span>🖼️ Chọn ảnh</span>
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button type="button" @click="closeCompletionModal()"
              class="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 inline-flex items-center justify-center cursor-pointer">
        Huỷ
      </button>
      <button type="button" @click="confirmCompleteTask()"
              :disabled="completingUploadingPhoto"
              class="flex-1 h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/25 transition active:scale-95 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
        <svg x-show="completingUploadingPhoto" class="spinner w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
        <span x-text="completingUploadingPhoto ? 'Đang lưu...' : 'Xác nhận đã xong ✓'"></span>
      </button>
    </div>
  </div>
</div>

<!-- ═══════ CONFIRM DELETE MODAL ═══════ -->
<div x-show="showDeleteModal" x-cloak class="fixed inset-0 z-[200] flex items-center justify-center p-4"
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
<div x-show="showClearCompletedModal" x-cloak class="fixed inset-0 z-[200] flex items-center justify-center p-4"
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

<!-- ═══════ UNIVERSAL CONFIRM MODAL ═══════ -->
<div x-show="confirmDialog.show" x-cloak class="fixed inset-0 z-[200] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="closeConfirm(false)"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center animate-bounce-once"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
       @click.stop>
    <div class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 text-2xl shadow-xs"
         :class="confirmDialog.isDanger ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500' : 'bg-brand-50 dark:bg-brand-950/60 text-brand-500'">
      <span x-text="confirmDialog.icon || '⚠️'"></span>
    </div>
    <h3 id="confirm-dialog-title" class="text-base font-bold text-slate-900 dark:text-white mb-1.5" x-text="confirmDialog.title"></h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed" x-text="confirmDialog.message"></p>
    <div class="flex gap-2.5">
      <button type="button" @click="closeConfirm(false)"
              class="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 inline-flex items-center justify-center cursor-pointer"
              x-text="confirmDialog.cancelText || 'Hủy'"></button>
      <button type="button" @click="closeConfirm(true)"
              class="flex-1 h-10 px-3 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 inline-flex items-center justify-center cursor-pointer"
              :class="confirmDialog.isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30'"
              x-text="confirmDialog.confirmText || 'Đồng ý'"></button>
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
      <button type="button" @click="exportIcalLocally()"
         class="w-full p-3.5 rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100/50 dark:hover:bg-violet-900/40 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-violet-900 dark:text-violet-200 group text-left cursor-pointer active:scale-95">
        <span class="text-2xl">📅</span>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span>Xuất file iCalendar (.ics)</span>
            <span class="text-[10px] bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-2 py-0.5 rounded-full font-bold">Chuẩn RFC 5545</span>
          </div>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Đồng bộ sang Apple Calendar, Google Calendar, Outlook</p>
        </div>
      </button>

      <!-- 2. Xuất sao lưu JSON qua iOS Share Sheet -->
      <button type="button" @click="exportJsonLocally()"
         class="w-full p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200 group text-left cursor-pointer active:scale-95">
        <span class="text-2xl">💾</span>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span>Sao lưu dữ liệu JSON</span>
            <span class="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">iOS Share Sheet</span>
          </div>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Lưu file JSON trực tiếp vào Tệp (Files), AirDrop hoặc Ghi chú trên iPhone</p>
        </div>
      </button>

      <!-- 2b. Sao chép JSON vào Clipboard -->
      <button type="button" @click="copyBackupToClipboard()"
         class="w-full p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 group text-left cursor-pointer active:scale-95">
        <span class="text-2xl">📋</span>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span>Sao chép JSON vào Clipboard</span>
            <span class="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">1-Click</span>
          </div>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Dán nhanh nội dung sao lưu vào bất kỳ ứng dụng nào</p>
        </div>
      </button>

      <!-- 3. Nhập phục hồi file JSON -->
      <label class="w-full p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
        <span class="text-2xl">📥</span>
        <div class="flex-1">
          <span>Khôi phục từ file JSON</span>
          <p class="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">Chọn file sao lưu từ iPhone để phục hồi danh sách công việc</p>
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

<!-- ═══════ FOCUS TOOLS: POMODORO, STOPWATCH, COUNTDOWN TIMER & AMBIENT SOUND ═══════ -->
<div x-show="showPomodoroModal" x-cloak class="fixed inset-0 z-[130] flex items-center justify-center p-4"
     role="dialog" aria-modal="true" aria-labelledby="focus-tools-modal-title">
  <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="showPomodoroModal=false"
       x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
       x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"></div>
  <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center max-h-[90vh] flex flex-col"
       x-transition:enter="transition ease-out duration-250" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
       @click.stop>
    <!-- Header with 3 Tabs -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div class="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
        <button type="button" @click="focusToolTab='pomodoro'"
                class="px-2.5 sm:px-3 py-1.5 rounded-xl transition cursor-pointer"
                :class="focusToolTab === 'pomodoro' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
          🍅 Pomodoro
        </button>
        <button type="button" @click="focusToolTab='stopwatch'"
                class="px-2.5 sm:px-3 py-1.5 rounded-xl transition cursor-pointer"
                :class="focusToolTab === 'stopwatch' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
          ⏱️ Bấm giờ
        </button>
        <button type="button" @click="focusToolTab='timer'"
                class="px-2.5 sm:px-3 py-1.5 rounded-xl transition cursor-pointer"
                :class="focusToolTab === 'timer' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'">
          ⏳ Hẹn giờ
        </button>
      </div>
      <button @click="showPomodoroModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">✕</button>
    </div>

    <div class="flex-1 overflow-y-auto no-scrollbar">
      <!-- ─── TAB 1: POMODORO ─── -->
      <div x-show="focusToolTab==='pomodoro'">
        <!-- Mode Selector -->
        <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5 text-xs font-bold">
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
        <div class="my-5">
          <div class="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-slate-900 dark:text-white select-none"
               x-text="formatTimer(pomodoroTimeLeft)"></div>
          <div class="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest"
               x-text="pomodoroRunning ? 'Đang đếm ngược...' : 'Tạm dừng'"></div>
        </div>

        <!-- Timer Controls -->
        <div class="flex items-center justify-center gap-3 mb-5">
          <button type="button" @click="pomodoroRunning ? pausePomodoro() : startPomodoro()"
                  class="h-11 px-5 rounded-2xl font-bold text-sm text-white shadow-lg transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  :class="pomodoroRunning ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'">
            <span x-text="pomodoroRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu'"></span>
          </button>
          <button type="button" @click="resetPomodoro()"
                  class="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold inline-flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Đặt lại đồng hồ">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>
      </div>

      <!-- ─── TAB 2: STOPWATCH (BẤM GIỜ) ─── -->
      <div x-show="focusToolTab==='stopwatch'">
        <div class="my-5">
          <div class="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-slate-900 dark:text-white select-none"
               x-text="formatStopwatch(stopwatchTime)"></div>
          <div class="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest"
               x-text="stopwatchRunning ? 'Đang tính giờ...' : (stopwatchTime > 0 ? 'Tạm dừng' : 'Sẵn sàng')"></div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center gap-2.5 mb-4">
          <button type="button" @click="stopwatchRunning ? pauseStopwatch() : startStopwatch()"
                  class="h-11 px-5 rounded-2xl font-bold text-sm text-white shadow-lg transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  :class="stopwatchRunning ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'">
            <span x-text="stopwatchRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu'"></span>
          </button>
          <button type="button" @click="lapStopwatch()" :disabled="!stopwatchRunning"
                  class="h-11 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs inline-flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer">
            🏁 Vòng
          </button>
          <button type="button" @click="resetStopwatch()"
                  class="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold inline-flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Đặt lại">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>

        <!-- Laps List -->
        <div x-show="stopwatchLaps.length > 0" class="max-h-36 overflow-y-auto mb-4 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
          <template x-for="lap in stopwatchLaps" :key="lap.lapNumber">
            <div class="flex items-center justify-between py-1 px-2 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 font-mono">
              <span class="font-bold text-slate-500" x-text="'Vòng ' + lap.lapNumber"></span>
              <span class="text-slate-400" x-text="'+' + formatStopwatch(lap.splitTime)"></span>
              <span class="font-bold text-slate-800 dark:text-slate-200" x-text="formatStopwatch(lap.totalTime)"></span>
            </div>
          </template>
        </div>
      </div>

      <!-- ─── TAB 3: COUNTDOWN TIMER (HẸN GIỜ) ─── -->
      <div x-show="focusToolTab==='timer'">
        <!-- Quick Presets -->
        <div class="flex flex-wrap items-center justify-center gap-1.5 mb-4">
          <button type="button" @click="setCountdownPreset(60)" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer">1p</button>
          <button type="button" @click="setCountdownPreset(300)" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer">5p</button>
          <button type="button" @click="setCountdownPreset(600)" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer">10p</button>
          <button type="button" @click="setCountdownPreset(900)" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer">15p</button>
          <button type="button" @click="setCountdownPreset(1500)" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer">25p</button>
          <button type="button" @click="setCountdownPreset(3600)" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer">60p</button>
        </div>

        <!-- Timer Display -->
        <div class="my-4">
          <div class="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-slate-900 dark:text-white select-none"
               x-text="formatCountdown(countdownTimeLeft)"></div>
          <div class="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest"
               x-text="countdownRunning ? 'Đang đếm ngược...' : (countdownTimeLeft <= 0 ? 'Đã hết giờ!' : 'Tạm dừng')"></div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center gap-3 mb-5">
          <button type="button" @click="countdownRunning ? pauseCountdown() : startCountdown()"
                  class="h-11 px-5 rounded-2xl font-bold text-sm text-white shadow-lg transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  :class="countdownRunning ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'">
            <span x-text="countdownRunning ? '⏸️ Tạm dừng' : '▶️ Bắt đầu'"></span>
          </button>
          <button type="button" @click="resetCountdown()"
                  class="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold inline-flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Đặt lại">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        </div>
      </div>

      <!-- Ambient Sound Generator (Web Audio API - 0KB) -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-left mt-2">
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
          <input type="range" min="0" max="100" step="5" x-model.number="ambientVolume" @input="setAmbientVolume($event.target.value)"
                 class="flex-1 accent-brand-600 cursor-pointer h-1.5 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <span class="text-[11px] font-mono text-slate-400 w-10 text-right" x-text="ambientVolume + '%'"></span>
        </div>
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
${storageScript}
${notificationsScript}
${audioTimerScript}
${otaUpdaterScript}

function app() {
  return {
    darkMode: localStorage.getItem('darkMode') === 'true',
    authenticated: true,
    currentUser: { id: 'local_user', username: 'Người dùng', email: 'offline@localhost' },

    // Filters
    searchQuery: '',
    filterStatus: 'pending',
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

    viewMode: (localStorage.getItem('viewMode') === 'calendar' ? 'calendar' : 'list'),
    filterTag: 'all',
    showBackupModal: false,
    calendarDate: new Date(),
    selectedCalendarDate: null,

    modalDragY: 0,
    isDraggingModal: false,
    modalStartY: 0,

    toasts: [],
    toastId: 0,
    showAboutModal: false,
    appVersion: '2.6.0',
    isRefreshing: false,

    // ── GỘP CÁC MODULE CON ĐỘC LẬP ──
    ...getStorageModule(),
    ...getNotificationsModule(),
    ...getAudioTimerModule(),
    ...getOtaUpdaterModule(),

    checkAppVersion(manual) {
      return this.checkOtaUpdate(manual);
    },

    // ── COMPUTED / GETTERS ──
    get trashTodos() {
      return (this.todos || []).filter(t => Boolean(t.deleted_at));
    },

    get analyticsData() {
      const activeTodos = (this.todos || []).filter(t => !t.deleted_at);
      const total = activeTodos.length;
      const completedList = activeTodos.filter(t => t.is_completed);
      const completed = completedList.length;
      const pending = activeTodos.filter(t => !t.is_completed).length;
      const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const on_time = completedList.filter(t => {
        if (!t.due_date) return true;
        const due = this.parseDateSafe(t.due_date);
        const comp = this.parseDateSafe(t.updated_at || t.created_at);
        if (!due || !comp) return true;
        return comp.getTime() <= due.getTime();
      }).length;

      const total_actual_minutes = activeTodos.reduce((sum, t) => sum + (Number(t.actual_minutes) || 0), 0);

      const catMap = {};
      activeTodos.forEach(t => {
        const cat = t.category || 'Personal';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const category_distribution = Object.entries(catMap).map(([category, count]) => ({
        category,
        count
      }));

      const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const week_stats = days.map(d => ({ day: d, count: 0 }));
      const vnNow = this.getVnDateParts(Date.now());
      const currentDay = vnNow.dayOfWeek;
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayMs = Date.now() - (diffToMonday * 24 * 3600 * 1000);
      const mondayVn = this.getVnDateParts(mondayMs);
      const mondayDateStr = mondayVn.dateStr;

      (this.completionHistory || []).forEach(hist => {
        if (!hist.date_str) return;
        if (hist.date_str >= mondayDateStr) {
          const histD = this.parseDateSafe(hist.completed_at || hist.date_str);
          if (histD) {
            const histVn = this.getVnDateParts(histD);
            const dayIdx = histVn.dayOfWeek === 0 ? 6 : histVn.dayOfWeek - 1;
            if (week_stats[dayIdx]) {
              week_stats[dayIdx].count++;
            }
          }
        }
      });

      return {
        total,
        completed,
        pending,
        completion_rate,
        on_time,
        total_actual_minutes,
        category_distribution,
        week_stats,
        streak: this.streak || 1
      };
    },

    get stats() {
      const activeTodos = (this.todos || []).filter(t => !t.deleted_at);
      const total = activeTodos.length;
      const completed = activeTodos.filter(t => t.is_completed).length;
      const pending = activeTodos.filter(t => !t.is_completed).length;
      const overdue = activeTodos.filter(t => this.isOverdue(t)).length;
      const recurring = activeTodos.filter(t => t.repeat_mode && t.repeat_mode !== 'none' && !t.is_completed).length;

      const todayTodos = activeTodos.filter(t => this.isTodoForToday(t));
      const todayTotal = todayTodos.length;
      const todayCompleted = todayTodos.filter(t => t.is_completed).length;
      const todayPending = todayTodos.filter(t => !t.is_completed).length;
      const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : (todayCompleted > 0 ? 100 : 0);
      const percent = todayPercent;

      return {
        total,
        completed,
        pending,
        overdue,
        recurring,
        percent,
        todayTotal,
        todayCompleted,
        todayPending,
        todayPercent
      };
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
      let list = this.todos.filter(t => !t.deleted_at);
      return list.sort((a, b) => {
        const aCompleted = a.is_completed ? 1 : 0;
        const bCompleted = b.is_completed ? 1 : 0;
        const aOverdue = this.isOverdue(a) ? 1 : 0;
        const bOverdue = this.isOverdue(b) ? 1 : 0;

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

        const aPinned = a.is_pinned ? 1 : 0;
        const bPinned = b.is_pinned ? 1 : 0;
        if (aPinned !== bPinned) {
          return bPinned - aPinned;
        }

        const sortBy = this.sortBy || 'due_date-asc';

        if (sortBy === 'custom') {
          const posA = typeof a.position === 'number' ? a.position : 0;
          const posB = typeof b.position === 'number' ? b.position : 0;
          if (posA !== posB) return posA - posB;
        } else if (sortBy === 'due_date-desc') {
          if (a.due_date && b.due_date) {
            const tA = new Date(a.due_date).getTime();
            const tB = new Date(b.due_date).getTime();
            if (!isNaN(tA) && !isNaN(tB) && tA !== tB) return tB - tA;
          }
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
        } else if (sortBy === 'created_at-desc') {
          const cA = new Date(a.created_at).getTime() || 0;
          const cB = new Date(b.created_at).getTime() || 0;
          if (cA !== cB) return cB - cA;
        } else if (sortBy === 'created_at-asc') {
          const cA = new Date(a.created_at).getTime() || 0;
          const cB = new Date(b.created_at).getTime() || 0;
          if (cA !== cB) return cA - cB;
        } else {
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
      return (this.todos || []).filter(t => !t.deleted_at && this.isWithin30Minutes(t));
    },

    get imminentSummary() {
      return this.imminentTodos.map(t => '«' + t.title + '» (' + (t.priority || 'Medium') + ' - ' + this.getMinutesRemaining(t) + 'p)').join(', ');
    },

    get allTags() {
      const set = new Set();
      for (const t of (this.todos || [])) {
        if (t.deleted_at) continue;
        const tags = this.getTags(t);
        tags.forEach(tg => set.add(tg));
      }
      return Array.from(set).sort();
    },

    get filteredSortedTodos() {
      let list = this.sortedTodos;

      if (this.filterStatus === 'pending') {
        list = list.filter(t => !t.is_completed);
      } else if (this.filterStatus === 'completed') {
        list = list.filter(t => t.is_completed);
      } else if (this.filterStatus === 'overdue') {
        list = list.filter(t => this.isOverdue(t));
      } else if (this.filterStatus === 'recurring') {
        list = list.filter(t => t.repeat_mode && t.repeat_mode !== 'none');
      }

      if (this.filterCategory && this.filterCategory !== 'all') {
        list = list.filter(t => t.category === this.filterCategory);
      }

      if (this.filterPriority && this.filterPriority !== 'all') {
        list = list.filter(t => t.priority === this.filterPriority);
      }

      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        list = list.filter(t =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      }

      if (this.filterTag && this.filterTag !== 'all') {
        if (this.filterTag === 'pomodoro') {
          list = list.filter(t => Boolean(t.pomodoro_mode));
        } else {
          list = list.filter(t => {
            const tags = this.getTags(t);
            return tags.includes(this.filterTag);
          });
        }
      }

      return list;
    },

    get streak() {
      const baseStreak = this.historicalStreak || 0;
      const completed = this.todos.filter(t => t.is_completed);
      if (!completed.length) return baseStreak;
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
      if (!check) return baseStreak;
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
      return Math.max(count, baseStreak);
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
        const tasksOnDay = (this.todos || []).filter(t => {
          if (!t.due_date || t.deleted_at) return false;
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
      return (this.todos || []).filter(t => {
        if (!t.due_date || t.deleted_at) return false;
        const taskD = new Date(t.due_date);
        if (isNaN(taskD.getTime())) return false;
        const taskVn = new Date(taskD.getTime() + 7 * 3600 * 1000);
        const taskDateStr = taskVn.getUTCFullYear() + '-' + pad(taskVn.getUTCMonth()+1) + '-' + pad(taskVn.getUTCDate());
        return taskDateStr === this.selectedCalendarDate;
      });
    },

    // ── CORE LIFECYCLE & HANDLERS ──
    async init() {
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

      if (window.Capacitor?.Plugins?.SplashScreen) {
        try {
          await window.Capacitor.Plugins.SplashScreen.hide();
        } catch {}
      }
      setTimeout(() => {
        document.querySelectorAll('[x-cloak]').forEach(el => el.removeAttribute('x-cloak'));
      }, 300);

      // Đánh dấu app khởi chạy thành công và hủy timer Boot Guard
      window.__APP_BOOTED__ = true;
      if (window.__OTA_BOOT_TIMER__) {
        clearTimeout(window.__OTA_BOOT_TIMER__);
        window.__OTA_BOOT_TIMER__ = null;
      }

      // Khởi động kiểm tra OTA ngầm (non-blocking, timeout 4s)
      this.initOtaCheck();

      if (window.Capacitor?.Plugins?.StatusBar) {
        try {
          const { StatusBar, Style } = window.Capacitor.Plugins;
          await StatusBar.setStyle({ style: this.darkMode ? Style.Dark : Style.Light });
        } catch {}
      }

      if (window.Capacitor?.Plugins?.App) {
        try {
          window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
            if (state && state.isActive) {
              this.checkAndResetRecurringTasksLocally();
            }
          });
        } catch {}
      }

      // Khởi tạo lưu trữ cục bộ 0ms
      await this.initStorage();
      this.checkAndResetRecurringTasksLocally();

      // Khởi tạo thông báo cục bộ Native trên thiết bị
      this.initNativeLocalNotifications().catch(() => {});
      this.syncAllNativeLocalNotifications();

      // Bắt đầu background timer worker & Ticker phản ứng thời gian thực 1s
      this.startBackgroundTimerWorker();
      this.currentTimeTick = Date.now();
      setInterval(() => {
        this.currentTimeTick = Date.now();
      }, 1000);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkAndResetRecurringTasksLocally();
          this.syncAllNativeLocalNotifications();
        }
      });
      window.addEventListener('focus', () => {
        this.checkAndResetRecurringTasksLocally();
        this.syncAllNativeLocalNotifications();
      });

      // Lắng nghe phím tắt
      window.addEventListener('keydown', (e) => {
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
        if (!isInput) {
          const anyModalOpen = this.showModal || this.showDeleteModal || this.showClearCompletedModal || this.showAboutModal || this.showTrashModal || this.showPomodoroModal || this.showAnalyticsModal || this.showLightbox;
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

    refreshDataManual(e) {
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      this.isRefreshing = true;
      this.checkAndResetRecurringTasksLocally();
      this.syncAllNativeLocalNotifications();
      setTimeout(() => {
        this.isRefreshing = false;
        this.showToast('Đã làm mới dữ liệu cục bộ!', 'success');
      }, 400);
    },

    closeAllModals() {
      this.showModal = false;
      this.modalDragY = 0;
      this.isDraggingModal = false;
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

    onModalDragStart(e) {
      this.isDraggingModal = true;
      this.modalStartY = e.touches ? e.touches[0].clientY : e.clientY;
      this.modalDragY = 0;
    },

    onModalDragMove(e) {
      if (!this.isDraggingModal) return;
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - this.modalStartY;
      if (deltaY > 0) {
        this.modalDragY = deltaY;
      } else {
        this.modalDragY = 0;
      }
    },

    onModalDragEnd(e) {
      if (!this.isDraggingModal) return;
      this.isDraggingModal = false;
      if (this.modalDragY > 100) {
        this.showModal = false;
        this.modalDragY = 0;
      } else {
        this.modalDragY = 0;
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
          existing.count = (existing.count || 1) + 1;
          existing.message = message;
          if (existing.timer) clearTimeout(existing.timer);
          existing.timer = setTimeout(() => {
            this.removeToast(existing.id);
          }, duration);
          return;
        }
      }

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
    },

    openAboutModal() {
      this.showAboutModal = true;
    },

    async copyToClipboard(text) {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch {}
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    },

    setViewMode(mode) {
      this.viewMode = mode;
      try {
        localStorage.setItem('viewMode', mode);
      } catch {}
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
    }
  };
}
window.app = app;
document.addEventListener('alpine:init', () => {
  if (window.Alpine && window.Alpine.data) {
    window.Alpine.data('app', app);
  }
});
</script>

</body>
</html>`;
}