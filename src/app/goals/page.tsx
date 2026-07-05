import {
  CalendarClock,
  PiggyBank,
  Save,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import {
  createGoalAction,
  updateGoalAction,
  updateGoalBudgetAction,
} from "@/app/actions";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { requireSession } from "@/server/auth";
import { getGoalsPageData } from "@/server/goals";

type MoneyInputProps = {
  label: string;
  name: string;
  defaultValue?: string;
};

function centsToInput(value: bigint) {
  const yuan = value / 100n;
  const cents = value % 100n;

  if (cents === 0n) {
    return yuan.toString();
  }

  return `${yuan}.${cents.toString().padStart(2, "0")}`;
}

function MoneyInput({ label, name, defaultValue = "0" }: MoneyInputProps) {
  return (
    <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
      <span>{label}</span>
      <Input
        name={name}
        inputMode="decimal"
        min="0"
        step="0.01"
        type="number"
        defaultValue={defaultValue}
      />
    </label>
  );
}

function formatReachDate(date: Date | null) {
  if (!date) {
    return "暂不可达成";
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });
}

export default async function GoalsPage() {
  const session = await requireSession();
  const { budget, goals } = await getGoalsPageData(session.userId);

  return (
    <MobileShell title="目标">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>月度收支</CardTitle>
              <p className="mt-1 text-xs text-[#6e6e73]">
                所有目标共用这一套固定配置
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#34c759]/10 text-[#248a3d]">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
          </CardHeader>
          <CardContent>
            <form action={updateGoalBudgetAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MoneyInput
                  label="月收入"
                  name="monthlyIncome"
                  defaultValue={centsToInput(budget.monthlyIncome)}
                />
                <MoneyInput
                  label="其他月收入"
                  name="monthlyOtherIncome"
                  defaultValue={centsToInput(budget.monthlyOtherIncome)}
                />
                <MoneyInput
                  label="房租"
                  name="monthlyRent"
                  defaultValue={centsToInput(budget.monthlyRent)}
                />
                <MoneyInput
                  label="餐饮"
                  name="monthlyFood"
                  defaultValue={centsToInput(budget.monthlyFood)}
                />
                <MoneyInput
                  label="日常支出"
                  name="monthlyLiving"
                  defaultValue={centsToInput(budget.monthlyLiving)}
                />
                <MoneyInput
                  label="其他支出"
                  name="monthlyOtherExpense"
                  defaultValue={centsToInput(budget.monthlyOtherExpense)}
                />
              </div>
              <Button className="w-full" type="submit" variant="secondary">
                <Save className="h-4 w-4" />
                保存月度配置
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-[#007aff]/10 bg-white/90 shadow-[0_14px_34px_rgba(0,122,255,0.10)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>新增目标</CardTitle>
              <p className="mt-1 text-xs text-[#6e6e73]">
                设置目标金额和当前进度
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#007aff] text-white shadow-sm shadow-[#007aff]/30">
              <Target className="h-5 w-5" />
            </span>
          </CardHeader>
          <CardContent>
            <form action={createGoalAction} className="space-y-3">
              <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
                <span>目标名称</span>
                <Input name="name" placeholder="例如：一年存款目标" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <MoneyInput label="目标金额" name="targetAmount" />
                <MoneyInput label="当前已存" name="currentAmount" />
                <MoneyInput label="一次性收入" name="oneTimeIncome" />
                <MoneyInput label="一次性支出" name="oneTimeExpense" />
              </div>
              <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
                <span>备注</span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-white/70 bg-white/85 px-3 py-2 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition placeholder:text-[#86868b] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
                  name="note"
                  placeholder="可选"
                />
              </label>
              <Button className="w-full" type="submit">
                <PiggyBank className="h-4 w-4" />
                保存目标
              </Button>
            </form>
          </CardContent>
        </Card>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-sm text-[#3a3a3c]">
              还没有目标。保存第一个目标后，这里会显示进度和预计达成时间。
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const projection = goal.projection;

            return (
              <Card key={goal.id}>
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base font-semibold text-[#1d1d1f]">
                        {goal.name}
                      </CardTitle>
                      <p className="mt-1 text-xs text-[#6e6e73]">
                        目标 {formatCents(goal.targetAmount)}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#34c759]/10 text-[#248a3d]">
                      <CalendarClock className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#34c759]"
                      style={{ width: `${projection.progressPercent}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[#6e6e73]">当前进度</p>
                      <p className="mt-1 font-semibold text-[#1d1d1f]">
                        {projection.progressPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6e6e73]">每月可存</p>
                      <p className="mt-1 font-semibold text-[#1d1d1f]">
                        {formatCents(projection.monthlyNetAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6e6e73]">剩余金额</p>
                      <p className="mt-1 font-semibold text-[#1d1d1f]">
                        {formatCents(projection.remainingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6e6e73]">预计达成</p>
                      <p className="mt-1 font-semibold text-[#1d1d1f]">
                        {formatReachDate(projection.estimatedReachDate)}
                      </p>
                    </div>
                  </div>

                  <form action={updateGoalAction} className="space-y-3">
                    <input name="goalId" type="hidden" value={goal.id} />
                    <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
                      <span>目标名称</span>
                      <Input name="name" defaultValue={goal.name} required />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <MoneyInput
                        label="目标金额"
                        name="targetAmount"
                        defaultValue={centsToInput(goal.targetAmount)}
                      />
                      <MoneyInput
                        label="当前已存"
                        name="currentAmount"
                        defaultValue={centsToInput(goal.currentAmount)}
                      />
                      <MoneyInput
                        label="一次性收入"
                        name="oneTimeIncome"
                        defaultValue={centsToInput(goal.oneTimeIncome)}
                      />
                      <MoneyInput
                        label="一次性支出"
                        name="oneTimeExpense"
                        defaultValue={centsToInput(goal.oneTimeExpense)}
                      />
                    </div>
                    <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
                      <span>备注</span>
                      <textarea
                        className="min-h-20 w-full rounded-lg border border-white/70 bg-white/85 px-3 py-2 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition placeholder:text-[#86868b] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
                        name="note"
                        defaultValue={goal.note ?? ""}
                      />
                    </label>
                    <Button className="w-full" type="submit" variant="secondary">
                      <Save className="h-4 w-4" />
                      保存修改
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </MobileShell>
  );
}
