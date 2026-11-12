const fs = require('fs');
const b64 = fs.readFileSync('icon-base64.txt', 'utf8').trim();

const code = `// ============================================================
// App Icon — Sắc nét 100% sinh bằng Sharp (Chuẩn Retina 192x192 & 512x512)
// Bo góc theo chuẩn Apple App Icon, nền gradient xanh dương, checkmark trắng
// ============================================================

export const ICON_192_PNG_BASE64 =
  '${b64}';

export function getIconPNGBytes(): Uint8Array {
  const binary = atob(ICON_192_PNG_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
`;

fs.writeFileSync('src/icon.ts', code);
console.log('src/icon.ts updated successfully with size:', fs.statSync('src/icon.ts').size);

