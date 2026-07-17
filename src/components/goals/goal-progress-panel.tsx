import { formatMonthYear } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type CentsValue = bigint | number | string;

type GoalProgressPanelProps = {
  className?: string;
  currentAmount: CentsValue;
  estimatedReachDate: Date | string | null;
  monthlyNetAmount: CentsValue;
  progressPercent: number;
  remainingAmount: CentsValue;
};

function formatAmount(value: CentsValue) {
  return formatCents(typeof value === "string" ? BigInt(value) : value);
}

function formatReachDate(value: Date | string | null) {
  return value ? formatMonthYear(value) : "暂不可达成";
}

export function GoalProgressPanel({
  className,
  currentAmount,
  estimatedReachDate,
  monthlyNetAmount,
  progressPercent,
  remainingAmount,
}: GoalProgressPanelProps) {
  return (
    <div className={cn("rounded-xl bg-black/[0.025] px-3 py-3", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-[#6e6e73]">当前已存</p>
          <p className="mt-1 text-[clamp(0.85rem,4vw,1rem)] font-semibold leading-tight tabular-nums text-[#248a3d]">
            {formatAmount(currentAmount)}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-xs text-[#6e6e73]">剩余金额</p>
          <p className="mt-1 text-[clamp(0.85rem,4vw,1rem)] font-semibold leading-tight tabular-nums text-[#1d1d1f]">
            {formatAmount(remainingAmount)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
          <div
            className="h-full rounded-full bg-[#34c759]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-[#248a3d]">
          {progressPercent.toFixed(1)}%
        </span>
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-4 text-xs text-[#6e6e73]">
        <p className="min-w-0">
          每月可存{" "}
          <span className="font-medium tabular-nums text-[#3a3a3c]">
            {formatAmount(monthlyNetAmount)}
          </span>
        </p>
        <p className="min-w-0 text-right">
          计划达成{" "}
          <span className="font-medium tabular-nums text-[#3a3a3c]">
            {formatReachDate(estimatedReachDate)}
          </span>
        </p>
      </div>
    </div>
  );
}
