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
        {/* Load only weights actually used (400-900), no italic, with font-display=swap */}
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}
