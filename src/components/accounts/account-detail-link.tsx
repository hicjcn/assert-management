"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type AccountDetailLinkProps = {
  children: React.ReactNode;
  className?: string;
  href: string;
};

export function AccountDetailLink({
  children,
  className,
  href,
}: AccountDetailLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      className={cn(
        "relative overflow-hidden",
        "active:scale-[0.985] active:bg-white",
        className,
      )}
      href={href}
      onClick={() => {
        sessionStorage.setItem(
          "asset-management:account-return",
          JSON.stringify({ from: pathname, to: href, at: Date.now() }),
        );
      }}
      prefetch
    >
      {children}
    </Link>
  );
}
