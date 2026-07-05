import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "资产管家",
  description: "手机优先的自部署个人资产管理工具",
  applicationName: "资产管家",
  appleWebApp: {
    capable: true,
    title: "资产管家",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
