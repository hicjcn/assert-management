"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flag, Home, ListOrdered, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/accounts", label: "账户", icon: WalletCards },
  { href: "/charts", label: "图表", icon: BarChart3 },
  { href: "/goals", label: "目标", icon: Flag },
  { href: "/records", label: "记录", icon: ListOrdered },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-white/70 bg-white/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_28px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium text-[#86868b] transition",
                active && "bg-[#007aff]/10 text-[#007aff]",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
