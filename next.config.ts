import type { NextConfig } from "next";

// Suy ra origin của Supabase từ biến môi trường để đưa vào connect-src của CSP
// (client gọi trực tiếp Supabase REST/Auth/Realtime từ trình duyệt).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseOrigin = "";
try {
  if (supabaseUrl) supabaseOrigin = new URL(supabaseUrl).origin;
} catch {
  supabaseOrigin = "";
}

// connect-src: self + Supabase (REST/Auth + Realtime websocket). Các lời gọi tới
// nhà cung cấp AI được thực hiện phía server (route handler) nên không cần liệt kê ở đây.
const connectSrc = [
  "'self'",
  supabaseOrigin,
  "https://*.supabase.co",
  "wss://*.supabase.co",
]
  .filter(Boolean)
  .join(" ");

// Content-Security-Policy: mặc định 'self', chỉ mở rộng đúng những nguồn app thực sự dùng.
// - PDF.js worker được self-host tại /pdf.worker.min.mjs (same-origin) nên không cần CDN ngoài.
// - img unsplash: ảnh nền màn hình đăng nhập.
// - 'unsafe-inline'/'unsafe-eval' cần cho Next.js hydration, styled-jsx và các thư viện
//   parse file (pdfjs/xlsx). Đây là đánh đổi đã biết; siết chặt hơn cần chuyển sang CSP nonce qua middleware.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Không lộ header X-Powered-By tiết lộ framework/phiên bản.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
