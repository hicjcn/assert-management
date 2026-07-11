"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f5f5f7]">
      {children}
      <BottomNav />
    </div>
  );
}
