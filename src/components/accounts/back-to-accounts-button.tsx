"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const RETURN_MARKER = "asset-management:account-return";
const RETURN_MARKER_MAX_AGE = 10 * 60 * 1000;

type ReturnMarker = {
  at: number;
  from: string;
  to: string;
};

function canRestoreAccounts(pathname: string) {
  try {
    const marker = JSON.parse(
      sessionStorage.getItem(RETURN_MARKER) ?? "null",
    ) as ReturnMarker | null;

    return Boolean(
      marker &&
        marker.from === "/accounts" &&
        marker.to === pathname &&
        Date.now() - marker.at < RETURN_MARKER_MAX_AGE,
    );
  } catch {
    return false;
  }
}

export function BackToAccountsButton() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/accounts");
  }, [router]);

  function returnToAccounts() {
    if (canRestoreAccounts(pathname)) {
      sessionStorage.removeItem(RETURN_MARKER);
      router.back();
      return;
    }

    router.push("/accounts");
  }

  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-[#3a3a3c] transition active:scale-95 active:bg-black/[0.04]"
      onClick={returnToAccounts}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" />
      返回账户
    </button>
  );
}
