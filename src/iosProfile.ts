// ============================================================
// Apple Configuration Profile Generator (.mobileconfig WebClip)
// Cho phép cài đặt ứng dụng To-Do List lên màn hình chính iPhone / iPad
// ============================================================

import { ICON_192_PNG_BASE64 } from './icon';

export function generateIOSMobileConfig(appUrl: string): string {
  const cleanUrl = appUrl.endsWith('/') ? appUrl : appUrl + '/';
  const profileUUID = crypto.randomUUID().toUpperCase();
  const webClipUUID = crypto.randomUUID().toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>ConsentText</key>
    <dict>
        <key>default</key>
        <string>Hồ sơ này sẽ cài đặt biểu tượng ứng dụng To-Do List lên Màn hình chính của bạn với chế độ Toàn màn hình (Standalone App).</string>
    </dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>
${ICON_192_PNG_BASE64}
            </data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>To-Do List</string>
            <key>PayloadDescription</key>
            <string>Cài đặt ứng dụng web To-Do List</string>
            <key>PayloadDisplayName</key>
            <string>To-Do List</string>
            <key>PayloadIdentifier</key>
            <string>com.todolist.app.webclip.${webClipUUID}</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${webClipUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${cleanUrl}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Cài đặt biểu tượng ứng dụng To-Do List lên Màn hình chính iPhone/iPad</string>
    <key>PayloadDisplayName</key>
    <string>To-Do List</string>
    <key>PayloadIdentifier</key>
    <string>com.todolist.app.profile.${profileUUID}</string>
    <key>PayloadOrganization</key>
    <string>To-Do List</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${profileUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}

