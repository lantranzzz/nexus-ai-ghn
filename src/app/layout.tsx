import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusAI - GHN Research Tool",
  description: "Hệ thống nghiên cứu chiến lược tự động đa mô hình dành riêng cho Giao Hàng Nhanh (GHN)",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <head>
        {/* Preconnect to Google Fonts domains for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Montserrat: font chính theo Brand Guideline GHN (mục 2.2 Phiên bản Digital).
            Exo 2: font phối tương phản theo Guideline (mục 2.3), dùng cho các điểm nhấn hiển thị lớn. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Exo+2:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}
