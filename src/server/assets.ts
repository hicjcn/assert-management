import "server-only";

import { AccountType, ChangeType } from "@/generated/prisma/enums";
import {
  addChinaMonths,
  chinaMonthEnd,
  chinaMonthStart,
  formatMonthYear,
  monthKey,
  parseChinaDateTimeLocal,
} from "@/lib/date";
import { yuanToCents } from "@/lib/money";
import {
  accountChangeSchema,
  accountDeleteSchema,
  accountSchema,
  accountUpdateSchema,
} from "@/lib/validators";
import { prisma } from "@/server/db/prisma";
import { cacheAssetData } from "@/server/cache";
import {
  accountCategoryFromPrisma,
  accountCategoryToPrisma,
  accountTypeFromPrisma,
  changeTypeFromPrisma,
  changeTypeToPrisma,
} from "@/server/domain-mapping";
import type { AccountCategory } from "@/types/domain";
import type { ChartsData } from "@/types/charts";

const liabilityCategories = new Set<AccountCategory>([
  "credit_card",
  "liability_account",
]);

function inferAccountType(category: AccountCategory) {
  return liabilityCategories.has(category)
    ? AccountType.LIABILITY
    : AccountType.ASSET;
}

function toMonthKey(date: Date) {
  return monthKey(date);
}

function toMonthLabel(date: Date) {
  return formatMonthYear(date);
}

function monthStart(date: Date) {
  return chinaMonthStart(date);
}

function monthEnd(date: Date) {
  return chinaMonthEnd(date);
}

function addMonths(date: Date, months: number) {
  return addChinaMonths(monthStart(date), months);
}

function buildChartMonths(startAt: Date, endAt: Date) {
  const months = [];
  let cursor = monthStart(startAt);
  const finalMonth = monthStart(endAt);

  while (cursor <= finalMonth) {
    months.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }

  return months;
}

export async function getDashboard(userId: string) {
  "use cache";
  cacheAssetData(userId);

  const now = new Date();
  const currentMonthStart = chinaMonthStart(now);
  const [accounts, monthChanges, recentChanges] = await Promise.all([
    prisma.account.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountChange.findMany({
      where: {
        userId,
        changedAt: { gte: currentMonthStart },
        account: { includeInStats: true, archived: false },
      },
      select: { changeAmount: true, categorySnapshot: true },
    }),
    prisma.accountChange.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { changedAt: "desc" },
      take: 5,
    }),
  ]);

  const includedAccounts = accounts.filter((account) => account.includeInStats);
  const assets = includedAccounts
    .filter((account) => account.type === AccountType.ASSET)
    .reduce((sum, account) => sum + account.currentAmount, 0n);
  const liabilities = includedAccounts
    .filter((account) => account.type === AccountType.LIABILITY)
    .reduce((sum, account) => sum + account.currentAmount, 0n);
  const monthlyChange = monthChanges.reduce(
    (sum, change) => {
      const category = accountCategoryFromPrisma[change.categorySnapshot];

      return liabilityCategories.has(category)
        ? sum - change.changeAmount
        : sum + change.changeAmount;
    },
    0n,
  );

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    monthlyChange,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      category: accountCategoryFromPrisma[account.category],
      type: accountTypeFromPrisma[account.type],
      currentAmount: account.currentAmount,
      includeInStats: account.includeInStats,
      iconKey: account.iconKey,
    })),
    recentChanges: recentChanges.map((change) => ({
      id: change.id,
      accountName: change.accountNameSnapshot,
      category: accountCategoryFromPrisma[change.categorySnapshot],
      iconKey: change.account.iconKey,
      type: changeTypeFromPrisma[change.type],
      changeAmount: change.changeAmount,
      afterAmount: change.afterAmount,
      changedAt: change.changedAt,
    })),
  };
}

