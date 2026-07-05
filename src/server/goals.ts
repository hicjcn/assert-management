import "server-only";

import { yuanToCents } from "@/lib/money";
import {
  goalBudgetSchema,
  goalSchema,
  goalUpdateSchema,
} from "@/lib/validators";
import { prisma } from "@/server/db/prisma";

type GoalTargetAmounts = {
  targetAmount: bigint;
  currentAmount: bigint;
  oneTimeIncome: bigint;
  oneTimeExpense: bigint;
};

type GoalBudgetAmounts = {
  monthlyIncome: bigint;
  monthlyRent: bigint;
  monthlyFood: bigint;
  monthlyLiving: bigint;
  monthlyOtherExpense: bigint;
  monthlyOtherIncome: bigint;
};

type GoalProjectionInput = GoalTargetAmounts & GoalBudgetAmounts;

type GoalProjection = {
  effectiveCurrentAmount: bigint;
  monthlyNetAmount: bigint;
  remainingAmount: bigint;
  progressPercent: number;
  monthsToReach: number | null;
  estimatedReachDate: Date | null;
};

const GOAL_BUDGET_SETTING_KEY = "goal_monthly_budget";

const goalAmountFieldLabels: Record<keyof GoalTargetAmounts, string> = {
  targetAmount: "目标金额",
  currentAmount: "当前已存",
  oneTimeIncome: "一次性收入",
  oneTimeExpense: "一次性支出",
};

const budgetAmountFieldLabels: Record<keyof GoalBudgetAmounts, string> = {
  monthlyIncome: "月收入",
  monthlyRent: "房租",
  monthlyFood: "餐饮",
  monthlyLiving: "日常支出",
  monthlyOtherExpense: "其他支出",
  monthlyOtherIncome: "其他收入",
};

const emptyBudget: GoalBudgetAmounts = {
  monthlyIncome: 0n,
  monthlyRent: 0n,
  monthlyFood: 0n,
  monthlyLiving: 0n,
  monthlyOtherExpense: 0n,
  monthlyOtherIncome: 0n,
};

function parseAmounts<T extends Record<string, string>>(
  values: T,
  labels: Record<keyof T, string>,
) {
  const amounts = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, yuanToCents(value)]),
  ) as Record<keyof T, bigint>;

  for (const [key, value] of Object.entries(amounts) as [
    keyof T,
    bigint,
  ][]) {
    if (value < 0n) {
      throw new Error(`${labels[key]}不能为负数`);
    }
  }

  return amounts;
}

function parseGoalAmounts(values: Record<keyof GoalTargetAmounts, string>) {
  const amounts = parseAmounts(values, goalAmountFieldLabels);

  if (amounts.targetAmount <= 0n) {
    throw new Error("目标金额必须大于 0");
  }

  return amounts;
}

function parseBudgetAmounts(values: Record<keyof GoalBudgetAmounts, string>) {
  return parseAmounts(values, budgetAmountFieldLabels);
}

function pickGoalAmountStrings(values: Record<string, string>) {
  return {
    targetAmount: values.targetAmount,
    currentAmount: values.currentAmount,
    oneTimeIncome: values.oneTimeIncome,
    oneTimeExpense: values.oneTimeExpense,
  };
}

function pickBudgetAmountStrings(values: Record<string, string>) {
  return {
    monthlyIncome: values.monthlyIncome,
    monthlyRent: values.monthlyRent,
    monthlyFood: values.monthlyFood,
    monthlyLiving: values.monthlyLiving,
    monthlyOtherExpense: values.monthlyOtherExpense,
    monthlyOtherIncome: values.monthlyOtherIncome,
  };
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function ceilDivide(value: bigint, divisor: bigint) {
  return Number((value + divisor - 1n) / divisor);
}

export function calculateGoalProjection(
  goal: GoalProjectionInput,
  baseDate = new Date(),
): GoalProjection {
  const effectiveCurrentAmount =
    goal.currentAmount + goal.oneTimeIncome - goal.oneTimeExpense;
  const monthlyNetAmount =
    goal.monthlyIncome +
    goal.monthlyOtherIncome -
    goal.monthlyRent -
    goal.monthlyFood -
    goal.monthlyLiving -
    goal.monthlyOtherExpense;
  const remainingAmount = goal.targetAmount - effectiveCurrentAmount;
  const progressPercent =
    goal.targetAmount <= 0n
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            Number((effectiveCurrentAmount * 10000n) / goal.targetAmount) / 100,
          ),
        );

  if (remainingAmount <= 0n) {
    return {
      effectiveCurrentAmount,
      monthlyNetAmount,
      remainingAmount: 0n,
      progressPercent,
      monthsToReach: 0,
      estimatedReachDate: baseDate,
    };
  }

  if (monthlyNetAmount <= 0n) {
    return {
      effectiveCurrentAmount,
      monthlyNetAmount,
      remainingAmount,
      progressPercent,
      monthsToReach: null,
      estimatedReachDate: null,
    };
  }

  const monthsToReach = ceilDivide(remainingAmount, monthlyNetAmount);

  return {
    effectiveCurrentAmount,
    monthlyNetAmount,
    remainingAmount,
    progressPercent,
    monthsToReach,
    estimatedReachDate: addMonths(baseDate, monthsToReach),
  };
}

