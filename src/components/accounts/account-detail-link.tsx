"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pending) {
      return;
    }

    const resetPending = window.setTimeout(() => setPending(false), 5000);
    return () => window.clearTimeout(resetPending);
  }, [pending]);

  return (
    <Link
      aria-busy={pending || undefined}
      className={cn(
        "relative overflow-hidden",
        "active:scale-[0.985] active:bg-white",
        pending && "scale-[0.985] bg-white ring-2 ring-[#007aff]/10",
        className,
      )}
      href={href}
      onClick={() => {
        sessionStorage.setItem(
          "asset-management:account-return",
          JSON.stringify({ from: pathname, to: href, at: Date.now() }),
        );
        setPending(true);
      }}
      onPointerDown={() => setPending(true)}
      prefetch
    >
      {children}
      {pending ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-[#007aff]"
        />
      ) : null}
    </Link>
  );
}
