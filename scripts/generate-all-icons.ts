import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

async function generateAllIcons() {
  console.log('🎨 Bắt đầu đồng bộ bộ Icon chuẩn giữa Web và App iOS...');

  // 1. Web Icon SVG (có bo góc mềm rx=115 cho PWA / Chrome / Safari WebClip)
  const webSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)" />
  <path d="M140 262 L224 346 L372 178"
        fill="none"
        stroke="#ffffff"
        stroke-width="48"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#shadow)" />
</svg>`;

  // 2. iOS Native AppIcon SVG (Chuẩn Apple: nền vuông 1024x1024, không bo góc mềm vì iOS tự động áp mask squircle)
  const iosAppIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)" />
  <path d="M280 524 L448 692 L744 356"
        fill="none"
        stroke="#ffffff"
        stroke-width="96"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#shadow)" />
</svg>`;

  // 3. Splash Screen SVG (2732x2732 nền Dark Slate #0f172a, ở giữa là Logo tròn 720px)
  const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <filter id="splashShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="30" stdDeviation="40" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>
  <rect width="2732" height="2732" fill="#0f172a" />
  <g transform="translate(1006, 1006)">
    <rect width="720" height="720" rx="160" fill="url(#iconBg)" filter="url(#splashShadow)" />
    <path d="M197 368 L315 487 L523 250"
          fill="none"
          stroke="#ffffff"
          stroke-width="68"
          stroke-linecap="round"
          stroke-linejoin="round" />
  </g>
</svg>`;

  // Sinh Web Icons
  const png512 = await sharp(Buffer.from(webSvg)).resize(512, 512).png().toBuffer();
  const png192 = await sharp(Buffer.from(webSvg)).resize(192, 192).png().toBuffer();

  fs.writeFileSync('icon-512.png', png512);
  fs.writeFileSync('icon-192.png', png192);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'icon-512.png'), png512);
    fs.writeFileSync(path.join(distDir, 'icon-192.png'), png192);
  }
  console.log('   ✓ Đã sinh icon-512.png & icon-192.png cho Web & PWA');

  // Sinh iOS AppIcon (1024x1024 opaque, no alpha)
  const iosIconDir = path.resolve(process.cwd(), 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if (fs.existsSync(iosIconDir)) {
    await sharp(Buffer.from(iosAppIconSvg))
      .resize(1024, 1024)
      .removeAlpha()
      .png()
      .toFile(path.join(iosIconDir, 'AppIcon-512@2x.png'));
    console.log('   ✓ Đã đồng bộ AppIcon-512@2x.png (1024x1024) vào iOS Assets!');
  }

  // Sinh iOS Splash Screens
  const splashDir = path.resolve(process.cwd(), 'ios/App/App/Assets.xcassets/Splash.imageset');
  if (fs.existsSync(splashDir)) {
    const splashBuf = await sharp(Buffer.from(splashSvg)).resize(2732, 2732).png().toBuffer();
    fs.writeFileSync(path.join(splashDir, 'splash-2732x2732.png'), splashBuf);
    fs.writeFileSync(path.join(splashDir, 'splash-2732x2732-1.png'), splashBuf);
    fs.writeFileSync(path.join(splashDir, 'splash-2732x2732-2.png'), splashBuf);
    console.log('   ✓ Đã đồng bộ Splash Screens vào iOS Assets!');
  }

  console.log('🎉 Hoàn tất đồng bộ toàn bộ Icon & Logo App!');
}

generateAllIcons().catch((err) => {
  console.error('❌ Lỗi sinh icon:', err);
  process.exit(1);
});
