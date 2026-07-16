/**
 * Rate limiter đơn giản theo IP (in-memory, sliding window).
 *
 * LƯU Ý QUAN TRỌNG: Bộ nhớ này nằm trong tiến trình (per-instance). Trên môi trường
 * serverless/nhiều instance (Vercel, v.v.) nó chỉ giới hạn theo từng instance nên
 * chỉ là lớp phòng thủ theo chiều sâu. Với giới hạn cứng thực sự, hãy chuyển sang
 * store dùng chung như Upstash Redis / Vercel KV.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Dọn rác định kỳ để tránh Map phình vô hạn.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = 0;

const cleanup = (now: number, windowMs: number) => {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
};

/** Lấy IP client từ các header proxy phổ biến. */
export const getClientIp = (req: Request): string => {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Kiểm tra và ghi nhận một request.
 * @param key    Khoá định danh (thường là `${route}:${ip}`).
 * @param limit  Số request tối đa trong cửa sổ.
 * @param windowMs Độ dài cửa sổ (ms).
 */
export const checkRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now();
  cleanup(now, windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  // Giữ lại các mốc thời gian còn trong cửa sổ.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  return { allowed: true, retryAfterSeconds: 0 };
};