export async function getCharts(userId: string): Promise<ChartsData> {
  "use cache";
  cacheAssetData(userId);

  const accounts = await prisma.account.findMany({
    where: { userId, archived: false, includeInStats: true },
    orderBy: [{ type: "asc" }, { currentAmount: "desc" }],
  });

  if (accounts.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      accounts: [],
      months: [],
    };
  }

  const accountIds = accounts.map((account) => account.id);
  const changes = await prisma.accountChange.findMany({
    where: { userId, accountId: { in: accountIds } },
    orderBy: [{ changedAt: "asc" }, { createdAt: "asc" }],
    select: {
      accountId: true,
      afterAmount: true,
      changedAt: true,
    },
  });
  const now = new Date();
  const earliestAccountAt = accounts.reduce(
    (earliest, account) =>
      account.createdAt < earliest ? account.createdAt : earliest,
    accounts[0].createdAt,
  );
  const earliestChangeAt = changes.reduce(
    (earliest, change) =>
      change.changedAt < earliest ? change.changedAt : earliest,
    earliestAccountAt,
  );
  const months = buildChartMonths(earliestChangeAt, now);
  const changesByAccount = new Map<
    string,
    { afterAmount: bigint; changedAt: Date }[]
  >();

  for (const change of changes) {
    const accountChanges = changesByAccount.get(change.accountId) ?? [];
    accountChanges.push({
      afterAmount: change.afterAmount,
      changedAt: change.changedAt,
    });
    changesByAccount.set(change.accountId, accountChanges);
  }

  return {
    generatedAt: now.toISOString(),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      category: accountCategoryFromPrisma[account.category],
      type: accountTypeFromPrisma[account.type],
      currentAmount: Number(account.currentAmount),
      iconKey: account.iconKey,
    })),
    months: months.map((month) => {
      const endAt = monthEnd(month);
      const accountAmounts: Record<string, number> = {};

      for (const account of accounts) {
        if (account.createdAt > endAt) {
          continue;
        }

        const accountChanges = changesByAccount.get(account.id) ?? [];
        let amount =
          accountChanges.length === 0 ? account.currentAmount : 0n;

        for (const change of accountChanges) {
          if (change.changedAt > endAt) {
            break;
          }
          amount = change.afterAmount;
        }

        accountAmounts[account.id] = Number(amount);
      }

      return {
        key: toMonthKey(month),
        label: toMonthLabel(month),
        accountAmounts,
      };
    }),
  };
}

export async function listAccounts(userId: string) {
  "use cache";
  cacheAssetData(userId);

  const accounts = await prisma.account.findMany({
    where: { userId, archived: false },
    orderBy: [{ includeInStats: "desc" }, { createdAt: "desc" }],
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    category: accountCategoryFromPrisma[account.category],
    type: accountTypeFromPrisma[account.type],
    currentAmount: account.currentAmount,
    includeInStats: account.includeInStats,
    iconKey: account.iconKey,
    note: account.note,
  }));
}

export async function getAccount(userId: string, accountId: string) {
  "use cache";
  cacheAssetData(userId);

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, archived: false },
  });

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    category: accountCategoryFromPrisma[account.category],
    type: accountTypeFromPrisma[account.type],
    currentAmount: account.currentAmount,
    includeInStats: account.includeInStats,
    iconKey: account.iconKey,
    note: account.note,
  };
}

export async function listAccountChanges(userId: string, accountId?: string) {
  "use cache";
  cacheAssetData(userId);

  const changes = await prisma.accountChange.findMany({
    where: { userId, ...(accountId ? { accountId } : {}) },
    include: { account: true },
    orderBy: { changedAt: "desc" },
    take: accountId ? 100 : 30,
  });

  return changes.map((change) => ({
    id: change.id,
    accountId: change.accountId,
    accountName: change.accountNameSnapshot,
    category: accountCategoryFromPrisma[change.categorySnapshot],
    iconKey: change.account.iconKey,
    type: changeTypeFromPrisma[change.type],
    beforeAmount: change.beforeAmount,
    changeAmount: change.changeAmount,
    afterAmount: change.afterAmount,
    note: change.note,
    changedAt: change.changedAt,
  }));
}

