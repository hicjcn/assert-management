"use client";

import {
  CalendarClock,
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
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMonthYear } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type BudgetView = {
  monthlyIncome: string;
  monthlyRent: string;
  monthlyFood: string;
  monthlyLiving: string;
  monthlyOtherExpense: string;
  monthlyOtherIncome: string;
};

type GoalView = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  oneTimeIncome: string;
  oneTimeExpense: string;
  note: string | null;
  projection: {
    monthlyNetAmount: string;
    remainingAmount: string;
    progressPercent: number;
    estimatedReachDate: string | null;
  };
};

type GoalsWorkspaceProps = {
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

function formatReachDate(value: string | null) {
  if (!value) {
    return "暂不可达成";
  }

  return formatMonthYear(value);
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
  goal,
}: {
  action: (formData: FormData) => void | Promise<void>;
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
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MoneyInput
          defaultValue={goal ? centsToInput(goal.targetAmount) : "0"}
          label="目标金额"
          name="targetAmount"
        />
        <MoneyInput
          defaultValue={goal ? centsToInput(goal.currentAmount) : "0"}
          label="当前已存"
          name="currentAmount"
        />
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

export function GoalsWorkspace({ budget, goals }: GoalsWorkspaceProps) {
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
                设置目标金额和当前进度
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
            <GoalForm action={createGoalAction} />
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
                      {formatCentsString(projection.monthlyNetAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6e6e73]">剩余金额</p>
                    <p className="mt-1 font-semibold text-[#1d1d1f]">
                      {formatCentsString(projection.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6e6e73]">预计达成</p>
                    <p className="mt-1 font-semibold text-[#1d1d1f]">
                      {formatReachDate(projection.estimatedReachDate)}
                    </p>
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-3 border-t border-black/[0.06] pt-4">
                    <GoalForm action={updateGoalAction} goal={goal} />
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
