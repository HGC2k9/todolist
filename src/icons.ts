import fs from 'node:fs';
import path from 'node:path';

const iconCache = new Map<string, string>();
const ICONS_DIR = path.resolve(process.cwd(), 'public', 'icons');

/**
 * Loads a cleaned Line/Outline SVG file from `public/icons/<name>.svg`,
 * injects CSS classes + extra attributes (preserving `viewBox` and `currentColor`).
 */
export function svgIcon(name: string, className = 'w-4 h-4', extraAttrs = ''): string {
  let raw = iconCache.get(name);
  if (!raw) {
    const filePath = path.join(ICONS_DIR, `${name}.svg`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`[MISSING SVG ICON] public/icons/${name}.svg`);
    }
    raw = fs.readFileSync(filePath, 'utf8').trim();
    iconCache.set(name, raw);
  }

  const attrs = [`class="${className}"`, 'aria-hidden="true"', extraAttrs.trim()]
    .filter(Boolean)
    .join(' ');

  return raw.replace(/<svg\b([^>]*)>/i, `<svg ${attrs}$1>`);
}
