import { Suspense } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";

function BottomNavFallback() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-5 bottom-[max(env(safe-area-inset-bottom),0.85rem)] z-30 mx-auto h-16 max-w-[25rem] animate-pulse rounded-[1.7rem] border border-white/30 bg-white/18 shadow-[0_18px_48px_rgba(29,29,31,0.08)] backdrop-blur-2xl"
    />
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f5f5f7]">
      {children}
      <Suspense fallback={<BottomNavFallback />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
