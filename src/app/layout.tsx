import type { Metadata } from "next";
import { Suspense } from "react";

import { AppChrome } from "@/components/layout/app-chrome";
import Loading from "@/app/loading";

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
      <body className="min-h-full bg-[#f5f5f7] text-[#1d1d1f] antialiased">
        <AppChrome>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </AppChrome>
      </body>
    </html>
  );
}
