import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-white/70 bg-white/85 px-3 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03]",
        "outline-none transition placeholder:text-[#86868b] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15",
        className,
      )}
      {...props}
    />
  );
}
