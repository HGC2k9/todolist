// ============================================================
// Client Module: Over-The-Air (OTA) Updater via GitHub Pages
// (Capacitor iOS & Web, 100% Offline-first, Zero-latency fallback)
// ============================================================

export interface VersionManifest {
  version: string;
  appVersion: string;
  commit?: string;
  buildTime: string;
  files: string[];
}

export function parseVersionParts(vStr: string): { major: number; minor: number; patch: number; timestamp: number } {
  if (!vStr) return { major: 0, minor: 0, patch: 0, timestamp: 0 };
  const clean = String(vStr).trim().replace(/^v/, '');
  const [semver, tag] = clean.split('-');
  const parts = semver.split('.').map(n => parseInt(n, 10) || 0);
  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;
  const timestamp = tag ? (parseInt(tag, 10) || 0) : 0;
  return { major, minor, patch, timestamp };
}

export function compareVersions(current: string, remote: string): boolean {
  if (!remote || !remote.trim()) return false;
  if (!current || !current.trim()) return true;
  if (remote === current) return false;

  const cur = parseVersionParts(current);
  const rem = parseVersionParts(remote);

  if (rem.major !== cur.major) return rem.major > cur.major;
  if (rem.minor !== cur.minor) return rem.minor > cur.minor;
  if (rem.patch !== cur.patch) return rem.patch > cur.patch;

  if (rem.timestamp !== cur.timestamp) {
    return rem.timestamp > cur.timestamp;
  }

  return remote !== current;
}

export function verifyBundleIntegrity(files: { path: string; size?: number; content?: string }[]): boolean {
  if (!Array.isArray(files) || files.length === 0) return false;
  const indexFile = files.find(f => f.path === 'index.html');
  if (!indexFile) return false;
  if (indexFile.size !== undefined && indexFile.size < 10000) return false;
  if (indexFile.content !== undefined) {
    const content = indexFile.content;
    if (!content.includes('<html') || !content.includes('app()')) {
      return false;
    }
  }
  return true;
}

