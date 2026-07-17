"use client";

import {
  CalendarClock,
  ChevronDown,
  Edit3,
  PiggyBank,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  createGoalAction,
  deleteGoalAction,
  updateGoalAction,
  updateGoalBudgetAction,
} from "@/app/actions";
import { GoalProgressPanel } from "@/components/goals/goal-progress-panel";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMonthYear } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  type AccountCategory,
  accountCategoryLabels,
} from "@/types/domain";

type BudgetView = {
  monthlyIncome: string;
  monthlyRent: string;
  monthlyFood: string;
  monthlyLiving: string;
  monthlyOtherExpense: string;
  monthlyOtherIncome: string;
};

type AccountOption = {
  id: string;
  name: string;
  category: AccountCategory;
  currentAmount: string;
};

type GoalView = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  oneTimeIncome: string;
  oneTimeExpense: string;
  accountIds: string[];
  linkedAccounts: {
    category: AccountCategory;
    name: string;
  }[];
  progressSource: "net_worth" | "accounts";
  note: string | null;
  projection: {
    monthlyNetAmount: string;
    remainingAmount: string;
    progressPercent: number;
    estimatedReachDate: string | null;
  };
  trendProjection: {
    monthlyTrendAmount: string;
    monthlyBreakdown: {
      month: string;
      amount: string;
      changeCount: number;
    }[];
    observedMonths: number;
    changeCount: number;
    estimatedReachDate: string | null;
  };
};

type GoalsWorkspaceProps = {
  accounts: AccountOption[];
  budget: BudgetView;
  goals: GoalView[];
};

type MoneyInputProps = {
  label: string;
  name: string;
  defaultValue?: string;
};

function centsToInput(value: string) {
  const centsValue = BigInt(value);
  const yuan = centsValue / 100n;
  const cents = centsValue % 100n;

  if (cents === 0n) {
    return yuan.toString();
  }

  return `${yuan}.${cents.toString().padStart(2, "0")}`;
}

function formatCentsString(value: string) {
  return formatCents(BigInt(value));
}

function formatTrendReachDate(trend: GoalView["trendProjection"]) {
  if (trend.estimatedReachDate) {
    return formatMonthYear(trend.estimatedReachDate);
  }

  return trend.changeCount === 0 ? "数据不足" : "暂无增长趋势";
}

function formatTrendMonth(value: string) {
  const [year, month] = value.split("-");

  return `${year}年${Number(month)}月`;
}

function formatTrendFormula(trend: GoalView["trendProjection"]) {
  const total = trend.monthlyBreakdown.reduce(
    (sum, month) => sum + BigInt(month.amount),
    0n,
  );

  return `合计 ${formatCents(total, { signed: true })} ÷ ${trend.observedMonths} 个月 = ${formatCents(BigInt(trend.monthlyTrendAmount), { signed: true })}`;
}

