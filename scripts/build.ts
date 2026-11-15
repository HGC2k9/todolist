import fs from 'node:fs';
import path from 'node:path';
import { renderHTML } from '../src/frontend';
import { renderServiceWorker } from '../src/sw';

const VENDOR_LIBS = [
  { name: 'tailwind.js', url: 'https://cdn.tailwindcss.com' },
  { name: 'alpine.min.js', url: 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js' },
  { name: 'lucide.min.js', url: 'https://unpkg.com/lucide@latest/dist/umd/lucide.js' },
  { name: 'confetti.browser.min.js', url: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js' },
  { name: 'sortable.min.js', url: 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js' },
];

async function build() {
  console.log('🚀 Bắt đầu quá trình Build Standalone Frontend & iOS Assets...');

  const distDir = path.resolve(process.cwd(), 'dist');
  const vendorDir = path.resolve(distDir, 'vendor');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  if (!fs.existsSync(vendorDir)) {
    fs.mkdirSync(vendorDir, { recursive: true });
  }

  // 1. Tải và lưu các thư viện vendor để app chạy Offline 100% trong WKWebView
  console.log('📦 Tải & đồng bộ các thư viện Vendor Offline...');
  for (const lib of VENDOR_LIBS) {
    const dest = path.join(vendorDir, lib.name);
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      try {
        console.log(`   -> Đang tải ${lib.name}...`);
        const res = await fetch(lib.url);
        if (res.ok) {
          const text = await res.text();
          fs.writeFileSync(dest, text, 'utf8');
          console.log(`   ✓ Đã lưu ${lib.name} (${Math.round(text.length / 1024)} KB)`);
        } else {
          console.warn(`   ⚠️ Không tải được ${lib.name} (HTTP ${res.status}), sẽ dùng CDN`);
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Lỗi tải ${lib.name}:`, err.message);
      }
    } else {
      console.log(`   ✓ ${lib.name} đã sẵn sàng trong cache build`);
    }
  }

  // 2. Sinh dist/index.html từ renderHTML()
  console.log('📄 Đang sinh dist/index.html...');
  let html = renderHTML();

  // Thay thế các đường dẫn CDN thành file vendor nội bộ (với fallback CDN nếu không có)
  html = html.replace(
    'src="https://cdn.tailwindcss.com"',
    'src="./vendor/tailwind.js" onerror="this.onerror=null;this.src=\'https://cdn.tailwindcss.com\'"'
  );
  html = html.replace(
    'src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"',
    'src="./vendor/alpine.min.js" onerror="this.onerror=null;this.src=\'https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js\'"'
  );
  html = html.replace(
    'src="https://unpkg.com/lucide@latest"',
    'src="./vendor/lucide.min.js" onerror="this.onerror=null;this.src=\'https://unpkg.com/lucide@latest\'"'
  );
  html = html.replace(
    'src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"',
    'src="./vendor/confetti.browser.min.js" onerror="this.onerror=null;this.src=\'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js\'"'
  );
  html = html.replace(
    'src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"',
    'src="./vendor/sortable.min.js" onerror="this.onerror=null;this.src=\'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js\'"'
  );

  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
  console.log(`   ✓ Đã tạo dist/index.html (${Math.round(html.length / 1024)} KB)`);

  // 3. Sinh Service Worker dist/sw.js
  console.log('⚙️ Đang sinh dist/sw.js...');
  const swCode = renderServiceWorker();
  fs.writeFileSync(path.join(distDir, 'sw.js'), swCode, 'utf8');
  console.log(`   ✓ Đã tạo dist/sw.js (${Math.round(swCode.length / 1024)} KB)`);

  // 4. Sinh dist/manifest.json
  console.log('📱 Đang sinh dist/manifest.json...');
  const manifest = {
    name: 'To-Do List',
    short_name: 'To-Do List',
    description: 'Ứng dụng quản lý công việc hiện đại trên Cloudflare Workers',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Thêm việc mới',
        short_name: 'Thêm việc',
        description: 'Tạo công việc mới ngay',
        url: '/?action=new',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Việc hôm nay',
        short_name: 'Hôm nay',
        description: 'Xem các việc cần làm hôm nay',
        url: '/?filter=today',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ]
  };
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('   ✓ Đã tạo dist/manifest.json');

  // 5. Sao chép Icons
  console.log('🖼️ Đang sao chép Icons...');
  if (fs.existsSync('icon-192.png')) {
    fs.copyFileSync('icon-192.png', path.join(distDir, 'icon-192.png'));
    console.log('   ✓ Đã sao chép icon-192.png');
  }
  if (fs.existsSync('icon-512.png')) {
    fs.copyFileSync('icon-512.png', path.join(distDir, 'icon-512.png'));
    console.log('   ✓ Đã sao chép icon-512.png');
  }

  console.log('✅ Hoàn tất đóng gói dist/ thành công!');
}

build().catch((err) => {
  console.error('❌ Lỗi quá trình build:', err);
  process.exit(1);
});
