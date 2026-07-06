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
  const activeIndex = Math.max(
    items.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    ),
    0,
  );

  return (
    <nav
      aria-label="主要导航"
      className="fixed inset-x-5 bottom-[max(env(safe-area-inset-bottom),0.85rem)] z-30 mx-auto max-w-[25rem] rounded-[1.7rem] border border-white/30 bg-white/12 px-2.5 py-2 shadow-[0_18px_48px_rgba(29,29,31,0.10),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/10"
    >
      <div className="relative grid grid-cols-5 gap-1 overflow-hidden rounded-[1.25rem]">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/5 rounded-[1.05rem] bg-white/26 shadow-[0_8px_22px_rgba(0,122,255,0.08)] ring-1 ring-white/28 transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 flex h-12 flex-col items-center justify-center gap-1 rounded-[1.05rem] text-xs font-medium text-[#6e6e73] transition duration-200 hover:text-[#007aff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]",
                active && "text-[#007aff]",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform duration-200 motion-reduce:transition-none",
                  active && "-translate-y-0.5",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
