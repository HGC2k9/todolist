// ============================================================
// Web Push Notifications (RFC 8291 / RFC 8292 / VAPID)
// Hỗ trợ Apple Push (APNs cho iOS WebClip/PWA) và Google Push (FCM cho Chrome/Android)
// ============================================================

import * as webpush from 'web-push';

export const VAPID_PUBLIC_KEY =
  'BNJrhLFKzdl_pPETV4MIvSbtSdJuaPlSJOvVNZPcWIgu2ehz-PphxiZSzjnTQeyR9q_8IYiPKRPZ2lfuq523V6U';

export const VAPID_PRIVATE_KEY =
  'zLj_p1Il9Nj7-9n0RJzs9-DNboQEmbyBcmp1Vz2OadA';

export const VAPID_SUBJECT = 'mailto:admin@todolists.workers.dev';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

/**
 * Gửi Web Push Notification qua native fetch của Cloudflare Workers
 * sử dụng webpush.generateRequestDetails để mã hóa RFC 8291
 */
export async function sendWebPush(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; status?: number; error?: string; expired?: boolean }> {
  try {
    const payloadStr = JSON.stringify(payload);
    const requestDetails = webpush.generateRequestDetails(
      subscription,
      payloadStr,
      {
        vapidDetails: {
          subject: VAPID_SUBJECT,
          publicKey: VAPID_PUBLIC_KEY,
          privateKey: VAPID_PRIVATE_KEY
        },
        TTL: 86400, // 24 giờ
        urgency: 'high'
      }
    );

    const res = await fetch(requestDetails.endpoint, {
      method: 'POST',
      headers: requestDetails.headers as any,
      body: requestDetails.body as any
    });

    if (res.status === 201 || res.status === 200 || res.status === 202) {
      return { success: true, status: res.status };
    }

    // Nếu endpoint trả về 404 hoặc 410 Gone (user đã gỡ app hoặc hủy đăng ký)
    if (res.status === 404 || res.status === 410) {
      return { success: false, status: res.status, expired: true };
    }

    const text = await res.text();
    return { success: false, status: res.status, error: text };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
