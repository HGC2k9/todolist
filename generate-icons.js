const sharp = require('sharp');
const fs = require('fs');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
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
  <!-- Nền bo góc mềm theo tỷ lệ chuẩn Apple App Icon -->
  <rect width="512" height="512" rx="115" fill="url(#bg)" />
  <!-- Dấu Checkmark sắc nét -->
  <path d="M140 262 L224 346 L372 178"
        fill="none"
        stroke="#ffffff"
        stroke-width="48"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#shadow)" />
</svg>`;

async function run() {
  const png512 = await sharp(Buffer.from(svg)).resize(512, 512).png().toBuffer();
  const png192 = await sharp(Buffer.from(svg)).resize(192, 192).png().toBuffer();
  fs.writeFileSync('icon-512.png', png512);
  fs.writeFileSync('icon-192.png', png192);
  
  const b64 = png192.toString('base64');
  console.log('PNG 192 bytes:', png192.length, 'Base64 length:', b64.length);
  fs.writeFileSync('icon-base64.txt', b64);
}

run().catch(console.error);