function TrendProjectionPanel({
  trend,
}: {
  trend: GoalView["trendProjection"];
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = trend.monthlyBreakdown.length > 0;

  return (
    <div className="rounded-xl bg-[#007aff]/[0.055] px-3 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#0066cc]">趋势达成</p>
          {canExpand ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-[#6e6e73]">
              <span>近 {trend.observedMonths} 个月月均</span>
              <button
                aria-expanded={expanded}
                className="inline-flex items-center gap-0.5 font-semibold text-[#0066cc]"
                onClick={() => setExpanded((current) => !current)}
                type="button"
              >
                {formatCents(BigInt(trend.monthlyTrendAmount), {
                  signed: true,
                })}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#6e6e73]">暂无可计算月份</p>
          )}
        </div>
        <p className="shrink-0 text-sm font-semibold text-[#1d1d1f]">
          {formatTrendReachDate(trend)}
        </p>
      </div>
      {expanded ? (
        <div className="mt-3 space-y-2 border-t border-[#007aff]/10 pt-3">
          {trend.monthlyBreakdown.map((month) => {
            const amount = BigInt(month.amount);

            return (
              <div
                className="flex items-center justify-between gap-3 text-xs"
                key={month.month}
              >
                <span className="text-[#6e6e73]">
                  {formatTrendMonth(month.month)} · {month.changeCount} 笔
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    amount > 0n && "text-[#248a3d]",
                    amount < 0n && "text-rose-600",
                    amount === 0n && "text-[#6e6e73]",
                  )}
                >
                  {formatCents(amount, { signed: true })}
                </span>
              </div>
            );
          })}
          <p className="border-t border-[#007aff]/10 pt-2 text-xs text-[#3a3a3c]">
            {formatTrendFormula(trend)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MoneyInput({ label, name, defaultValue = "0" }: MoneyInputProps) {
  return (
    <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
      <span>{label}</span>
      <Input
        defaultValue={defaultValue}
        inputMode="decimal"
        min="0"
        name={name}
        step="0.01"
        type="number"
      />
    </label>
  );
}

function TextArea({
  defaultValue,
  name,
  placeholder,
}: {
  defaultValue?: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <textarea
      className="min-h-20 w-full rounded-lg border border-white/70 bg-white/85 px-3 py-2 text-base text-[#1d1d1f] shadow-sm shadow-black/[0.03] outline-none transition placeholder:text-[#86868b] focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/15"
      defaultValue={defaultValue}
      name={name}
      placeholder={placeholder}
    />
  );
}

function GoalForm({
  action,
  accounts,
  goal,
}: {
  action: (formData: FormData) => void | Promise<void>;
  accounts: AccountOption[];
  goal?: GoalView;
}) {
  return (
    <form action={action} className="space-y-4">
      {goal ? <input name="goalId" type="hidden" value={goal.id} /> : null}
      <label className="space-y-2 text-xs font-medium text-[#6e6e73]">
        <span>目标名称</span>
        <Input
          defaultValue={goal?.name}
          name="name"
          placeholder="例如：一年存款目标"
          required
        />
      </label>
      <div className="mt-5 space-y-3">
        <MoneyInput
          defaultValue={goal ? centsToInput(goal.targetAmount) : "0"}
          label="目标金额"
          name="targetAmount"
        />
        <div className="grid grid-cols-2 gap-3">
          <MoneyInput
            defaultValue={goal ? centsToInput(goal.oneTimeIncome) : "0"}
            label="一次性收入"
            name="oneTimeIncome"
          />
          <MoneyInput
            defaultValue={goal ? centsToInput(goal.oneTimeExpense) : "0"}
            label="一次性支出"
            name="oneTimeExpense"
          />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[#6e6e73]">
          关联资产账户（可选）
        </legend>
        <p className="text-xs leading-5 text-[#86868b]">
          选择后只统计这些账户；不选择则自动使用总净资产。
        </p>
        {accounts.length === 0 ? (
          <p className="rounded-lg bg-black/[0.035] px-3 py-2 text-sm text-[#6e6e73]">
            暂无可关联的资产账户，将使用总净资产。
          </p>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <label
                className="flex min-h-12 items-center gap-3 rounded-xl border border-black/[0.06] bg-white/65 px-3 py-2.5"
                key={account.id}
              >
                <input
                  className="h-5 w-5 accent-[#007aff]"
                  defaultChecked={goal?.accountIds.includes(account.id)}
                  name="accountIds"
                  type="checkbox"
                  value={account.id}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="min-w-0 truncate text-sm font-medium text-[#1d1d1f]">
                    {account.name}
                  </span>
                  <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-black/[0.05] px-1.5 text-[10px] font-medium text-[#6e6e73]">
                    {accountCategoryLabels[account.category]}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[#6e6e73]">
                  {formatCentsString(account.currentAmount)}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <label className="space-y-1.5 text-xs font-medium text-[#6e6e73]">
        <span>备注</span>
        <TextArea defaultValue={goal?.note ?? ""} name="note" placeholder="可选" />
      </label>
      <Button className="w-full" type="submit" variant="primary">
        {goal ? <Save className="h-4 w-4" /> : <PiggyBank className="h-4 w-4" />}
        {goal ? "保存修改" : "保存目标"}
      </Button>
    </form>
  );
}

function HeaderActionButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-[#007aff] transition hover:bg-white/55",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]",
        active && "bg-white/70 shadow-sm shadow-black/[0.05]",
      )}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function GoalsWorkspace({
  accounts,
  budget,
  goals,
}: GoalsWorkspaceProps) {
  const [openPanel, setOpenPanel] = useState<"budget" | "create" | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  const header = (
    <div className="flex items-start justify-between gap-4 pt-2">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-normal text-[#1d1d1f] drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">
          目标
        </h1>
        <div className="mt-3 h-1 w-12 rounded-full bg-[#007aff]" />
      </div>
      <div className="-mr-1 mt-1 flex shrink-0 items-center gap-1">
        <HeaderActionButton
          active={openPanel === "budget"}
          label="月度收支"
          onClick={() => setOpenPanel(openPanel === "budget" ? null : "budget")}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </HeaderActionButton>
        <HeaderActionButton
          active={openPanel === "create"}
          label="新增目标"
          onClick={() => setOpenPanel(openPanel === "create" ? null : "create")}
        >
          <Plus className="h-5 w-5" />
        </HeaderActionButton>
      </div>
    </div>
  );

  return (
    <MobileShell header={header} title="目标">
      <section className="space-y-4">
      {openPanel === "budget" ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>月度收支</CardTitle>
              <p className="mt-1 text-xs text-[#6e6e73]">
                所有目标共用这一套固定配置
              </p>
            </div>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#3a3a3c]"
              onClick={() => setOpenPanel(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent>
            <form action={updateGoalBudgetAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MoneyInput
                  defaultValue={centsToInput(budget.monthlyIncome)}
                  label="月收入"
                  name="monthlyIncome"
                />
                <MoneyInput
                  defaultValue={centsToInput(budget.monthlyOtherIncome)}
                  label="其他月收入"
                  name="monthlyOtherIncome"
                />
                <MoneyInput
                  defaultValue={centsToInput(budget.monthlyRent)}
                  label="房租"
                  name="monthlyRent"
                />
                <MoneyInput
                  defaultValue={centsToInput(budget.monthlyFood)}
                  label="餐饮"
                  name="monthlyFood"
                />
                <MoneyInput
                  defaultValue={centsToInput(budget.monthlyLiving)}
                  label="日常支出"
                  name="monthlyLiving"
                />
                <MoneyInput
                  defaultValue={centsToInput(budget.monthlyOtherExpense)}
                  label="其他支出"
                  name="monthlyOtherExpense"
                />
              </div>
              <Button className="w-full" type="submit" variant="primary">
                <Save className="h-4 w-4" />
                保存月度配置
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {openPanel === "create" ? (
        <Card className="overflow-hidden border-[#007aff]/10 bg-white/90 shadow-[0_14px_34px_rgba(0,122,255,0.10)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>新增目标</CardTitle>
              <p className="mt-1 text-xs text-[#6e6e73]">
                设置目标金额，进度由账户自动计算
              </p>
            </div>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#3a3a3c]"
              onClick={() => setOpenPanel(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent>
            <GoalForm accounts={accounts} action={createGoalAction} />
          </CardContent>
        </Card>
      ) : null}

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-sm text-[#3a3a3c]">
            还没有目标。点击右上角加号保存第一个目标后，这里会显示进度和预计达成时间。
          </CardContent>
        </Card>
      ) : (
        goals.map((goal) => {
          const projection = goal.projection;
          const trendProjection = goal.trendProjection;
          const editing = editingGoalId === goal.id;

          return (
            <Card key={goal.id}>
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#34c759]/10 text-[#248a3d]">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base font-semibold text-[#1d1d1f]">
                      {goal.name}
                    </CardTitle>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      目标 {formatCentsString(goal.targetAmount)}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#86868b]">
                      {goal.progressSource === "net_worth"
                        ? "进度来源：总净资产"
                        : goal.linkedAccounts.length > 0
                          ? `进度来源：${goal.linkedAccounts
                              .map(
                                (account) =>
                                  `${account.name}（${accountCategoryLabels[account.category]}）`,
                              )
                              .join("、")}`
                          : "进度来源：关联账户已归档"}
                    </p>
                  </div>
                  {editing ? null : (
                    <button
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#3a3a3c] transition hover:bg-black/[0.06]"
                      onClick={() => setEditingGoalId(goal.id)}
                      type="button"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <GoalProgressPanel
                  currentAmount={goal.currentAmount}
                  estimatedReachDate={projection.estimatedReachDate}
                  monthlyNetAmount={projection.monthlyNetAmount}
                  progressPercent={projection.progressPercent}
                  remainingAmount={projection.remainingAmount}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <TrendProjectionPanel trend={trendProjection} />

                {editing ? (
                  <div className="space-y-3 border-t border-black/[0.06] pt-4">
                    <GoalForm
                      accounts={accounts}
                      action={updateGoalAction}
                      goal={goal}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="w-full"
                        onClick={() => {
                          setEditingGoalId(null);
                          setConfirmingDeleteId(null);
                        }}
                        type="button"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                        收起
                      </Button>
                      {confirmingDeleteId === goal.id ? (
                        <form action={deleteGoalAction}>
                          <input name="goalId" type="hidden" value={goal.id} />
                          <Button
                            className="w-full bg-rose-500 text-white hover:bg-rose-600"
                            type="submit"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                            确认删除
                          </Button>
                        </form>
                      ) : (
                        <Button
                          className="w-full text-rose-600 hover:bg-rose-50"
                          onClick={() => setConfirmingDeleteId(goal.id)}
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      )}

      </section>
    </MobileShell>
  );
}
