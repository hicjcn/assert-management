import "server-only";

import {
  AccountCategory,
  AccountType,
  ChangeType,
} from "@/generated/prisma/enums";
import { addChinaMonths, chinaMonthStart, monthKey } from "@/lib/date";
import { yuanToCents } from "@/lib/money";
import {
  goalBudgetSchema,
  goalDeleteSchema,
  goalSchema,
  goalUpdateSchema,
} from "@/lib/validators";
import { prisma } from "@/server/db/prisma";
import { cacheAssetData, cacheGoalData } from "@/server/cache";
import { accountCategoryFromPrisma } from "@/server/domain-mapping";

type GoalTargetAmounts = {
  targetAmount: bigint;
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

type GoalProjectionInput = GoalTargetAmounts &
  GoalBudgetAmounts & {
    currentAmount: bigint;
  };

type GoalAccountAmount = {
  id: string;
  type: AccountType;
  currentAmount: bigint;
  includeInStats: boolean;
  archived: boolean;
};

type GoalTrendAccount = GoalAccountAmount & {
  createdAt: Date;
};

type GoalTrendChange = {
  accountId: string;
  type: ChangeType;
  categorySnapshot: AccountCategory;
  changeAmount: bigint;
  changedAt: Date;
};

type GoalProjection = {
  effectiveCurrentAmount: bigint;
  monthlyNetAmount: bigint;
  remainingAmount: bigint;
  progressPercent: number;
  monthsToReach: number | null;
  estimatedReachDate: Date | null;
};

type GoalTrendProjection = {
  monthlyTrendAmount: bigint;
  monthlyBreakdown: {
    month: string;
    amount: bigint;
    changeCount: number;
  }[];
  observedMonths: number;
  changeCount: number;
  monthsToReach: number | null;
  estimatedReachDate: Date | null;
};

const GOAL_BUDGET_SETTING_KEY = "goal_monthly_budget";
const GOAL_TREND_MONTHS = 6;
const liabilityAccountCategories = new Set<AccountCategory>([
  AccountCategory.CREDIT_CARD,
  AccountCategory.LIABILITY_ACCOUNT,
]);

const goalAmountFieldLabels: Record<keyof GoalTargetAmounts, string> = {
  targetAmount: "目标金额",
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

function pickGoalAmountStrings(values: {
  targetAmount: string;
  oneTimeIncome: string;
  oneTimeExpense: string;
}) {
  return {
    targetAmount: values.targetAmount,
    oneTimeIncome: values.oneTimeIncome,
    oneTimeExpense: values.oneTimeExpense,
  };
}

function pickBudgetAmountStrings(values: {
  monthlyIncome: string;
  monthlyRent: string;
  monthlyFood: string;
  monthlyLiving: string;
  monthlyOtherExpense: string;
  monthlyOtherIncome: string;
}) {
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
  return addChinaMonths(date, months);
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

export function calculateGoalCurrentAmount(
  accounts: GoalAccountAmount[],
  linkedAccountIds: string[],
) {
  return getGoalSourceAccounts(accounts, linkedAccountIds)
    .reduce(
      (sum, account) =>
        account.type === AccountType.LIABILITY
          ? sum - account.currentAmount
          : sum + account.currentAmount,
      0n,
    );
}

function getGoalSourceAccounts<T extends GoalAccountAmount>(
  accounts: T[],
  linkedAccountIds: string[],
) {
  const activeAccounts = accounts.filter((account) => !account.archived);

  if (linkedAccountIds.length === 0) {
    return activeAccounts.filter((account) => account.includeInStats);
  }

  const linkedIds = new Set(linkedAccountIds);

  return activeAccounts.filter(
    (account) =>
      linkedIds.has(account.id) && account.type === AccountType.ASSET,
  );
}

function chinaMonthIndex(value: Date) {
  const [year, month] = monthKey(value).split("-").map(Number);

  return year * 12 + month - 1;
}

function countChinaMonthsInclusive(startAt: Date, endAt: Date) {
  return Math.max(0, chinaMonthIndex(endAt) - chinaMonthIndex(startAt) + 1);
}

function buildTrendMonthBreakdown(startAt: Date, endAt: Date) {
  const months = [];
  let cursor = chinaMonthStart(startAt);
  const finalMonth = chinaMonthStart(endAt);

  while (cursor <= finalMonth) {
    months.push({
      month: monthKey(cursor),
      amount: 0n,
      changeCount: 0,
    });
    cursor = addChinaMonths(cursor, 1);
  }

  return months;
}

export function calculateGoalTrendProjection(
  goal: { targetAmount: bigint; currentAmount: bigint },
  accounts: GoalTrendAccount[],
  linkedAccountIds: string[],
  changes: GoalTrendChange[],
  baseDate = new Date(),
): GoalTrendProjection {
  const sourceAccounts = getGoalSourceAccounts(accounts, linkedAccountIds);
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  if (sourceAccounts.length === 0) {
    return {
      monthlyTrendAmount: 0n,
      monthlyBreakdown: [],
      observedMonths: 0,
      changeCount: 0,
      monthsToReach: remainingAmount <= 0n ? 0 : null,
      estimatedReachDate: remainingAmount <= 0n ? baseDate : null,
    };
  }

  const windowStart = addChinaMonths(
    chinaMonthStart(baseDate),
    -(GOAL_TREND_MONTHS - 1),
  );
  const earliestAccountAt = sourceAccounts.reduce(
    (earliest, account) =>
      account.createdAt < earliest ? account.createdAt : earliest,
    sourceAccounts[0].createdAt,
  );
  const observationStart =
    earliestAccountAt > windowStart
      ? chinaMonthStart(earliestAccountAt)
      : windowStart;
  const observedMonths = Math.min(
    GOAL_TREND_MONTHS,
    countChinaMonthsInclusive(observationStart, baseDate),
  );
  const sourceAccountsById = new Map(
    sourceAccounts.map((account) => [account.id, account]),
  );
  const trendChanges = changes.filter(
    (change) =>
      change.changedAt >= observationStart &&
      change.changedAt <= baseDate &&
      sourceAccountsById.has(change.accountId),
  );
  const monthlyBreakdown = buildTrendMonthBreakdown(
    observationStart,
    baseDate,
  );
  const breakdownByMonth = new Map(
    monthlyBreakdown.map((month) => [month.month, month]),
  );

  for (const change of trendChanges) {
    const month = breakdownByMonth.get(monthKey(change.changedAt));

    if (!month) {
      continue;
    }

    month.amount += liabilityAccountCategories.has(change.categorySnapshot)
      ? -change.changeAmount
      : change.changeAmount;
    month.changeCount += 1;
  }

  const totalTrendAmount = monthlyBreakdown.reduce(
    (sum, month) => sum + month.amount,
    0n,
  );
  const monthlyTrendAmount =
    observedMonths > 0 ? totalTrendAmount / BigInt(observedMonths) : 0n;

  if (remainingAmount <= 0n) {
    return {
      monthlyTrendAmount,
      monthlyBreakdown,
      observedMonths,
      changeCount: trendChanges.length,
      monthsToReach: 0,
      estimatedReachDate: baseDate,
    };
  }

  if (trendChanges.length === 0 || monthlyTrendAmount <= 0n) {
    return {
      monthlyTrendAmount,
      monthlyBreakdown,
      observedMonths,
      changeCount: trendChanges.length,
      monthsToReach: null,
      estimatedReachDate: null,
    };
  }

  const monthsToReach = ceilDivide(remainingAmount, monthlyTrendAmount);

  return {
    monthlyTrendAmount,
    monthlyBreakdown,
    observedMonths,
    changeCount: trendChanges.length,
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

function toGoalView(
  goal: GoalTargetAmounts & {
    id: string;
    name: string;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    accountLinks: { accountId: string }[];
  },
  budget: GoalBudgetAmounts,
  accounts: (GoalTrendAccount & { category: AccountCategory; name: string })[],
  changes: GoalTrendChange[],
  baseDate: Date,
) {
  const accountIds = goal.accountLinks.map((link) => link.accountId);
  const currentAmount = calculateGoalCurrentAmount(accounts, accountIds);
  const linkedAccounts = accounts
    .filter((account) => accountIds.includes(account.id) && !account.archived)
    .map((account) => ({
      category: accountCategoryFromPrisma[account.category],
      name: account.name,
    }));

  return {
    ...goal,
    accountIds,
    linkedAccounts,
    currentAmount,
    progressSource:
      accountIds.length > 0
        ? ("accounts" as const)
        : ("net_worth" as const),
    projection: calculateGoalProjection({
      ...goal,
      ...budget,
      currentAmount,
    }, baseDate),
    trendProjection: calculateGoalTrendProjection(
      { targetAmount: goal.targetAmount, currentAmount },
      accounts,
      accountIds,
      changes,
      baseDate,
    ),
  };
}

export async function getGoalsPageData(userId: string) {
  "use cache";
  cacheGoalData(userId);
  cacheAssetData(userId);

  const baseDate = new Date();
  const trendWindowStart = addChinaMonths(
    chinaMonthStart(baseDate),
    -(GOAL_TREND_MONTHS - 1),
  );
  const [goals, budgetSetting, accounts, changes] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      include: {
        accountLinks: {
          select: { accountId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.setting.findUnique({
      where: { userId_key: { userId, key: GOAL_BUDGET_SETTING_KEY } },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        currentAmount: true,
        includeInStats: true,
        archived: true,
        createdAt: true,
      },
    }),
    prisma.accountChange.findMany({
      where: {
        userId,
        changedAt: { gte: trendWindowStart, lte: baseDate },
      },
      select: {
        accountId: true,
        type: true,
        categorySnapshot: true,
        changeAmount: true,
        changedAt: true,
      },
    }),
  ]);
  const budget = decodeBudgetSetting(budgetSetting?.value) ?? emptyBudget;

  return {
    budget,
    accounts: accounts
      .filter(
        (account) => account.type === AccountType.ASSET && !account.archived,
      )
      .map((account) => ({
        ...account,
        category: accountCategoryFromPrisma[account.category],
      })),
    goals: goals.map((goal) =>
      toGoalView(goal, budget, accounts, changes, baseDate),
    ),
  };
}

export async function listGoals(userId: string) {
  const { goals } = await getGoalsPageData(userId);
  return goals;
}

async function validateGoalAccountIds(userId: string, values: string[]) {
  const accountIds = [...new Set(values)];

  if (accountIds.length === 0) {
    return accountIds;
  }

  const accounts = await prisma.account.findMany({
    where: {
      id: { in: accountIds },
      userId,
      type: AccountType.ASSET,
      archived: false,
    },
    select: { id: true },
  });

  if (accounts.length !== accountIds.length) {
    throw new Error("只能关联自己的有效资产账户");
  }

  return accountIds;
}

export async function createGoal(userId: string, formData: FormData) {
  const parsed = goalSchema.parse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    oneTimeIncome: formData.get("oneTimeIncome"),
    oneTimeExpense: formData.get("oneTimeExpense"),
    accountIds: formData.getAll("accountIds").map(String),
    note: formData.get("note") ?? "",
  });
  const amounts = parseGoalAmounts(pickGoalAmountStrings(parsed));
  const accountIds = await validateGoalAccountIds(userId, parsed.accountIds);

  await prisma.goal.create({
    data: {
      userId,
      name: parsed.name,
      ...amounts,
      note: parsed.note || null,
      accountLinks: {
        create: accountIds.map((accountId) => ({ accountId })),
      },
    },
  });
}

export async function updateGoal(userId: string, formData: FormData) {
  const parsed = goalUpdateSchema.parse({
    goalId: formData.get("goalId"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    oneTimeIncome: formData.get("oneTimeIncome"),
    oneTimeExpense: formData.get("oneTimeExpense"),
    accountIds: formData.getAll("accountIds").map(String),
    note: formData.get("note") ?? "",
  });
  const amounts = parseGoalAmounts(pickGoalAmountStrings(parsed));
  const accountIds = await validateGoalAccountIds(userId, parsed.accountIds);
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
      accountLinks: {
        deleteMany: {},
        create: accountIds.map((accountId) => ({ accountId })),
      },
    },
  });
}

export async function deleteGoal(userId: string, formData: FormData) {
  const parsed = goalDeleteSchema.parse({
    goalId: formData.get("goalId"),
  });
  const goal = await prisma.goal.findFirst({
    where: { id: parsed.goalId, userId },
  });

  if (!goal) {
    throw new Error("目标不存在");
  }

  await prisma.goal.delete({
    where: { id: goal.id },
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
