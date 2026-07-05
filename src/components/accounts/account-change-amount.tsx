import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatAccountChangeCents, toAccountDisplayCents } from "@/lib/money";
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
  const displayChangeAmount = toAccountDisplayCents(
    change.changeAmount,
    account,
  );
  const isIncome = displayChangeAmount > 0n;
  const isExpense = displayChangeAmount < 0n;
  const Icon = isExpense ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-end gap-1 font-semibold",
        isIncome && "text-rose-600",
        isExpense && "text-emerald-600",
        !isIncome && !isExpense && "text-slate-900",
        className,
      )}
    >
      {(isIncome || isExpense) ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {formatAccountChangeCents(change, account)}
    </span>
  );
}