export async function createAccount(userId: string, formData: FormData) {
  const parsed = accountSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    iconKey: formData.get("iconKey") || undefined,
    currentAmount: formData.get("currentAmount"),
    includeInStats: formData.get("includeInStats") === "on",
    note: formData.get("note") ?? "",
  });
  const currentAmount = yuanToCents(parsed.currentAmount);
  const accountType = inferAccountType(parsed.category);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        userId,
        name: parsed.name,
        category: accountCategoryToPrisma[parsed.category],
        type: accountType,
        iconKey: parsed.iconKey ?? null,
        currentAmount,
        includeInStats: parsed.includeInStats,
        note: parsed.note || null,
      },
    });

    await tx.accountChange.create({
      data: {
        userId,
        accountId: account.id,
        accountNameSnapshot: account.name,
        categorySnapshot: account.category,
        type: ChangeType.INITIAL,
        beforeAmount: 0n,
        changeAmount: currentAmount,
        afterAmount: currentAmount,
        note: "创建账户",
        changedAt: now,
      },
    });
  });
}

export async function updateAccount(userId: string, formData: FormData) {
  const parsed = accountUpdateSchema.parse({
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    category: formData.get("category"),
    iconKey: formData.get("iconKey") || undefined,
    currentAmount: formData.get("currentAmount"),
    includeInStats: formData.get("includeInStats") === "on",
    note: formData.get("note") ?? "",
  });
  const currentAmount = yuanToCents(parsed.currentAmount);
  const accountCategory = accountCategoryToPrisma[parsed.category];
  const accountType = inferAccountType(parsed.category);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: parsed.accountId, userId, archived: false },
    });

    if (!account) {
      throw new Error("账户不存在");
    }

    const changeAmount = currentAmount - account.currentAmount;

    await tx.account.update({
      where: { id: account.id },
      data: {
        name: parsed.name,
        category: accountCategory,
        type: accountType,
        iconKey: parsed.iconKey ?? null,
        currentAmount,
        includeInStats: parsed.includeInStats,
        note: parsed.note || null,
      },
    });

    if (changeAmount !== 0n) {
      await tx.accountChange.create({
        data: {
          userId,
          accountId: account.id,
          accountNameSnapshot: parsed.name,
          categorySnapshot: accountCategory,
          type: ChangeType.SET,
          beforeAmount: account.currentAmount,
          changeAmount,
          afterAmount: currentAmount,
          note: "更新账户金额",
          changedAt: now,
        },
      });
    }
  });
}

export async function deleteAccount(userId: string, formData: FormData) {
  const parsed = accountDeleteSchema.parse({
    accountId: formData.get("accountId"),
  });

  const account = await prisma.account.findFirst({
    where: { id: parsed.accountId, userId, archived: false },
  });

  if (!account) {
    throw new Error("账户不存在");
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { archived: true, includeInStats: false },
  });
}

export async function createAccountChange(userId: string, formData: FormData) {
  const parsed = accountChangeSchema.parse({
    accountId: formData.get("accountId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    changedAt: formData.get("changedAt"),
    note: formData.get("note") || undefined,
  });
  const amount = yuanToCents(parsed.amount);
  const changedAt = parseChinaDateTimeLocal(parsed.changedAt);

  if (Number.isNaN(changedAt.getTime())) {
    throw new Error("请选择有效的变更时间");
  }

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: parsed.accountId, userId, archived: false },
    });

    if (!account) {
      throw new Error("账户不存在");
    }

    const beforeAmount = account.currentAmount;
    let changeAmount = amount;

    if (parsed.type === "increase") {
      if (amount <= 0n) {
        throw new Error("增加金额必须大于 0");
      }
      changeAmount = amount;
    }

    if (parsed.type === "decrease") {
      if (amount <= 0n) {
        throw new Error("减少金额必须大于 0");
      }
      changeAmount = -amount;
    }

    if (parsed.type === "set") {
      changeAmount = amount - beforeAmount;
    }

    if (parsed.type === "correction" && amount === 0n) {
      throw new Error("校正金额不能为 0");
    }

    const afterAmount = beforeAmount + changeAmount;

    await tx.account.update({
      where: { id: account.id },
      data: { currentAmount: afterAmount },
    });

    await tx.accountChange.create({
      data: {
        userId,
        accountId: account.id,
        accountNameSnapshot: account.name,
        categorySnapshot: account.category,
        type: changeTypeToPrisma[parsed.type],
        beforeAmount,
        changeAmount,
        afterAmount,
        note: parsed.note,
        changedAt,
      },
    });
  });
}
