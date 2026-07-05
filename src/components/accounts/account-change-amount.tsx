import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatAccountChangeCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { AccountCategory, AccountType, ChangeType } from "@/types/domain";

type AccountChangeAmountProps = {
  change: {
    type: ChangeType;
    changeAmount: bigint | number;
    afterAmount: bigint | number;
  };
  account: {
    category?: AccountCategory;
    type?: AccountType;
  };
  className?: string;
};

export function AccountChangeAmount({
  change,
  account,
  className,
}: AccountChangeAmountProps) {
  const changeAmount = BigInt(change.changeAmount);
  const isIncrease =
    change.type === "increase" ||
    (change.type !== "decrease" && changeAmount > 0n);
  const isDecrease =
    change.type === "decrease" ||
    (change.type !== "increase" && changeAmount < 0n);
  const Icon = isDecrease ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-end gap-1 font-semibold",
        isIncrease && "text-rose-600",
        isDecrease && "text-emerald-600",
        !isIncrease && !isDecrease && "text-slate-900",
        className,
      )}
    >
      {(isIncrease || isDecrease) ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {formatAccountChangeCents(change, account)}
    </span>
  );
}