function encodeBudgetSetting(budget: GoalBudgetAmounts) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(budget).map(([key, value]) => [key, value.toString()]),
    ),
  );
}

function decodeBudgetSetting(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<
      Record<keyof GoalBudgetAmounts, string>
    >;

    return {
      monthlyIncome: BigInt(parsed.monthlyIncome ?? 0),
      monthlyRent: BigInt(parsed.monthlyRent ?? 0),
      monthlyFood: BigInt(parsed.monthlyFood ?? 0),
      monthlyLiving: BigInt(parsed.monthlyLiving ?? 0),
      monthlyOtherExpense: BigInt(parsed.monthlyOtherExpense ?? 0),
      monthlyOtherIncome: BigInt(parsed.monthlyOtherIncome ?? 0),
    };
  } catch {
    return null;
  }
}

function toGoalView(goal: GoalTargetAmounts & {
  id: string;
  name: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}, budget: GoalBudgetAmounts) {
  return {
    ...goal,
    projection: calculateGoalProjection({
      ...goal,
      ...budget,
    }),
  };
}

export async function getGoalsPageData(userId: string) {
  const [goals, budgetSetting] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.setting.findUnique({
      where: { userId_key: { userId, key: GOAL_BUDGET_SETTING_KEY } },
    }),
  ]);
  const budget = decodeBudgetSetting(budgetSetting?.value) ?? emptyBudget;

  return {
    budget,
    goals: goals.map((goal) => toGoalView(goal, budget)),
  };
}

export async function listGoals(userId: string) {
  const { goals } = await getGoalsPageData(userId);
  return goals;
}

export async function createGoal(userId: string, formData: FormData) {
  const parsed = goalSchema.parse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount"),
    oneTimeIncome: formData.get("oneTimeIncome"),
    oneTimeExpense: formData.get("oneTimeExpense"),
    note: formData.get("note") ?? "",
  });
  const amounts = parseGoalAmounts(pickGoalAmountStrings(parsed));

  await prisma.goal.create({
    data: {
      userId,
      name: parsed.name,
      ...amounts,
      note: parsed.note || null,
    },
  });
}

export async function updateGoal(userId: string, formData: FormData) {
  const parsed = goalUpdateSchema.parse({
    goalId: formData.get("goalId"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount"),
    oneTimeIncome: formData.get("oneTimeIncome"),
    oneTimeExpense: formData.get("oneTimeExpense"),
    note: formData.get("note") ?? "",
  });
  const amounts = parseGoalAmounts(pickGoalAmountStrings(parsed));
  const goal = await prisma.goal.findFirst({
    where: { id: parsed.goalId, userId },
  });

  if (!goal) {
    throw new Error("目标不存在");
  }

  await prisma.goal.update({
    where: { id: goal.id },
    data: {
      name: parsed.name,
      ...amounts,
      note: parsed.note || null,
    },
  });
}

export async function updateGoalBudget(userId: string, formData: FormData) {
  const parsed = goalBudgetSchema.parse({
    monthlyIncome: formData.get("monthlyIncome"),
    monthlyRent: formData.get("monthlyRent"),
    monthlyFood: formData.get("monthlyFood"),
    monthlyLiving: formData.get("monthlyLiving"),
    monthlyOtherExpense: formData.get("monthlyOtherExpense"),
    monthlyOtherIncome: formData.get("monthlyOtherIncome"),
  });
  const budget = parseBudgetAmounts(pickBudgetAmountStrings(parsed));

  await prisma.setting.upsert({
    where: { userId_key: { userId, key: GOAL_BUDGET_SETTING_KEY } },
    create: {
      userId,
      key: GOAL_BUDGET_SETTING_KEY,
      value: encodeBudgetSetting(budget),
    },
    update: {
      value: encodeBudgetSetting(budget),
    },
  });
}
