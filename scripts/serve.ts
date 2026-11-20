import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const PORT = 5173;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SRC_DIR = path.resolve(process.cwd(), 'src');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.caf': 'audio/x-caf',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url?.split('?')[0] || '/';
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

let isBuilding = false;
let buildPending = false;

function triggerRebuild(filename?: string) {
  if (isBuilding) {
    buildPending = true;
    return;
  }
  isBuilding = true;
  console.log(`\n🔄 Phát hiện thay đổi file [${filename || 'src/'}], đang tự động build lại...`);
  exec('npx tsx scripts/build.ts', (err) => {
    isBuilding = false;
    if (err) {
      console.error('❌ Lỗi khi re-build:', err.message);
    } else {
      console.log('⚡ Build xong! Nhấn F5 trên trình duyệt để xem thay đổi.');
    }
    if (buildPending) {
      buildPending = false;
      triggerRebuild();
    }
  });
}

try {
  let debounceTimer: NodeJS.Timeout | null = null;
  fs.watch(SRC_DIR, { recursive: true }, (event, filename) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      triggerRebuild(filename || undefined);
    }, 250);
  });
  console.log('👀 Đang theo dõi (Watch mode) các thay đổi trong src/...');
} catch (e: any) {
  console.warn('Watch mode không khả dụng:', e.message);
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Standalone Local ToDoList Server running at http://localhost:${PORT}`);
});
