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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}