export async function fetchWithTimeout(url: string, timeoutMs: number = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache'
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export const otaUpdaterScript = /*javascript*/ `
function getOtaUpdaterModule() {
  return {
    otaStatus: 'idle', // 'idle' | 'checking' | 'downloading' | 'ready' | 'error'
    otaVersionAvailable: null,
    otaProgress: 0,
    otaBaseUrl: 'https://hgc2k9.github.io/todolist',

    parseVersionParts(vStr) {
      if (!vStr) return { major: 0, minor: 0, patch: 0, timestamp: 0 };
      const clean = String(vStr).trim().replace(/^v/, '');
      const [semver, tag] = clean.split('-');
      const parts = semver.split('.').map(n => parseInt(n, 10) || 0);
      const major = parts[0] || 0;
      const minor = parts[1] || 0;
      const patch = parts[2] || 0;
      const timestamp = tag ? (parseInt(tag, 10) || 0) : 0;
      return { major, minor, patch, timestamp };
    },

    compareVersions(current, remote) {
      if (!remote || !remote.trim()) return false;
      if (!current || !current.trim()) return true;
      if (remote === current) return false;

      const cur = this.parseVersionParts(current);
      const rem = this.parseVersionParts(remote);

      if (rem.major !== cur.major) return rem.major > cur.major;
      if (rem.minor !== cur.minor) return rem.minor > cur.minor;
      if (rem.patch !== cur.patch) return rem.patch > cur.patch;

      if (rem.timestamp !== cur.timestamp) {
        return rem.timestamp > cur.timestamp;
      }

      return remote !== current;
    },

    async fetchWithTimeout(url, timeoutMs = 4000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache'
        });
        return res;
      } finally {
        clearTimeout(timer);
      }
    },

    initOtaCheck() {
      // Chạy ngầm sau 1.5s để nhường hoàn toàn luồng khởi động đầu cho giao diện Offline (0ms)
      setTimeout(() => {
        this.checkOtaUpdate(false).catch(() => {});
      }, 1500);
    },

    async checkOtaUpdate(manual = false) {
      if (!navigator.onLine) {
        if (manual) this.showToast('Không có kết nối mạng để kiểm tra bản cập nhật', 'info');
        return;
      }

      if (this.otaStatus === 'downloading') return;
      this.otaStatus = 'checking';

      try {
        const versionUrl = this.otaBaseUrl + '/version.json?t=' + Date.now();
        const res = await this.fetchWithTimeout(versionUrl, 4000);
        if (!res.ok) {
          this.otaStatus = 'idle';
          if (manual) this.showToast('Chưa thể lấy thông tin bản cập nhật mới', 'info');
          return;
        }

        const manifest = await res.json();
        if (!manifest || !manifest.version) {
          this.otaStatus = 'idle';
          return;
        }

        const currentVersion = localStorage.getItem('ota_active_version') || this.appVersion;
        const isBlacklisted = localStorage.getItem('ota_blacklisted_' + manifest.version);

        if (isBlacklisted) {
          console.warn('[OTA] Phiên bản ' + manifest.version + ' đã bị rollback trước đó, bỏ qua.');
          this.otaStatus = 'idle';
          return;
        }

        if (this.compareVersions(currentVersion, manifest.version)) {
          console.log('[OTA] Phát hiện phiên bản mới: ' + manifest.version + ' (Hiện tại: ' + currentVersion + ')');
          this.otaVersionAvailable = manifest.version;
          
          const isCapacitorIos = Boolean(window.Capacitor?.isPluginAvailable?.('Filesystem') && window.Capacitor?.Plugins?.WebView);
          if (isCapacitorIos) {
            await this.downloadAndApplyOta(manifest);
          } else {
            // Môi trường Web thông thường: Thông báo người dùng tải lại trang
            this.otaStatus = 'ready';
            this.showToast('🚀 Có bản cập nhật mới ' + (manifest.appVersion || manifest.version) + '!', 'info', {
              label: 'Tải lại',
              onClick: () => window.location.reload()
            });
          }
        } else {
          this.otaStatus = 'idle';
          if (manual) this.showToast('Bạn đang sử dụng phiên bản mới nhất (' + currentVersion + ')', 'info');
        }
      } catch (err) {
        // Lỗi timeout hoặc rớt mạng: Bỏ qua âm thầm, không ảnh hưởng người dùng
        console.warn('[OTA] Kiểm tra cập nhật ngầm bỏ qua (timeout/offline):', err.message);
        this.otaStatus = 'idle';
      }
    },

    async downloadAndApplyOta(manifest) {
      try {
        this.otaStatus = 'downloading';
        const FS = window.Capacitor.Plugins.Filesystem;
        const WV = window.Capacitor.Plugins.WebView;

        const releaseDir = 'NoCloud/ionic_built_snapshots/' + manifest.version;
        const filesToDownload = Array.isArray(manifest.files) ? manifest.files : ['index.html'];
        const downloadedFiles = [];

        console.log('[OTA] Bắt đầu tải ' + filesToDownload.length + ' files cho bản ' + manifest.version + '...');

        for (let i = 0; i < filesToDownload.length; i++) {
          const filePath = filesToDownload[i];
          const fileUrl = this.otaBaseUrl + '/' + filePath + '?t=' + Date.now();
          const targetPath = releaseDir + '/' + filePath;

          try {
            const isBinary = /\\.(png|jpg|jpeg|ico|caf|wav|mp3|webp)$/i.test(filePath);
            const res = await this.fetchWithTimeout(fileUrl, 8000);
            if (!res.ok) throw new Error('HTTP ' + res.status);

            if (isBinary) {
              const blob = await res.blob();
              const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const dataUrl = reader.result;
                  resolve(String(dataUrl).split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              await FS.writeFile({
                path: targetPath,
                data: base64Data,
                directory: 'LIBRARY',
                recursive: true
              });
            } else {
              const textData = await res.text();
              await FS.writeFile({
                path: targetPath,
                data: textData,
                directory: 'LIBRARY',
                encoding: 'utf8',
                recursive: true
              });
              if (filePath === 'index.html') {
                downloadedFiles.push({ path: filePath, content: textData, size: textData.length });
              }
            }
          } catch (fileErr) {
            console.error('[OTA] Lỗi tải file: ' + filePath, fileErr);
            throw new Error('Tải file thất bại: ' + filePath);
          }
        }

        // Kiểm tra tính toàn vẹn gói cập nhật
        const indexCheck = downloadedFiles.find(f => f.path === 'index.html');
        if (!indexCheck || indexCheck.size < 10000 || !indexCheck.content.includes('app()')) {
          throw new Error('File index.html không hợp lệ hoặc bị lỗi tải nửa chừng');
        }

        // Lấy đường dẫn cục bộ trên iOS filesystem
        const uriResult = await FS.getUri({
          directory: 'LIBRARY',
          path: releaseDir
        });

        if (!uriResult || !uriResult.uri) {
          throw new Error('Không lấy được URI thư mục OTA');
        }

        const localPath = decodeURIComponent(uriResult.uri.replace(/^file:\\/\\//, ''));
        console.log('[OTA] Đã lưu bản cập nhật tại: ' + localPath);

        // Chuyển đổi và lưu trữ Server Base Path của WKWebView
        await WV.setServerBasePath({ path: localPath });
        await WV.persistServerBasePath();

        localStorage.setItem('ota_active_version', manifest.version);
        this.otaStatus = 'ready';

        if (typeof this.playSound === 'function') this.playSound('add');
        this.showToast('🚀 Đã cập nhật xong bản ' + (manifest.appVersion || manifest.version) + '!', 'info', {
          label: 'Tải lại',
          onClick: () => window.location.reload()
        });
      } catch (err) {
        console.error('[OTA] Tải bản cập nhật thất bại, giữ nguyên bản hiện tại:', err.message);
        this.otaStatus = 'error';
      }
    },

    async rollbackToDefaultBundle() {
      try {
        const WV = window.Capacitor?.Plugins?.WebView;
        const FS = window.Capacitor?.Plugins?.Filesystem;
        const activeVer = localStorage.getItem('ota_active_version');

        if (WV && WV.setServerAssetPath) {
          await WV.setServerAssetPath({ path: 'public' });
          await WV.persistServerBasePath();
        }

        if (activeVer) {
          localStorage.setItem('ota_blacklisted_' + activeVer, '1');
          localStorage.removeItem('ota_active_version');
          if (FS) {
            await FS.rmdir({
              path: 'NoCloud/ionic_built_snapshots/' + activeVer,
              directory: 'LIBRARY',
              recursive: true
            }).catch(() => {});
          }
        }

        this.showToast('Đã khôi phục về bản cài gốc của ứng dụng', 'info');
        setTimeout(() => window.location.reload(), 500);
      } catch (e) {
        console.error('Lỗi khi rollback:', e);
        window.location.reload();
      }
    }
  };
}
`;
