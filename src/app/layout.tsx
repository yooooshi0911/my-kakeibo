import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ★PWA用のメタデータを追加
export const metadata: Metadata = {
  title: "My Kakeibo",
  description: "Simple expense tracker PWA",
  manifest: "/manifest.json", // マニフェストファイルの場所
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Kakeibo",
  },
  formatDetection: {
    telephone: false,
  },
};

// ★PWA用のビューポート設定を追加
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6", // アドレスバーの色（青）
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}