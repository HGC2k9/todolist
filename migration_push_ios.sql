-- ============================================================
-- Migration: Thêm hỗ trợ Apple Push Notification Service (APNs)
-- cho ứng dụng iOS đóng gói bằng Capacitor (@capacitor/push-notifications)
-- ============================================================

ALTER TABLE push_subscriptions ADD COLUMN platform TEXT NOT NULL DEFAULT 'web';
ALTER TABLE push_subscriptions ADD COLUMN device_token TEXT;
CREATE INDEX IF NOT EXISTS idx_push_platform ON push_subscriptions(platform);

