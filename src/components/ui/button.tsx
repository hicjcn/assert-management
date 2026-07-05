import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]",
        variant === "primary" &&
          "bg-[#007aff] text-white shadow-sm shadow-[#007aff]/25 hover:bg-[#006ee6]",
        variant === "secondary" &&
          "border border-white/70 bg-white/85 text-[#1d1d1f] shadow-sm shadow-black/[0.04] hover:bg-white",
        variant === "ghost" &&
          "bg-transparent text-[#3a3a3c] hover:bg-white/70",
        className,
      )}
      {...props}
    />
  );
}
